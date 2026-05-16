const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const User = require("../models/User");
const Order = require("../models/Order");
const { protect } = require("../middleware/auth");

let ChatHistory;
try { ChatHistory = require("../models/ChatHistory"); } catch { ChatHistory = null; }

// =============================================================================
// AI PROVIDER
// =============================================================================
async function callAI(system, userMsg, history) {
  const provider = (process.env.CHATBOT_PROVIDER || "groq").toLowerCase();
  if (provider === "groq") {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error("GROQ_API_KEY not set. Get free key at console.groq.com");
    const messages = [
      { role: "system", content: system },
      ...(history || []).slice(-8).map(h => ({ role: h.role === "assistant" ? "assistant" : "user", content: String(h.content) })),
      { role: "user", content: userMsg },
    ];
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: "llama-3.1-8b-instant", messages, max_tokens: 700, temperature: 0.7 }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `Groq HTTP ${res.status}`); }
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.choices?.[0]?.message?.content?.trim() || "";
  }
  if (provider === "gemini") {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY not set. Get free key at aistudio.google.com");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    const contents = [
      ...(history || []).slice(-8).map(h => ({ role: h.role === "assistant" ? "model" : "user", parts: [{ text: String(h.content) }] })),
      { role: "user", parts: [{ text: userMsg }] },
    ];
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents, generationConfig: { maxOutputTokens: 700, temperature: 0.7 } }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `Gemini HTTP ${res.status}`); }
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  }
  throw new Error(`Unknown CHATBOT_PROVIDER="${provider}". Use groq or gemini.`);
}

// =============================================================================
// INTENT + PRODUCT SELECTION
// =============================================================================
function classifyIntent(msg) {
  const m = msg.toLowerCase();
  if (/my cart|show cart|view cart|cart summary/.test(m)) return "SHOW_CART";
  if (/track|order status|where is my order|my orders/.test(m)) return "TRACK_ORDER";
  if (/add.{0,15}cart|buy this|i.?ll take|add it/.test(m)) return "ADD_TO_CART";
  if (/remove.{0,15}cart|delete from cart/.test(m)) return "REMOVE_FROM_CART";
  if (/wishlist|save for later/.test(m)) return "WISHLIST";
  if (/compare|vs\.? |versus|which is better/.test(m)) return "COMPARE";
  if (/checkout|place order|buy now|proceed to pay/.test(m)) return "CHECKOUT";
  if (/return|refund|exchange|money back|cancel order/.test(m)) return "RETURN_POLICY";
  if (/ship|delivery|how long|when will|free delivery/.test(m)) return "SHIPPING";
  if (/pay|payment|upi|cod|cash on delivery|credit card/.test(m)) return "PAYMENT";
  if (/human|agent|real person|support team|complaint/.test(m)) return "ESCALATE";
  if (/coupon|discount|offer|promo|deal|sale/.test(m)) return "COUPON";
  if (/^(hi|hello|hey|hii|helo|howdy|namaste)[\s!.]*$/.test(m)) return "GREETING";
  return "PRODUCT_SEARCH";
}

function selectProducts(allProducts, intent, message) {
  const noProductIntents = ["SHOW_CART", "TRACK_ORDER", "RETURN_POLICY", "SHIPPING", "PAYMENT", "ESCALATE", "GREETING", "COUPON", "CHECKOUT"];
  if (noProductIntents.includes(intent)) return [];
  const m = message.toLowerCase();
  const catMap = [
    [/laptop|computer|pc|notebook|macbook/, "Computers"],
    [/phone|mobile|smartphone|iphone|samsung/, "Electronics"],
    [/headphone|earphone|airpod|speaker/, "Electronics"],
    [/camera|dslr|photography/, "Cameras"],
    [/gaming|console|playstation|xbox/, "Gaming"],
    [/shirt|pant|cloth|dress|fashion/, "Clothing"],
    [/kitchen|home|furniture|appliance/, "Home & Kitchen"],
    [/book|novel|textbook/, "Books"],
    [/sport|fitness|gym|exercise/, "Sports"],
    [/beauty|skincare|makeup/, "Beauty"],
    [/health|vitamin|supplement/, "Health"],
    [/toy|kids|children|baby/, "Toys"],
    [/music|guitar|piano|instrument/, "Music"],
    [/car|automotive|vehicle/, "Automotive"],
    [/pet|dog|cat|animal/, "Pet Supplies"],
  ];
  for (const [re, cat] of catMap) {
    if (re.test(m)) {
      const f = allProducts.filter(p => p.category === cat);
      if (f.length) return f.slice(0, 20);
    }
  }
  const priceMatch = m.match(/under\s+[₹$]?(\d+)|below\s+[₹$]?(\d+)|less\s+than\s+[₹$]?(\d+)|within\s+[₹$]?(\d+)/);
  if (priceMatch) {
    const max = parseInt(priceMatch[1] || priceMatch[2] || priceMatch[3]);
    const f = allProducts.filter(p => p.price <= max);
    if (f.length) return f.slice(0, 20);
  }
  const trending = [...allProducts].sort((a, b) => b.numReviews - a.numReviews).slice(0, 12);
  const topRated = [...allProducts].sort((a, b) => b.rating - a.rating).slice(0, 12);
  const seen = new Set();
  const mix = [];
  for (const p of [...trending, ...topRated]) {
    const id = String(p._id);
    if (!seen.has(id)) { seen.add(id); mix.push(p); }
    if (mix.length >= 20) break;
  }
  return mix;
}

// =============================================================================
// SYSTEM PROMPT
// =============================================================================
function buildPrompt({ user, allProducts, selectedProducts, cart, orders, categories, intent }) {
  const cartItems = cart?.items || [];
  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  return `You are ZoneBot, a world-class AI shopping assistant for OmniKart ecommerce platform.
Be intelligent, warm, concise. Sound like a knowledgeable friend.

STORE: Free shipping above ₹100 | Delivery 3-5 days | 30-day returns | Refund 5-7 days
Coupon: SAVE10 (10% off orders >₹200) | Support: support@omnikart.com Mon-Sat 9AM-6PM
Payments: Credit/Debit Card, UPI, Net Banking, COD, Razorpay
Categories: ${categories.join(", ")} | Total products: ${allProducts.length}

USER: ${user.name} (${user.email})
CART: ${cartItems.length > 0 ? `${cartItems.length} item(s) ₹${cartTotal.toLocaleString("en-IN")} — ${cartItems.map(i => `${i.name} x${i.quantity}`).join(", ")}` : "empty"}
RECENT ORDERS: ${orders.length > 0 ? orders.map(o => `#${String(o._id).slice(-6)} ₹${o.totalPrice.toLocaleString("en-IN")} ${o.isPaid ? "Paid" : "Pending"} ${o.isDelivered ? "Delivered" : "In Transit"}`).join(" | ") : "none"}
INTENT: ${intent}
${selectedProducts.length > 0 ? `
RELEVANT PRODUCTS (${selectedProducts.length}):
${selectedProducts.map(p => `ID:${p._id} | ${p.name} | ${p.brand} | ${p.category} | ₹${p.price.toLocaleString("en-IN")} | ${p.rating} Stars | ${p.countInStock > 0 ? `Stock:${p.countInStock}` : "OUT OF STOCK"}`).join("\n")}` : ""}

RESPOND WITH VALID JSON ONLY — no text before or after, no markdown fences:
{"message":"full response using \n for newlines and **text** for bold","action":null,"actionProduct":null,"products":[],"compareProducts":null,"suggestions":["s1","s2","s3"]}

action: null|ADD_TO_CART|REMOVE_FROM_CART|ADD_TO_WISHLIST|SHOW_CART|TRACK_ORDER|GO_CHECKOUT|COMPARE|ESCALATE|SHOW_PRODUCTS
actionProduct: {"_id":"EXACT_ID_FROM_LIST","name":"name","quantity":1} or null
products: [{"_id":"EXACT_ID","name":"name"}] max 4 or []
compareProducts: [{"_id":"ID1"},{"_id":"ID2"}] or null
suggestions: 3 short follow-up chips

STRICT RULES:
1. ONLY use _id values from RELEVANT PRODUCTS list. NEVER invent IDs. Always valid JSON.
2. MISSING & OUT OF STOCK HANDLING — critical:
   - If the exact product requested is IN STOCK (> 0): show normally, user can add to cart.
   - If the exact product requested is OUT OF STOCK, OR if the product DOES NOT EXIST in the RELEVANT PRODUCTS list:
     In message say EXACTLY: "⚠️ What you are asking is out of stock now and these are the relevant products:"
     Then show the most relevant available products from the list in the 'products' array.
   - If setting action for an out-of-stock item you know exists, use ADD_TO_WISHLIST.
3. If user tries to buy an out-of-stock item: save to wishlist + show alternatives.
4. Always suggest 3 helpful follow-up chips`;
}

// =============================================================================
// ACTION EXECUTOR
// =============================================================================
async function executeAction(action, payload, userId) {
  if (!payload?._id) return null;
  if (action === "ADD_TO_CART") {
    const product = await Product.findById(payload._id).lean();
    if (!product) return { success: false, reason: "not_found", productName: payload.name };
    // Out of stock — auto save to wishlist instead of cart
    if (product.countInStock < 1) {
      try {
        const u = await User.findById(userId);
        const has = u.wishlist?.some(w => String(w) === String(product._id));
        if (!has) await User.findByIdAndUpdate(userId, { $addToSet: { wishlist: product._id } });
      } catch { }
      return { success: false, reason: "out_of_stock", productName: product.name, autoWishlisted: true };
    }
    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = new Cart({ user: userId, items: [] });
    const idx = cart.items.findIndex(i => String(i.product) === String(product._id));
    if (idx >= 0) cart.items[idx].quantity += (payload.quantity || 1);
    else cart.items.push({ product: product._id, name: product.name, image: product.image, price: product.price, countInStock: product.countInStock, quantity: payload.quantity || 1 });
    await cart.save();
    return { success: true, type: "cart_added", productName: product.name };
  }
  if (action === "REMOVE_FROM_CART") {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return { success: false, reason: "empty_cart" };
    const before = cart.items.length;
    cart.items = cart.items.filter(i => {
      const byId = payload._id && String(i.product) === String(payload._id);
      const byName = payload.name && i.name.toLowerCase().includes(payload.name.toLowerCase());
      return !byId && !byName;
    });
    if (cart.items.length === before) return { success: false, reason: "not_in_cart" };
    await cart.save();
    return { success: true, type: "cart_removed", productName: payload.name || "item" };
  }
  if (action === "ADD_TO_WISHLIST") {
    const product = await Product.findById(payload._id).lean();
    if (!product) return { success: false };
    const user = await User.findById(userId);
    const has = user.wishlist?.some(w => String(w) === String(product._id));
    if (!has) await User.findByIdAndUpdate(userId, { $addToSet: { wishlist: product._id } });
    return { success: true, type: has ? "already_in_wishlist" : "wishlist_added", productName: product.name };
  }
  return null;
}

// =============================================================================
// PRODUCT ENRICHER
// =============================================================================
async function enrichProducts(rawList) {
  if (!rawList?.length) return [];
  const fields = "name price image rating brand category _id countInStock isFeatured";
  const results = [];
  for (const item of rawList.slice(0, 4)) {
    if (item._id) {
      try { const p = await Product.findById(item._id, fields).lean(); if (p) { results.push(p); continue; } } catch { }
    }
    if (item.name) {
      const p = await Product.findOne({ name: { $regex: String(item.name).slice(0, 20), $options: "i" } }, fields).lean();
      if (p) results.push(p);
    }
  }
  return results;
}

// =============================================================================
// ROUTES
// =============================================================================
router.post("/message", protect, async (req, res) => {
  try {
    const { message, history = [], sessionId } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: "Message is required" });
    const userId = req.user._id;
    const cleanMsg = message.trim();
    const [allProducts, cart, orders] = await Promise.all([
      Product.find({}, "name brand category price rating countInStock _id image numReviews isFeatured").lean(),
      Cart.findOne({ user: userId }).lean(),
      Order.find({ user: userId }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);
    const categories = [...new Set(allProducts.map(p => p.category))];
    const intent = classifyIntent(cleanMsg);
    const selectedProducts = selectProducts(allProducts, intent, cleanMsg);
    const system = buildPrompt({ user: req.user, allProducts, selectedProducts, cart, orders, categories, intent });
    const rawAI = await callAI(system, cleanMsg, history);

    let parsed = null;
    try {
      const clean = rawAI.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      const match = rawAI.match(/\{[\s\S]*\}/);
      if (match) { try { parsed = JSON.parse(match[0]); } catch { } }
    }

    if (!parsed || typeof parsed !== "object") {
      parsed = { message: rawAI || "I'm here to help!", action: null, actionProduct: null, products: [], compareProducts: null, suggestions: ["Show products", "My cart", "Track order"] };
    }

    parsed.message = String(parsed.message || "How can I help?");
    parsed.action = parsed.action || null;
    parsed.actionProduct = parsed.actionProduct || null;
    parsed.products = Array.isArray(parsed.products) ? parsed.products : [];
    parsed.compareProducts = Array.isArray(parsed.compareProducts) ? parsed.compareProducts : null;
    parsed.suggestions = Array.isArray(parsed.suggestions) && parsed.suggestions.length ? parsed.suggestions : ["Show products", "My cart", "Help"];

    const actionResult = await executeAction(parsed.action, parsed.actionProduct, userId);

    // Auto-fetch similar in-stock products when item is out of stock
    let similarProducts = [];
    if (actionResult?.reason === "out_of_stock" && actionResult?.autoWishlisted) {
      try {
        const oosProduct = await Product.findById(parsed.actionProduct?._id, "category").lean();
        if (oosProduct) {
          similarProducts = await Product.find(
            { category: oosProduct.category, countInStock: { $gt: 0 }, _id: { $ne: parsed.actionProduct._id } },
            "name price image rating brand category _id countInStock isFeatured"
          ).sort({ rating: -1 }).limit(4).lean();
        }
      } catch { }
    }

    let cartData = undefined;
    if (parsed.action === "SHOW_CART") {
      const fresh = await Cart.findOne({ user: userId }).lean();
      cartData = fresh?.items || [];
    }

    let orderData = undefined;
    if (parsed.action === "TRACK_ORDER") {
      orderData = orders.map(o => ({
        id: String(o._id).slice(-6), fullId: o._id,
        total: o.totalPrice, paid: o.isPaid, delivered: o.isDelivered,
        date: o.createdAt, itemCount: o.items?.length || 0,
      }));
    }

    const [enrichedProducts, enrichedCompare] = await Promise.all([
      enrichProducts(parsed.products),
      enrichProducts(parsed.compareProducts || []),
    ]);

    if (ChatHistory && sessionId) {
      ChatHistory.findOneAndUpdate(
        { user: userId, sessionId },
        { $push: { messages: { $each: [{ role: "user", content: cleanMsg, intent }, { role: "assistant", content: parsed.message }] } }, $setOnInsert: { user: userId, sessionId } },
        { upsert: true }
      ).catch(() => { });
    }

    // If out of stock, use similar in-stock products
    const finalProducts = similarProducts.length > 0 ? similarProducts : enrichedProducts;

    return res.json({
      success: true, message: parsed.message, action: parsed.action,
      actionResult: actionResult || null,
      products: finalProducts,
      compareProducts: enrichedCompare.length >= 2 ? enrichedCompare : null,
      cartItems: cartData, orderData: orderData,
      suggestions: parsed.suggestions, intent,
    });
  } catch (err) {
    console.error("❌ /chatbot/message:", err.message);
    return res.status(500).json({ success: false, message: `ZoneBot error: ${err.message}`, action: null, products: [], suggestions: ["Try again", "Show products", "Contact support"] });
  }
});

router.post("/translate", protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim() || text.trim().length < 2) return res.json({ translated: text, language: "en", wasTranslated: false });
    if (/^[\x00-\x7F]+$/.test(text.trim())) return res.json({ translated: text, language: "en", wasTranslated: false });
    const result = await callAI(
      "You are a translator. Respond with JSON only.",
      `Detect language and translate to English. Text: "${text}"\nReturn: {"detectedLanguage":"en/hi/kn/ta/te/other","translatedText":"english text","wasTranslated":true}`,
      []
    );
    const match = result.match(/\{[\s\S]*\}/);
    const data = match ? JSON.parse(match[0]) : null;
    return res.json({ translated: data?.translatedText || text, language: data?.detectedLanguage || "en", wasTranslated: data?.wasTranslated || false });
  } catch { return res.json({ translated: req.body?.text || "", language: "en", wasTranslated: false }); }
});

router.get("/history", protect, async (req, res) => {
  try {
    if (!ChatHistory) return res.json([]);
    const filter = { user: req.user._id };
    if (req.query.sessionId) filter.sessionId = req.query.sessionId;
    return res.json(await ChatHistory.find(filter).sort({ createdAt: -1 }).limit(5).lean());
  } catch (err) { return res.status(500).json({ message: err.message }); }
});

router.post("/escalate", protect, async (req, res) => {
  try {
    if (ChatHistory && req.body?.sessionId) {
      await ChatHistory.findOneAndUpdate({ user: req.user._id, sessionId: req.body.sessionId }, { escalated: true }).catch(() => { });
    }
    return res.json({ success: true, message: `✅ Connected to support!\n\nWe'll reach out to **${req.user.email}** within 2 hours.\n📧 support@omnikart.com | Mon–Sat 9AM–6PM` });
  } catch (err) { return res.status(500).json({ message: err.message }); }
});

// =============================================================================
//  ROUTE: POST /api/chatbot/visual — Image Search
//  Accepts base64 image, uses Groq vision or text model to identify product
// =============================================================================
router.post("/visual", protect, async (req, res) => {
  try {
    const { imageBase64, mediaType } = req.body;
    if (!imageBase64) return res.status(400).json({ message: "Image data required" });

    const provider = (process.env.CHATBOT_PROVIDER || "groq").toLowerCase();

    let analysisText = "";

    // Gemini supports vision natively
    if (provider === "gemini") {
      const key = process.env.GEMINI_API_KEY;
      if (!key) throw new Error("GEMINI_API_KEY not set");

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mediaType || "image/jpeg", data: imageBase64 } },
              { text: `Analyze this product image. Return JSON only: {"productName":"name","category":"category from: Electronics,Computers,Clothing,Home & Kitchen,Books,Gaming,Sports,Cameras,Beauty,Health,Toys,Music,Automotive,Pet Supplies","searchTerms":["term1","term2","term3"],"brand":"brand if visible or empty string"}` }
            ]
          }],
          generationConfig: { maxOutputTokens: 200 }
        }),
      });
      const d = await r.json();
      analysisText = d.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else {
      // Groq: text-only model — use filename/mime type heuristic + smart fallback
      // Since llama-3.1-8b-instant doesn't support vision, we search products based
      // on what we can infer, then let user refine
      analysisText = JSON.stringify({
        productName: "product",
        category: "",
        searchTerms: ["product"],
        brand: "",
        note: "vision_not_supported"
      });
    }

    // Parse JSON from AI response
    let analysis = null;
    try {
      const clean = analysisText.replace(/```json|```/g, "").trim();
      analysis = JSON.parse(clean);
    } catch {
      const m = analysisText.match(/\{[\s\S]*\}/);
      if (m) { try { analysis = JSON.parse(m[0]); } catch { } }
    }

    if (!analysis) {
      analysis = { productName: "product", category: "", searchTerms: ["product"], brand: "" };
    }

    return res.json({ success: true, analysis });
  } catch (err) {
    console.error("❌ /chatbot/visual error:", err.message);
    return res.status(500).json({ success: false, message: err.message, analysis: { searchTerms: [], category: "" } });
  }
});

module.exports = router;