/**
 * Gamification Routes — /api/gamification
 * Phase 4: Scratch Card + Referral System
 */
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Order = require("../models/Order");
const { protect } = require("../middleware/auth");

// Possible scratch card prizes (weighted)
const PRIZES = [
    { discount: 5, code: "SCRATCH5", label: "5% OFF", probability: 0.35, color: "#22c55e" },
    { discount: 10, code: "SCRATCH10", label: "10% OFF", probability: 0.30, color: "#3b82f6" },
    { discount: 15, code: "SCRATCH15", label: "15% OFF", probability: 0.20, color: "#a855f7" },
    { discount: 20, code: "SCRATCH20", label: "20% OFF", probability: 0.10, color: "#f59e0b" },
    { discount: 25, code: "SCRATCH25", label: "25% OFF", probability: 0.04, color: "#ef4444" },
    { discount: 50, code: "SCRATCH50", label: "50% OFF", probability: 0.01, color: "#ec4899" },
];

const pickPrize = () => {
    const rand = Math.random();
    let cumulative = 0;
    for (const prize of PRIZES) {
        cumulative += prize.probability;
        if (rand <= cumulative) return prize;
    }
    return PRIZES[0];
};

// ── GET /api/gamification/scratch-status ─────────────────────────────────────
router.get("/scratch-status", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select("scratchCardUsed scratchCoupon scratchDiscount name").lean();
        res.json({
            used: user.scratchCardUsed || false,
            coupon: user.scratchCoupon || null,
            discount: user.scratchDiscount || 0,
        });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── POST /api/gamification/scratch ───────────────────────────────────────────
router.post("/scratch", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user.scratchCardUsed) {
            return res.status(400).json({
                message: "You have already used your scratch card!",
                coupon: user.scratchCoupon,
                discount: user.scratchDiscount,
            });
        }

        // Only allow on first order or new user (within 30 days)
        const daysSinceJoined = (Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24);
        const orderCount = await Order.countDocuments({ user: user._id });
        if (orderCount > 3 && daysSinceJoined > 30) {
            return res.status(400).json({ message: "Scratch card is only for new members within their first 30 days!" });
        }

        const prize = pickPrize();

        user.scratchCardUsed = true;
        user.scratchCoupon = prize.code;
        user.scratchDiscount = prize.discount;
        await user.save();

        res.json({
            success: true,
            discount: prize.discount,
            coupon: prize.code,
            label: prize.label,
            color: prize.color,
            message: `🎉 Congratulations! You won ${prize.label} off your next order! Use code: ${prize.code}`,
        });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── GET /api/gamification/referral ───────────────────────────────────────────
router.get("/referral", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select("referralCode referralCount referralCredits name").lean();

        // Get list of referred users
        const referred = await User.find({ referredBy: req.user._id })
            .select("name createdAt").lean();

        res.json({
            code: user.referralCode,
            count: user.referralCount || 0,
            credits: user.referralCredits || 0,
            referredUsers: referred.map(u => ({ name: u.name, joinedAt: u.createdAt })),
            shareLink: `${process.env.CLIENT_URL || "http://localhost:5173"}/register?ref=${user.referralCode}`,
        });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── POST /api/gamification/apply-referral ────────────────────────────────────
// Called after registration with a referral code
router.post("/apply-referral", protect, async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ message: "Referral code required" });

        const currentUser = await User.findById(req.user._id);
        if (currentUser.referredBy) {
            return res.status(400).json({ message: "You have already used a referral code" });
        }

        // Can't refer yourself
        if (currentUser.referralCode === code.toUpperCase()) {
            return res.status(400).json({ message: "You cannot use your own referral code!" });
        }

        const referrer = await User.findOne({ referralCode: code.toUpperCase() });
        if (!referrer) return res.status(404).json({ message: "Invalid referral code" });

        // Apply benefits
        const REFERRER_CREDIT = 500;  // ₹500 credit for referrer
        const REFEREE_DISCOUNT = 10;   // 10% discount for new user

        currentUser.referredBy = referrer._id;
        currentUser.scratchDiscount = Math.max(currentUser.scratchDiscount, REFEREE_DISCOUNT);
        if (!currentUser.scratchCoupon) {
            currentUser.scratchCoupon = "REF" + code.toUpperCase();
            currentUser.scratchCardUsed = true;
        }
        await currentUser.save();

        referrer.referralCount += 1;
        referrer.referralCredits += REFERRER_CREDIT;
        await referrer.save();

        res.json({
            success: true,
            message: `✅ Referral applied! You get ${REFEREE_DISCOUNT}% off your first order. ${referrer.name} earned ₹${REFERRER_CREDIT} credits!`,
            discountAwarded: REFEREE_DISCOUNT,
            coupon: currentUser.scratchCoupon,
        });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── POST /api/gamification/validate-coupon ───────────────────────────────────
router.post("/validate-coupon", protect, async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ message: "Coupon code required" });

        const user = await User.findById(req.user._id).lean();

        // Check user's personal scratch coupon
        if (user.scratchCoupon && user.scratchCoupon === code.toUpperCase()) {
            return res.json({
                valid: true,
                discount: user.scratchDiscount,
                message: `✅ Coupon valid! ${user.scratchDiscount}% discount applied.`,
                type: "scratch",
            });
        }

        // Check standard SAVE10 coupon
        if (code.toUpperCase() === "SAVE10") {
            return res.json({ valid: true, discount: 10, message: "✅ SAVE10 applied! 10% discount.", type: "standard" });
        }

        return res.status(400).json({ valid: false, message: "Invalid or expired coupon code" });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;