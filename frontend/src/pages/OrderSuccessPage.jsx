import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiCheckCircle, FiPackage, FiArrowRight } from 'react-icons/fi'
import { fetchOrderById } from '../redux/slices/orderSlice'

const fmt = (n) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

const StatusBadge = ({ status }) => {
  const colors = {
    pending: "bg-yellow-100 text-yellow-700",
    processing: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${colors[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
};

const Spinner = () => (
  <div className="flex justify-center items-center py-20">
    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export const OrderSuccessPage = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const { order, loading } = useSelector((state) => state.orders)

  useEffect(() => {
    dispatch(fetchOrderById(id))
  }, [id, dispatch])

  if (loading) return <Spinner />

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="text-green-500 flex justify-center mb-6 animate-bounce">
        <FiCheckCircle size={72} />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-3">Order Placed Successfully!</h1>
      <p className="text-gray-500 mb-2">Thank you for your purchase. Your order has been confirmed.</p>
      {order && (
        <p className="text-sm text-gray-400 mb-8">Order ID: <span className="font-mono font-medium text-gray-600">{order._id}</span></p>
      )}
      {order && (
        <div className="bg-white rounded-xl shadow p-6 text-left mb-8">
          <h2 className="font-bold mb-4 flex items-center gap-2"><FiPackage /> Order Summary</h2>
          <div className="space-y-3 mb-4">
            {(order.items || []).map((item, i) => (
              <div key={i} className="flex gap-3">
                <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded"
                  onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/48x48/131921/febd69?text=?"; }} />
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity} × {fmt(item.price)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{fmt(order.itemsPrice)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>{fmt(order.taxPrice)}</span></div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className={order.shippingPrice === 0 ? "text-green-600 font-semibold" : ""}>
                {order.shippingPrice === 0 ? 'FREE' : fmt(order.shippingPrice)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
              <span>Total</span><span className="text-blue-600">{fmt(order.totalPrice)}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-gray-500">Status:</span>
            <StatusBadge status={order.status} />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-gray-500">Payment:</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${order.isPaid ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
              {order.isPaid ? "✅ Paid" : "⏳ Pending"}
            </span>
          </div>
        </div>
      )}
      <div className="flex gap-4 justify-center">
        <Link to="/orders" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center gap-2 transition-colors">
          View My Orders <FiArrowRight />
        </Link>
        <Link to="/products" className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors">
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}

export default OrderSuccessPage
