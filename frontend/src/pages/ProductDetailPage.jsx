import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { productAPI } from "../services/api";
import { addToCart } from "../redux/slices/cartSlice";
import { toggleWishlist } from "../redux/slices/wishlistSlice";
import Rating from "../components/common/Rating";
import Spinner from "../components/common/Spinner";
import { toast } from "react-toastify";
import { FaHeart, FaRegHeart, FaShoppingCart, FaArrowLeft } from "react-icons/fa";
import { Link } from "react-router-dom";

const ProductDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { userInfo } = useSelector((s) => s.auth);
  const { wishlistIds } = useSelector((s) => s.wishlist);
  const isWishlisted = wishlistIds.includes(id);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await productAPI.getProductById(id);
      setProduct(res.data);
    } catch (err) {
      toast.error("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProduct(); }, [id]);

  const handleAddToCart = () => {
    if (!userInfo) { toast.info("Please sign in"); return; }
    dispatch(addToCart({ productId: id, quantity: qty }));
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!userInfo) { toast.info("Please sign in"); return; }
    try {
      setSubmitting(true);
      await productAPI.createReview(id, { rating: reviewRating, comment: reviewComment });
      toast.success("Review added!");
      setReviewComment("");
      fetchProduct();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner size="lg" />;
  if (!product) return <div className="text-center py-20">Product not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Link to="/products" className="flex items-center gap-2 text-amazon-blue hover:underline mb-6"><FaArrowLeft /> Back to Products</Link>

      <div className="grid md:grid-cols-2 gap-8 bg-white rounded-xl shadow p-6">
        {/* Image */}
        <div>
          <img src={product.image} alt={product.name} className="w-full rounded-lg max-h-96 object-contain"
            onError={(e) => { e.target.src = "https://via.placeholder.com/600"; }} />
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div className="text-sm text-gray-500">{product.brand} · {product.category}</div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <Rating value={product.rating} text={`${product.numReviews} reviews`} />
          <div className="text-3xl font-bold text-gray-900">${product.price.toFixed(2)}</div>
          <p className="text-gray-600">{product.description}</p>

          <div className="flex items-center gap-2">
            <span className={`font-semibold ${product.countInStock > 0 ? "text-green-600" : "text-red-500"}`}>
              {product.countInStock > 0 ? `In Stock (${product.countInStock})` : "Out of Stock"}
            </span>
          </div>

          {product.countInStock > 0 && (
            <div className="flex items-center gap-3">
              <label className="font-semibold">Qty:</label>
              <select value={qty} onChange={(e) => setQty(Number(e.target.value))} className="input-field w-20">
                {Array.from({ length: Math.min(product.countInStock, 10) }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={handleAddToCart} disabled={product.countInStock === 0}
              className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50">
              <FaShoppingCart /> Add to Cart
            </button>
            <button onClick={() => userInfo && dispatch(toggleWishlist(id))}
              className="p-3 border rounded-lg hover:border-red-400 transition-colors">
              {isWishlisted ? <FaHeart className="text-red-500 text-xl" /> : <FaRegHeart className="text-gray-400 text-xl" />}
            </button>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-8 grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold mb-4">Customer Reviews</h2>
          {product.reviews.length === 0 ? (
            <p className="text-gray-500">No reviews yet. Be the first!</p>
          ) : (
            <div className="space-y-4">
              {product.reviews.map((r) => (
                <div key={r._id} className="bg-white p-4 rounded-lg shadow">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold">{r.name}</span>
                    <span className="text-gray-400 text-sm">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  <Rating value={r.rating} />
                  <p className="text-gray-600 mt-2">{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {userInfo && (
          <div>
            <h2 className="text-xl font-bold mb-4">Write a Review</h2>
            <form onSubmit={handleReview} className="bg-white p-4 rounded-lg shadow space-y-3">
              <div>
                <label className="block font-semibold mb-1">Rating</label>
                <select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))} className="input-field">
                  {[5,4,3,2,1].map((n) => <option key={n} value={n}>{"★".repeat(n)} ({n} stars)</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Comment</label>
                <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows={3}
                  className="input-field resize-none" placeholder="Share your experience..." required />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;