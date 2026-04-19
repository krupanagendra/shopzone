const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");

exports.getStats = async (req, res) => {
  try {
    // Use aggregation pipeline for revenue — avoid loading all orders into memory
    const [totalUsers, totalOrders, totalProducts, revenueAgg] = await Promise.all([
      User.countDocuments(),
      Order.countDocuments(),
      Product.countDocuments(),
      Order.aggregate([
        { $match: { isPaid: true } },
        { $group: { _id: null, revenue: { $sum: "$totalPrice" } } }
      ])
    ]);
    const revenue = revenueAgg[0]?.revenue || 0;
    res.json({ totalUsers, totalOrders, totalProducts, revenue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").lean();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.role = req.body.role;
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
