const cron = require("node-cron");
const { stockQueue, orderQueue, reportQueue, pricingQueue } = require("../queues");

const startScheduler = () => {
  const isDemoMode = process.env.DEMO_MODE === "true";

  console.log(`[CRON] AI Agents Scheduler Initialized.${isDemoMode ? " 🔥 DEMO MODE (2-min intervals)" : ""}`);

  if (isDemoMode) {
    // ══════════════════════════════════════════════════════════════════════
    //  DEMO MODE — All agents run every 2 minutes for live demonstrations
    // ══════════════════════════════════════════════════════════════════════

    cron.schedule("*/2 * * * *", () => {
      const ts = new Date().toLocaleTimeString();
      console.log(`[CRON-DEMO] ⏰ ${ts} — Enqueuing ALL agents (demo mode)`);
      stockQueue.add({}, { jobId: `demo-stock-${Date.now()}` });
      orderQueue.add({}, { jobId: `demo-order-${Date.now()}` });
      pricingQueue.add({}, { jobId: `demo-pricing-${Date.now()}` });
      reportQueue.add({}, { jobId: `demo-report-${Date.now()}` });
    });

    console.log("[CRON] 📋 Demo schedule: Every 2 minutes for all agents.");
  } else {
    // ══════════════════════════════════════════════════════════════════════
    //  PRODUCTION MODE — Standard schedules
    // ══════════════════════════════════════════════════════════════════════

    // Inventory Agent — Runs at 10 AM and 4 PM daily
    cron.schedule("0 10,16 * * *", () => {
      console.log("[CRON] Enqueuing Stock Agent Task");
      stockQueue.add({}, { jobId: `stock-${new Date().toISOString().slice(0, 13)}` });
    });

    // Order Lifecycle Agent — Runs every hour
    cron.schedule("0 * * * *", () => {
      console.log("[CRON] Enqueuing Order Agent Task");
      orderQueue.add({}, { jobId: `order-${new Date().toISOString().slice(0, 16)}` });
    });

    // Daily Report Agent — Runs every day at 11 AM
    cron.schedule("0 11 * * *", () => {
      console.log("[CRON] Enqueuing Daily Report Agent Task");
      reportQueue.add({}, { jobId: `report-${new Date().toISOString().slice(0, 10)}` });
    });

    // Dynamic Pricing & Offer Agent — Runs once daily at midnight
    cron.schedule("0 0 * * *", () => {
      console.log("[CRON] Enqueuing Pricing Agent Task");
      pricingQueue.add({}, { jobId: `pricing-${new Date().toISOString().slice(0, 10)}` });
    });

    console.log("[CRON] 📋 Production schedule: Stock(10AM,4PM), Orders(hourly), Report(11AM), Pricing(midnight)");
  }
};

module.exports = startScheduler;
