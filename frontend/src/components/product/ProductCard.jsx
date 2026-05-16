import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaHeart, FaRegHeart, FaShoppingCart } from "react-icons/fa";
import { toggleWishlist } from "../../redux/slices/wishlistSlice";
import { addToCart } from "../../redux/slices/cartSlice";
import Rating from "../common/Rating";
import { motion } from "framer-motion";

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
    <motion.div
      whileHover={{ y: -8 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="group relative block bg-white dark:bg-slate-800 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_12px_30px_rgba(0,0,0,0.3)] transition-all overflow-hidden border border-gray-100 dark:border-slate-700 flex flex-col h-full"
    >
      <Link to={`/product/${product._id}`} className="flex-grow flex flex-col relative">
        <div className="relative overflow-hidden aspect-[4/3] bg-gray-50 dark:bg-slate-700/50">
          <motion.img
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = "https://via.placeholder.com/400x300?text=No+Image"; }}
          />
          {product.countInStock === 0 && (
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-20">
              <span className="text-white font-bold bg-slate-900/80 px-4 py-1.5 rounded-full text-sm tracking-wide shadow-lg border border-white/20">Out of Stock</span>
            </div>
          )}
          {product.offer && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg z-10">
              {product.offer}
            </div>
          )}
          <button 
            onClick={handleWishlist} 
            className="absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur-md dark:bg-slate-800/90 rounded-full shadow-md hover:scale-110 transition-transform z-10 border border-white/20"
          >
            {isWishlisted ? <FaHeart className="text-red-500 text-sm" /> : <FaRegHeart className="text-gray-500 dark:text-gray-300 text-sm" />}
          </button>
        </div>
        
        <div className="p-5 flex flex-col flex-grow">
          <p className="text-xs font-semibold text-omnikart-accent uppercase tracking-wider mb-1.5">{product.brand}</p>
          <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 mb-2 text-base leading-tight group-hover:text-omnikart-accent transition-colors">
            {product.name}
          </h3>
          <div className="mt-auto">
            <Rating value={product.rating} text={`(${product.numReviews})`} />
            <div className="flex items-end justify-between mt-4">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 dark:text-gray-400 line-through mb-0.5">₹{(product.price * 1.2).toLocaleString("en-IN")}</span>
                <span className="text-xl font-black text-gray-900 dark:text-white leading-none">₹{product.price.toLocaleString("en-IN")}</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddToCart}
                disabled={product.countInStock === 0}
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-omnikart-accent dark:hover:bg-omnikart-accent px-4 py-2 sm:px-4 sm:py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 disabled:hover:bg-slate-900 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-md min-w-[100px]"
              >
                <FaShoppingCart className="text-sm" /> <span>Add</span>
              </motion.button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;