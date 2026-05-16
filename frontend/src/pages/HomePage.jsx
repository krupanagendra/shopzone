import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchFeatured } from "../redux/slices/productSlice";
import { fetchCart } from "../redux/slices/cartSlice";
import { fetchWishlist } from "../redux/slices/wishlistSlice";
import ProductCard from "../components/product/ProductCard";
import Spinner from "../components/common/Spinner";
import BrandLogo from "../components/common/BrandLogo";
import { FaMobileAlt, FaLaptop, FaTshirt, FaHome, FaBook, FaGamepad, FaDumbbell, FaCamera, FaStar, FaArrowRight, FaBolt, FaShieldAlt, FaShippingFast } from "react-icons/fa";
import { motion } from "framer-motion";

const ALL_CATEGORIES = [
  { label: "Electronics", Icon: FaMobileAlt, color: "from-blue-600/80 to-blue-900/80", img: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&fit=crop" },
  { label: "Computers", Icon: FaLaptop, color: "from-gray-700/80 to-gray-900/80", img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&fit=crop" },
  { label: "Clothing", Icon: FaTshirt, color: "from-pink-600/80 to-pink-900/80", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&fit=crop" },
  { label: "Home & Kitchen", Icon: FaHome, color: "from-emerald-600/80 to-emerald-900/80", img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&fit=crop" },
  { label: "Books", Icon: FaBook, color: "from-amber-600/80 to-amber-900/80", img: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&fit=crop" },
  { label: "Gaming", Icon: FaGamepad, color: "from-violet-600/80 to-violet-900/80", img: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400&fit=crop" },
  { label: "Sports", Icon: FaDumbbell, color: "from-orange-600/80 to-orange-900/80", img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&fit=crop" },
  { label: "Cameras", Icon: FaCamera, color: "from-rose-600/80 to-rose-900/80", img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&fit=crop" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

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
    <div className="bg-[#f8fafc] dark:bg-[#0B1120] min-h-screen pb-12 transition-colors duration-300 font-sans selection:bg-omnikart-accent/30">

      {/* ── Cinematic Hero Banner ── */}
      <div className="relative bg-[#0B1120] text-white overflow-hidden min-h-[70vh] flex items-center">
        {/* Deep ambient lighting effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-omnikart-accent/20 rounded-full blur-[150px] mix-blend-screen pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[150px] mix-blend-screen pointer-events-none"></div>
        
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50"></div>

        <div className="max-w-7xl mx-auto px-4 py-16 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-col gap-8 max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md w-fit">
                <span className="flex h-2 w-2 rounded-full bg-omnikart-accent animate-pulse"></span>
                <span className="text-sm font-medium text-gray-300">Next Generation E-Commerce</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tight">
                Discover the <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">Extraordinary.</span>
              </h1>
              
              <p className="text-xl text-gray-400 font-medium leading-relaxed max-w-xl">
                Experience a curated collection of premium products, designed to elevate your lifestyle with seamless shopping and rapid delivery.
              </p>
              
              <div className="flex flex-wrap gap-4 items-center">
                <Link to="/products"
                  className="group relative inline-flex items-center justify-center bg-white text-[#0B1120] font-bold py-4 px-8 rounded-2xl text-lg transition-all hover:bg-gray-100 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)]">
                  <span>Explore Collection</span>
                  <FaArrowRight className="ml-3 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/products?sort=rating"
                  className="inline-flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 px-8 rounded-2xl text-lg transition-all backdrop-blur-md">
                  <FaStar className="mr-2 text-omnikart-accent" /> Top Rated
                </Link>
              </div>

              <div className="flex items-center gap-8 mt-4 pt-8 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/5 rounded-xl"><FaShippingFast className="text-omnikart-accent text-xl" /></div>
                  <div className="flex flex-col"><span className="font-bold text-white">Free Shipping</span><span className="text-xs text-gray-400">On premium orders</span></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/5 rounded-xl"><FaShieldAlt className="text-omnikart-accent text-xl" /></div>
                  <div className="flex flex-col"><span className="font-bold text-white">Secure Checkout</span><span className="text-xs text-gray-400">256-bit encryption</span></div>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              className="hidden lg:block relative"
            >
               <motion.div 
                 animate={{ y: [0, -20, 0] }}
                 transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                 className="relative z-10"
               >
                 {/* Premium visual composition instead of basic image */}
                 <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-gradient-to-tr from-white/5 to-white/0 p-2 backdrop-blur-3xl transform rotate-y-[-10deg] rotate-x-[5deg] perspective-1000">
                   <div className="absolute inset-0 bg-gradient-to-tr from-omnikart-accent/20 to-transparent opacity-50"></div>
                   <img src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&fit=crop&auto=format" alt="Premium Shopping" className="rounded-[2rem] shadow-inner object-cover w-full h-[600px]" />
                   
                   {/* Floating glassmorphism cards */}
                   <motion.div 
                     animate={{ y: [0, 10, 0] }}
                     transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1 }}
                     className="absolute -left-10 top-20 bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-2xl flex items-center gap-4"
                   >
                     <div className="w-12 h-12 bg-omnikart-accent rounded-full flex items-center justify-center"><FaBolt className="text-[#0B1120] text-xl" /></div>
                     <div>
                       <p className="text-white font-bold">Fast Delivery</p>
                       <p className="text-gray-300 text-xs">Within 24 hours</p>
                     </div>
                   </motion.div>
                 </div>
               </motion.div>
            </motion.div>

          </div>
        </div>
      </div>

      {/* ── Immersive Categories ── */}
      <div className="max-w-7xl mx-auto px-4 pt-12 pb-24 relative z-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Explore Categories</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Find exactly what you're looking for</p>
          </div>
          <Link to="/products"
            className="group flex items-center gap-2 text-omnikart-accent font-bold hover:text-yellow-600 transition-colors">
            Browse All Categories <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {ALL_CATEGORIES.map((cat) => (
            <motion.div key={cat.label} variants={itemVariants}>
              <Link to={`/products?category=${encodeURIComponent(cat.label)}`}
                className="group relative flex flex-col items-center justify-center h-48 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 bg-white dark:bg-slate-800"
              >
                <img src={cat.img} alt={cat.label}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} opacity-90 group-hover:opacity-70 transition-opacity duration-500`} />
                
                {/* Glass effect container */}
                <div className="absolute inset-0 m-4 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-[2px] transition-all group-hover:backdrop-blur-0 group-hover:border-white/40"></div>
                
                <div className="relative z-10 flex flex-col items-center justify-center text-white p-4">
                  <span className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 mb-3 group-hover:-translate-y-2 group-hover:bg-white/20 transition-all duration-300">
                    <cat.Icon className="text-3xl drop-shadow-md" />
                  </span>
                  <span className="font-bold text-lg text-center tracking-wide group-hover:-translate-y-1 transition-transform duration-300">{cat.label}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ── Curated Featured Products ── */}
      <div className="max-w-7xl mx-auto px-4 pb-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Curated Picks</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Handpicked premium items just for you</p>
          </div>
          <Link to="/products?isFeatured=true"
            className="group flex items-center gap-2 text-omnikart-accent font-bold hover:text-yellow-600 transition-colors">
            View Collection <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
          >
            {featured.slice(0, 8).map((product) => (
              <motion.div key={product._id} variants={itemVariants}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* ── Premium Offer Banner ── */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative bg-[#0B1120] rounded-[3rem] overflow-hidden shadow-2xl border border-gray-800"
        >
          {/* Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-r from-omnikart-accent/10 to-transparent"></div>
          <div className="absolute -right-40 -top-40 w-96 h-96 bg-omnikart-accent rounded-full blur-[100px] opacity-20"></div>
          
          <div className="grid md:grid-cols-2 items-center relative z-10">
            <div className="p-10 md:p-16 lg:p-20">
              <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-white text-sm font-bold tracking-wide border border-white/20 mb-6 backdrop-blur-md">
                LIMITED TIME OFFER
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                Unlock Premium <br/><span className="text-omnikart-accent">Experience</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8 max-w-md">
                Get exclusive access to premium shipping, early product drops, and dedicated support on all orders.
              </p>
              <Link to="/products"
                className="inline-flex items-center gap-3 bg-white text-[#0B1120] font-bold py-4 px-8 rounded-2xl hover:bg-gray-100 transition-all hover:scale-105 shadow-xl">
                Start Shopping <FaArrowRight />
              </Link>
            </div>
            
            <div className="hidden md:block relative h-full min-h-[400px]">
              <img 
                src="https://images.unsplash.com/photo-1550009158-9efff6c97348?w=800&fit=crop" 
                alt="Premium Box" 
                className="absolute inset-0 w-full h-full object-cover"
                style={{ clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0% 100%)' }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0B1120] via-transparent to-transparent"></div>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
};

export default HomePage;