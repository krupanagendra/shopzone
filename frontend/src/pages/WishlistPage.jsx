import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchWishlist } from "../redux/slices/wishlistSlice";
import { addToCart } from "../redux/slices/cartSlice";
import { toggleWishlist } from "../redux/slices/wishlistSlice";
import Spinner from "../components/common/Spinner";
import Rating from "../components/common/Rating";
import { FaHeart, FaShoppingCart } from "react-icons/fa";

const WishlistPage = () => {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((s) => s.wishlist);
  const { userInfo } = useSelector((s) => s.auth);

  useEffect(() => { if (userInfo) dispatch(fetchWishlist()); }, [dispatch, userInfo]);

  if (!userInfo) return (
    <div className="text-center py-20">
      <p className="text-xl mb-4">Please sign in to view your wishlist</p>
      <Link to="/login" className="btn-primary py-3 px-8">Sign In</Link>
    </div>
  );

  if (loading) return <Spinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><FaHeart className="text-red-500" /> My Wishlist ({items.length})</h1>
      {items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-6xl mb-4">💝</p>
          <p className="text-xl mb-4">Your wishlist is empty</p>
          <Link to="/products" className="btn-primary py-3 px-8">Discover Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((product) => (
            <div key={product._id} className="card">
              <div className="relative">
                <Link to={`/product/${product._id}`}>
                  <img src={product.image} alt={product.name} className="w-full h-48 object-cover"
                    onError={(e)=>{e.target.src="https://via.placeholder.com/400"}} />
                </Link>
                <button onClick={() => dispatch(toggleWishlist(product._id))} className="absolute top-2 right-2 p-2 bg-white rounded-full shadow">
                  <FaHeart className="text-red-500" />
                </button>
              </div>
              <div className="p-4">
                <Link to={`/product/${product._id}`} className="font-semibold hover:text-amazon-blue line-clamp-2">{product.name}</Link>
                <Rating value={product.rating} />
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold">${product.price.toFixed(2)}</span>
                  <button onClick={() => dispatch(addToCart({ productId: product._id, quantity: 1 }))}
                    className="flex items-center gap-1 bg-amazon-yellow hover:bg-amazon-orange text-black text-sm px-3 py-1 rounded font-semibold">
                    <FaShoppingCart className="text-xs" /> Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;