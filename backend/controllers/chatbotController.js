const Product = require("../models/Product");
const Cart = require("../models/Cart");
const User = require("../models/User");
const Order = require("../models/Order");
const ChatHistory = require("../models/ChatHistory");

// ─────────────────────────────────────────────────────────────────────────────
//  INTENT DETECTION — classify user message before sending to AI
// ─────────────────────────────────────────────────────────────────────────────
const detectIntent = (message) => {
    const msg = message.toLowerCase().trim();

    const intents = {
        PRODUCT_SEARCH: [/show me/, /find/, /search/, /looking for/, /need a/, /want a/, /suggest/, /recommend/, /under \d+/, /below \d+/, /best/, /top/, /cheap/, /affordable/, /budget/],
        ADD_TO_CART: [/add.*(to cart|to my cart)/, /buy/, /purchase/, /order this/, /i want this/, /add it/, /add the (first|second|third|1st|2nd|3rd)/],
        VIEW_CART: [/my cart/, /show cart/, /view cart/, /what('s| is) in/, /cart summary/, /cart items/],
        ORDER_TRACKING: [/track/, /order status/, /where is my/, /my order/, /delivery status/, /shipped/, /dispatch/, /order #/, /order id/],
        SHIPPING_POLICY: [/shipping/, /delivery time/, /how long/, /when will/, /free shipping/, /delivery charge/],
        RETURN_POLICY: [/return/, /refund/, /exchange/, /money back/, /cancel order/, /replace/],
        PAYMENT_HELP: [/payment/, /pay/, /upi/, /credit card/, /debit card/, /cod/, /cash on delivery/, /net banking/, /wallet/],
        COMPARE_PRODUCTS: [/compare/, /difference between/, /vs/, /versus/, /which is better/, /which one/],
        ESCALATE_HUMAN: [/human/, /agent/, /support/, /speak to someone/, /real person/, /customer care/, /complaint/],
        GREETING: [/^hi$/, /^hello$/, /^hey$/, /good morning/, /good evening/, /howdy/, /what can you do/, /help me/],
        CHECKOUT: [/checkout/, /place order/, /complete order/, /buy now/, /proceed/],
        WISHLIST: [/wishlist/, /save for later/, /favourite/, /favorite/],
    };

    for (const [intent, patterns] of Object.entries(intents)) {
        if (patterns.some((p) => p.test(msg))) return intent;
    }
    return "GENERAL";
};

// ─────────────────────────────────────────────────────────────────────────────
//  AI CALL — supports Groq (default), Gemini, OpenRouter
// ─────────────────────────────────────────────────────────────────────────────
const callAI = async (systemPrompt, userMessage, history = []) => {
    const PROVIDER = (process.env.CHATBOT_PROVIDER || "groq").toLowerCase();

    // ── GROQ (recommended — free, works everywhere, ultra fast) ───────────────
    if (PROVIDER === "groq") {
        const key = process.env.GROQ_API_KEY;
        if (!key) throw new Error("GROQ_API_KEY missing in .env — get free key at console.groq.com");

        const messages = [
            { role: "system", content: systemPrompt },
            ...history.slice(-10).map((h) => ({ role: h.role, content: h.content })),
            { role: "user", content: userMessage },
        ];

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
            body: JSON.stringify({ model: "llama-3.1-8b-instant", messages, max_tokens: 800, temperature: 0.7 }),
        });
        const data = await res.json();
        if (data.error) throw new Error(`Groq error: ${data.error.message}`);
        return data.choices?.[0]?.message?.content || "";
    }

    // ── GEMINI (free, supports images) ───────────────────────────────────────
    if (PROVIDER === "gemini") {
        const key = process.env.GEMINI_API_KEY;
        if (!key) throw new Error("GEMINI_API_KEY missing in .env — get free key at aistudio.google.com");
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
        const contents = [
            ...history.slice(-10).map((h) => ({ role: h.role === "assistant" ? "model" : "user", parts: [{ text: h.content }] })),
            { role: "user", parts: [{ text: userMessage }] },
        ];
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ systemInstruction: { parts: [{ text: systemPrompt }] }, contents, generationConfig: { maxOutputTokens: 1200, temperature: 0.7 } }),
        });
        const data = await res.json();
        if (data.error) throw new Error(`Gemini error: ${data.error.message}`);
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    throw new Error(`Unknown CHATBOT_PROVIDER: "${PROVIDER}". Use groq or gemini.`);
};

// ─────────────────────────────────────────────────────────────────────────────
//  SAFE JSON PARSER
// ─────────────────────────────────────────────────────────────────────────────
const parseJSON = (text) => {
    try { return JSON.parse(text.trim().replace(/```json|```/g, "").trim()); }
    catch {
        const m = text.match(/\{[\s\S]*\}/);
        if (m) { try { return JSON.parse(m[0]); } catch { } }
        return null;
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  SMART PRODUCT FILTER — send only relevant products to save tokens
// ─────────────────────────────────────────────────────────────────────────────
const getRelevantProducts = (allProducts, intent, message) => {
    const msg = message.toLowerCase();

    // For FAQ / cart / order intents — no products needed
    const noProductIntents = ["SHOW_CART", "TRACK_ORDER", "SHIPPING_POLICY", "RETURN_POLICY", "PAYMENT_HELP", "ESCALATE_HUMAN", "GREETING", "CHECKOUT"];
    if (noProductIntents.includes(intent)) return allProducts.slice(0, 15);

    // Try to filter by category keyword in message
    const categoryMap = {
        "laptop|computer|pc|notebook|macbook": "Computers",
        "phone|mobile|smartphone|iphone|samsung": "Electronics",
        "headphone|earphone|airpod|speaker|audio": "Electronics",
        "camera|dslr|lens|photography": "Cameras",
        "game|gaming|console|playstation|xbox": "Gaming",
        "shirt|pant|clothing|dress|fashion|wear": "Clothing",
        "kitchen|home|furniture|appliance|cookware": "Home & Kitchen",
        "book|novel|textbook|comic": "Books",
        "sport|fitness|gym|exercise|yoga": "Sports",
        "beauty|skincare|makeup|cosmetic": "Beauty",
        "health|medicine|vitamin|supplement": "Health",
        "toy|kids|children|baby": "Toys",
        "music|guitar|piano|instrument": "Music",
        "car|auto|vehicle|bike": "Automotive",
        "pet|dog|cat|animal": "Pet Supplies",
    };

    for (const [keywords, category] of Object.entries(categoryMap)) {
        if (new RegExp(keywords).test(msg)) {
            const filtered = allProducts.filter(p => p.category === category);
            if (filtered.length > 0) return filtered.slice(0, 30);
        }
    }

    // Price filter
    const priceMatch = msg.match(/under \$?(\d+)|below \$?(\d+)|less than \$?(\d+)/);
    if (priceMatch) {
        const maxPrice = parseInt(priceMatch[1] || priceMatch[2] || priceMatch[3]);
        const filtered = allProducts.filter(p => p.price <= maxPrice);
        if (filtered.length > 0) return filtered.slice(0, 30);
    }

    // Default: trending + top rated (max 40 products)
    const trending = [...allProducts].sort((a, b) => b.numReviews - a.numReviews).slice(0, 20);
    const topRated = [...allProducts].sort((a, b) => b.rating - a.rating).slice(0, 20);
    const combined = [...new Map([...trending, ...topRated].map(p => [p._id.toString(), p])).values()];
    return combined.slice(0, 40);
};

// ─────────────────────────────────────────────────────────────────────────────
//  BUILD SYSTEM PROMPT — lean and token-efficient
// ─────────────────────────────────────────────────────────────────────────────
const buildSystemPrompt = ({ user, allProducts, relevantProducts, cart, recentOrders, categories }) => {
    const cartItems = cart?.items || [];
    const cartTotal = cartItems.reduce((a, i) => a + i.price * i.quantity, 0);
    const trending = [...allProducts].sort((a, b) => b.numReviews - a.numReviews).slice(0, 5);
    const topRated = [...allProducts].sort((a, b) => b.rating - a.rating).slice(0, 5);

    return `You are ZoneBot, an AI shopping assistant for ShopZone e-commerce.
Be helpful, friendly, concise. Use emojis naturally.

## CAPABILITIES
Add/remove cart, show cart, track orders, search products, compare, FAQ answers, wishlist, checkout, escalate to human.

## STORE POLICIES
- Free shipping above $100 | $10 flat otherwise
- Delivery: 3-5 days standard | 1-2 days express (+$15)
- 30-day returns | Refund in 5-7 days
- Payments: Card, UPI, COD, Net Banking, Razorpay
- Support: support@shopzone.com | Mon-Sat 9AM-6PM
- Coupon: SAVE10 (10% off above $200)

## STORE INFO
Categories: ${categories.join(", ")} | Total: ${allProducts.length} products
Trending: ${trending.map(p => p.name).join(", ")}
Top Rated: ${topRated.map(p => p.name).join(", ")}

## USER: ${user.name}
Cart: ${cartItems.length ? `${cartItems.length} items $${cartTotal.toFixed(2)} — ${cartItems.map(i => `${i.name} x${i.quantity}`).join(", ")}` : "empty"}
Orders: ${recentOrders.length ? recentOrders.map(o => `#${o._id.toString().slice(-6)} $${o.totalPrice} ${o.isPaid ? "Paid" : "Pending"}`).join(", ") : "none"}

## RELEVANT PRODUCTS (${relevantProducts.length} shown, ${allProducts.length} total in store)
${relevantProducts.map(p => `ID:${p._id}|"${p.name}"|${p.brand}|${p.category}|$${p.price}|⭐${p.rating}|Stock:${p.countInStock > 0 ? p.countInStock : "OUT"}`).join("\n")}

## RESPONSE — JSON only, no markdown:
{"preview":"short teaser","message":"full response","action":null,"actionProduct":null,"products":[],"compareProducts":null,"suggestions":["s1","s2","s3"],"coupon":null}

Actions: ADD_TO_CART|REMOVE_FROM_CART|ADD_TO_WISHLIST|SHOW_CART|TRACK_ORDER|GO_CHECKOUT|COMPARE|ESCALATE|SHOW_PRODUCTS
- Use EXACT _id from products above. Never invent IDs.
- Always suggest alternatives if product not found.
- Always return valid JSON.`;
};

// ─────────────────────────────────────────────────────────────────────────────
//  EXECUTE CART / WISHLIST ACTIONS
// ─────────────────────────────────────────────────────────────────────────────
const executeAction = async (action, actionProduct, userId) => {
    if (!actionProduct?._id) return null;

    if (action === "ADD_TO_CART") {
        const product = await Product.findById(actionProduct._id).lean();
        if (!product) return { success: false, reason: "not_found" };
        if (product.countInStock === 0) return { success: false, reason: "out_of_stock", productName: product.name };

        let cart = await Cart.findOne({ user: userId });
        if (!cart) cart = new Cart({ user: userId, items: [] });

        const existing = cart.items.find((i) => i.product.toString() === product._id.toString());
        if (existing) existing.quantity += actionProduct.quantity || 1;
        else cart.items.push({ product: product._id, name: product.name, image: product.image, price: product.price, quantity: actionProduct.quantity || 1 });

        await cart.save();
        return { success: true, type: "cart_added", productName: product.name };
    }

    if (action === "REMOVE_FROM_CART") {
        const cart = await Cart.findOne({ user: userId });
        if (!cart) return { success: false, reason: "no_cart" };

        const before = cart.items.length;
        cart.items = cart.items.filter((i) => {
            const byId = actionProduct._id && i.product.toString() === actionProduct._id.toString();
            const byName = actionProduct.name && i.name.toLowerCase().includes(actionProduct.name.toLowerCase());
            return !byId && !byName;
        });

        if (cart.items.length === before) return { success: false, reason: "item_not_found" };
        await cart.save();
        return { success: true, type: "cart_removed", productName: actionProduct.name };
    }

    if (action === "ADD_TO_WISHLIST") {
        const product = await Product.findById(actionProduct._id).lean();
        if (!product) return { success: false, reason: "not_found" };

        const user = await User.findById(userId);
        const has = user.wishlist?.some((w) => w.toString() === product._id.toString());
        if (!has) await User.findByIdAndUpdate(userId, { $addToSet: { wishlist: product._id } });

        return { success: true, type: has ? "wishlist_exists" : "wishlist_added", productName: product.name };
    }

    return null;
};

// ─────────────────────────────────────────────────────────────────────────────
//  ENRICH PRODUCTS — fetch real data from DB with name fallback
// ─────────────────────────────────────────────────────────────────────────────
const enrichProducts = async (list) => {
    if (!list?.length) return [];
    const results = [];

    for (const item of list) {
        // Try by _id first
        if (item._id) {
            try {
                const found = await Product.findById(item._id, "name price image rating brand category _id countInStock description").lean();
                if (found) { results.push(found); continue; }
            } catch { }
        }
        // Fallback: match by name
        if (item.name) {
            const safeName = item.name.slice(0, 25);
            const found = await Product.findOne(
                { name: { $regex: safeName, $options: "i" } },
                "name price image rating brand category _id countInStock description"
            ).lean();
            if (found) results.push(found);
        }
    }
    return results;
};

// ─────────────────────────────────────────────────────────────────────────────
//  CONTROLLER: POST /api/chatbot/message
// ─────────────────────────────────────────────────────────────────────────────
exports.sendMessage = async (req, res) => {
    try {
        const { message, sessionId } = req.body;
        const userId = req.user._id;

        if (!message?.trim()) return res.status(400).json({ message: "Message is required" });

        // ── 1. Detect intent ────────────────────────────────────────────────────
        const intent = detectIntent(message);

        // ── 2. Load store context ───────────────────────────────────────────────
        const [allProducts, cart, user, recentOrders, chatSession] = await Promise.all([
            Product.find({}, "name brand category price rating countInStock isFeatured _id description image numReviews").lean(),
            Cart.findOne({ user: userId }).lean(),
            User.findById(userId).lean(),
            Order.find({ user: userId }).sort({ createdAt: -1 }).limit(5).lean(),
            ChatHistory.findOne({ user: userId, sessionId }).lean(),
        ]);

        const categories = [...new Set(allProducts.map((p) => p.category))];
        const history = chatSession?.messages?.slice(-10) || [];

        // ── 3. Get relevant products based on intent (saves tokens) ────────────
        const relevantProducts = getRelevantProducts(allProducts, intent, message);

        // ── 4. Build lean system prompt ─────────────────────────────────────────
        const systemPrompt = buildSystemPrompt({ user, allProducts, relevantProducts, cart, recentOrders, categories });

        // ── 4. Add intent context to message ───────────────────────────────────
        const enrichedMessage = intent !== "GENERAL"
            ? `[Intent: ${intent}] ${message}`
            : message;

        // ── 5. Call AI ──────────────────────────────────────────────────────────
        const rawText = await callAI(systemPrompt, enrichedMessage, history);
        let parsed = parseJSON(rawText);

        // Fallback if AI returns plain text
        if (!parsed) {
            parsed = {
                preview: rawText?.slice(0, 100) || "I'm here to help! 😊",
                message: rawText || "I didn't quite understand that. Could you rephrase? 😊",
                action: null, products: [], actionProduct: null,
                suggestions: ["Show trending products", "My cart", "Track my order"],
                compareProducts: null, coupon: null,
            };
        }

        // Ensure all fields exist
        parsed.products = parsed.products || [];
        parsed.suggestions = parsed.suggestions || [];
        parsed.compareProducts = parsed.compareProducts || [];
        parsed.preview = parsed.preview || parsed.message?.slice(0, 100) || "Here you go!";
        parsed.message = parsed.message || "I'm not sure about that. Try asking differently! 😊";

        // ── 6. Execute action ───────────────────────────────────────────────────
        const actionResult = await executeAction(parsed.action, parsed.actionProduct, userId);

        // ── 7. Show cart if requested ───────────────────────────────────────────
        let cartItems = null;
        if (parsed.action === "SHOW_CART") {
            const freshCart = await Cart.findOne({ user: userId }).lean();
            cartItems = freshCart?.items || [];
        }

        // ── 8. Track order if requested ─────────────────────────────────────────
        let orderData = null;
        if (parsed.action === "TRACK_ORDER" && recentOrders.length) {
            orderData = recentOrders.map((o) => ({
                id: o._id.toString().slice(-6),
                fullId: o._id,
                total: o.totalPrice,
                status: o.isPaid ? "Paid" : "Payment Pending",
                delivered: o.isDelivered,
                date: o.createdAt,
                items: o.items?.length,
            }));
        }

        // ── 9. Enrich products ──────────────────────────────────────────────────
        if (parsed.products?.length) parsed.products = await enrichProducts(parsed.products);
        if (parsed.compareProducts?.length) parsed.compareProducts = await enrichProducts(parsed.compareProducts);

        // ── 10. Save to chat history ────────────────────────────────────────────
        const userMsg = { role: "user", content: message, intent };
        const botMsg = { role: "assistant", content: parsed.message, intent };

        await ChatHistory.findOneAndUpdate(
            { user: userId, sessionId },
            {
                $push: { messages: { $each: [userMsg, botMsg] } },
                $setOnInsert: { user: userId, sessionId, language: "en" },
            },
            { upsert: true, new: true }
        );

        // ── 11. Send response ───────────────────────────────────────────────────
        res.json({
            preview: parsed.preview,
            message: parsed.message,
            action: parsed.action,
            actionResult,
            products: parsed.products,
            compareProducts: parsed.compareProducts,
            cartItems,
            orderData,
            suggestions: parsed.suggestions,
            coupon: parsed.coupon || null,
            intent,
            sessionId,
        });

    } catch (err) {
        console.error("❌ Chatbot controller error:", err.message);
        res.status(500).json({
            preview: "Oops! Something went wrong.",
            message: `ZoneBot error: ${err.message}`,
            action: null,
            products: [],
            suggestions: ["Try again", "Show products", "Contact support"],
        });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  CONTROLLER: POST /api/chatbot/translate
// ─────────────────────────────────────────────────────────────────────────────
exports.translate = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text?.trim() || text.trim().length < 2)
            return res.json({ translated: text, language: "en", wasTranslated: false });

        // Skip if already English
        const isEnglish = /^[a-zA-Z0-9\s.,!?'"@#$%&*()\-+=:;<>[\]{}]+$/.test(text.trim());
        if (isEnglish) return res.json({ translated: text, language: "en", wasTranslated: false });

        const result = await callAI(
            "You are a language translator. Respond with JSON only, no extra text.",
            `Detect language and translate to English.
Text: "${text}"
Supported: English(en), Hindi(hi), Kannada(kn), Tamil(ta), Telugu(te).
Return JSON: {"detectedLanguage":"en/hi/kn/ta/te/unknown","translatedText":"English version","wasTranslated":true/false}`,
            []
        );

        const parsed = parseJSON(result) || { translatedText: text, detectedLanguage: "en", wasTranslated: false };
        res.json({ translated: parsed.translatedText || text, language: parsed.detectedLanguage, wasTranslated: parsed.wasTranslated });
    } catch {
        res.json({ translated: req.body.text, language: "en", wasTranslated: false });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  CONTROLLER: GET /api/chatbot/history
// ─────────────────────────────────────────────────────────────────────────────
exports.getHistory = async (req, res) => {
    try {
        const { sessionId } = req.query;
        const query = { user: req.user._id };
        if (sessionId) query.sessionId = sessionId;

        const history = await ChatHistory.find(query)
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        res.json(history);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  CONTROLLER: POST /api/chatbot/escalate
// ─────────────────────────────────────────────────────────────────────────────
exports.escalate = async (req, res) => {
    try {
        const { sessionId } = req.body;
        await ChatHistory.findOneAndUpdate(
            { user: req.user._id, sessionId },
            { escalated: true, isResolved: false }
        );
        res.json({
            message: "✅ I've connected you to our support team! Someone will reach out to you at **" + req.user.email + "** within 2 hours.\n\nFor urgent help: support@shopzone.com | Mon-Sat 9AM-6PM",
            escalated: true,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
