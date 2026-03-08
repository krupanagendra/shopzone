import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminAPI } from "../../services/api";
import Spinner from "../../components/common/Spinner";
import { FaBoxes, FaUsers, FaShoppingBag, FaDollarSign } from "react-icons/fa";

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className={`bg-white rounded-xl shadow p-6 border-l-4 ${color}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </div>
      <Icon className={`text-4xl opacity-20`} />
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getStats().then((r) => { setStats(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Revenue" value={`$${stats?.revenue?.toFixed(0) || 0}`} icon={FaDollarSign} color="border-green-500" />
        <StatCard title="Total Orders" value={stats?.totalOrders || 0} icon={FaShoppingBag} color="border-blue-500" />
        <StatCard title="Total Products" value={stats?.totalProducts || 0} icon={FaBoxes} color="border-purple-500" />
        <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={FaUsers} color="border-orange-500" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {[
          { label: "Manage Products", href: "/admin/products", desc: "Add, edit, delete products", color: "bg-purple-500" },
          { label: "Manage Orders", href: "/admin/orders", desc: "View and update order status", color: "bg-blue-500" },
          { label: "Manage Users", href: "/admin/users", desc: "View and manage user accounts", color: "bg-orange-500" },
        ].map((item) => (
          <Link key={item.href} to={item.href} className={`${item.color} text-white rounded-xl p-6 hover:opacity-90 transition-opacity`}>
            <h3 className="text-xl font-bold">{item.label}</h3>
            <p className="opacity-80 mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;