const cron = require("node-cron");
const { stockQueue, orderQueue, reportQueue, pricingQueue, isRedisConnected } = require("../queues");

// Lazy-load reportAgent to avoid circular dependency at startup.
// reportAgent requires queues → queues requires nothing upstream, so this is safe.
const getRunDailyReport = () => require("../services/agents/reportAgent").runDailyReport;

// ── Helper: safely enqueue a job, with a direct-call fallback if Redis is down ─
const safeEnqueue = (queue, jobId, directFallback = null) => {
  if (isRedisConnected()) {
    queue.add({}, { jobId }).catch(err => {
      console.warn(`[CRON] ⚠️  Queue enqueue failed for ${jobId}: ${err.message}`);
      if (directFallback) {
        console.log(`[CRON] Falling back to direct execution for ${jobId}`);
        directFallback().catch(e => console.error(`[CRON] Direct fallback error:`, e.message));
      }
    });
  } else {
    // Redis is offline — run the task directly if a fallback is provided
    if (directFallback) {
      console.log(`[CRON] ⚡ Redis unavailable — running ${jobId} directly (no queue)`);
      directFallback().catch(e => console.error(`[CRON] Direct execution error for ${jobId}:`, e.message));
    } else {
      console.warn(`[CRON] ⚠️  Skipping ${jobId}: Redis offline and no direct fallback available.`);
    }
  }
};

const startScheduler = () => {
  const isDemoMode = process.env.DEMO_MODE === "true";

  // IST = UTC+5:30, so all cron expressions are in Asia/Kolkata timezone
  const TZ = "Asia/Kolkata";

  console.log(`[CRON] AI Agents Scheduler Initialized. Timezone: ${TZ}${isDemoMode ? " 🔥 DEMO MODE (2-min intervals)" : ""}`);

  if (isDemoMode) {
    // ══════════════════════════════════════════════════════════════════════
    //  DEMO MODE — All agents run every 2 minutes for live demonstrations
    // ══════════════════════════════════════════════════════════════════════

    cron.schedule("*/2 * * * *", () => {
      const ts = new Date().toLocaleTimeString("en-IN", { timeZone: TZ });
      console.log(`[CRON-DEMO] ⏰ ${ts} — Enqueuing ALL agents (demo mode)`);

      const demoTs = Date.now();
      safeEnqueue(stockQueue,   `demo-stock-${demoTs}`);
      safeEnqueue(orderQueue,   `demo-order-${demoTs}`);
      safeEnqueue(pricingQueue, `demo-pricing-${demoTs}`);

      // Report agent has a direct fallback
      safeEnqueue(reportQueue, `demo-report-${demoTs}`, getRunDailyReport());

    }, { timezone: TZ });

    console.log("[CRON] 📋 Demo schedule: Every 2 minutes for all agents.");

  } else {
    // ══════════════════════════════════════════════════════════════════════
    //  PRODUCTION MODE — Standard IST schedules
    // ══════════════════════════════════════════════════════════════════════

    // Inventory Agent — 10:00 AM and 4:00 PM IST daily
    cron.schedule("0 10,16 * * *", () => {
      const ts = new Date().toLocaleTimeString("en-IN", { timeZone: TZ });
      console.log(`[CRON] ⏰ ${ts} — Enqueuing Stock Agent Task`);
      safeEnqueue(stockQueue, `stock-${new Date().toISOString().slice(0, 13)}`);
    }, { timezone: TZ });

    // Order Lifecycle Agent — Every hour
    cron.schedule("0 * * * *", () => {
      const ts = new Date().toLocaleTimeString("en-IN", { timeZone: TZ });
      console.log(`[CRON] ⏰ ${ts} — Enqueuing Order Agent Task`);
      safeEnqueue(orderQueue, `order-${new Date().toISOString().slice(0, 16)}`);
    }, { timezone: TZ });

    // Daily Report Agent — Every day at 11:45 AM IST
    cron.schedule("45 11 * * *", () => {
      const ts = new Date().toLocaleTimeString("en-IN", { timeZone: TZ });
      console.log(`[CRON] ⏰ ${ts} — Enqueuing Daily Report Agent Task`);
      safeEnqueue(reportQueue, `report-${new Date().toISOString().slice(0, 10)}`, getRunDailyReport());
    }, { timezone: TZ });

    // Dynamic Pricing & Offer Agent — Midnight IST daily
    cron.schedule("0 0 * * *", () => {
      const ts = new Date().toLocaleTimeString("en-IN", { timeZone: TZ });
      console.log(`[CRON] ⏰ ${ts} — Enqueuing Pricing Agent Task`);
      safeEnqueue(pricingQueue, `pricing-${new Date().toISOString().slice(0, 10)}`);
    }, { timezone: TZ });

    console.log("[CRON] 📋 Production schedule (Asia/Kolkata): Stock(10AM,4PM), Orders(hourly), Report(11:45AM IST), Pricing(midnight IST)");
  }
};

module.exports = startScheduler;
