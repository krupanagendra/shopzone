const Order = require("../../models/Order");
const AILog = require("../../models/AI_Log");
const { emailQueue, orderQueue } = require("../../queues");

console.log("[AGENT] Order Lifecycle Agent subscribed to the queue.");

/**
 * Strict Order Lifecycle Agent
 * Enforces: Processing -> (24h) -> Shipped -> (24h) -> Delivered
 */
orderQueue.process(async (job) => {
  const startTime = Date.now();
  console.log(`[AGENT-START] Order Agent processing lifecycle at ${new Date().toISOString()}`);

  try {
    const orders = await Order.find({
      status: { $in: ["processing", "shipped"] },
      isDelivered: { $ne: true }
    }).populate('user', 'name email');

    let shipped = 0, delivered = 0;
    const isDemo = process.env.DEMO_MODE === "true";
    const threshold = isDemo ? 0.033 : 24; // 2 min for demo, 24h for prod

    for (let order of orders) {
      const now = new Date();

      // ── 1. Processing → Shipped (Min 24h since Created) ──────────────────
      if (order.status === "processing") {
        const createdAt = new Date(order.createdAt);
        const hoursPassed = Math.abs(now - createdAt) / 36e5;

        if (hoursPassed >= threshold) {
          order.status = "shipped";
          order.shippedAt = now;

          // Dispatch Customer Email
          if (!order.emailSentShipped && order.user?.email) {
            emailQueue.add({
              type: "order-shipped",
              to: order.user.email,
              subject: "📦 Your ShopZone Order has Shipped!",
              order: { _id: order._id, items: order.items, totalPrice: order.totalPrice, user: { name: order.user.name } }
            });
            order.emailSentShipped = true;
          }

          await order.save();
          await AILog.create({
            agentName: "OrderLifecycleAgent",
            actionType: "STATUS_CHANGE",
            entityId: order._id,
            onModel: "Order",
            oldValue: "processing",
            newValue: "shipped",
            reason: `Strict ${threshold}h processing window completed.`,
            status: "success",
          });
          shipped++;
        }
      }

      // ── 2. Shipped → Delivered (Min 24h since Shipped) ────────────────────
      else if (order.status === "shipped") {
        const shippedAt = new Date(order.shippedAt || order.updatedAt);
        const hoursPassed = Math.abs(now - shippedAt) / 36e5;

        if (hoursPassed >= threshold) {
          order.status = "delivered";
          order.deliveredAt = now;
          order.isDelivered = true;

          // Dispatch Customer Email
          if (!order.emailSentDelivered && order.user?.email) {
            emailQueue.add({
              type: "order-delivered",
              to: order.user.email,
              subject: "🎉 Your Order has arrived!",
              order: { _id: order._id, items: order.items, totalPrice: order.totalPrice, user: { name: order.user.name } }
            });
            order.emailSentDelivered = true;
          }

          await order.save();
          await AILog.create({
            agentName: "OrderLifecycleAgent",
            actionType: "STATUS_CHANGE",
            entityId: order._id,
            onModel: "Order",
            oldValue: "shipped",
            newValue: "delivered",
            reason: `Strict ${threshold}h transit window completed.`,
            status: "success",
          });
          delivered++;
        }
      }
    }

    const execTime = Date.now() - startTime;
    console.log(`[AGENT-END] Order Agent finished. Shipped: ${shipped}, Delivered: ${delivered} in ${execTime}ms`);
  } catch (error) {
    console.error(`[AGENT-ERROR] Order Agent Failed:`, error);
    await AILog.create({
      agentName: "OrderLifecycleAgent",
      actionType: "AGENT_ERROR",
      reason: error.message,
      status: "failure"
    });
    throw error;
  }
});

orderQueue.on("failed", (job, err) => {
  console.log(`Order Job ${job.id} failed: ${err.message}`);
});
