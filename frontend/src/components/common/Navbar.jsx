import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiShoppingCart, FiHeart, FiUser, FiSearch, FiMenu, FiX, FiChevronDown, FiLogOut, FiPackage, FiSettings } from 'react-icons/fi'
import { logout } from '../../redux/slices/authSlice'
import { fetchCart } from '../../redux/slices/cartSlice'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const userMenuRef = useRef(null)

  const { user } = useSelector((state) => state.auth)
  const { totalItems } = useSelector((state) => state.cart)
  const { wishlistIds } = useSelector((state) => state.wishlist)

  useEffect(() => {
    if (user) dispatch(fetchCart())
  }, [user, dispatch])

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setIsMenuOpen(false)
  }, [location])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  const handleLogout = () => {
    dispatch(logout())
    setIsUserMenuOpen(false)
    navigate('/')
  }

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'shadow-lg' : ''}`}>
      {/* Top bar */}
      <div className="bg-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center flex-shrink-0">
              <span className="text-gold font-display text-2xl font-bold tracking-tight">Shop</span>
              <span className="text-white font-display text-2xl font-bold">Now</span>
            </Link>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-4 hidden sm:flex">
              <div className="flex w-full">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-2 text-dark text-sm focus:outline-none rounded-l-md"
                />
                <button
                  type="submit"
                  className="bg-gold hover:bg-yellow-400 px-4 py-2 rounded-r-md transition-colors"
                >
                  <FiSearch className="text-dark" size={20} />
                </button>
              </div>
            </form>

            {/* Right actions */}
            <div className="flex items-center gap-2 ml-auto">
              {/* User Menu */}
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-1 hover:text-gold transition-colors px-2 py-1 rounded"
                  >
                    <FiUser size={20} />
                    <span className="text-sm hidden md:block max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                    <FiChevronDown size={14} className={`transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white text-dark rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-slide-up">
                      <div className="px-4 py-3 bg-gray-50 border-b">
                        <p className="text-sm font-semibold">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <Link to="/profile" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm transition-colors">
                        <FiSettings size={16} className="text-gray-500" /> Profile Settings
                      </Link>
                      <Link to="/orders" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm transition-colors">
                        <FiPackage size={16} className="text-gray-500" /> My Orders
                      </Link>
                      {user.role === 'admin' && (
                        <Link to="/admin" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm font-medium text-brand-600 transition-colors">
                          <FiSettings size={16} /> Admin Panel
                        </Link>
                      )}
                      <div className="border-t">
                        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full hover:bg-red-50 text-sm text-red-600 transition-colors">
                          <FiLogOut size={16} /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="flex items-center gap-1 hover:text-gold transition-colors px-2 py-1 text-sm">
                  <FiUser size={20} />
                  <span className="hidden md:block">Sign In</span>
                </Link>
              )}

              {/* Wishlist */}
              {user && (
                <Link to="/wishlist" className="relative flex items-center hover:text-gold transition-colors px-2 py-1">
                  <FiHeart size={20} />
                  {wishlistIds.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {wishlistIds.length > 9 ? '9+' : wishlistIds.length}
                    </span>
                  )}
                </Link>
              )}

              {/* Cart */}
              <Link to="/cart" className="relative flex items-center hover:text-gold transition-colors px-2 py-1">
                <FiShoppingCart size={20} />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold text-dark text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </Link>

              {/* Mobile menu toggle */}
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="sm:hidden hover:text-gold transition-colors">
                {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary nav */}
      <div className="bg-navy text-white hidden sm:block">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-6 py-2 text-sm">
            <Link to="/products" className="hover:text-gold transition-colors">All Products</Link>
            <Link to="/products?category=Electronics" className="hover:text-gold transition-colors">Electronics</Link>
            <Link to="/products?category=Clothing" className="hover:text-gold transition-colors">Clothing</Link>
            <Link to="/products?category=Home+%26+Kitchen" className="hover:text-gold transition-colors">Home & Kitchen</Link>
            <Link to="/products?category=Sports+%26+Outdoors" className="hover:text-gold transition-colors">Sports</Link>
            <Link to="/products?category=Books" className="hover:text-gold transition-colors">Books</Link>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden bg-dark text-white border-t border-navy animate-fade-in">
          <div className="px-4 py-3">
            <form onSubmit={handleSearch} className="flex mb-4">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 text-dark text-sm focus:outline-none rounded-l"
              />
              <button type="submit" className="bg-gold px-4 py-2 rounded-r">
                <FiSearch className="text-dark" />
              </button>
            </form>
            <div className="space-y-2 text-sm">
              <Link to="/products" className="block py-2 hover:text-gold">All Products</Link>
              <Link to="/products?category=Electronics" className="block py-2 hover:text-gold">Electronics</Link>
              <Link to="/products?category=Clothing" className="block py-2 hover:text-gold">Clothing</Link>
              {!user ? (
                <>
                  <Link to="/login" className="block py-2 hover:text-gold">Sign In</Link>
                  <Link to="/register" className="block py-2 hover:text-gold">Register</Link>
                </>
              ) : (
                <>
                  <Link to="/orders" className="block py-2 hover:text-gold">My Orders</Link>
                  <Link to="/wishlist" className="block py-2 hover:text-gold">Wishlist</Link>
                  <Link to="/profile" className="block py-2 hover:text-gold">Profile</Link>
                  <button onClick={handleLogout} className="block py-2 text-red-400 hover:text-red-300">Logout</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
