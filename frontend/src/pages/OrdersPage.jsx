import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { orderAPI } from "../services/api";
import Spinner from "../components/common/Spinner";
import { FaBox } from "react-icons/fa";

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderAPI.getMyOrders().then((res) => { setOrders(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><FaBox /> My Orders</h1>
      {orders.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-6xl mb-4">📦</p>
          <p className="text-xl mb-4">No orders yet</p>
          <Link to="/products" className="btn-primary py-3 px-8">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order._id} to={`/order/${order._id}`} className="block bg-white rounded-xl shadow hover:shadow-md transition-shadow p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">Order #{order._id.slice(-8).toUpperCase()}</p>
                  <p className="text-sm text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${STATUS_COLORS[order.status] || "bg-gray-100"}`}>{order.status}</span>
                <div className="text-right">
                  <p className="font-bold text-lg">${order.totalPrice.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {order.items.slice(0, 4).map((item, i) => (
                  <img key={i} src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded"
                    onError={(e)=>{e.target.src="https://via.placeholder.com/50"}} />
                ))}
                {order.items.length > 4 && <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-500">+{order.items.length - 4}</div>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;