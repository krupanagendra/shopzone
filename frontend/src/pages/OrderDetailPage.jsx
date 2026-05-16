import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { orderAPI } from "../services/api";
import Spinner from "../components/common/Spinner";
import { FaCheckCircle, FaArrowLeft, FaRobot, FaTruck, FaBox, FaClock, FaGift, FaDownload } from "react-icons/fa";

const STATUS_STEPS = ["pending", "processing", "shipped", "delivered"];
const STATUS_ICONS = [FaClock, FaBox, FaTruck, FaGift];
const STATUS_LABELS = ["Order Placed", "Processing", "Shipped", "Delivered"];

const fmt = (n) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

const OrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderAPI.getOrderById(id)
      .then((res) => { setOrder(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;
  if (!order) return <div className="text-center py-20 text-gray-500">Order not found</div>;

  const currentStep = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === "cancelled";

  // Estimated delivery
  const getEstDelivery = () => {
    if (order.deliveredAt) return `Delivered on ${new Date(order.deliveredAt).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long" })}`;
    if (order.shippedAt) {
      const est = new Date(order.shippedAt);
      est.setDate(est.getDate() + 2);
      return `Est. delivery by ${est.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long" })}`;
    }
    const est = new Date(order.createdAt);
    est.setDate(est.getDate() + 5);
    return `Est. delivery by ${est.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long" })}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Link to="/orders" className="flex items-center gap-2 text-amazon-blue hover:underline mb-6">
        <FaArrowLeft /> Back to Orders
      </Link>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold">Order #{order._id.slice(-8).toUpperCase()}</h1>
            <p className="text-gray-500 text-sm">Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const token = JSON.parse(localStorage.getItem("userInfo"))?.token;
                if (token) {
                  window.open(`${import.meta.env.VITE_API_URL}/api/orders/${order._id}/receipt?token=${token}`, "_blank");
                }
              }}
              className="flex items-center gap-1 text-gray-700 hover:text-amazon-blue bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-sm font-semibold transition-colors"
            >
              <FaDownload /> Receipt
            </button>
            {order.isPaid && (
              <span className="flex items-center gap-1 text-green-600 font-semibold bg-green-50 px-3 py-1 rounded-full text-sm">
                <FaCheckCircle /> Paid
              </span>
            )}
            <span className="flex items-center gap-1 text-indigo-600 font-semibold bg-indigo-50 px-3 py-1 rounded-full text-sm">
              <FaRobot /> AI Managed
            </span>
          </div>
        </div>

        {/* Enhanced Progress Steps */}
        {!isCancelled && (
          <div className="mb-8">
            <div className="flex items-center">
              {STATUS_STEPS.map((s, i) => {
                const Icon = STATUS_ICONS[i];
                const isCompleted = i < currentStep;
                const isCurrent = i === currentStep;
                const isActive = i <= currentStep;
                return (
                  <div key={s} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all duration-500
                        ${isCompleted ? "bg-green-500 text-white shadow-lg shadow-green-200" :
                          isCurrent ? "bg-amber-500 text-white shadow-lg shadow-amber-200 animate-pulse" :
                          "bg-gray-100 text-gray-400"}`}
                      >
                        {isCompleted ? "✓" : <Icon />}
                      </div>
                      <span className={`mt-2 text-xs font-medium text-center
                        ${isCompleted ? "text-green-600" : isCurrent ? "text-amber-600 font-bold" : "text-gray-400"}`}>
                        {STATUS_LABELS[i]}
                      </span>
                      {/* Timestamp under step */}
                      <span className="text-[10px] text-gray-400 mt-1">
                        {i === 0 && order.createdAt ? new Date(order.createdAt).toLocaleDateString([], { month: "short", day: "numeric" }) : ""}
                        {i === 2 && order.shippedAt ? new Date(order.shippedAt).toLocaleDateString([], { month: "short", day: "numeric" }) : ""}
                        {i === 3 && order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString([], { month: "short", day: "numeric" }) : ""}
                      </span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`flex-1 h-1 mx-3 rounded-full transition-all duration-700 ${isActive && i < currentStep ? "bg-green-500" : "bg-gray-200"}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Delivery estimate bar */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-2">
              <FaTruck className="text-blue-500" />
              <span className="text-sm text-blue-700 font-medium">{getEstDelivery()}</span>
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200 text-center">
            <p className="text-red-600 font-bold text-lg">❌ Order Cancelled</p>
          </div>
        )}

        {/* Order items */}
        <div className="space-y-3 mb-4">
          {order.items.map((item, i) => (
            <div key={i} className="flex gap-3 items-center">
              <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/60x60/131921/febd69?text=?"; }} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{item.name}</p>
                <p className="text-gray-500 text-sm">Qty: {item.quantity} × {fmt(item.price)}</p>
              </div>
              <p className="font-bold text-gray-900 flex-shrink-0">{fmt(item.quantity * item.price)}</p>
            </div>
          ))}
        </div>

        <hr />

        {/* Bottom grid */}
        <div className="mt-4 grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold mb-2 text-gray-800">Shipping Address</h3>
            <p className="font-medium">{order.shippingAddress?.fullName}</p>
            <p className="text-gray-600 text-sm">{order.shippingAddress?.address}, {order.shippingAddress?.city}</p>
            <p className="text-gray-600 text-sm">{order.shippingAddress?.postalCode}, {order.shippingAddress?.country}</p>
          </div>

          <div>
            <h3 className="font-bold mb-2 text-gray-800">Order Total</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Items:</span>
                <span className="font-medium">{fmt(order.itemsPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping:</span>
                <span className={order.shippingPrice === 0 ? "text-green-600 font-semibold" : "font-medium"}>
                  {order.shippingPrice === 0 ? "FREE" : fmt(order.shippingPrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium">{fmt(order.taxPrice)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-green-600">Discount:</span>
                  <span className="text-green-600 font-semibold">-{fmt(order.discountAmount)}</span>
                </div>
              )}
              <hr />
              <div className="flex justify-between font-bold text-base">
                <span>Total:</span>
                <span className="text-amazon-blue">{fmt(order.totalPrice)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Agent Note */}
        <div className="mt-6 p-3 bg-indigo-50 rounded-lg border border-indigo-100 flex items-center gap-2">
          <FaRobot className="text-indigo-500 flex-shrink-0" />
          <p className="text-xs text-indigo-600">
            This order's status transitions are managed automatically by the <strong>OmniKart AI Order Lifecycle Agent</strong>.
            Status updates happen every hour (or every 2 minutes in demo mode).
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
