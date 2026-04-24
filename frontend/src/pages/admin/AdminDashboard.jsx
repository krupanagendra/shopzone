import { useEffect, useState } from "react";
import { adminAPI, orderAPI, productAPI, systemAPI, adminAiAPI } from "../../services/api";
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
    const [systemStatus, setSystemStatus] = useState(null);
    const [aiLogs, setAiLogs] = useState([]);
    const [dashStats, setDashStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const [aiQuery, setAiQuery] = useState("");
    const [aiSubmitting, setAiSubmitting] = useState(false);
    const [aiResponse, setAiResponse] = useState(null);
    const [triggeringAgent, setTriggeringAgent] = useState(null);

    const fetchAll = async () => {
        try {
            const [statsRes, sysRes, logRes, dashRes] = await Promise.all([
                adminAPI.getStats(),
                systemAPI.getStatus(),
                adminAiAPI.getLogs(),
                systemAPI.getDashboardStats()
            ]);
            setStats(statsRes.data);
            setSystemStatus(sysRes.data);
            setAiLogs(logRes.data);
            setDashStats(dashRes.data);
        } catch (err) {
            console.error("Dashboard error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const handleAiSubmit = async (e) => {
        e.preventDefault();
        if (!aiQuery.trim()) return;
        setAiSubmitting(true);
        setAiResponse(null);
        try {
            const res = await adminAiAPI.queryAI({ query: aiQuery });
            setAiResponse(res.data.ai_response || "Command dispatched successfully");
            setAiQuery("");
            const logRes = await adminAiAPI.getLogs();
            setAiLogs(logRes.data);
        } catch (err) {
            setAiResponse("❌ Failed to reach AI Agent. Check backend connection.");
        } finally {
            setAiSubmitting(false);
        }
    };

    const handleTriggerAgent = async (agent) => {
        setTriggeringAgent(agent);
        try {
            await systemAPI.triggerAgent(agent);
            setTimeout(async () => {
                const [logRes, sysRes] = await Promise.all([
                    adminAiAPI.getLogs(),
                    systemAPI.getStatus()
                ]);
                setAiLogs(logRes.data);
                setSystemStatus(sysRes.data);
                setTriggeringAgent(null);
            }, 2000);
        } catch (err) {
            console.error("Trigger error:", err);
            setTriggeringAgent(null);
        }
    };

    if (loading) return <Spinner size="lg" />;

    // --- Chart data from REAL MongoDB stats ---
    const chartData = dashStats?.chartData || [];

    // --- Revenue by Month from Backend ---
    const revenueByMonth = dashStats?.revenueByMonth || [];

    // --- Orders by status pie chart ---
    const ordersByStatus = dashStats?.ordersByStatus || [];

    // --- Top products ---
    const topProducts = (dashStats?.topProducts || []).map(p => ({
        name: (p.name || '').slice(0, 18) + "...", 
        price: p.price || 0, 
        rating: p.rating || 0, 
        stock: p.countInStock || p.salesLast7Days || 0
    }));

    // --- Category breakdown ---
    const categoryData = dashStats?.categoryData || [];

    const recentOrders = dashStats?.recentOrders || [];

    const STATUS_COLORS = {
        pending: { bg: "#fff8e1", color: "#f57c00" },
        processing: { bg: "#e3f2fd", color: "#1565c0" },
        shipped: { bg: "#f3e5f5", color: "#7b1fa2" },
        delivered: { bg: "#e8f5e9", color: "#2e7d32" },
        cancelled: { bg: "#ffebee", color: "#c62828" },
    };

    const AGENT_LIST = [
        { key: "stock", label: "Stock Agent", icon: "📦", desc: "Restocks low inventory" },
        { key: "order", label: "Order Agent", icon: "🚚", desc: "Updates order statuses" },
        { key: "pricing", label: "Pricing Agent", icon: "💰", desc: "Adjusts prices by demand" },
        { key: "report", label: "Report Agent", icon: "📊", desc: "Generates daily report" },
    ];

    return (
        <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: "#131921" }}>📊 Dashboard Overview</h1>
                <p style={{ color: "#888", fontSize: 14, marginTop: 4 }}>
                    Live data from MongoDB — {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
                {systemStatus && (
                    <div style={{ marginTop: 12, display: "flex", gap: 15, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, background: "#e8f5e9", color: "#2e7d32", padding: "4px 10px", borderRadius: 12, fontWeight: 700 }}>AI Core {systemStatus.status}</span>
                        {systemStatus.demoMode && <span style={{ fontSize: 12, background: "#fff3e0", color: "#e65100", padding: "4px 10px", borderRadius: 12, fontWeight: 700 }}>🔥 DEMO MODE</span>}
                        <span style={{ fontSize: 12, color: "#666" }}>Uptime: <strong>{systemStatus.uptime}</strong></span>
                        <span style={{ fontSize: 12, color: "#666" }}>Redis: <strong style={{ color: systemStatus.redisConnected ? "#2e7d32" : "#c62828" }}>{systemStatus.redisConnected ? "Connected" : "Offline"}</strong></span>
                        <span style={{ fontSize: 12, color: "#666" }}>Agents: <strong>{Object.keys(systemStatus.agentLastRuns).length}</strong></span>
                    </div>
                )}
            </div>

            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginBottom: 28 }}>
                <StatCard title="Total Revenue" value={`₹${(stats?.revenue || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`} icon="💰" color="#00b386" sub trend={12} />
                <StatCard title="Total Orders" value={(stats?.totalOrders || 0).toLocaleString()} icon="📦" color="#f90" sub trend={8} />
                <StatCard title="Total Products" value={(stats?.totalProducts || 0).toLocaleString()} icon="🛍️" color="#457b9d" sub trend={5} />
                <StatCard title="Total Users" value={(stats?.totalUsers || 0).toLocaleString()} icon="👥" color="#e63946" sub trend={3} />
            </div>

            {/* Row 1: Real Revenue Chart + Orders Pie */}
            <div className="grid lg:grid-cols-3 gap-5 mb-5">
                <div className="lg:col-span-2" style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
                    <SectionTitle>📈 Sales & Revenue (Last 7 Days — Real Data)</SectionTitle>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f90" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#f90" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                            <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#888" }} />
                            <YAxis tick={{ fontSize: 12, fill: "#888" }} />
                            <Tooltip formatter={(v, name) => [`₹${Number(v).toLocaleString("en-IN")}`, name === "revenue" ? "Revenue" : "Sales"]} contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                            <Area type="monotone" dataKey="revenue" stroke="#f90" strokeWidth={3} fill="url(#revenueGrad)" dot={{ fill: "#f90", strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="sales" stroke="#232f3e" strokeWidth={2} dot={{ fill: "#232f3e", r: 3 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
                    <SectionTitle>🥧 Orders by Status</SectionTitle>
                    {ordersByStatus.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px 0", color: "#bbb" }}>
                            <p style={{ fontSize: 36 }}>📭</p><p style={{ marginTop: 8 }}>No orders yet</p>
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

            {/* Row 2: Orders Bar + Category */}
            <div className="grid lg:grid-cols-2 gap-5 mb-5">
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

            {/* Row 3: Agent Controls (NEW!) + Recent Orders */}
            <div className="grid lg:grid-cols-2 gap-5 mb-5">
                <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
                    <SectionTitle>🤖 AI Agent Controls</SectionTitle>
                    <p style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>Manually trigger agents for live demo. Each button enqueues a job immediately.</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                        {AGENT_LIST.map(a => (
                            <button key={a.key}
                                onClick={() => handleTriggerAgent(a.key)}
                                disabled={triggeringAgent === a.key}
                                style={{
                                    padding: "14px 12px", border: "1px solid #e0e0e0", borderRadius: 10,
                                    background: triggeringAgent === a.key ? "#f0f0f0" : "white",
                                    cursor: triggeringAgent === a.key ? "wait" : "pointer",
                                    transition: "all 0.2s", textAlign: "left"
                                }}
                                onMouseEnter={e => { if (triggeringAgent !== a.key) e.currentTarget.style.borderColor = "#f90"; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e0e0e0"; }}
                            >
                                <div style={{ fontSize: 20, marginBottom: 4 }}>{a.icon}</div>
                                <div style={{ fontWeight: 700, fontSize: 13, color: "#131921" }}>{a.label}</div>
                                <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                                    {triggeringAgent === a.key ? "⏳ Running..." : a.desc}
                                </div>
                            </button>
                        ))}
                    </div>
                    {systemStatus?.agentLastRuns && (
                        <div style={{ marginTop: 16 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 8 }}>Last Run Times:</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                {Object.entries(systemStatus.agentLastRuns).map(([name, info]) => (
                                    <div key={name} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#666" }}>
                                        <span>{name.replace("Agent", "").replace("_", " ")}</span>
                                        <span style={{ color: info.status === "success" ? "#2e7d32" : info.status === "failure" ? "#c62828" : "#888" }}>
                                            {info.lastRun === "Never" ? "Never" : new Date(info.lastRun).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
                    <SectionTitle>🕐 Recent Orders</SectionTitle>
                    {recentOrders.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px 0", color: "#bbb" }}>
                            <p style={{ fontSize: 36 }}>📭</p><p style={{ marginTop: 8 }}>No orders yet</p>
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
                                        <p style={{ fontWeight: 800, fontSize: 15, color: "#131921" }}>₹{o.totalPrice?.toFixed(0)}</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Row 4: Top Products + Pricing Changes */}
            <div className="grid lg:grid-cols-2 gap-5 mb-5">
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
                                        <td style={{ padding: "10px", fontWeight: 600, color: "#131921" }}>{p.name}</td>
                                        <td style={{ padding: "10px", color: "#c45500", fontWeight: 700 }}>₹{p.price?.toLocaleString("en-IN")}</td>
                                        <td style={{ padding: "10px" }}>
                                            <span style={{ color: "#f90" }}>{"★".repeat(Math.round(p.rating || 0))}</span>
                                            <span style={{ color: "#ddd" }}>{"★".repeat(5 - Math.round(p.rating || 0))}</span>
                                        </td>
                                        <td style={{ padding: "10px" }}>
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

                {/* NEW: Pricing Changes View */}
                <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
                    <SectionTitle>💰 AI Pricing Changes</SectionTitle>
                    {(!dashStats?.pricingChanges || dashStats.pricingChanges.length === 0) ? (
                        <div style={{ textAlign: "center", padding: "40px 0", color: "#bbb" }}>
                            <p style={{ fontSize: 36 }}>📊</p><p style={{ marginTop: 8 }}>No pricing changes yet</p>
                            <p style={{ fontSize: 12, marginTop: 4 }}>Trigger the Pricing Agent to see changes here</p>
                        </div>
                    ) : (
                        <div style={{ maxHeight: 280, overflowY: "auto" }}>
                            {dashStats.pricingChanges.map((log, i) => (
                                <div key={i} style={{ padding: "10px 12px", borderBottom: "1px solid #f5f5f5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <span style={{
                                            fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12,
                                            background: log.actionType === "PRICE_INCREASE" ? "#fff3e0" : "#e8f5e9",
                                            color: log.actionType === "PRICE_INCREASE" ? "#e65100" : "#2e7d32"
                                        }}>
                                            {log.actionType === "PRICE_INCREASE" ? "📈 UP" : "📉 DOWN"}
                                        </span>
                                        <span style={{ fontSize: 12, color: "#555", marginLeft: 8 }}>{log.reason}</span>
                                    </div>
                                    <div style={{ fontSize: 11, color: "#888", whiteSpace: "nowrap" }}>
                                        ₹{log.oldValue?.price?.toFixed(0)} → ₹{log.newValue?.price?.toFixed(0)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Row 5: AI Logs + AI Query */}
            <div className="grid lg:grid-cols-2 gap-5 mb-5">
                <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <SectionTitle>🤖 AI Agent Operations Log</SectionTitle>
                        <button onClick={async () => { const r = await adminAiAPI.getLogs(); setAiLogs(r.data); }}
                            style={{ fontSize: 11, padding: "4px 10px", border: "1px solid #ddd", borderRadius: 6, background: "white", cursor: "pointer" }}>
                            🔄 Refresh
                        </button>
                    </div>
                    <div style={{ overflowX: "auto", maxHeight: 320, overflowY: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead style={{ position: "sticky", top: 0, background: "white" }}>
                                <tr style={{ borderBottom: "2px solid #f0f0f0" }}>
                                    {["Time", "Agent", "Action", "Status"].map(h => (
                                        <th key={h} style={{ textAlign: "left", padding: "8px 10px", color: "#888", fontWeight: 600, fontSize: 12 }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {aiLogs.slice(0, 20).map((log, i) => (
                                    <tr key={i} style={{ borderBottom: "1px solid #f9f9f9" }}>
                                        <td style={{ padding: "10px", color: "#555" }}>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                        <td style={{ padding: "10px", fontWeight: 600, color: "#131921" }}>{log.agentName?.replace("Agent", "").replace("_", " ")}</td>
                                        <td style={{ padding: "10px", color: "#457b9d" }}>{log.actionType}</td>
                                        <td style={{ padding: "10px" }}>
                                            <span style={{ background: log.status === "success" ? "#e8f5e9" : "#ffebee", color: log.status === "success" ? "#2e7d32" : "#c62828", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                                                {log.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {/* Admin AI Query Box */}
                    <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", flex: 1 }}>
                        <SectionTitle>💬 Ask Admin AI</SectionTitle>
                        <p style={{ fontSize: 13, color: "#888", marginBottom: 15 }}>
                            Type a natural query like "sales today" or "top products" to get an AI summary.
                        </p>
                        <form onSubmit={handleAiSubmit} style={{ display: "flex", gap: 10 }}>
                            <input
                                type="text"
                                placeholder="e.g. slowest moving products..."
                                value={aiQuery}
                                onChange={e => setAiQuery(e.target.value)}
                                style={{ flex: 1, padding: "12px 16px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, outline: "none" }}
                            />
                            <button
                                type="submit"
                                disabled={aiSubmitting}
                                style={{
                                    background: "#232f3e", color: "white", padding: "12px 24px", borderRadius: 8,
                                    fontWeight: 600, cursor: aiSubmitting ? "not-allowed" : "pointer", opacity: aiSubmitting ? 0.7 : 1, border: "none"
                                }}
                            >
                                {aiSubmitting ? "Thinking..." : "Send Query"}
                            </button>
                        </form>
                        {/* Inline AI Response (replaces alert!) */}
                        {aiResponse && (
                            <div style={{
                                marginTop: 16, padding: 16, borderRadius: 8,
                                background: aiResponse.startsWith("❌") ? "#ffebee" : "#f0f7ff",
                                border: `1px solid ${aiResponse.startsWith("❌") ? "#ffcdd2" : "#bbdefb"}`,
                            }}>
                                <p style={{ fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 6 }}>🤖 AI Response:</p>
                                <p style={{ fontSize: 14, color: "#333", whiteSpace: "pre-line", lineHeight: 1.6, margin: 0 }}>{aiResponse}</p>
                            </div>
                        )}
                    </div>

                    {/* Quick Links */}
                    <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
                        <SectionTitle>⚡ Quick Links</SectionTitle>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <a href="/admin/products" style={{ textAlign: "center", padding: "12px", background: "#f9fafb", borderRadius: 8, textDecoration: "none", color: "#333", fontWeight: 600, border: "1px solid #eee" }}>🛍️ Products</a>
                            <a href="/admin/orders" style={{ textAlign: "center", padding: "12px", background: "#f9fafb", borderRadius: 8, textDecoration: "none", color: "#333", fontWeight: 600, border: "1px solid #eee" }}>📦 Orders</a>
                            <a href="/admin/users" style={{ textAlign: "center", padding: "12px", background: "#f9fafb", borderRadius: 8, textDecoration: "none", color: "#333", fontWeight: 600, border: "1px solid #eee" }}>👥 Users</a>
                            <a href="/admin/ai-agents" style={{ textAlign: "center", padding: "12px", background: "#f9fafb", borderRadius: 8, textDecoration: "none", color: "#333", fontWeight: 600, border: "1px solid #eee" }}>🤖 AI Agents</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
