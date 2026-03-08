// OrderSuccessPage.jsx
import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiCheckCircle, FiPackage, FiArrowRight } from 'react-icons/fi'
import { fetchOrderById } from '../redux/slices/orderSlice'
import { Spinner, StatusBadge } from '../components/common/UIComponents'

export const OrderSuccessPage = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const { order, loading } = useSelector((state) => state.orders)

  useEffect(() => {
    dispatch(fetchOrderById(id))
  }, [id, dispatch])

  if (loading) return <Spinner size="lg" />

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center page-enter">
      <div className="text-green-500 flex justify-center mb-6">
        <FiCheckCircle size={72} />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-3">Order Placed Successfully!</h1>
      <p className="text-gray-500 mb-2">Thank you for your purchase. Your order has been confirmed.</p>
      {order && (
        <p className="text-sm text-gray-400 mb-8">Order ID: <span className="font-mono font-medium text-gray-600">{order._id}</span></p>
      )}
      {order && (
        <div className="card p-6 text-left mb-8">
          <h2 className="font-bold mb-4 flex items-center gap-2"><FiPackage /> Order Summary</h2>
          <div className="space-y-3 mb-4">
            {order.orderItems?.map((item, i) => (
              <div key={i} className="flex gap-3">
                <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity} × ${item.price?.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>${order.itemsPrice?.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>${order.taxPrice?.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>{order.shippingPrice === 0 ? 'FREE' : `$${order.shippingPrice?.toFixed(2)}`}</span></div>
            <div className="flex justify-between font-bold text-base"><span>Total</span><span>${order.totalPrice?.toFixed(2)}</span></div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-gray-500">Status:</span>
            <StatusBadge status={order.status} />
          </div>
        </div>
      )}
      <div className="flex gap-4 justify-center">
        <Link to="/orders" className="btn-secondary py-3 px-6 flex items-center gap-2">
          View My Orders <FiArrowRight />
        </Link>
        <Link to="/products" className="btn-outline py-3 px-6">
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}

export default OrderSuccessPage
