const Queue = require("bull");

// ─── Redis connection options ──────────────────────────────────────────
// Bull uses ioredis under the hood. We configure it to retry with long
// backoff so it doesn't flood the console, and we ensure errors are
// always caught (Bull crashes the process on uncaught ioredis errors).

const createRedisConfig = () => {
  if (process.env.REDIS_URL) return process.env.REDIS_URL;
  return {
    host: "127.0.0.1",
    port: 6379,
    maxRetriesPerRequest: null,       // Bull requires null for blocking cmds
    enableReadyCheck: false,
    lazyConnect: true,                // Don't connect until first command
    retryStrategy(times) {
      // Exponential backoff: 1s → 2s → 4s → … capped at 60s
      return Math.min(times * 1000, 60_000);
    },
  };
};

const queueOptions = {
  redis: createRedisConfig(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 50,
    removeOnFail: 20,
  },
  // Bull creates multiple ioredis clients; handle their errors so they
  // don't surface as uncaught exceptions / unhandled rejections.
  createClient(type) {
    const Redis = require("ioredis");
    const cfg = createRedisConfig();
    
    // Bull requires maxRetriesPerRequest to be null and enableReadyCheck to be false
    // for its internal clients. When using a URL string, ioredis defaults these
    // in a way that crashes Bull.
    if (typeof cfg === "string") {
      return new Redis(cfg, { 
        maxRetriesPerRequest: null, 
        enableReadyCheck: false 
      });
    }
    return new Redis(cfg);
  },
};

// ─── Track queue health ────────────────────────────────────────────────
let redisConnected = false;
const errorLogged = {};

const emailQueue   = new Queue("emailQueue",   queueOptions);
const reportQueue  = new Queue("reportQueue",  queueOptions);
const pricingQueue = new Queue("pricingQueue", queueOptions);
const orderQueue   = new Queue("orderQueue",   queueOptions);
const stockQueue   = new Queue("stockQueue",   queueOptions);

const allQueues  = [emailQueue, reportQueue, pricingQueue, orderQueue, stockQueue];
const queueNames = ["emailQueue", "reportQueue", "pricingQueue", "orderQueue", "stockQueue"];

// ─── Per-queue event wiring ────────────────────────────────────────────
allQueues.forEach((q, i) => {
  const name = queueNames[i];

  q.on("error", (err) => {
    // Log each error message at most once per queue to avoid spam
    const key = `${name}:${err.code || err.message}`;
    if (errorLogged[key]) return;
    errorLogged[key] = true;
    // Only print once, not hundreds of times
    if (!redisConnected) return;
    console.warn(`[QUEUE WARN] ${name}: ${err.message}`);
  });

  q.isReady().then(() => {
    if (!redisConnected) {
      console.log("[QUEUE] ✅ Redis connected — All queues operational.");
    }
    redisConnected = true;
  }).catch(() => {});
});

// ─── One-time startup probe ────────────────────────────────────────────
// Give Redis 3 seconds to connect; if it doesn't, print one warning and move on.
const STARTUP_TIMEOUT = 5000;
const startupTimer = setTimeout(() => {
  if (!redisConnected) {
    console.warn("[QUEUE] ⚠️  Redis not available — queue features disabled.");
    console.warn("[QUEUE] 💡 Install Redis or set REDIS_URL to enable queues.");
    console.warn("[QUEUE]    The server will continue to work without queues.\n");
  }
}, STARTUP_TIMEOUT);

// Don't let the timer keep the process alive
if (startupTimer.unref) startupTimer.unref();

module.exports = {
  emailQueue,
  reportQueue,
  pricingQueue,
  orderQueue,
  stockQueue,
  isRedisConnected: () => redisConnected,
};
