import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { orderAPI } from "../../services/api";
import Spinner from "../../components/common/Spinner";
import { toast } from "react-toastify";

const STATUS_OPTIONS = ["pending", "processing", "shipped", "delivered", "cancelled"];
const STATUS_COLORS = { pending:"bg-yellow-100 text-yellow-700", processing:"bg-blue-100 text-blue-700", shipped:"bg-purple-100 text-purple-700", delivered:"bg-green-100 text-green-700", cancelled:"bg-red-100 text-red-700" };

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    orderAPI.getAllOrders().then((r) => { setOrders(r.data); setLoading(false); });
  };
  useEffect(() => { fetchOrders(); }, []);

  const handleStatusChange = async (id, status) => {
    try {
      await orderAPI.updateOrderStatus(id, { status });
      toast.success("Status updated");
      fetchOrders();
    } catch { toast.error("Failed to update"); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Orders ({orders.length})</h1>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>{["Order ID","Customer","Date","Total","Status","Actions"].map((h) => <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
            <tbody className="divide-y">
              {orders.map((o) => (
                <tr key={o._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">#{o._id.slice(-8).toUpperCase()}</td>
                  <td className="px-4 py-3">{o.user?.name || "N/A"}<br/><span className="text-gray-400 text-xs">{o.user?.email}</span></td>
                  <td className="px-4 py-3 text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-semibold">${o.totalPrice.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <select value={o.status} onChange={(e) => handleStatusChange(o._id, e.target.value)}
                      className={`text-xs font-semibold px-2 py-1 rounded-full border-0 outline-none ${STATUS_COLORS[o.status] || "bg-gray-100"}`}>
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/order/${o._id}`} className="text-blue-500 hover:underline text-xs">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;