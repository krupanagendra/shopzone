import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchFeatured } from "../redux/slices/productSlice";
import { fetchCart } from "../redux/slices/cartSlice";
import { fetchWishlist } from "../redux/slices/wishlistSlice";
import ProductCard from "../components/product/ProductCard";
import Spinner from "../components/common/Spinner";

const ALL_CATEGORIES = [
  { label: "Electronics", emoji: "📱", color: "from-blue-700 to-blue-500", img: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&fit=crop" },
  { label: "Computers", emoji: "💻", color: "from-gray-800 to-gray-600", img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&fit=crop" },
  { label: "Clothing", emoji: "👟", color: "from-pink-700 to-pink-500", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&fit=crop" },
  { label: "Home & Kitchen", emoji: "🏠", color: "from-green-700 to-green-500", img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&fit=crop" },
  { label: "Books", emoji: "📚", color: "from-yellow-700 to-yellow-500", img: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&fit=crop" },
  { label: "Gaming", emoji: "🎮", color: "from-purple-700 to-purple-500", img: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400&fit=crop" },
  { label: "Sports", emoji: "🚴", color: "from-orange-700 to-orange-500", img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&fit=crop" },
  { label: "Cameras", emoji: "📷", color: "from-red-700 to-red-500", img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&fit=crop" },
  { label: "Beauty", emoji: "🧴", color: "from-rose-600 to-pink-400", img: "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400&fit=crop" },
  { label: "Health", emoji: "🌱", color: "from-teal-700 to-teal-500", img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&fit=crop" },
  { label: "Toys", emoji: "🧸", color: "from-amber-600 to-yellow-400", img: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&fit=crop" },
  { label: "Music", emoji: "🎵", color: "from-indigo-700 to-indigo-500", img: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&fit=crop" },
  { label: "Automotive", emoji: "🚗", color: "from-slate-700 to-slate-500", img: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&fit=crop" },
  { label: "Pet Supplies", emoji: "🐾", color: "from-lime-700 to-lime-500", img: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&fit=crop" },
];

const HomePage = () => {
  const dispatch = useDispatch();
  const { featured, loading } = useSelector((s) => s.products);
  const { userInfo } = useSelector((s) => s.auth);

  useEffect(() => {
    dispatch(fetchFeatured());
    if (userInfo) {
      dispatch(fetchCart());
      dispatch(fetchWishlist());
    }
  }, [dispatch, userInfo]);

  return (
    <div>

      {/* ── Hero Banner ── */}
      <div className="relative bg-gradient-to-r from-amazon-blue to-amazon text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl">

            {/* Heading with inline logo — matches navbar exactly */}
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Welcome to{" "}
              <span className="inline-flex items-center gap-1 align-middle">
                <span className="text-white text-3xl md:text-4xl">🏠</span>
                <span className="text-amazon-yellow font-black text-4xl md:text-5xl tracking-tight">ShopZone</span>
              </span>
            </h1>

            <p className="text-xl mb-8 text-gray-300">
              Discover millions of products across 14 categories at unbeatable prices
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link
                to="/products"
                className="bg-amazon-yellow hover:bg-amazon-orange text-black font-bold py-3 px-8 rounded-lg text-lg transition-colors inline-block shadow-lg"
              >
                Shop Now →
              </Link>
              <Link
                to="/products?sort=rating"
                className="border-2 border-white hover:bg-white hover:text-black text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors inline-block"
              >
                ⭐ Top Rated
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 hidden lg:block overflow-hidden opacity-10">
          <div className="w-full h-full bg-gradient-to-l from-amazon-yellow to-transparent" />
        </div>
      </div>

      {/* ── Shop by Category ── */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">🛍️ Shop by Category</h2>
          <Link to="/products" className="text-amazon-blue hover:underline font-semibold text-sm">
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {ALL_CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              to={`/products?category=${encodeURIComponent(cat.label)}`}
              className="group relative rounded-xl overflow-hidden h-28 shadow-md hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <img
                src={cat.img}
                alt={cat.label}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                onError={(e) => { e.target.onerror = null; e.target.style.display = "none"; }}
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} opacity-70 group-hover:opacity-80 transition-opacity`} />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <span className="text-2xl mb-1">{cat.emoji}</span>
                <span className="font-bold text-xs text-center px-1 leading-tight drop-shadow">{cat.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Featured Products ── */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">⭐ Featured Products</h2>
          <Link to="/products?isFeatured=true" className="text-amazon-blue hover:underline font-semibold text-sm">
            View All →
          </Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {featured.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* ── Promo Banner ── */}
      <div className="bg-amazon-yellow py-10 text-center">
        <h2 className="text-3xl font-bold text-black mb-2">🚚 Free Shipping on Orders Over $100</h2>
        <p className="text-gray-800 mb-4">Test card: 4242 4242 4242 4242 · Any date · Any CVC</p>
        <Link
          to="/products"
          className="bg-amazon text-white font-bold py-3 px-8 rounded-lg hover:bg-amazon-blue transition-colors inline-block"
        >
          Explore All Deals
        </Link>
      </div>

    </div>
  );
};

export default HomePage;
