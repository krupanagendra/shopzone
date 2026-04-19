const Product = require("../models/Product");
const cloudinary = require("../config/cloudinary");

function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

exports.getSearchSuggestions = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";
    if (!keyword) return res.json([]);
    const regex = new RegExp(keyword, "i");
    const products = await Product.find({
      $or: [{ name: { $regex: regex } }, { brand: { $regex: regex } }]
    })
      .select("name brand category")
      .limit(5)
      .lean();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const pageSize = parseInt(req.query.pageSize) || 12;
    const page = parseInt(req.query.page) || 1;

    let query = {};

    if (req.query.keyword) {
      const regex = new RegExp(req.query.keyword, "i");
      query.$or = [
        { name: { $regex: regex } },
        { brand: { $regex: regex } },
        { category: { $regex: regex } }
      ];
    }
    if (req.query.category) query.category = req.query.category;
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice);
    }
    if (req.query.rating) query.rating = { $gte: parseFloat(req.query.rating) };

    let sort = {};
    if (req.query.sort === "price_asc") sort = { price: 1 };
    else if (req.query.sort === "price_desc") sort = { price: -1 };
    else if (req.query.sort === "rating") sort = { rating: -1 };
    else sort = { createdAt: -1 };

    let count = await Product.countDocuments(query);
    let suggestion = null;

    if (count === 0 && req.query.keyword) {
      const allProducts = await Product.find({}, "name brand category").lean();
      let bestMatch = null;
      let lowestDist = Infinity;
      const searchLower = req.query.keyword.toLowerCase();

      for (const p of allProducts) {
        const words = (p.name + " " + p.brand + " " + p.category).toLowerCase().split(/[\s-]+/);
        for (const word of words) {
          if (word.length < 3) continue;
          const dist = levenshtein(searchLower, word);
          if (dist < lowestDist && dist <= 2) {
            lowestDist = dist;
            bestMatch = p.name;
          }
        }
      }
      if (bestMatch) {
        suggestion = bestMatch;
      }
    }

    const products = await Product.find(query)
      .sort(sort)
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({ products, page, pages: Math.ceil(count / pageSize), total: count, suggestion });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("reviews.user", "name");
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct("category");
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    let imageUrl = req.body.image || "https://via.placeholder.com/400";
    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;
      const result = await cloudinary.uploader.upload(dataURI, { folder: "ecommerce" });
      imageUrl = result.secure_url;
    }
    const product = await Product.create({ ...req.body, image: imageUrl });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let imageUrl = product.image;
    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;
      const result = await cloudinary.uploader.upload(dataURI, { folder: "ecommerce" });
      imageUrl = result.secure_url;
    }

    Object.assign(product, req.body, { image: imageUrl });
    const updated = await product.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createReview = async (req, res) => {
  try {
    const rating = Number(req.body.rating);
    const comment = (req.body.comment || "").trim();

    // Validate explicitly
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }
    if (!comment) {
      return res.status(400).json({ message: "Comment is required" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );
    if (alreadyReviewed) return res.status(400).json({ message: "You have already reviewed this product" });

    // Upload review photos to Cloudinary (up to 3 photos)
    const photos = [];
    if (req.files && req.files.length > 0) {
      const cloudinary = require("../config/cloudinary");
      for (const file of req.files.slice(0, 3)) {
        try {
          const b64 = Buffer.from(file.buffer).toString("base64");
          const dataURI = `data:${file.mimetype};base64,${b64}`;
          const result = await cloudinary.uploader.upload(dataURI, {
            folder: "ecommerce/reviews",
            transformation: [{ width: 800, height: 800, crop: "limit", quality: "auto" }],
          });
          photos.push(result.secure_url);
        } catch (uploadErr) {
          console.error("Photo upload failed:", uploadErr.message);
          // Continue without photo rather than failing the whole review
        }
      }
    }

    product.reviews.push({
      user: req.user._id,
      name: req.user.name,
      rating,
      comment,
      photos,
    });
    product.numReviews = product.reviews.length;
    product.rating = product.reviews.reduce((acc, r) => r.rating + acc, 0) / product.reviews.length;
    await product.save();
    res.status(201).json({ message: "Review added successfully", photos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ isFeatured: true }).limit(8);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSimilarProducts = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Find products in same category, excluding current, sorted by rating
    const similar = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
    })
      .sort({ rating: -1, numReviews: -1 })
      .limit(6)
      .lean();

    res.json(similar);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Phase 6: AI Review Summary ────────────────────────────────────────────────
exports.getReviewSummary = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (!product.reviews?.length) {
      return res.json({ summary: "No reviews yet. Be the first to review this product!", sentiment: "neutral", count: 0 });
    }

    const provider = (process.env.CHATBOT_PROVIDER || "groq").toLowerCase();
    const reviews = product.reviews.slice(-20); // last 20 reviews
    const reviewText = reviews.map((r, i) => `Review ${i + 1} (${r.rating}★): ${r.comment}`).join("\n");
    const avgRating = (product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length).toFixed(1);

    const prompt = `Analyze these ${reviews.length} customer reviews for "${product.name}" (avg rating: ${avgRating}★).
Write a 2-3 sentence AI summary highlighting: main pros, main cons (if any), and overall sentiment.
Be concise and helpful for a shopper deciding to buy.
Reviews:\n${reviewText}
Return JSON only: {"summary":"2-3 sentence summary","sentiment":"positive|mixed|negative","pros":["pro1","pro2"],"cons":["con1"]}`;

    let aiText = "";

    if (provider === "groq") {
      const key = process.env.GROQ_API_KEY;
      if (!key) return res.json({ summary: "AI summary unavailable.", sentiment: "neutral", count: reviews.length });
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: "llama-3.1-8b-instant", messages: [{ role: "user", content: prompt }], max_tokens: 300, temperature: 0.5 }),
      });
      const d = await r.json();
      aiText = d.choices?.[0]?.message?.content || "";
    } else if (provider === "gemini") {
      const key = process.env.GEMINI_API_KEY;
      if (!key) return res.json({ summary: "AI summary unavailable.", sentiment: "neutral", count: reviews.length });
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 300 } }),
      });
      const d = await r.json();
      aiText = d.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    // Parse JSON from AI
    let parsed = null;
    try {
      const clean = aiText.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      const m = aiText.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch { } }
    }

    res.json({
      summary: parsed?.summary || "This product has received mixed customer feedback.",
      sentiment: parsed?.sentiment || "mixed",
      pros: parsed?.pros || [],
      cons: parsed?.cons || [],
      count: product.reviews.length,
      avgRating,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};