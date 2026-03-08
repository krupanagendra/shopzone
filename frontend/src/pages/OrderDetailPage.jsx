import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { orderAPI } from "../services/api";
import Spinner from "../components/common/Spinner";
import { FaCheckCircle, FaArrowLeft } from "react-icons/fa";

const STATUS_STEPS = ["pending", "processing", "shipped", "delivered"];

const OrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderAPI.getOrderById(id).then((res) => { setOrder(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;
  if (!order) return <div className="text-center py-20">Order not found</div>;

  const currentStep = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Link to="/orders" className="flex items-center gap-2 text-amazon-blue hover:underline mb-6"><FaArrowLeft /> Back to Orders</Link>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold">Order #{order._id.slice(-8).toUpperCase()}</h1>
            <p className="text-gray-500 text-sm">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          {order.isPaid && <span className="flex items-center gap-1 text-green-600 font-semibold"><FaCheckCircle /> Paid</span>}
        </div>

        {/* Progress bar */}
        {order.status !== "cancelled" && (
          <div className="flex items-center mb-6">
            {STATUS_STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i <= currentStep ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                  {i < currentStep ? "✓" : i + 1}
                </div>
                <span className={`ml-1 text-xs capitalize hidden sm:block ${i <= currentStep ? "text-green-600 font-semibold" : "text-gray-400"}`}>{s}</span>
                {i < STATUS_STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${i < currentStep ? "bg-green-500" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
        )}

        {/* Items */}
        <div className="space-y-3 mb-4">
          {order.items.map((item, i) => (
            <div key={i} className="flex gap-3">
              <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" onError={(e)=>{e.target.src="https://via.placeholder.com/60"}} />
              <div className="flex-1">
                <p className="font-semibold">{item.name}</p>
                <p className="text-gray-500 text-sm">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
              </div>
              <p className="font-semibold">${(item.quantity * item.price).toFixed(2)}</p>
            </div>
          ))}
        </div>

        <hr />
        <div className="mt-4 grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Shipping Address</h3>
            <p>{order.shippingAddress?.fullName}</p>
            <p className="text-gray-600 text-sm">{order.shippingAddress?.address}, {order.shippingAddress?.city}</p>
            <p className="text-gray-600 text-sm">{order.shippingAddress?.postalCode}, {order.shippingAddress?.country}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Order Total</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Items:</span><span>${order.itemsPrice?.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shipping:</span><span>{order.shippingPrice === 0 ? <span className="text-green-600">FREE</span> : `$${order.shippingPrice?.toFixed(2)}`}</span></div>
              <div className="flex justify-between"><span>Tax:</span><span>${order.taxPrice?.toFixed(2)}</span></div>
              <hr />
              <div className="flex justify-between font-bold text-base"><span>Total:</span><span>${order.totalPrice?.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;