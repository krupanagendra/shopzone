/**
 * OmniKart Prime Membership — Backend Routes
 * Amazon-style eligibility criteria:
 *   Tier 1 (Silver): 2+ orders OR ₹5,000+ total spend
 *   Tier 2 (Gold):   5+ orders OR ₹15,000+ total spend
 *   Tier 3 (Platinum): 10+ orders OR ₹30,000+ total spend
 */
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Order = require("../models/Order");
const { protect } = require("../middleware/auth");

// ── Tier definitions (Amazon-style) ──────────────────────────────────────────
const TIERS = {
    silver: {
        name: "Silver",
        icon: "🥈",
        color: "#94a3b8",
        minOrders: 2,
        minSpend: 5000,
        discountPercent: 5,
        benefits: [
            "Free standard delivery on all orders",
            "5% discount on every order",
            "30-day hassle-free returns",
            "Priority customer support",
        ],
    },
    gold: {
        name: "Gold",
        icon: "🥇",
        color: "#f59e0b",
        minOrders: 5,
        minSpend: 15000,
        discountPercent: 10,
        benefits: [
            "Free express delivery (1-2 days)",
            "10% discount on every order",
            "Early access to sales & new arrivals",
            "Free returns within 30 days",
            "Dedicated Gold support line",
            "Monthly exclusive coupon",
        ],
    },
    platinum: {
        name: "Platinum",
        icon: "💎",
        color: "#a855f7",
        minOrders: 10,
        minSpend: 30000,
        discountPercent: 15,
        benefits: [
            "Free same-day delivery (select cities)",
            "15% discount on every order",
            "First access to flash deals",
            "Free returns, always",
            "Dedicated Platinum concierge",
            "Surprise gift on birthday month",
            "Exclusive Platinum-only products",
        ],
    },
};

// ── Helper: calculate eligibility & current tier ─────────────────────────────
const calculateEligibility = async (userId) => {
    const orders = await Order.find({ user: userId, status: { $ne: 'cancelled' } }).lean();
    const totalOrders = orders.length;
    const totalSpend = orders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);

    // Determine highest eligible tier
    let eligibleTier = null;
    if (totalOrders >= TIERS.platinum.minOrders || totalSpend >= TIERS.platinum.minSpend) {
        eligibleTier = "platinum";
    } else if (totalOrders >= TIERS.gold.minOrders || totalSpend >= TIERS.gold.minSpend) {
        eligibleTier = "gold";
    } else if (totalOrders >= TIERS.silver.minOrders || totalSpend >= TIERS.silver.minSpend) {
        eligibleTier = "silver";
    }

    // Progress toward next tier
    const nextTierKey = eligibleTier === "platinum" ? null
        : eligibleTier === "gold" ? "platinum"
            : eligibleTier === "silver" ? "gold"
                : "silver";

    let progress = null;
    if (nextTierKey) {
        const next = TIERS[nextTierKey];
        const ordersNeeded = Math.max(0, next.minOrders - totalOrders);
        const spendNeeded = Math.max(0, next.minSpend - totalSpend);
        const ordersPct = Math.min(100, Math.round((totalOrders / next.minOrders) * 100));
        const spendPct = Math.min(100, Math.round((totalSpend / next.minSpend) * 100));
        progress = {
            nextTier: nextTierKey,
            nextTierName: next.name,
            nextTierIcon: next.icon,
            ordersNeeded,
            spendNeeded: Math.round(spendNeeded),
            ordersPct,
            spendPct,
            totalOrders,
            totalSpend: Math.round(totalSpend),
        };
    }

    return { eligibleTier, totalOrders, totalSpend: Math.round(totalSpend), progress };
};

// ── GET /api/prime/status ─────────────────────────────────────────────────────
router.get("/status", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).lean();
        const { eligibleTier, totalOrders, totalSpend, progress } = await calculateEligibility(req.user._id);

        res.json({
            isPremium: user.isPremium || false,
            primeTier: user.primeTier || null,
            premiumSince: user.premiumSince || null,
            tierDetails: user.primeTier ? TIERS[user.primeTier] : null,
            eligibleTier,      // what they can upgrade TO
            totalOrders,
            totalSpend,
            progress,
            tiers: TIERS,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ── POST /api/prime/activate ──────────────────────────────────────────────────
router.post("/activate", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const { eligibleTier, totalOrders, totalSpend } = await calculateEligibility(req.user._id);

        // Not eligible at all
        if (!eligibleTier) {
            const silver = TIERS.silver;
            return res.status(400).json({
                message: "Not eligible yet",
                reason: `You need at least ${silver.minOrders} paid orders OR ₹${silver.minSpend.toLocaleString("en-IN")} total spend to unlock Prime.`,
                progress: {
                    totalOrders,
                    totalSpend,
                    ordersNeeded: Math.max(0, silver.minOrders - totalOrders),
                    spendNeeded: Math.max(0, silver.minSpend - totalSpend),
                },
            });
        }

        // Already on same or higher tier
        const tierRank = { silver: 1, gold: 2, platinum: 3 };
        if (user.isPremium && tierRank[user.primeTier] >= tierRank[eligibleTier]) {
            return res.status(400).json({
                message: `You are already a ${TIERS[user.primeTier].name} Prime member! Keep ordering to unlock the next tier.`,
            });
        }

        const isUpgrade = user.isPremium && tierRank[eligibleTier] > tierRank[user.primeTier];
        const prevTier = user.primeTier;

        user.isPremium = true;
        user.primeTier = eligibleTier;
        user.premiumSince = user.premiumSince || new Date();
        await user.save();

        const tier = TIERS[eligibleTier];
        res.json({
            success: true,
            isUpgrade,
            prevTier,
            primeTier: eligibleTier,
            tierDetails: tier,
            premiumSince: user.premiumSince,
            message: isUpgrade
                ? `🎉 Upgraded to ${tier.icon} ${tier.name} Prime! You now get ${tier.discountPercent}% off all orders.`
                : `🎉 Welcome to ${tier.icon} ${tier.name} Prime! Enjoy ${tier.discountPercent}% off all your orders.`,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ── GET /api/prime/eligibility  — check without activating ───────────────────
router.get("/eligibility", protect, async (req, res) => {
    try {
        const { eligibleTier, totalOrders, totalSpend, progress } = await calculateEligibility(req.user._id);
        res.json({ eligibleTier, totalOrders, totalSpend, progress, tiers: TIERS });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ── GET /api/prime/savings ────────────────────────────────────────────────────
router.get("/savings", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).lean();
        if (!user.isPremium) return res.json({ savings: 0, ordersCount: 0 });

        const tier = TIERS[user.primeTier] || TIERS.silver;
        const orders = await Order.find({ user: req.user._id, createdAt: { $gte: user.premiumSince }, status: { $ne: 'cancelled' } }).lean();
        const discountSavings = orders.reduce((s, o) => s + o.totalPrice * (tier.discountPercent / 100), 0);
        const shippingSavings = orders.length * 840;

        res.json({
            savings: Math.round(discountSavings + shippingSavings),
            ordersCount: orders.length,
            memberSince: user.premiumSince,
            tier: user.primeTier,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;