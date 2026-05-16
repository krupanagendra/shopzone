const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const User = require("../models/User");
const Order = require("../models/Order");
const { protect } = require("../middleware/auth");

// ─────────────────────────────────────────────────────────────────────────────
//  FREE AI PROVIDER — set CHATBOT_PROVIDER in backend/.env
//
//  OPTION 1 (RECOMMENDED — works everywhere): 
//    CHATBOT_PROVIDER=groq
//    GROQ_API_KEY=gsk_xxxx
//    Get free key: https://console.groq.com
//
//  OPTION 2:
//    CHATBOT_PROVIDER=gemini
//    GEMINI_API_KEY=AIzaSy_xxxx
//    Get free key: https://aistudio.google.com/app/apikey
// ─────────────────────────────────────────────────────────────────────────────

const callAI = async (systemPrompt, userMessage, history = [], imageBase64 = null, imageMediaType = null) => {
    const PROVIDER = (process.env.CHATBOT_PROVIDER || "groq").toLowerCase();

    // ══════════════════════════════════════════════════════════════════
    //  GROQ — 100% FREE, works in ALL regions including India
    //  Free: 14,400 requests/day, ultra fast (LLaMA 3)
    //  Get key: https://console.groq.com → API Keys → Create key
    //  Note: No image support (use gemini for visual search)
    // ══════════════════════════════════════════════════════════════════
    if (PROVIDER === "groq") {
        const key = process.env.GROQ_API_KEY;
        if (!key) throw new Error("GROQ_API_KEY not set in backend/.env — get free key at console.groq.com");

        if (imageBase64) throw new Error("Visual search requires Gemini. Set CHATBOT_PROVIDER=gemini for visual search.");

        const messages = [
            { role: "system", content: systemPrompt },
            ...history.map((h) => ({ role: h.role, content: h.content })),
            { role: "user", content: userMessage },
        ];

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
            body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages, max_tokens: 1500, temperature: 0.7 }),
        });
        const data = await res.json();
        if (data.error) throw new Error(`Groq: ${data.error.message}`);
        return data.choices?.[0]?.message?.content || "No response";
    }

    // ══════════════════════════════════════════════════════════════════
    //  GEMINI — Free but regional restrictions apply
    //  Supports images/visual search
    //  Get key: https://aistudio.google.com/app/apikey
    // ══════════════════════════════════════════════════════════════════
    if (PROVIDER === "gemini") {
        const key = process.env.GEMINI_API_KEY;
        if (!key) throw new Error("GEMINI_API_KEY not set in backend/.env");

        // Try multiple models — first one that works for your account wins
        const MODELS = [
            "gemini-1.5-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-flash-8b",
            "gemini-1.0-pro",
        ];

        const parts = [];
        if (imageBase64) parts.push({ inlineData: { mimeType: imageMediaType || "image/jpeg", data: imageBase64 } });
        parts.push({ text: userMessage });

        const contents = [
            ...history.map((h) => ({ role: h.role === "assistant" ? "model" : "user", parts: [{ text: h.content }] })),
            { role: "user", parts },
        ];

        let lastError = "";
        for (const model of MODELS) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
                const body = {
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    contents,
                    generationConfig: { maxOutputTokens: 1500, temperature: 0.7 },
                };
                const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
                const data = await res.json();
                if (data.error) { lastError = data.error.message; continue; }
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) { console.log(`✅ Gemini model: ${model}`); return text; }
            } catch (e) { lastError = e.message; continue; }
        }
        throw new Error(`Gemini quota exceeded or unavailable. Try CHATBOT_PROVIDER=groq instead. Last error: ${lastError}`);
    }

    // ══════════════════════════════════════════════════════════════════
    //  OPENROUTER — Free models available
    //  Get key: https://openrouter.ai
    // ══════════════════════════════════════════════════════════════════
    if (PROVIDER === "openrouter") {
        const key = process.env.OPENROUTER_API_KEY;
        if (!key) throw new Error("OPENROUTER_API_KEY not set in backend/.env");
        const userContent = imageBase64
            ? [{ type: "image_url", image_url: { url: `data:${imageMediaType};base64,${imageBase64}` } }, { type: "text", text: userMessage }]
            : userMessage;
        const messages = [
            { role: "system", content: systemPrompt },
            ...history.map((h) => ({ role: h.role, content: h.content })),
            { role: "user", content: userContent },
        ];
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "HTTP-Referer": process.env.CLIENT_URL || "http://localhost:5173", "X-Title": "OmniKart" },
            body: JSON.stringify({ model: imageBase64 ? "google/gemini-flash-1.5" : "mistralai/mistral-7b-instruct:free", messages, max_tokens: 1500 }),
        });
        const data = await res.json();
        if (data.error) throw new Error(`OpenRouter: ${data.error.message}`);
        return data.choices?.[0]?.message?.content || "No response";
    }

    throw new Error(`Unknown CHATBOT_PROVIDER: "${PROVIDER}". Use groq, gemini, or openrouter in backend/.env`);
};

// ── Safe JSON parser ──────────────────────────────────────────────────────────
const parseJSON = (text) => {
    try { return JSON.parse(text.trim().replace(/```json|```/g, "").trim()); }
    catch { const m = text.match(/\{[\s\S]*\}/); if (m) { try { return JSON.parse(m[0]); } catch { } } return null; }
};

// ── Store context loader ──────────────────────────────────────────────────────
const getContext = async (userId) => {
    const [allProducts, cart, user, recentOrders] = await Promise.all([
        Product.find({}, "name brand category price rating countInStock isFeatured _id description image numReviews").lean(),
        Cart.findOne({ user: userId }).lean(),
        User.findById(userId).populate("wishlist", "name price _id").lean(),
        Order.find({ user: userId }).sort({ createdAt: -1 }).limit(3).lean(),
    ]);
    return { allProducts, cart, user, recentOrders };
};

// ── Execute cart / wishlist actions ──────────────────────────────────────────
const executeAction = async (action, payload, userId) => {
    if (!payload) return null;

    if (action === "ADD_TO_CART") {
        const product = await Product.findById(payload._id);
        if (!product) return { success: false, reason: "not_found" };
        if (product.countInStock === 0) return { success: false, reason: "out_of_stock", productName: product.name };
        let cart = await Cart.findOne({ user: userId });
        if (!cart) cart = new Cart({ user: userId, items: [] });
        const existing = cart.items.find((i) => i.product.toString() === product._id.toString());
        if (existing) existing.quantity += payload.quantity || 1;
        else cart.items.push({ product: product._id, name: product.name, image: product.image, price: product.price, quantity: payload.quantity || 1 });
        await cart.save();
        return { success: true, type: "cart_added", productName: product.name };
    }

    if (action === "REMOVE_FROM_CART") {
        const cart = await Cart.findOne({ user: userId });
        if (!cart) return { success: false, reason: "no_cart" };
        const before = cart.items.length;
        cart.items = cart.items.filter((i) => {
            const nameMatch = payload.name && i.name.toLowerCase().includes(payload.name.toLowerCase());
            const idMatch = payload._id && i.product.toString() === payload._id.toString();
            return !nameMatch && !idMatch;
        });
        if (cart.items.length === before) return { success: false, reason: "item_not_found" };
        await cart.save();
        return { success: true, type: "cart_removed", productName: payload.name };
    }

    if (action === "ADD_TO_WISHLIST") {
        const product = await Product.findById(payload._id);
        if (!product) return { success: false };
        const user = await User.findById(userId);
        const has = user.wishlist?.some((w) => w.toString() === product._id.toString());
        if (!has) await User.findByIdAndUpdate(userId, { $addToSet: { wishlist: product._id } });
        return { success: true, type: has ? "wishlist_exists" : "wishlist_added", productName: product.name };
    }

    return null;
};

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/chatbot  — Main chat
// ─────────────────────────────────────────────────────────────────────────────
router.post("/", protect, async (req, res) => {
    try {
        const { message, history = [] } = req.body;
        const userId = req.user._id;
        const { allProducts, cart, user, recentOrders } = await getContext(userId);

        const categories = [...new Set(allProducts.map((p) => p.category))];
        const cartItems = cart?.items || [];
        const cartTotal = cartItems.reduce((a, i) => a + i.price * i.quantity, 0);
        const wishlist = user?.wishlist || [];
        const trending = [...allProducts].sort((a, b) => b.numReviews - a.numReviews).slice(0, 5);
        const topRated = [...allProducts].sort((a, b) => b.rating - a.rating).slice(0, 5);

        const systemPrompt = `You are ZoneBot, an intelligent AI shopping assistant for OmniKart e-commerce store.
You are helpful, friendly and conversational. Use emojis naturally.

YOUR CAPABILITIES:
1. Search and recommend products from the catalog
2. Add products to cart (action: ADD_TO_CART)
3. Remove products from cart (action: REMOVE_FROM_CART)
4. Add to wishlist (action: ADD_TO_WISHLIST)
5. Show cart summary (action: SHOW_CART)
6. Guide to checkout (action: GO_CHECKOUT)
7. Compare products side by side
8. Answer customer support questions
9. Give personalized recommendations
10. Remember conversation context

MULTILINGUAL: Understand English, Hindi, Kannada, Tamil, Telugu. Always respond in English.

STORE INFO:
- Free shipping over $100 | 15% tax | 30-day returns
- Payment: Razorpay (online) or Cash on Delivery
- Categories: ${categories.join(", ")}
- Total products: ${allProducts.length}

TRENDING: ${trending.map((p) => p.name).join(", ")}
TOP RATED: ${topRated.map((p) => p.name).join(", ")}

USER: ${req.user.name}
CART (${cartItems.length} items, $${cartTotal.toFixed(2)}): ${cartItems.length ? cartItems.map((i) => `${i.name} x${i.quantity}`).join(", ") : "empty"}
WISHLIST: ${wishlist.length ? wishlist.map((i) => i.name).join(", ") : "empty"}
RECENT ORDERS: ${recentOrders.length ? recentOrders.map((o) => `#${o._id.toString().slice(-6)} $${o.totalPrice}`).join(", ") : "none"}

PRODUCT CATALOG:
${allProducts.map((p) => `ID:${p._id} | "${p.name}" | ${p.brand} | ${p.category} | $${p.price} | Rating:${p.rating} | Stock:${p.countInStock}`).join("\n")}

HANDLING RULES:
- If product NOT in catalog: acknowledge, suggest closest alternatives, never leave user with nothing
- If language unclear/unknown: politely ask to rephrase in English/Hindi/Kannada/Tamil/Telugu
- If out of stock: suggest adding to wishlist + show alternatives
- If "the first one" / "that one" / "it": refer to previously shown products in history
- NEVER return empty message

RESPOND WITH JSON ONLY (no markdown, no extra text):
{"preview":"1-2 line teaser","message":"full response with emojis","action":null,"products":[],"actionProduct":null,"suggestions":["reply1","reply2","reply3"],"compareProducts":null}

action options: null | "ADD_TO_CART" | "REMOVE_FROM_CART" | "ADD_TO_WISHLIST" | "SHOW_CART" | "GO_CHECKOUT" | "SHOW_PRODUCTS" | "COMPARE"
products: array of objects with EXACT _id values copied from the PRODUCT CATALOG above (max 4). Example: [{"_id":"507f1f77bcf86cd799439011","name":"product name"}]. NEVER make up IDs.
actionProduct: use EXACT _id from PRODUCT CATALOG above. Example: {"_id":"507f1f77bcf86cd799439011","name":"product name","quantity":1}
compareProducts: [{_id},{_id}] for comparisons`;

        const rawText = await callAI(systemPrompt, message, history);
        let parsed = parseJSON(rawText);

        if (!parsed) {
            parsed = {
                preview: rawText?.slice(0, 80) || "I'm here to help! 😊",
                message: rawText || "I'm having trouble understanding. Could you rephrase? 😊",
                action: null, products: [], actionProduct: null,
                suggestions: ["Show trending products", "What's in my cart?", "Help me find something"],
                compareProducts: null,
            };
        }

        // Ensure all fields exist
        parsed.products = parsed.products || [];
        parsed.suggestions = parsed.suggestions || [];
        parsed.compareProducts = parsed.compareProducts || [];
        parsed.preview = parsed.preview || parsed.message?.slice(0, 80) || "Here you go!";
        parsed.message = parsed.message || "I'm not sure about that. Try asking differently! 😊";

        const actionResult = await executeAction(parsed.action, parsed.actionProduct, userId);

        if (parsed.action === "SHOW_CART") {
            const freshCart = await Cart.findOne({ user: userId }).lean();
            parsed.cartItems = freshCart?.items || [];
        }

        // ── Enrich products — ID match first, name-based fuzzy fallback ─────────
        const enrichProducts = async (list) => {
            if (!list?.length) return [];

            // Try ID-based lookup first
            const ids = list.map((p) => p._id).filter(Boolean);
            if (ids.length) {
                const found = await Product.find({ _id: { $in: ids } }, "name price image rating brand category _id countInStock description").lean();
                if (found.length === list.length) return found; // all matched
            }

            // Fallback: name-based fuzzy match for any that didn't match by ID
            const results = [];
            for (const item of list) {
                if (item._id) {
                    try {
                        const byId = await Product.findById(item._id, "name price image rating brand category _id countInStock description").lean();
                        if (byId) { results.push(byId); continue; }
                    } catch { }
                }
                // Try matching by name (simple contains search)
                if (item.name) {
                    const safeName = item.name.slice(0, 20);
                    const byName = await Product.findOne(
                        { name: { $regex: safeName, $options: "i" } },
                        "name price image rating brand category _id countInStock description"
                    ).lean();
                    if (byName) { results.push(byName); continue; }
                }
            }
            return results;
        };

        if (parsed.products?.length) parsed.products = await enrichProducts(parsed.products);
        if (parsed.compareProducts?.length) parsed.compareProducts = await enrichProducts(parsed.compareProducts);

        res.json({ ...parsed, actionResult });
    } catch (err) {
        console.error("Chatbot error:", err.message);
        res.status(500).json({
            preview: "Oops! Something went wrong.",
            message: `ZoneBot error: ${err.message}`,
            action: null, products: [], suggestions: ["Try again", "Show products", "Help"],
            actionProduct: null,
        });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/chatbot/visual  — Image search (requires Gemini)
// ─────────────────────────────────────────────────────────────────────────────
router.post("/visual", protect, async (req, res) => {
    try {
        const { imageBase64, mediaType = "image/jpeg" } = req.body;
        if (!imageBase64) return res.status(400).json({ message: "No image provided" });

        const PROVIDER = (process.env.CHATBOT_PROVIDER || "groq").toLowerCase();
        if (PROVIDER === "groq") {
            return res.status(400).json({
                message: "📸 Visual search needs Gemini API. Add GEMINI_API_KEY to .env and set CHATBOT_PROVIDER=gemini to use this feature.",
                products: [], analysis: null,
            });
        }

        const { allProducts } = await getContext(req.user._id);

        const analysisText = await callAI(
            "You are a product image analyzer. Respond with JSON only, no markdown.",
            `Analyze this image. Return JSON: {"productType":"...","brand":"...or null","category":"Electronics/Computers/Clothing/Home & Kitchen/Books/Gaming/Sports/Cameras/Beauty/Health/Toys/Music/Automotive/Pet Supplies","color":"...or null","features":["..."],"searchTerms":["...","..."],"description":"one sentence"}`,
            [], imageBase64, mediaType
        );
        let analysis = parseJSON(analysisText) || { productType: "product", category: null, searchTerms: [], description: "A product" };

        const matchText = await callAI(
            "You are a product matching engine. Respond with JSON only.",
            `Image shows: ${analysis.description}. Type: ${analysis.productType}, Category: ${analysis.category}.
CATALOG: ${allProducts.map((p) => `ID:${p._id} | "${p.name}" | ${p.brand} | ${p.category} | $${p.price}`).join("\n")}
Return JSON: {"productIds":["id1","id2","id3","id4"],"matchMessage":"one friendly sentence"}`,
            []
        );
        const match = parseJSON(matchText) || { productIds: [], matchMessage: "Here are similar products!" };
        const products = await Product.find({ _id: { $in: match.productIds } }, "name price image rating brand category _id countInStock").lean();
        res.json({ analysis, products, message: match.matchMessage });
    } catch (err) {
        console.error("Visual error:", err.message);
        res.status(500).json({ message: `Visual search failed: ${err.message}`, products: [], analysis: null });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/chatbot/translate  — Language detection + translation
// ─────────────────────────────────────────────────────────────────────────────
router.post("/translate", protect, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || text.trim().length < 2) return res.json({ translated: text, language: "en", wasTranslated: false });

        // Skip translation for pure English text — saves API quota
        const isEnglish = /^[a-zA-Z0-9\s.,!?'"@#$%&*()\-+=:;<>[\]{}]+$/.test(text.trim());
        if (isEnglish) return res.json({ translated: text, language: "en", wasTranslated: false });

        const result = await callAI(
            "You are a translator. Respond with JSON only.",
            `Detect language and translate to English.
Text: "${text}"
Supported: English(en), Hindi(hi), Kannada(kn), Tamil(ta), Telugu(te).
If gibberish or unknown: set detectedLanguage to "unknown".
Return JSON: {"detectedLanguage":"en/hi/kn/ta/te/unknown","translatedText":"English translation","wasTranslated":true/false}`,
            []
        );
        const parsed = parseJSON(result) || { translatedText: text, detectedLanguage: "en", wasTranslated: false };
        res.json({ translated: parsed.translatedText || text, language: parsed.detectedLanguage, wasTranslated: parsed.wasTranslated, isUnknown: parsed.detectedLanguage === "unknown" });
    } catch {
        res.json({ translated: req.body.text, language: "en", wasTranslated: false });
    }
});

module.exports = router;
