import { useEffect, useState } from "react";
import { adminAPI, orderAPI, productAPI } from "../../services/api";
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, AreaChart, Area
} from "recharts";
import Spinner from "../../components/common/Spinner";

const COLORS = ["#f90", "#232f3e", "#00b386", "#e63946", "#457b9d", "#a8dadc"];

const StatCard = ({ title, value, icon, color, sub, trend }) => (
    <div style={{
        background: "white",
        borderRadius: 16,
        padding: "20px 24px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        borderLeft: `5px solid ${color}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        transition: "transform 0.2s, box-shadow 0.2s",
        cursor: "default",
    }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)"; }}
    >
        <div>
            <p style={{ color: "#888", fontSize: 13, marginBottom: 4, fontWeight: 500 }}>{title}</p>
            <p style={{ fontWeight: 800, fontSize: 28, color: "#131921", marginBottom: 4 }}>{value}</p>
            {sub && <p style={{ fontSize: 12, color: trend > 0 ? "#00b386" : "#e63946" }}>
                {trend > 0 ? "▲" : "▼"} {Math.abs(trend)}% from last month
            </p>}
        </div>
        <div style={{ fontSize: 40, opacity: 0.15 }}>{icon}</div>
    </div>
);

const SectionTitle = ({ children }) => (
    <h2 style={{ fontSize: 17, fontWeight: 700, color: "#131921", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        {children}
    </h2>
);

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [statsRes, ordersRes, productsRes] = await Promise.all([
                    adminAPI.getStats(),
                    orderAPI.getAllOrders(),
                    productAPI.getProducts({ pageSize: 100 }),
                ]);
                setStats(statsRes.data);
                setOrders(ordersRes.data);
                setProducts(productsRes.data.products);
            } catch (err) {
                console.error("Dashboard error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    if (loading) return <Spinner size="lg" />;

    // --- Build Revenue by Month chart data from real orders ---
    const revenueByMonth = (() => {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const map = {};
        months.forEach(m => map[m] = { month: m, revenue: 0, orders: 0 });
        orders.forEach(o => {
            const m = months[new Date(o.createdAt).getMonth()];
            map[m].revenue += o.totalPrice || 0;
            map[m].orders += 1;
        });
        return Object.values(map);
    })();

    // --- Orders by status pie chart ---
    const ordersByStatus = (() => {
        const map = {};
        orders.forEach(o => { map[o.status] = (map[o.status] || 0) + 1; });
        return Object.entries(map).map(([name, value]) => ({ name, value }));
    })();

    // --- Top 6 products by price (as proxy for featured) ---
    const topProducts = [...products]
        .sort((a, b) => b.price - a.price)
        .slice(0, 6)
        .map(p => ({ name: p.name.slice(0, 18) + "...", price: p.price, rating: p.rating, stock: p.countInStock }));

    // --- Category breakdown ---
    const categoryData = (() => {
        const map = {};
        products.forEach(p => { map[p.category] = (map[p.category] || 0) + 1; });
        return Object.entries(map).map(([name, value]) => ({ name, value }));
    })();

    // --- Recent 5 orders ---
    const recentOrders = orders.slice(0, 5);

    const STATUS_COLORS = {
        pending: { bg: "#fff8e1", color: "#f57c00" },
        processing: { bg: "#e3f2fd", color: "#1565c0" },
        shipped: { bg: "#f3e5f5", color: "#7b1fa2" },
        delivered: { bg: "#e8f5e9", color: "#2e7d32" },
        cancelled: { bg: "#ffebee", color: "#c62828" },
    };

    return (
        <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: "#131921" }}>📊 Dashboard Overview</h1>
                <p style={{ color: "#888", fontSize: 14, marginTop: 4 }}>
                    Live data from your MongoDB database — {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
            </div>

            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginBottom: 28 }}>
                <StatCard title="Total Revenue" value={`$${(stats?.revenue || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon="💰" color="#00b386" sub trend={12} />
                <StatCard title="Total Orders" value={(stats?.totalOrders || 0).toLocaleString()} icon="📦" color="#f90" sub trend={8} />
                <StatCard title="Total Products" value={(stats?.totalProducts || 0).toLocaleString()} icon="🛍️" color="#457b9d" sub trend={5} />
                <StatCard title="Total Users" value={(stats?.totalUsers || 0).toLocaleString()} icon="👥" color="#e63946" sub trend={-2} />
            </div>

            {/* Row 1: Revenue Area Chart + Orders Pie */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 20 }}>

                {/* Revenue Over Time */}
                <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
                    <SectionTitle>📈 Revenue Over Time</SectionTitle>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={revenueByMonth}>
                            <defs>
                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f90" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#f90" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#888" }} />
                            <YAxis tick={{ fontSize: 12, fill: "#888" }} />
                            <Tooltip formatter={(v) => [`$${v.toFixed(2)}`, "Revenue"]} contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                            <Area type="monotone" dataKey="revenue" stroke="#f90" strokeWidth={3} fill="url(#revenueGrad)" dot={{ fill: "#f90", strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Orders by Status Pie */}
                <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
                    <SectionTitle>🥧 Orders by Status</SectionTitle>
                    {ordersByStatus.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px 0", color: "#bbb" }}>
                            <p style={{ fontSize: 36 }}>📭</p>
                            <p style={{ marginTop: 8 }}>No orders yet</p>
                        </div>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={ordersByStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                                        {ordersByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                                {ordersByStatus.map((s, i) => (
                                    <span key={s.name} style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS[i % COLORS.length], display: "inline-block" }} />
                                        {s.name} ({s.value})
                                    </span>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Row 2: Orders Bar Chart + Category Pie */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

                {/* Orders Per Month */}
                <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
                    <SectionTitle>📦 Orders Per Month</SectionTitle>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={revenueByMonth}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#888" }} />
                            <YAxis tick={{ fontSize: 11, fill: "#888" }} />
                            <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                            <Bar dataKey="orders" fill="#232f3e" radius={[6, 6, 0, 0]}>
                                {revenueByMonth.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? "#232f3e" : "#37475a"} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Products by Category */}
                <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
                    <SectionTitle>🛍️ Products by Category</SectionTitle>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={categoryData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                            <XAxis type="number" tick={{ fontSize: 11, fill: "#888" }} />
                            <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#888" }} width={90} />
                            <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Row 3: Top Products Table + Recent Orders */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

                {/* Top Products */}
                <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
                    <SectionTitle>⭐ Top Products by Price</SectionTitle>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                                <tr style={{ borderBottom: "2px solid #f0f0f0" }}>
                                    {["Product", "Price", "Rating", "Stock"].map(h => (
                                        <th key={h} style={{ textAlign: "left", padding: "8px 10px", color: "#888", fontWeight: 600, fontSize: 12 }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {topProducts.map((p, i) => (
                                    <tr key={i} style={{ borderBottom: "1px solid #f9f9f9" }}
                                        onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                        <td style={{ padding: "10px 10px", fontWeight: 600, color: "#131921" }}>{p.name}</td>
                                        <td style={{ padding: "10px 10px", color: "#c45500", fontWeight: 700 }}>${p.price}</td>
                                        <td style={{ padding: "10px 10px" }}>
                                            <span style={{ color: "#f90" }}>{"★".repeat(Math.round(p.rating))}</span>
                                            <span style={{ color: "#ddd" }}>{"★".repeat(5 - Math.round(p.rating))}</span>
                                        </td>
                                        <td style={{ padding: "10px 10px" }}>
                                            <span style={{ background: p.stock > 0 ? "#e8f5e9" : "#ffebee", color: p.stock > 0 ? "#2e7d32" : "#c62828", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                                                {p.stock > 0 ? p.stock : "Out"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Orders */}
                <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
                    <SectionTitle>🕐 Recent Orders</SectionTitle>
                    {recentOrders.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px 0", color: "#bbb" }}>
                            <p style={{ fontSize: 36 }}>📭</p>
                            <p style={{ marginTop: 8 }}>No orders yet</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {recentOrders.map((o) => {
                                const st = STATUS_COLORS[o.status] || { bg: "#f5f5f5", color: "#555" };
                                return (
                                    <div key={o._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#fafafa", borderRadius: 10, border: "1px solid #f0f0f0" }}>
                                        <div>
                                            <p style={{ fontWeight: 700, fontSize: 13, fontFamily: "monospace" }}>#{o._id.slice(-6).toUpperCase()}</p>
                                            <p style={{ color: "#888", fontSize: 11, marginTop: 2 }}>{new Date(o.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <span style={{ background: st.bg, color: st.color, padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, textTransform: "capitalize" }}>{o.status}</span>
                                        <p style={{ fontWeight: 800, fontSize: 15, color: "#131921" }}>${o.totalPrice?.toFixed(2)}</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
                <SectionTitle>⚡ Quick Actions</SectionTitle>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                    {[
                        { label: "Add Product", emoji: "➕", color: "#7b1fa2", href: "/admin/products" },
                        { label: "View Orders", emoji: "📦", color: "#1565c0", href: "/admin/orders" },
                        { label: "Manage Users", emoji: "👥", color: "#c45500", href: "/admin/users" },
                        { label: "Visit Store", emoji: "🛍️", color: "#2e7d32", href: "/" },
                    ].map(a => (
                        <a key={a.label} href={a.href}
                            style={{ background: a.color, color: "white", borderRadius: 12, padding: "16px 12px", textAlign: "center", textDecoration: "none", display: "block", transition: "opacity 0.2s, transform 0.2s" }}
                            onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "none"; }}>
                            <div style={{ fontSize: 28, marginBottom: 6 }}>{a.emoji}</div>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{a.label}</div>
                        </a>
                    ))}
                </div>
            </div>

        </div>
    );
}
