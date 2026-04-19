import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { productAPI } from "../services/api";
import { addToCart } from "../redux/slices/cartSlice";
import { toggleWishlist } from "../redux/slices/wishlistSlice";
import Rating from "../components/common/Rating";
import { SkeletonProductDetail } from "../components/common/SkeletonCard";
import ProductCard from "../components/product/ProductCard";
import { toast } from "react-toastify";
import { FaHeart, FaRegHeart, FaShoppingCart, FaArrowLeft, FaSearchPlus, FaTruck, FaBox, FaUndo, FaBolt, FaClipboardList, FaStar, FaRobot, FaSmile, FaFrown, FaMeh, FaThumbsUp, FaThumbsDown, FaComment, FaUser, FaCamera, FaShoppingBag } from "react-icons/fa";

const fmt = (n) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

// ─── Amazon-style image zoom ──────────────────────────────────────────────────
const ImageZoom = ({ src, alt }) => {
  const [zoomed, setZoomed] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const containerRef = useRef(null);
  const ZOOM_FACTOR = 2.5;
  const LENS_SIZE = 120;

  const handleMouseMove = useCallback((e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const lensX = Math.max(LENS_SIZE / 2, Math.min(mouseX, rect.width - LENS_SIZE / 2));
    const lensY = Math.max(LENS_SIZE / 2, Math.min(mouseY, rect.height - LENS_SIZE / 2));
    setLensPos({ x: lensX, y: lensY });
    setZoomPos({ x: (lensX / rect.width) * 100, y: (lensY / rect.height) * 100 });
  }, []);

  const fallback = `https://placehold.co/600x500/131921/febd69?text=${encodeURIComponent((alt || "Product").slice(0, 12))}`;

  return (
    <div className="relative flex gap-4">
      <div ref={containerRef}
        className="relative overflow-hidden rounded-xl border border-gray-200 bg-white cursor-crosshair select-none flex-shrink-0 w-full max-w-md mx-auto aspect-square md:aspect-auto md:h-[420px]"
        onMouseEnter={() => { if (imgLoaded) setZoomed(true); }}
        onMouseLeave={() => setZoomed(false)}
        onMouseMove={handleMouseMove}>
        <img src={src} alt={alt} className="w-full h-full object-contain"
          onLoad={() => setImgLoaded(true)}
          onError={e => { e.target.onerror = null; e.target.src = fallback; setImgLoaded(true); }}
          draggable={false} />
        {zoomed && (
          <div className="absolute border-2 border-amazon-yellow bg-amazon-yellow bg-opacity-20 pointer-events-none"
            style={{ width: LENS_SIZE, height: LENS_SIZE, left: lensPos.x - LENS_SIZE / 2, top: lensPos.y - LENS_SIZE / 2 }} />
        )}
        {!zoomed && imgLoaded && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black bg-opacity-60 text-white text-xs px-2.5 py-1.5 rounded-full pointer-events-none">
            <FaSearchPlus className="text-amazon-yellow" /> Hover to zoom
          </div>
        )}
      </div>
      {zoomed && (
        <div className="hidden md:block absolute top-0 rounded-xl border-2 border-amazon-yellow shadow-2xl bg-white overflow-hidden z-50 pointer-events-none"
          style={{
            left: "calc(100% + 16px)", width: 400, height: 420,
            backgroundImage: `url(${src})`, backgroundRepeat: "no-repeat",
            backgroundSize: `${ZOOM_FACTOR * 100}%`,
            backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`
          }} />
      )}
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const ProductDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();

  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [similarLoad, setSimilarLoad] = useState(false);
  const [qty, setQty] = useState(1);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [reviewPhotos, setReviewPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [aiSummary, setAiSummary] = useState(null);
  const [summaryLoad, setSummaryLoad] = useState(false);

  const { userInfo } = useSelector(s => s.auth);
  const { wishlistIds } = useSelector(s => s.wishlist);
  const isWishlisted = wishlistIds.includes(id);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await productAPI.getProductById(id);
      setProduct(res.data);
    } catch { toast.error("Failed to load product"); }
    finally { setLoading(false); }
  };

  const fetchSimilar = async () => {
    try {
      setSimilarLoad(true);
      const res = await productAPI.getSimilarProducts(id);
      setSimilar(res.data);
    } catch { }
    finally { setSimilarLoad(false); }
  };

  const fetchSummary = async () => {
    if (!product?.reviews?.length) return;
    try {
      setSummaryLoad(true);
      const res = await productAPI.getReviewSummary(id);
      setAiSummary(res.data);
    } catch { }
    finally { setSummaryLoad(false); }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchProduct();
    fetchSimilar();
  }, [id]);

  useEffect(() => {
    if (product?.reviews?.length > 0) fetchSummary();
  }, [product]);

  const handleAddToCart = () => {
    if (!userInfo) { toast.info("Please sign in to add to cart"); return; }
    dispatch(addToCart({ productId: id, quantity: qty }));
  };

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    setReviewPhotos(files);
    setPhotoPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!userInfo) { toast.info("Please sign in"); return; }
    if (!reviewComment.trim()) { toast.error("Please write a comment"); return; }
    try {
      setSubmitting(true);
      if (reviewPhotos.length > 0) {
        // With photos — use FormData
        const formData = new FormData();
        formData.append("rating", String(reviewRating));
        formData.append("comment", reviewComment.trim());
        reviewPhotos.forEach(photo => formData.append("photos", photo));
        await productAPI.createReview(id, formData);
      } else {
        // Without photos — use plain JSON (more reliable)
        await productAPI.createReviewJSON(id, {
          rating: Number(reviewRating),
          comment: reviewComment.trim(),
        });
      }
      toast.success("Review added!");
      setReviewComment("");
      setReviewRating(5);
      setReviewPhotos([]);
      setPhotoPreviews([]);
      fetchProduct();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add review");
    } finally { setSubmitting(false); }
  };

  if (loading) return <SkeletonProductDetail />;
  if (!product) return <div className="text-center py-20 text-gray-500">Product not found</div>;

  const discount = Math.floor((product._id.toString().charCodeAt(0) % 15) + 5);
  const originalPrice = Math.round(product.price * (1 + discount / 100));

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 flex-wrap">
        <Link to="/" className="hover:text-amazon-blue hover:underline">Home</Link>
        <span>›</span>
        <Link to="/products" className="hover:text-amazon-blue hover:underline">Products</Link>
        <span>›</span>
        <Link to={`/products?category=${product.category}`} className="hover:text-amazon-blue hover:underline">{product.category}</Link>
        <span>›</span>
        <span className="text-gray-800 font-medium line-clamp-1">{product.name}</span>
      </div>

      {/* Main card */}
      <div className="grid md:grid-cols-2 gap-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        {/* Image zoom */}
        <div>
          <ImageZoom src={product.image} alt={product.name} />
          <p className="text-xs text-gray-400 text-center mt-3 flex items-center justify-center gap-1">
            <FaSearchPlus className="text-amazon-yellow" /> Move mouse over image to zoom
          </p>
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-amazon-blue text-sm font-semibold">{product.brand}</span>
            <span className="text-gray-300">|</span>
            <span className="text-xs bg-amazon-yellow text-black px-2 py-0.5 rounded-full font-bold">{product.category}</span>
            {product.isFeatured && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><FaStar /> Featured</span>}
          </div>

          <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-snug">{product.name}</h1>

          <div className="flex items-center gap-3">
            <Rating value={product.rating} />
            <span className="text-amazon-blue text-sm">{product.numReviews} ratings</span>
          </div>

          <hr className="border-gray-100" />

          {/* Price */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-gray-900">{fmt(product.price)}</span>
              <span className="text-gray-400 line-through text-lg">{fmt(originalPrice)}</span>
              <span className="text-green-600 font-bold text-sm bg-green-50 px-2 py-0.5 rounded">Save {discount}%</span>
            </div>
            <p className="text-xs text-gray-500">Inclusive of all taxes</p>
          </div>

          <hr className="border-gray-100" />

          {/* Stock */}
          <div className="flex items-center gap-2">
            {product.countInStock > 0 ? (
              <>
                <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                <span className="text-green-600 font-semibold text-sm">
                  {product.countInStock <= 5 ? `Only ${product.countInStock} left!` : "In Stock"}
                </span>
              </>
            ) : (
              <>
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                <span className="text-red-500 font-semibold text-sm">Out of stock</span>
              </>
            )}
          </div>

          {/* Delivery info */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
            <div className="flex items-center gap-2 text-gray-700"><FaTruck className="text-gray-500" /><span><strong>FREE delivery</strong> on orders above ₹8,400</span></div>
            <div className="flex items-center gap-2 text-gray-700"><FaBox className="text-gray-500" /><span>Standard: <strong>3-5 business days</strong></span></div>
            <div className="flex items-center gap-2 text-gray-700"><FaUndo className="text-gray-500" /><span><strong>30-day</strong> hassle-free returns</span></div>
          </div>

          {/* Qty */}
          {product.countInStock > 0 && (
            <div className="flex items-center gap-3">
              <label className="font-semibold text-sm text-gray-700">Quantity:</label>
              <select value={qty} onChange={e => setQty(Number(e.target.value))}
                className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-amazon-yellow">
                {Array.from({ length: Math.min(product.countInStock, 10) }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={handleAddToCart} disabled={product.countInStock === 0}
              className="flex-1 bg-amazon-yellow hover:bg-amazon-orange text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
              <FaShoppingCart /> Add to Cart
            </button>
            <button onClick={() => { if (!userInfo) { toast.info("Sign in to save"); return; } dispatch(toggleWishlist(id)); }}
              className={`p-3 border-2 rounded-xl transition-all hover:scale-110 ${isWishlisted ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-red-400"}`}>
              {isWishlisted ? <FaHeart className="text-red-500 text-xl" /> : <FaRegHeart className="text-gray-400 text-xl" />}
            </button>
          </div>

          {product.countInStock > 0 && (
            <button onClick={() => { handleAddToCart(); setTimeout(() => window.location.href = "/checkout", 500); }}
              className="w-full bg-amazon-orange hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm">
              <FaBolt className="inline" /> Buy Now
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="flex border-b border-gray-100">
          {["description", "reviews"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-sm font-bold capitalize transition-colors
                ${activeTab === tab ? "text-amazon-blue border-b-2 border-amazon-blue bg-blue-50" : "text-gray-500 hover:text-gray-700"}`}>
              {tab === "description" ? <><FaClipboardList className="inline mr-1" />Description</> : <><FaStar className="inline mr-1" />Reviews ({product.reviews.length})</>}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === "description" && (
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                {[["Brand", product.brand], ["Category", product.category], ["Rating", `${product.rating} / 5`],
                ["Reviews", product.numReviews], ["In Stock", product.countInStock || "Out of stock"], ["Price", fmt(product.price)]
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-sm font-semibold text-gray-500">{k}</span>
                    <span className="text-sm font-bold text-gray-800">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-gray-800 mb-4">Customer Reviews</h3>

                {/* AI Summary */}
                {summaryLoad && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4 animate-pulse">
                    <div className="h-4 bg-blue-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-blue-200 rounded w-1/2" />
                  </div>
                )}
                {aiSummary && !summaryLoad && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FaRobot className="text-lg text-blue-600" />
                      <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">AI Review Summary</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ml-auto ` +
                        (aiSummary.sentiment === "positive" ? "bg-green-100 text-green-700" :
                          aiSummary.sentiment === "negative" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>
                        {aiSummary.sentiment === "positive" ? <><FaSmile className="inline" /> Mostly Positive</> :
                          aiSummary.sentiment === "negative" ? <><FaFrown className="inline" /> Mixed Concerns</> : <><FaMeh className="inline" /> Mixed Reviews</>}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed mb-3">{aiSummary.summary}</p>
                    {(aiSummary.pros?.length > 0 || aiSummary.cons?.length > 0) && (
                      <div className="grid grid-cols-2 gap-3">
                        {aiSummary.pros?.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-green-700 mb-1 flex items-center gap-1"><FaThumbsUp /> Pros</p>
                            {aiSummary.pros.map((p, i) => <p key={i} className="text-xs text-gray-600">• {p}</p>)}
                          </div>
                        )}
                        {aiSummary.cons?.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-red-600 mb-1 flex items-center gap-1"><FaThumbsDown /> Cons</p>
                            {aiSummary.cons.map((c, i) => <p key={i} className="text-xs text-gray-600">• {c}</p>)}
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">Based on {aiSummary.count} reviews · Avg {aiSummary.avgRating}★</p>
                  </div>
                )}
                {product.reviews.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <FaComment className="text-4xl mb-2 text-gray-300" />
                    <p>No reviews yet. Be the first!</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {product.reviews.map(r => (
                      <div key={r._id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm text-gray-800 flex items-center gap-1"><FaUser className="text-gray-500" /> {r.name}</span>
                          <span className="text-gray-400 text-xs">{new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                        <Rating value={r.rating} />
                        <p className="text-gray-600 text-sm mt-2 leading-relaxed">{r.comment}</p>
                        {r.photos?.length > 0 && (
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {r.photos.map((photo, pi) => (
                              <a key={pi} href={photo} target="_blank" rel="noreferrer">
                                <img src={photo} alt={`Review photo ${pi + 1}`}
                                  className="w-16 h-16 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity cursor-zoom-in" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {userInfo ? (
                <div>
                  <h3 className="font-bold text-gray-800 mb-4">Write a Review</h3>
                  <form onSubmit={handleReview} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1.5 text-gray-700">Rating</label>
                      <select value={reviewRating} onChange={e => setReviewRating(Number(e.target.value))}
                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amazon-yellow">
                        {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{"★".repeat(n)}{"☆".repeat(5 - n)} ({n} stars)</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1.5 text-gray-700">Your Review</label>
                      <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)}
                        rows={4} required placeholder="Share your experience..."
                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-amazon-yellow" />
                    </div>
                    {/* Photo upload */}
                    <div>
                      <label className="block text-sm font-semibold mb-1.5 text-gray-700">
                        Add Photos <span className="text-gray-400 font-normal">(optional, max 3)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-300 hover:border-amazon-yellow rounded-xl p-3 transition-colors">
                        <FaCamera className="text-2xl text-gray-400" />
                        <span className="text-sm text-gray-500">Click to upload photos</span>
                        <input type="file" accept="image/*" multiple onChange={handlePhotoSelect} className="hidden" />
                      </label>
                      {photoPreviews.length > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {photoPreviews.map((src, i) => (
                            <div key={i} className="relative">
                              <img src={src} alt={`Preview ${i}`} className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                              <button type="button" onClick={() => {
                                setReviewPhotos(p => p.filter((_, j) => j !== i));
                                setPhotoPreviews(p => p.filter((_, j) => j !== i));
                              }}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button type="submit" disabled={submitting}
                      className="w-full bg-amazon-yellow hover:bg-amazon-orange text-black font-bold py-3 rounded-xl transition-all disabled:opacity-50">
                      {submitting ? "Uploading..." : "Submit Review"}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <div className="text-center p-8 bg-gray-50 rounded-xl">
                    <p className="text-gray-500 mb-3">Sign in to write a review</p>
                    <Link to="/login" className="bg-amazon-yellow text-black font-bold px-6 py-2 rounded-xl hover:bg-amazon-orange transition-colors">Sign In</Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Similar Products ── */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FaShoppingBag className="inline" /> Similar Products
          <span className="text-sm font-normal text-gray-500">in {product.category}</span>
        </h2>
        {similarLoad ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow p-3 space-y-2">
                <div className="bg-gray-200 h-32 rounded-lg" />
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : similar.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {similar.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ProductDetailPage;
