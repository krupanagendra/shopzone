import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaHeart, FaRegHeart, FaShoppingCart } from "react-icons/fa";
import { toggleWishlist } from "../../redux/slices/wishlistSlice";
import { addToCart } from "../../redux/slices/cartSlice";
import Rating from "../common/Rating";

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((s) => s.auth);
  const { wishlistIds } = useSelector((s) => s.wishlist);
  const isWishlisted = wishlistIds.includes(product._id);

  const handleWishlist = (e) => {
    e.preventDefault();
    if (!userInfo) return;
    dispatch(toggleWishlist(product._id));
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!userInfo) return;
    dispatch(addToCart({ productId: product._id, quantity: 1 }));
  };

  return (
    <Link to={`/product/${product._id}`} className="card group block">
      <div className="relative overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.src = "https://via.placeholder.com/400x300?text=No+Image"; }}
        />
        {product.countInStock === 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-bold bg-red-500 px-2 py-1 rounded">Out of Stock</span>
          </div>
        )}
        {product.offer && (
          <div className="absolute top-2 left-0 bg-gradient-to-r from-red-600 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-r-full shadow-lg z-10 animate-pulse">
            {product.offer}
          </div>
        )}
        <button onClick={handleWishlist} className="absolute top-2 right-2 p-2 bg-white rounded-full shadow hover:scale-110 transition-transform z-10">
          {isWishlisted ? <FaHeart className="text-red-500" /> : <FaRegHeart className="text-gray-400" />}
        </button>
      </div>
      <div className="p-4">
        <p className="text-xs text-gray-500 mb-1">{product.brand}</p>
        <h3 className="font-semibold text-gray-800 line-clamp-2 mb-2 group-hover:text-amazon-blue transition-colors">{product.name}</h3>
        <Rating value={product.rating} text={`(${product.numReviews})`} />
        <div className="flex items-center justify-between mt-3">
          <span className="text-lg sm:text-xl font-bold text-gray-900">₹{product.price.toLocaleString("en-IN")}</span>
          <button
            onClick={handleAddToCart}
            disabled={product.countInStock === 0}
            className="bg-amazon-yellow hover:bg-amazon-orange text-black px-4 py-2 sm:px-3 sm:py-1 rounded text-sm font-semibold transition-colors disabled:opacity-40 flex items-center gap-1 min-h-[36px]"
          >
            <FaShoppingCart className="text-xs" /> Add
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;