import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const TIER_ICONS = { silver: "🥈", gold: "🥇", platinum: "💎" };
const TIER_COLORS = {
    silver: "bg-slate-200 text-slate-700 border border-slate-300",
    gold: "bg-amber-100 text-amber-800 border border-amber-300",
    platinum: "bg-purple-100 text-purple-800 border border-purple-300",
};

const PrimeBadge = ({ size = "sm" }) => {
    const { userInfo } = useSelector(s => s.auth);
    const [primeData, setPrimeData] = useState(null);

    useEffect(() => {
        if (!userInfo) return;
        try {
            const { token } = JSON.parse(localStorage.getItem("userInfo") || "{}");
            fetch(`${API}/api/prime/status`, { headers: { Authorization: `Bearer ${token}` } })
                .then(r => r.json())
                .then(d => setPrimeData(d))
                .catch(() => { });
        } catch { }
    }, [userInfo]);

    if (!userInfo) return null;

    const pad = size === "lg" ? "px-3 py-1.5 text-sm" : "px-2 py-0.5 text-xs";
    const base = `inline-flex items-center gap-1 font-black rounded-full leading-none transition-all hover:scale-105 ${pad}`;

    if (primeData?.isPremium && primeData?.primeTier) {
        const tier = primeData.primeTier;
        return (
            <Link to="/prime" className={`${base} ${TIER_COLORS[tier]}`}>
                {TIER_ICONS[tier]} {tier.charAt(0).toUpperCase() + tier.slice(1)} Prime
            </Link>
        );
    }

    // Show eligible but not activated
    if (primeData?.eligibleTier) {
        return (
            <Link to="/prime" className={`${base} bg-amazon-yellow text-black animate-pulse`}>
                👑 Claim Prime!
            </Link>
        );
    }

    return (
        <Link to="/prime" className={`${base} border border-amazon-yellow text-amazon-yellow hover:bg-amazon-yellow hover:text-black`}>
            👑 Get Prime
        </Link>
    );
};

export default PrimeBadge;
