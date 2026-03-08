import { Link } from 'react-router-dom'
import { FiGithub, FiTwitter, FiInstagram } from 'react-icons/fi'

const Footer = () => {
  return (
    <footer className="bg-dark text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-gold font-display text-2xl font-bold mb-4">ShopNow</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your one-stop destination for quality products at unbeatable prices. Fast shipping, easy returns.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/products" className="hover:text-gold transition-colors">All Products</Link></li>
              <li><Link to="/products?category=Electronics" className="hover:text-gold transition-colors">Electronics</Link></li>
              <li><Link to="/products?category=Clothing" className="hover:text-gold transition-colors">Clothing</Link></li>
              <li><Link to="/products?category=Home+%26+Kitchen" className="hover:text-gold transition-colors">Home & Kitchen</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Account</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="hover:text-gold transition-colors">Sign In</Link></li>
              <li><Link to="/register" className="hover:text-gold transition-colors">Register</Link></li>
              <li><Link to="/orders" className="hover:text-gold transition-colors">My Orders</Link></li>
              <li><Link to="/wishlist" className="hover:text-gold transition-colors">Wishlist</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Help</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="text-gray-400">Shipping Policy</span></li>
              <li><span className="text-gray-400">Returns & Exchanges</span></li>
              <li><span className="text-gray-400">Contact Support</span></li>
              <li><span className="text-gray-400">FAQ</span></li>
            </ul>
            <div className="flex gap-4 mt-6">
              <a href="#" className="hover:text-gold transition-colors"><FiGithub size={20} /></a>
              <a href="#" className="hover:text-gold transition-colors"><FiTwitter size={20} /></a>
              <a href="#" className="hover:text-gold transition-colors"><FiInstagram size={20} /></a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} ShopNow. Built with MERN Stack. Stripe Test Mode.</p>
          <p className="mt-1">Test Card: 4242 4242 4242 4242 | Any future date | Any CVC</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
