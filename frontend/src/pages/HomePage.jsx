import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchFeatured } from "../redux/slices/productSlice";
import { fetchCart } from "../redux/slices/cartSlice";
import { fetchWishlist } from "../redux/slices/wishlistSlice";
import ProductCard from "../components/product/ProductCard";
import Spinner from "../components/common/Spinner";
import BrandLogo from "../components/common/BrandLogo";
import { FaMobileAlt, FaLaptop, FaTshirt, FaHome, FaBook, FaGamepad, FaDumbbell, FaCamera, FaStar } from "react-icons/fa";

const ALL_CATEGORIES = [
  { label: "Electronics", Icon: FaMobileAlt, color: "from-blue-700 to-blue-500", img: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&fit=crop" },
  { label: "Computers", Icon: FaLaptop, color: "from-gray-800 to-gray-600", img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&fit=crop" },
  { label: "Clothing", Icon: FaTshirt, color: "from-pink-700 to-pink-500", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&fit=crop" },
  { label: "Home & Kitchen", Icon: FaHome, color: "from-green-700 to-green-500", img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&fit=crop" },
  { label: "Books", Icon: FaBook, color: "from-yellow-700 to-yellow-500", img: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&fit=crop" },
  { label: "Gaming", Icon: FaGamepad, color: "from-purple-700 to-purple-500", img: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400&fit=crop" },
  { label: "Sports", Icon: FaDumbbell, color: "from-orange-700 to-orange-500", img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&fit=crop" },
  { label: "Cameras", Icon: FaCamera, color: "from-red-700 to-red-500", img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&fit=crop" },
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
    <div className="bg-gray-50 dark:bg-omnikart-dark min-h-screen pb-12 transition-colors duration-300">

      {/* ── Ultra-Modern Hero Banner ── */}
      <div className="relative bg-gradient-to-br from-slate-900 via-omnikart-dark to-slate-800 text-white overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-omnikart-accent rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 relative z-10 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 max-w-2xl backdrop-blur-md bg-white/5 border border-white/10 p-8 md:p-12 rounded-3xl shadow-2xl transition-transform hover:scale-[1.01]">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
              Welcome to{" "}
              <span className="inline-flex items-center gap-4 align-middle mt-2 md:mt-0">
                <BrandLogo className="h-16 md:h-20 drop-shadow-xl" />
              </span>
            </h1>
            <p className="text-lg md:text-xl mb-10 text-gray-300 font-medium leading-relaxed">
              Discover millions of premium products. Experience the next generation of e-commerce tailored perfectly for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-5">
              <Link to="/products"
                className="group relative inline-flex items-center justify-center bg-omnikart-accent text-slate-900 font-bold py-4 px-8 rounded-xl text-lg overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(255,184,77,0.4)]">
                <span className="relative z-10 flex items-center gap-2">Shop Now <span className="group-hover:translate-x-1 transition-transform duration-300">→</span></span>
                <div className="absolute inset-0 h-full w-full scale-0 rounded-xl transition-all duration-300 group-hover:scale-100 group-hover:bg-white/20"></div>
              </Link>
              <Link to="/products?sort=rating"
                className="inline-flex items-center justify-center border-2 border-white/30 hover:border-white hover:bg-white hover:text-slate-900 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg backdrop-blur-sm">
                <FaStar className="mr-2 text-yellow-400" /> Top Rated
              </Link>
            </div>
          </div>
          
          <div className="hidden lg:block flex-1 relative perspective-1000">
             <div className="w-full aspect-square bg-gradient-to-tr from-omnikart-accent/20 to-transparent rounded-full blur-3xl absolute inset-0"></div>
             <img src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&fit=crop&auto=format" alt="Shopping" className="relative z-10 rounded-2xl shadow-2xl transform rotate-y-12 rotate-z-3 hover:rotate-0 transition-transform duration-700 border border-white/10" />
          </div>
        </div>
      </div>

      {/* ── Shop by Category ── */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Shop by Category</h2>
          <Link to="/products"
            className="group flex items-center gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm px-5 py-2.5 rounded-full hover:border-omnikart-accent dark:hover:border-omnikart-accent hover:shadow-md transition-all">
            View All <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4 md:gap-5">
          {ALL_CATEGORIES.map((cat) => (
            <Link key={cat.label} to={`/products?category=${encodeURIComponent(cat.label)}`}
              className="group relative rounded-2xl overflow-hidden h-32 md:h-36 shadow-sm hover:shadow-2xl transition-all duration-500 ease-out hover:-translate-y-2 border border-gray-100 dark:border-slate-700">
              <img src={cat.img} alt={cat.label}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                onError={(e) => { e.target.onerror = null; e.target.style.display = "none"; }} />
              <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} opacity-80 group-hover:opacity-90 transition-opacity duration-300 mix-blend-multiply`} />
              <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/30 rounded-2xl transition-colors duration-300 z-10 m-2"></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-20 p-2">
                <span className="text-3xl mb-2 transform group-hover:-translate-y-1 group-hover:scale-110 transition-all duration-300 drop-shadow-md">
                  <cat.Icon />
                </span>
                <span className="font-bold text-sm text-center leading-tight drop-shadow-lg tracking-wide">{cat.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Featured Products ── */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Featured Products</h2>
          <Link to="/products?isFeatured=true"
            className="group flex items-center gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm px-5 py-2.5 rounded-full hover:border-omnikart-accent dark:hover:border-omnikart-accent hover:shadow-md transition-all">
            View All <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {featured.map((product) => (
              <div key={product._id} className="transition-transform duration-300 hover:-translate-y-1">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Premium Promo Banner ── */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="relative bg-gradient-to-r from-omnikart-accent via-[#ffc75e] to-yellow-600 rounded-3xl p-10 md:p-14 text-center shadow-xl overflow-hidden border border-yellow-300/50">
          <div className="absolute -left-20 -top-20 w-64 h-64 bg-white/20 rounded-full blur-2xl"></div>
          <div className="absolute -right-10 -bottom-20 w-80 h-80 bg-white/30 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 tracking-tight">
              Free Premium Shipping
            </h2>
            <p className="text-gray-900 text-lg md:text-xl mb-2 font-bold">
              On all orders over <span className="bg-white/50 px-2 py-0.5 rounded-md">₹8,400</span>
            </p>
            <p className="text-gray-800 text-sm mb-8 font-mono bg-black/10 inline-block px-3 py-1 rounded-lg">
              Test card: 4242 4242 4242 4242 · Any date · Any CVC
            </p>
            <br />
            <Link to="/products"
              className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold py-4 px-10 rounded-full hover:bg-slate-800 transition-all duration-300 hover:scale-105 shadow-[0_10px_20px_rgba(0,0,0,0.2)]">
              Explore All Deals <span>→</span>
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
};

export default HomePage;