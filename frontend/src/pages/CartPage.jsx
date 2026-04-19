import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { fetchCart, updateCartItem, removeFromCart } from "../redux/slices/cartSlice";
import Spinner from "../components/common/Spinner";
import { FaTrash, FaArrowLeft } from "react-icons/fa";

const fmt = (n) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cart, loading } = useSelector((s) => s.cart);
  const { userInfo } = useSelector((s) => s.auth);

  useEffect(() => {
    if (userInfo) dispatch(fetchCart());
  }, [dispatch, userInfo]);

  if (!userInfo) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <p className="text-xl mb-4">Please sign in to view your cart</p>
      <Link to="/login" className="btn-primary py-3 px-8">Sign In</Link>
    </div>
  );

  const items = cart?.items || [];
  const itemsPrice = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const shippingPrice = itemsPrice > 8400 ? 0 : (items.length > 0 ? 840 : 0);
  const taxPrice = itemsPrice * 0.15;
  const totalPrice = itemsPrice + shippingPrice + taxPrice;

  if (loading && !cart) return <Spinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Link to="/products" className="flex items-center gap-2 text-amazon-blue hover:underline mb-6"><FaArrowLeft /> Continue Shopping</Link>
      <h1 className="text-2xl font-bold mb-6">Shopping Cart ({items.length} items)</h1>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-6xl mb-4">🛒</p>
          <p className="text-xl mb-4">Your cart is empty</p>
          <Link to="/products" className="btn-primary py-3 px-8">Start Shopping</Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item._id} className="bg-white rounded-lg shadow p-4 flex flex-col sm:flex-row gap-4">
                <Link to={`/product/${item.product}`}>
                  <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded"
                    onError={(e) => { e.target.src = "https://via.placeholder.com/100" }} />
                </Link>
                <div className="flex-1">
                  <Link to={`/product/${item.product}`} className="font-semibold hover:text-amazon-blue line-clamp-2">{item.name}</Link>
                  <p className="text-amazon-yellow font-bold text-lg mt-1">{fmt(item.price)}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center border rounded">
                      <button onClick={() => dispatch(updateCartItem({ itemId: item._id, quantity: item.quantity - 1 }))} className="px-3 py-1 hover:bg-gray-100">-</button>
                      <span className="px-3 py-1 border-x">{item.quantity}</span>
                      <button onClick={() => dispatch(updateCartItem({ itemId: item._id, quantity: item.quantity + 1 }))} disabled={item.quantity >= item.countInStock} className="px-3 py-1 hover:bg-gray-100 disabled:opacity-40">+</button>
                    </div>
                    <span className="text-gray-500 text-sm">= {fmt(item.price * item.quantity)}</span>
                    <button onClick={() => dispatch(removeFromCart(item._id))} className="text-red-500 hover:text-red-700 ml-auto"><FaTrash /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow p-6 h-fit sticky top-24">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Items ({items.reduce((a, i) => a + i.quantity, 0)}):</span><span>{fmt(itemsPrice)}</span></div>
              <div className="flex justify-between"><span>Shipping:</span><span className={shippingPrice === 0 ? "text-green-600 font-semibold" : ""}>{shippingPrice === 0 ? "FREE" : fmt(shippingPrice)}</span></div>
              <div className="flex justify-between"><span>Tax (15%):</span><span>{fmt(taxPrice)}</span></div>
              <hr className="my-2" />
              <div className="flex justify-between font-bold text-lg"><span>Total:</span><span>{fmt(totalPrice)}</span></div>
            </div>
            {itemsPrice < 8400 && items.length > 0 && <p className="text-xs text-green-600 mt-2">Add {fmt(8400 - itemsPrice)} more for FREE shipping!</p>}
            <button onClick={() => navigate("/checkout")} className="w-full btn-primary py-3 mt-4 text-lg">
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;