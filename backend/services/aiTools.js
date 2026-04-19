const Product = require("../models/Product");
const Order = require("../models/Order");

/**
 * Shared Tool Execution Handler 
 * Executes autonomous actions dictated by the AI agents.
 */
const executeTool = async (actionConfig) => {
  const { tool, parameters } = actionConfig;

  try {
    switch (tool) {
      case "fetchSalesData": {
        const days = parameters.days || 7;
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - days);
        const orders = await Order.find({ status: "delivered", deliveredAt: { $gte: limitDate } }).lean();
        return { 
          status: "success", 
          totalOrders: orders.length, 
          revenue: orders.reduce((sum, o) => sum + o.totalPrice, 0) 
        };
      }

      case "updatePrice": {
        if (!parameters.productId || !parameters.newPrice) throw new Error("Missing parameters");
        await Product.findByIdAndUpdate(parameters.productId, { price: parameters.newPrice, lastUpdated: new Date() });
        return { status: "success", updated: true, newPrice: parameters.newPrice };
      }

      case "getLowStockProducts": {
        const threshold = parameters.threshold || 100;
        const products = await Product.find({ countInStock: { $lt: threshold } }).select("name countInStock salesLast7Days category _id").lean();
        return { status: "success", itemsAnalyzed: products.length, products };
      }

      case "updateStock": {
         if (!parameters.productId || parameters.newStock === undefined) throw new Error("Missing parameters");
         await Product.findByIdAndUpdate(parameters.productId, { countInStock: parameters.newStock });
         return { status: "success", updated: true, newStock: parameters.newStock };
      }

      case "sendEmail": {
        // Mock internal implementation for logging actions natively without circular dependencies
        return { status: "success", emailTriggered: true, template: parameters.template };
      }

      case "generateReportData": {
        return { status: "success", aggregated: true, chartsGenerated: 2 };
      }

      default:
        return { status: "error", message: `Unrecognized tool: ${tool}` };
    }
  } catch (error) {
    return { status: "failed", error: error.message };
  }
};

module.exports = { executeTool };
