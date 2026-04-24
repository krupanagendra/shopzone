const express = require("express");
const router = express.Router();
const AILog = require("../models/AI_Log");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const { emailQueue, reportQueue, pricingQueue, orderQueue, stockQueue, isRedisConnected } = require("../queues");

// Server boot time for uptime tracking
const SERVER_START_TIME = new Date();

const cache = {
  status: { data: null, timestamp: 0 },
  dashboard: { data: null, timestamp: 0 }
};
const CACHE_TTL = 15000; // 15 seconds

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/system/status
// @desc    Complete system health, agent metrics, and queue status
// ─────────────────────────────────────────────────────────────────────────────
router.get("/status", async (req, res) => {
  try {
    if (Date.now() - cache.status.timestamp < CACHE_TTL) {
      return res.status(200).json(cache.status.data);
    }

    const agents = ["EmailAgent", "StockAgent", "OrderLifecycleAgent", "ReportAgent", "PricingAgent", "AdminAI_Agent"];

    // Fetch last run + execution stats for each agent (single aggregation)
    const lastRunsAgg = await AILog.aggregate([
      { $match: { agentName: { $in: agents } } },
      { $sort: { timestamp: -1 } },
      { $group: {
        _id: "$agentName",
        lastRun: { $first: "$timestamp" },
        status: { $first: "$status" },
        totalRuns: { $sum: 1 },
        failures: { $sum: { $cond: [{ $eq: ["$status", "failure"] }, 1, 0] } }
      }}
    ]);

    const lastRuns = {};
    agents.forEach(agent => lastRuns[agent] = { lastRun: "Never", status: "idle", totalRuns: 0, failures: 0, errorRate: "0%" });
    lastRunsAgg.forEach(r => {
      lastRuns[r._id] = {
        lastRun: r.lastRun,
        status: r.status,
        totalRuns: r.totalRuns,
        failures: r.failures,
        errorRate: r.totalRuns > 0 ? ((r.failures / r.totalRuns) * 100).toFixed(1) + "%" : "0%"
      };
    });

    let queues = {};
    if (isRedisConnected()) {
      try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 1500));
        const queueStats = Promise.all([
          emailQueue.getJobCounts(),
          reportQueue.getJobCounts(),
          pricingQueue.getJobCounts(),
          orderQueue.getJobCounts(),
          stockQueue.getJobCounts()
        ]);
        const [emailQ, reportQ, pricingQ, orderQ, stockQ] = await Promise.race([queueStats, timeoutPromise]);
        queues = { emailQueue: emailQ, reportQueue: reportQ, pricingQueue: pricingQ, orderQueue: orderQ, stockQueue: stockQ };
      } catch (qErr) {
        queues = { note: "Redis queue error/timeout" };
      }
    } else {
      queues = { note: "Redis not connected — queues unavailable" };
    }

    // System counts
    const [totalOrders, totalProducts, totalUsers] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments(),
      User.countDocuments()
    ]);

    // Uptime
    const uptimeMs = Date.now() - SERVER_START_TIME.getTime();
    const uptimeHours = Math.floor(uptimeMs / 3600000);
    const uptimeMins = Math.floor((uptimeMs % 3600000) / 60000);

    const responseData = {
      status: "Operational 🟢",
      demoMode: process.env.DEMO_MODE === "true",
      redisConnected: isRedisConnected(),
      uptime: `${uptimeHours}h ${uptimeMins}m`,
      serverStartedAt: SERVER_START_TIME,
      systemMetrics: { totalOrders, totalProducts, totalUsers },
      agentLastRuns: lastRuns,
      queues,
      timestamp: new Date()
    };

    cache.status = { data: responseData, timestamp: Date.now() };
    res.status(200).json(responseData);
  } catch (error) {
    console.error("[SYSTEM ROUTE ERROR] /status failed:", error);
    res.status(500).json({ error: "Failed to fetch system status" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/system/dashboard-stats
// @desc    Revenue and quick-stats with REAL chart data from MongoDB
// ─────────────────────────────────────────────────────────────────────────────
router.get("/dashboard-stats", async (req, res) => {
  try {
    if (Date.now() - cache.dashboard.timestamp < CACHE_TTL) {
      return res.status(200).json(cache.dashboard.data);
    }

    // Revenue via aggregation (not loading all orders into memory)
    const revenueAgg = await Order.aggregate([
      { $match: { status: "delivered" } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" }, count: { $sum: 1 } } }
    ]);

    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;
    const totalDeliveredOrders = revenueAgg[0]?.count || 0;

    // ── Real chart data: Revenue by day for last 7 days ─────────────────
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyStats = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: 1 },
          revenue: { $sum: "$totalPrice" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill in missing days with zeros
    const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().slice(0, 10);
      const found = dailyStats.find(s => s._id === dateStr);
      return {
        date: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        sales: found?.sales || 0,
        revenue: Math.round(found?.revenue || 0)
      };
    });

    // Top products by sales
    const topProducts = await Product.find({})
      .select("name price salesLast7Days")
      .sort({ salesLast7Days: -1 })
      .limit(5)
      .lean();

    // AI pricing changes log (last 10)
    const pricingChanges = await AILog.find({
      agentName: "PricingAgent",
      actionType: { $in: ["PRICE_INCREASE", "PRICE_DECREASE"] }
    })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    // -- New Aggregations to offload Frontend processing --
    const revenueByMonthAgg = await Order.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: "$totalPrice" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const revenueByMonth = months.map((m, i) => {
      const found = revenueByMonthAgg.find(x => x._id === i + 1);
      return { month: m, revenue: found ? found.revenue : 0, orders: found ? found.orders : 0 };
    });

    const ordersByStatusAgg = await Order.aggregate([
      { $group: { _id: "$status", value: { $sum: 1 } } }
    ]);
    const ordersByStatus = ordersByStatusAgg.map(x => ({ name: x._id, value: x.value }));

    const categoryDataAgg = await Product.aggregate([
      { $group: { _id: "$category", value: { $sum: 1 } } }
    ]);
    const categoryData = categoryDataAgg.map(x => ({ name: x._id, value: x.value }));

    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5).select("_id createdAt status totalPrice").lean();

    const responseData = {
      totalRevenue: totalRevenue.toFixed(2),
      totalDeliveredOrders,
      chartData: last7DaysData,
      topProducts,
      pricingChanges,
      revenueByMonth,
      ordersByStatus,
      categoryData,
      recentOrders
    };

    cache.dashboard = { data: responseData, timestamp: Date.now() };
    res.status(200).json(responseData);
  } catch (error) {
    console.error("[SYSTEM] dashboard-stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/system/trigger-agent
// @desc    Manually trigger a specific AI agent (for demo/testing)
// ─────────────────────────────────────────────────────────────────────────────
router.post("/trigger-agent", async (req, res) => {
  try {
    const { agent } = req.body;
    const queueMap = {
      stock: stockQueue,
      order: orderQueue,
      pricing: pricingQueue,
      report: reportQueue
    };

    const queue = queueMap[agent];
    if (!queue) {
      return res.status(400).json({
        error: `Unknown agent: '${agent}'. Valid agents: ${Object.keys(queueMap).join(", ")}`
      });
    }

    await queue.add({}, { jobId: `manual-${agent}-${Date.now()}` });

    await AILog.create({
      agentName: `${agent.charAt(0).toUpperCase() + agent.slice(1)}Agent`,
      actionType: "MANUAL_TRIGGER",
      reason: "Manually triggered via admin dashboard.",
      status: "success"
    });

    console.log(`[SYSTEM] 🔧 Agent '${agent}' manually triggered.`);
    res.status(200).json({ message: `Agent '${agent}' triggered successfully.`, timestamp: new Date() });
  } catch (error) {
    console.error("[SYSTEM] trigger-agent error:", error);
    res.status(500).json({ error: "Failed to trigger agent" });
  }
});

module.exports = router;
