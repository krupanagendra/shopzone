import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import {
  FaShoppingCart, FaHeart, FaBars, FaTimes,
  FaSearch, FaUser, FaChevronDown, FaHome,
  FaArrowLeft, FaTh
} from 'react-icons/fa';

const ALL_CATEGORIES = [
  { label: "Electronics", emoji: "📱", short: "Electronics", icon: "🔌" },
  { label: "Computers", emoji: "💻", short: "Computers", icon: "🖥️" },
  { label: "Clothing", emoji: "👟", short: "Clothing", icon: "👗" },
  { label: "Home & Kitchen", emoji: "🏠", short: "Home", icon: "🍳" },
  { label: "Books", emoji: "📚", short: "Books", icon: "📖" },
  { label: "Gaming", emoji: "🎮", short: "Gaming", icon: "🕹️" },
  { label: "Sports", emoji: "🚴", short: "Sports", icon: "⚽" },
  { label: "Cameras", emoji: "📷", short: "Cameras", icon: "🎥" },
  { label: "Beauty", emoji: "🧴", short: "Beauty", icon: "💄" },
  { label: "Health", emoji: "🌱", short: "Health", icon: "💊" },
  { label: "Toys", emoji: "🧸", short: "Toys", icon: "🎯" },
  { label: "Music", emoji: "🎵", short: "Music", icon: "🎸" },
  { label: "Automotive", emoji: "🚗", short: "Auto", icon: "🔧" },
  { label: "Pet Supplies", emoji: "🐾", short: "Pets", icon: "🐶" },
];

// Duplicated for seamless infinite scroll
const SCROLL_ITEMS = [...ALL_CATEGORIES, ...ALL_CATEGORIES, ...ALL_CATEGORIES];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdown, setUserDropdown] = useState(false);
  const [catDropdown, setCatDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const dropdownRef = useRef(null);
  const catRef = useRef(null);
  const scrollRef = useRef(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { userInfo } = useSelector((s) => s.auth);
  const { cart } = useSelector((s) => s.cart);
  const cartCount = cart?.items?.reduce((acc, i) => acc + i.quantity, 0) || 0;
  const isHome = location.pathname === '/';

  // Navbar shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setUserDropdown(false);
      if (catRef.current && !catRef.current.contains(e.target)) setCatDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/products?keyword=${searchQuery}`);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    setUserDropdown(false);
  };

  const handleGoBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  return (
    <>
      {/* ─── Keyframe styles injected once ─── */}
      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .ticker-track {
          display: flex;
          width: max-content;
          animation: ticker 32s linear infinite;
        }
        .ticker-track.paused {
          animation-play-state: paused;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <nav className={`bg-amazon sticky top-0 z-50 transition-shadow duration-300 ${scrolled ? 'shadow-2xl' : 'shadow-lg'}`}>

        {/* ══ Main Bar ══ */}
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">

          {/* Back + Home */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {!isHome && (
              <button
                onClick={handleGoBack}
                title="Go back"
                className="text-white hover:text-amazon-yellow flex items-center gap-1 text-xs border border-gray-600 rounded px-2 py-1.5 transition-all hover:border-amazon-yellow hover:scale-105"
              >
                <FaArrowLeft className="text-xs" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
            <Link to="/" title="Home" className="text-white hover:text-amazon-yellow ml-1 transition-transform hover:scale-110">
              <FaHome className="text-xl" />
            </Link>
          </div>

          {/* Logo */}
          <Link to="/" className="text-white text-2xl font-black flex-shrink-0 tracking-tight hover:opacity-90 transition-opacity">
            <span className="text-amazon-yellow">Shop</span>Zone
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 flex max-w-2xl group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, brands, categories..."
              className="flex-1 px-4 py-2 rounded-l-md text-black focus:outline-none text-sm ring-0 focus:ring-2 focus:ring-amazon-yellow"
            />
            <button
              type="submit"
              className="bg-amazon-yellow hover:bg-amazon-orange px-4 py-2 rounded-r-md transition-colors"
            >
              <FaSearch className="text-black" />
            </button>
          </form>

          {/* Desktop icons */}
          <div className="hidden md:flex items-center gap-4 text-white">

            {/* All Categories dropdown */}
            <div className="relative" ref={catRef}>
              <button
                onClick={() => setCatDropdown(!catDropdown)}
                className="flex items-center gap-1 hover:text-amazon-yellow text-sm transition-colors"
              >
                <FaTh className="text-base" />
                <span className="hidden lg:inline">Categories</span>
                <FaChevronDown className={`text-xs transition-transform duration-200 ${catDropdown ? 'rotate-180' : ''}`} />
              </button>
              {catDropdown && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-100">
                  <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest border-b mb-1">
                    All Departments
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {ALL_CATEGORIES.map((cat) => (
                      <Link
                        key={cat.label}
                        to={`/products?category=${encodeURIComponent(cat.label)}`}
                        onClick={() => setCatDropdown(false)}
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-amber-50 hover:text-amazon-blue text-sm transition-colors"
                      >
                        <span className="text-lg w-6 text-center">{cat.emoji}</span>
                        <span className="font-medium">{cat.label}</span>
                      </Link>
                    ))}
                  </div>
                  <div className="border-t mt-1 pt-1">
                    <Link
                      to="/products"
                      onClick={() => setCatDropdown(false)}
                      className="flex items-center gap-3 px-4 py-2 text-amazon-blue font-bold hover:bg-amber-50 text-sm"
                    >
                      🛍️ View All Products
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User */}
            {userInfo ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdown(!userDropdown)}
                  className="flex items-center gap-1 hover:text-amazon-yellow text-sm transition-colors"
                >
                  <FaUser />
                  <span>{userInfo.name.split(' ')[0]}</span>
                  <FaChevronDown className={`text-xs transition-transform duration-200 ${userDropdown ? 'rotate-180' : ''}`} />
                </button>
                {userDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl py-1 z-50 border border-gray-100">
                    <Link to="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 text-sm" onClick={() => setUserDropdown(false)}>👤 My Profile</Link>
                    <Link to="/orders" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 text-sm" onClick={() => setUserDropdown(false)}>📦 My Orders</Link>
                    <Link to="/wishlist" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 text-sm" onClick={() => setUserDropdown(false)}>❤️ Wishlist</Link>
                    {userInfo.role === 'admin' && (
                      <Link to="/admin" className="block px-4 py-2 text-orange-600 hover:bg-gray-50 text-sm font-semibold" onClick={() => setUserDropdown(false)}>⚙️ Admin Panel</Link>
                    )}
                    <hr className="my-1" />
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50 text-sm">🚪 Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="hover:text-amazon-yellow flex items-center gap-1 text-sm transition-colors">
                <FaUser /><span>Sign In</span>
              </Link>
            )}

            <Link to="/wishlist" className="hover:text-amazon-yellow transition-all hover:scale-110 relative">
              <FaHeart className="text-xl" />
            </Link>

            <Link to="/cart" className="hover:text-amazon-yellow transition-all hover:scale-110 relative">
              <FaShoppingCart className="text-xl" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-amazon-yellow text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-bounce">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-white text-xl ml-auto transition-transform hover:scale-110"
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* ══ Animated Scrolling Category Ticker ══ */}
        <div
          className="bg-amazon-blue overflow-hidden border-t border-white border-opacity-10"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className={`ticker-track ${isPaused ? 'paused' : ''}`}>
            {SCROLL_ITEMS.map((cat, i) => (
              <Link
                key={i}
                to={`/products?category=${encodeURIComponent(cat.label)}`}
                className="flex items-center gap-2 text-white text-sm px-5 py-2 whitespace-nowrap
                  hover:text-amazon-yellow hover:bg-white hover:bg-opacity-10
                  transition-colors group border-r border-white border-opacity-10"
              >
                <span className="text-base group-hover:scale-125 transition-transform duration-200 inline-block">
                  {cat.emoji}
                </span>
                <span className="font-medium tracking-wide">{cat.short}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ══ Mobile Menu ══ */}
        {menuOpen && (
          <div className="md:hidden bg-amazon-blue text-white px-4 py-4 space-y-3 border-t border-white border-opacity-10">
            {userInfo ? (
              <>
                <span className="text-amazon-yellow font-semibold block">Hi, {userInfo.name} 👋</span>
                <Link to="/profile" className="block hover:text-amazon-yellow py-1" onClick={() => setMenuOpen(false)}>👤 Profile</Link>
                <Link to="/orders" className="block hover:text-amazon-yellow py-1" onClick={() => setMenuOpen(false)}>📦 Orders</Link>
                {userInfo.role === 'admin' && (
                  <Link to="/admin" className="block text-orange-400 py-1" onClick={() => setMenuOpen(false)}>⚙️ Admin Panel</Link>
                )}
                <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="block text-red-400 py-1">🚪 Logout</button>
              </>
            ) : (
              <Link to="/login" className="block hover:text-amazon-yellow py-1" onClick={() => setMenuOpen(false)}>👤 Sign In</Link>
            )}
            <Link to="/cart" className="flex items-center gap-2 hover:text-amazon-yellow py-1" onClick={() => setMenuOpen(false)}>
              <FaShoppingCart /> Cart {cartCount > 0 && `(${cartCount})`}
            </Link>
            <Link to="/wishlist" className="flex items-center gap-2 hover:text-amazon-yellow py-1" onClick={() => setMenuOpen(false)}>
              <FaHeart /> Wishlist
            </Link>
            <hr className="border-gray-600" />
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Categories</p>
            <div className="grid grid-cols-2 gap-1">
              {ALL_CATEGORIES.map((cat) => (
                <Link
                  key={cat.label}
                  to={`/products?category=${encodeURIComponent(cat.label)}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 text-sm hover:text-amazon-yellow py-1.5"
                >
                  <span>{cat.emoji}</span><span>{cat.short}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
