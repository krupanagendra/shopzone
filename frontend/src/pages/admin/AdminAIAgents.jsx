import { useEffect, useState, useCallback } from "react";
import { systemAPI, adminAiAPI } from "../../services/api";
import Spinner from "../../components/common/Spinner";

const AGENT_INFO = {
  EmailAgent: { icon: "📧", desc: "Dispatches transactional emails via SMTP queue", schedule: "Event-triggered" },
  StockAgent: { icon: "📦", desc: "Monitors inventory and restocks products below 100 units", schedule: "10 AM & 4 PM daily" },
  OrderLifecycleAgent: { icon: "🚚", desc: "Transitions orders: Processing → Shipped → Delivered", schedule: "Every hour" },
  ReportAgent: { icon: "📊", desc: "Generates daily PDF report with AI suggestions", schedule: "11 AM daily" },
  PricingAgent: { icon: "💰", desc: "Adjusts prices based on demand (±10-20%)", schedule: "Midnight daily" },
  "AdminAI_Agent": { icon: "🧠", desc: "Processes natural language admin queries", schedule: "On-demand" },
};

const TRIGGERABLE = [
  { key: "stock", label: "Stock Agent", color: "#00b386" },
  { key: "order", label: "Order Agent", color: "#457b9d" },
  { key: "pricing", label: "Pricing Agent", color: "#f90" },
  { key: "report", label: "Report Agent", color: "#e63946" },
];

export default function AdminAIAgents() {
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(null);
  const [filterAgent, setFilterAgent] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchData = useCallback(async () => {
    try {
      const [sysRes, logRes] = await Promise.all([
        systemAPI.getStatus(),
        adminAiAPI.getLogs()
      ]);
      setStatus(sysRes.data);
      setLogs(logRes.data);
    } catch (err) {
      console.error("AI Agents page error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // Auto-refresh every 15s
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleTrigger = async (agent) => {
    setTriggering(agent);
    try {
      await systemAPI.triggerAgent(agent);
      setTimeout(fetchData, 2500);
    } catch (err) {
      console.error("Trigger error:", err);
    } finally {
      setTimeout(() => setTriggering(null), 3000);
    }
  };

  if (loading) return <Spinner size="lg" />;

  const filteredLogs = logs.filter(log => {
    if (filterAgent !== "all" && log.agentName !== filterAgent) return false;
    if (filterStatus !== "all" && log.status !== filterStatus) return false;
    return true;
  });

  const agentNames = [...new Set(logs.map(l => l.agentName))];

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#131921" }}>🤖 AI Agent Control Center</h1>
        <p style={{ color: "#888", fontSize: 14, marginTop: 4 }}>
          Monitor, control, and analyze your autonomous AI agents in real-time.
          <span style={{ marginLeft: 8, fontSize: 12, background: "#e8f5e9", color: "#2e7d32", padding: "2px 8px", borderRadius: 12, fontWeight: 600 }}>
            Auto-refreshing every 15s
          </span>
        </p>
      </div>

      {/* Agent Health Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginBottom: 28 }}>
        {status?.agentLastRuns && Object.entries(status.agentLastRuns).map(([name, info]) => {
          const agentMeta = AGENT_INFO[name] || { icon: "🔧", desc: "Agent", schedule: "Unknown" };
          const isNever = info.lastRun === "Never";
          return (
            <div key={name} style={{
              background: "white", borderRadius: 16, padding: "20px 24px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
              borderTop: `4px solid ${info.status === "success" ? "#00b386" : info.status === "failure" ? "#e63946" : "#ddd"}`,
              transition: "transform 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "none"}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <span style={{ fontSize: 28 }}>{agentMeta.icon}</span>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#131921", marginTop: 8 }}>{name.replace("Agent", " Agent").replace("_", " ")}</h3>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 12,
                  background: info.status === "success" ? "#e8f5e9" : info.status === "failure" ? "#ffebee" : "#f5f5f5",
                  color: info.status === "success" ? "#2e7d32" : info.status === "failure" ? "#c62828" : "#888",
                }}>
                  {isNever ? "IDLE" : info.status.toUpperCase()}
                </span>
              </div>
              <p style={{ fontSize: 12, color: "#888", marginTop: 8, lineHeight: 1.4 }}>{agentMeta.desc}</p>
              <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", fontSize: 11, color: "#666" }}>
                <span>⏰ {agentMeta.schedule}</span>
                <span>📊 {info.totalRuns || 0} runs ({info.errorRate || "0%"} errors)</span>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: "#888" }}>
                Last run: {isNever ? "Never" : new Date(info.lastRun).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trigger Buttons */}
      <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: "#131921", marginBottom: 16 }}>⚡ Manual Agent Triggers</h2>
        <p style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>Click to immediately enqueue an agent job. Useful for live demo scenarios.</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {TRIGGERABLE.map(a => (
            <button key={a.key}
              onClick={() => handleTrigger(a.key)}
              disabled={triggering === a.key}
              style={{
                padding: "12px 24px", borderRadius: 10, fontWeight: 700, fontSize: 14,
                background: triggering === a.key ? "#f5f5f5" : a.color,
                color: triggering === a.key ? "#888" : "white",
                border: "none", cursor: triggering === a.key ? "wait" : "pointer",
                transition: "all 0.2s", opacity: triggering === a.key ? 0.7 : 1,
                boxShadow: triggering === a.key ? "none" : `0 4px 12px ${a.color}40`,
              }}
            >
              {triggering === a.key ? "⏳ Running..." : `▶ ${a.label}`}
            </button>
          ))}
          <button
            onClick={() => {
              TRIGGERABLE.forEach((a, i) => setTimeout(() => handleTrigger(a.key), i * 500));
            }}
            style={{
              padding: "12px 24px", borderRadius: 10, fontWeight: 700, fontSize: 14,
              background: "#131921", color: "#febd69",
              border: "none", cursor: "pointer", transition: "all 0.2s",
              boxShadow: "0 4px 12px rgba(19,25,33,0.3)",
            }}
          >
            🚀 Trigger ALL
          </button>
        </div>
      </div>

      {/* Queue Status */}
      {status?.queues && typeof status.queues === "object" && !status.queues.note && (
        <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: 28 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#131921", marginBottom: 16 }}>📬 Queue Status (Bull + Redis)</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
            {Object.entries(status.queues).map(([name, counts]) => (
              <div key={name} style={{ padding: 16, background: "#f9fafb", borderRadius: 10, border: "1px solid #eee" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#131921", marginBottom: 8 }}>{name}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {Object.entries(counts).map(([status, count]) => (
                    <span key={status} style={{ fontSize: 11, padding: "2px 6px", borderRadius: 6, background: count > 0 ? "#fff3e0" : "#f5f5f5", color: count > 0 ? "#e65100" : "#888" }}>
                      {status}: {count}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full AI Logs Table with Filters */}
      <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#131921" }}>📋 Complete AI Operations Log ({filteredLogs.length})</h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)}
              style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ddd", fontSize: 12 }}>
              <option value="all">All Agents</option>
              {agentNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ddd", fontSize: 12 }}>
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
            </select>
            <button onClick={fetchData} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #ddd", background: "white", cursor: "pointer", fontSize: 12 }}>
              🔄 Refresh
            </button>
          </div>
        </div>
        <div style={{ overflowX: "auto", maxHeight: 500, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead style={{ position: "sticky", top: 0, background: "white" }}>
              <tr style={{ borderBottom: "2px solid #f0f0f0" }}>
                {["Time", "Agent", "Action", "Details", "Status"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "10px", color: "#888", fontWeight: 600, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLogs.slice(0, 50).map((log, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f9f9f9" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "10px", color: "#555", whiteSpace: "nowrap" }}>
                    {new Date(log.timestamp).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </td>
                  <td style={{ padding: "10px", fontWeight: 600, color: "#131921" }}>{log.agentName}</td>
                  <td style={{ padding: "10px", color: "#457b9d", fontWeight: 500 }}>{log.actionType}</td>
                  <td style={{ padding: "10px", color: "#666", fontSize: 12, maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {log.reason || "—"}
                  </td>
                  <td style={{ padding: "10px" }}>
                    <span style={{
                      background: log.status === "success" ? "#e8f5e9" : "#ffebee",
                      color: log.status === "success" ? "#2e7d32" : "#c62828",
                      padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700
                    }}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
