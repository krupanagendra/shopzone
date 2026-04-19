require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler"); 
const startScheduler = require("./cron/scheduler");

connectDB();

// Initialize AI Event Subscriptions
require("./services/agents/emailAgent");
require("./services/agents/reportAgent");
require("./services/agents/pricingAgent");
require("./services/agents/orderAgent");
require("./services/agents/stockAgent");

// Initialize AI Time-Based Scheduler
startScheduler();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Standard API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/wishlist", require("./routes/wishlist"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/chatbot", require("./routes/chatbot"));
app.use("/api/prime", require("./routes/Prime"));
app.use("/api/gamification", require("./routes/gamification"));
app.use("/api/admin-ai", require("./routes/adminAi"));
app.use("/api/system", require("./routes/system"));
app.use("/api/suggestions", require("./routes/suggestions"));

// Core AI Debug and Visibility Router
const debugRouter = require('./routes/debugRouter');
app.use('/api/debug', debugRouter);

// System Health Check
app.get("/", (req, res) => res.json({
  message: "ShopZone AI API Running 🚀",
  mode: process.env.DEMO_MODE === "true" ? "DEMO" : "PRODUCTION",
  timestamp: new Date()
}));

// Route Not Found (404) catch-all handler
app.use("*", (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route Not Found: ${req.originalUrl}`
  });
});

// Final Safety Net: Global Error Handler Must Be The Last Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n══════════════════════════════════════════════════`);
  console.log(`  ShopZone AI Server running on port ${PORT}`);
  console.log(`  Mode: ${process.env.DEMO_MODE === "true" ? "🔥 DEMO" : "🏭 PRODUCTION"}`);
  console.log(`  Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`══════════════════════════════════════════════════\n`);
});

// Graceful Node.js Process Management
const shutdown = (signal) => {
  console.log(`\n[SERVER] ${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log("[SERVER] HTTP server closed.");
    process.exit(0);
  });
  // Force disconnect if active connections hang execution
  setTimeout(() => {
    console.error("[SERVER] Forced shutdown after timeout.");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));