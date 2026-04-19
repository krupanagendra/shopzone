import { Link, Outlet, useLocation } from "react-router-dom";
import { FaTachometerAlt, FaBoxes, FaShoppingBag, FaUsers, FaRobot, FaArrowLeft } from "react-icons/fa";

const nav = [
  { to: "/admin", label: "Dashboard", icon: FaTachometerAlt },
  { to: "/admin/products", label: "Products", icon: FaBoxes },
  { to: "/admin/orders", label: "Orders", icon: FaShoppingBag },
  { to: "/admin/users", label: "Users", icon: FaUsers },
  { to: "/admin/ai-agents", label: "AI Agents", icon: FaRobot },
];

const AdminLayout = () => {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-amazon min-h-screen flex-shrink-0">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-white font-bold text-lg">Admin Panel</h2>
          <p className="text-gray-400 text-xs mt-1">OmniKart AI</p>
        </div>
        <nav className="py-4">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${pathname === to ? "bg-amazon-blue text-amazon-yellow font-semibold" : "text-gray-300 hover:bg-amazon-blue hover:text-white"}`}>
              <Icon /> {label}
            </Link>
          ))}
          <Link to="/" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-white mt-4">
            <FaArrowLeft /> Back to Store
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-6 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;