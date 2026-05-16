import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import {
  FaShoppingCart, FaHeart, FaBars, FaTimes,
  FaSearch, FaUser, FaChevronDown, FaHome,
  FaArrowLeft, FaTh, FaHeadphones, FaMoon, FaSun,
  FaMobileAlt, FaLaptop, FaTshirt, FaBook, FaGamepad, FaDumbbell, FaCamera, FaBoxOpen, FaCrown, FaMusic, FaGift, FaCog, FaSignOutAlt, FaLightbulb, FaBox, FaShoppingBag
} from 'react-icons/fa';
import PrimeBadge from '../common/PrimeBadge';
import BrandLogo from '../common/BrandLogo';
import { useTheme } from '../../context/ThemeContext';

const ALL_CATEGORIES = [
  { label: "Electronics", Icon: FaMobileAlt, short: "Electronics" },
  { label: "Computers", Icon: FaLaptop, short: "Computers" },
  { label: "Clothing", Icon: FaTshirt, short: "Clothing" },
  { label: "Home & Kitchen", Icon: FaHome, short: "Home" },
  { label: "Books", Icon: FaBook, short: "Books" },
  { label: "Gaming", Icon: FaGamepad, short: "Gaming" },
  { label: "Sports", Icon: FaDumbbell, short: "Sports" },
  { label: "Cameras", Icon: FaCamera, short: "Cameras" },
  { label: "Beauty", Icon: FaHeart, short: "Beauty" },
  { label: "Health", Icon: FaHeart, short: "Health" },
  { label: "Toys", Icon: FaGamepad, short: "Toys" },
  { label: "Music", Icon: FaMusic, short: "Music" },
  { label: "Automotive", Icon: FaBoxOpen, short: "Auto" },
  { label: "Pet Supplies", Icon: FaHeart, short: "Pets" },
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
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const dropdownRef = useRef(null);
  const catRef = useRef(null);
  const scrollRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { userInfo } = useSelector((s) => s.auth);
  const { cart } = useSelector((s) => s.cart);
  const cartCount = cart?.items?.reduce((acc, i) => acc + i.quantity, 0) || 0;
  const isHome = location.pathname === '/';
  const { theme, toggleTheme } = useTheme();

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

  // ── Auto-suggestions ───────────────────────────────────────────────────────────
  const fetchSuggestions = async (query) => {
    if (!query.trim()) { setSuggestions([]); return; }
    try {
      const resp = await fetch(`${import.meta.env.VITE_API_URL}/api/products/search/suggestions?keyword=${query}`);
      const data = await resp.json();
      setSuggestions(data);
    } catch (err) {
      console.error("Failed to fetch suggestions");
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setShowSuggestions(true);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 300);
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

      <nav className={`bg-amazon dark:bg-omnikart-dark dark:border-b dark:border-slate-800 sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-2xl' : 'shadow-lg'}`}>

        {/* ══ Main Bar ══ */}
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">

          {/* Back */}
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
          </div>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 hover:opacity-90 transition-opacity">
            <BrandLogo className="h-10 md:h-12" />
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 flex max-w-2xl relative">
            <div className="flex-1 flex relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Search products, brands, categories..."
                className="flex-1 px-4 py-2 text-black focus:outline-none text-sm focus:ring-2 focus:ring-amazon-yellow bg-white rounded-l-md"
              />
            </div>
            <button type="submit" className="bg-amazon-yellow hover:bg-amazon-orange px-4 py-2 rounded-r-md transition-colors">
              <FaSearch className="text-black" />
            </button>
            
            {/* Auto-suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute top-full left-0 w-full bg-white rounded-b-lg shadow-2xl border border-gray-100 z-50 overflow-hidden mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {suggestions.map((s) => (
                  <li key={s._id}>
                    <button type="button" onMouseDown={() => { setSearchQuery(s.name); navigate(`/product/${s._id}`); }}
                      className="w-full text-left px-4 py-3 hover:bg-amber-50 focus:bg-amber-50 text-sm text-gray-800 transition-colors flex items-center gap-3 border-b border-gray-50 last:border-0">
                      <FaSearch className="text-gray-300 text-xs flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate text-gray-900">{s.name}</p>
                        <p className="text-xs text-gray-500 truncate">{s.brand} • {s.category}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </form>

          {/* Desktop icons */}
          <div className="hidden md:flex items-center gap-4 text-white">

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full hover:bg-white hover:bg-opacity-10 transition-colors text-lg"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <FaMoon /> : <FaSun />}
            </button>

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
                        <span className="text-lg w-6 text-center flex justify-center"><cat.Icon /></span>
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
                      <FaShoppingBag className="text-lg" /> View All Products
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Suggest Product */}
            <Link to="/suggest-product" className="hover:text-amazon-yellow text-sm transition-colors flex items-center gap-1 group">
              <span className="text-base group-hover:scale-125 transition-transform duration-200"><FaLightbulb /></span>
              <span className="hidden lg:inline">Suggest Product</span>
            </Link>

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
                    <Link to="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 text-sm flex items-center gap-2" onClick={() => setUserDropdown(false)}><FaUser /> My Profile</Link>
                    <Link to="/orders" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 text-sm flex items-center gap-2" onClick={() => setUserDropdown(false)}><FaBox /> My Orders</Link>
                    <Link to="/wishlist" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 text-sm flex items-center gap-2" onClick={() => setUserDropdown(false)}><FaHeart className="text-red-500" /> Wishlist</Link>
                    <Link to="/prime" className="block px-4 py-2 text-amber-600 hover:bg-amber-50 text-sm font-semibold flex items-center gap-2" onClick={() => setUserDropdown(false)}><FaCrown /> Prime Membership</Link>
                    <Link to="/music" className="block px-4 py-2 text-blue-600 hover:bg-blue-50 text-sm font-semibold flex items-center gap-2" onClick={() => setUserDropdown(false)}><FaMusic /> Prime Music</Link>
                    <Link to="/rewards" className="block px-4 py-2 text-green-600 hover:bg-green-50 text-sm font-semibold flex items-center gap-2" onClick={() => setUserDropdown(false)}><FaGift /> Rewards & Scratch</Link>
                    {userInfo.role === 'admin' && (
                      <>
                        <Link to="/admin" className="block px-4 py-2 text-orange-600 hover:bg-gray-50 text-sm font-semibold flex items-center gap-2" onClick={() => setUserDropdown(false)}><FaCog /> Admin Panel</Link>
                        <Link to="/admin/suggestions" className="block px-4 py-2 text-indigo-600 hover:bg-indigo-50 text-sm font-semibold flex items-center gap-2" onClick={() => setUserDropdown(false)}><FaLightbulb /> Manage Suggestions</Link>
                      </>
                    )}
                    <hr className="my-1" />
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50 text-sm flex items-center gap-2"><FaSignOutAlt /> Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="hover:text-amazon-yellow flex items-center gap-1 text-sm transition-colors">
                <FaUser /><span>Sign In</span>
              </Link>
            )}

            <PrimeBadge />

            <Link to="/music" className="hover:text-amazon-yellow transition-all hover:scale-110 relative flex items-center gap-1" title="Prime Music">
              <FaHeadphones className="text-xl" />
            </Link>

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
                  <cat.Icon />
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
                <Link to="/profile" className="flex items-center gap-2 hover:text-amazon-yellow py-1" onClick={() => setMenuOpen(false)}><FaUser /> Profile</Link>
                <Link to="/orders" className="flex items-center gap-2 hover:text-amazon-yellow py-1" onClick={() => setMenuOpen(false)}><FaBox /> Orders</Link>
                <Link to="/prime" className="flex items-center gap-2 text-amber-400 hover:text-amazon-yellow py-1 font-semibold" onClick={() => setMenuOpen(false)}><FaCrown /> Prime Membership</Link>
                <Link to="/music" className="flex items-center gap-2 text-blue-400 hover:text-amazon-yellow py-1 font-semibold" onClick={() => setMenuOpen(false)}><FaMusic /> Prime Music</Link>
                <Link to="/rewards" className="flex items-center gap-2 text-green-400 hover:text-amazon-yellow py-1 font-semibold" onClick={() => setMenuOpen(false)}><FaGift /> Rewards & Scratch</Link>
                {userInfo.role === 'admin' && (
                  <Link to="/admin" className="flex items-center gap-2 text-orange-400 py-1" onClick={() => setMenuOpen(false)}><FaCog /> Admin Panel</Link>
                )}
                <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="flex items-center gap-2 text-red-400 py-1"><FaSignOutAlt /> Logout</button>
              </>
            ) : (
              <Link to="/login" className="flex items-center gap-2 hover:text-amazon-yellow py-1" onClick={() => setMenuOpen(false)}><FaUser /> Sign In</Link>
            )}
            <Link to="/cart" className="flex items-center gap-2 hover:text-amazon-yellow py-1" onClick={() => setMenuOpen(false)}>
              <FaShoppingCart /> Cart {cartCount > 0 && `(${cartCount})`}
            </Link>
            <Link to="/wishlist" className="flex items-center gap-2 hover:text-amazon-yellow py-1" onClick={() => setMenuOpen(false)}>
              <FaHeart /> Wishlist
            </Link>
            <Link to="/suggest-product" className="flex items-center gap-2 hover:text-amazon-yellow py-1" onClick={() => setMenuOpen(false)}>
              <FaLightbulb /> Suggest Product
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
                  <span className="flex items-center justify-center w-5"><cat.Icon /></span><span>{cat.short}</span>
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
