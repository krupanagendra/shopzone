import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaAward, FaMedal, FaGem, FaCrown, FaMoneyBillWave, FaBox, FaTag, FaHome, FaTrophy, FaStar, FaClipboardList, FaShoppingBag, FaChartLine, FaBullseye, FaLightbulb, FaArrowUp } from "react-icons/fa";

const API = import.meta.env.VITE_API_URL;

const fmt = (n) => {
    try { return "₹" + Math.round(n || 0).toLocaleString("en-IN"); }
    catch { return "₹0"; }
};

const getToken = () => {
    try { return JSON.parse(localStorage.getItem("userInfo") || "{}").token || ""; }
    catch { return ""; }
};

const TIERS = [
    {
        key: "silver",
        name: "Silver",
        icon: FaMedal,
        minOrders: 2,
        minSpend: 5000,
        discount: 5,
        bg: "#64748b",
        benefits: ["Free standard delivery", "5% off all orders", "30-day returns", "Priority support"],
    },
    {
        key: "gold",
        name: "Gold",
        icon: FaTrophy,
        minOrders: 5,
        minSpend: 15000,
        discount: 10,
        bg: "#d97706",
        benefits: ["Free express delivery (1-2 days)", "10% off all orders", "Early access to deals", "Free returns", "Monthly exclusive coupon"],
    },
    {
        key: "platinum",
        name: "Platinum",
        icon: FaGem,
        minOrders: 10,
        minSpend: 30000,
        discount: 15,
        bg: "#9333ea",
        benefits: ["Free same-day delivery", "15% off all orders", "First access to flash sales", "Free returns always", "Dedicated concierge support", "Birthday month surprise gift"],
    },
];

const Bar = ({ value, max, color }) => {
    const pct = Math.min(100, Math.round((value / max) * 100));
    return (
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="h-2 rounded-full transition-all duration-700"
                style={{ width: pct + "%", background: pct >= 100 ? "#22c55e" : color }} />
        </div>
    );
};

export default function PrimePage() {
    const { userInfo } = useSelector((s) => s.auth);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [activating, setActivating] = useState(false);
    const [tab, setTab] = useState("overview");

    // API data
    const [isPremium, setIsPremium] = useState(false);
    const [primeTier, setPrimeTier] = useState("");
    const [premiumSince, setPremiumSince] = useState("");
    const [eligibleTier, setEligibleTier] = useState("");
    const [totalOrders, setTotalOrders] = useState(0);
    const [totalSpend, setTotalSpend] = useState(0);
    const [savedAmount, setSavedAmount] = useState(0);
    const [primeOrders, setPrimeOrders] = useState(0);

    useEffect(() => {
        if (!userInfo) { navigate("/login"); return; }
        load();
    }, [userInfo]);

    const load = async () => {
        setLoading(true);
        const token = getToken();
        const h = { "Content-Type": "application/json", Authorization: "Bearer " + token };
        try {
            const r1 = await fetch(API + "/api/prime/status", { headers: h });
            const d1 = await r1.json();
            setIsPremium(d1.isPremium || false);
            setPrimeTier(d1.primeTier || "");
            setPremiumSince(d1.premiumSince || "");
            setEligibleTier(d1.eligibleTier || "");
            setTotalOrders(d1.totalOrders || 0);
            setTotalSpend(d1.totalSpend || 0);

            const r2 = await fetch(API + "/api/prime/savings", { headers: h });
            const d2 = await r2.json();
            setSavedAmount(d2.savings || 0);
            setPrimeOrders(d2.ordersCount || 0);
        } catch (e) {
            toast.error("Could not load Prime data. Is backend running?");
        } finally {
            setLoading(false);
        }
    };

    const activate = async () => {
        setActivating(true);
        const token = getToken();
        try {
            const r = await fetch(API + "/api/prime/activate", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
            });
            const d = await r.json();
            if (!r.ok) { toast.error(d.reason || d.message); }
            else { toast.success(d.message); load(); }
        } catch { toast.error("Failed. Try again."); }
        finally { setActivating(false); }
    };

    // helpers
    const currentTierObj = TIERS.find((t) => t.key === primeTier) || null;
    const eligibleTierObj = TIERS.find((t) => t.key === eligibleTier) || null;
    const tierRank = { silver: 1, gold: 2, platinum: 3 };
    const canActivate = eligibleTierObj && (!isPremium || tierRank[eligibleTier] > tierRank[primeTier]);
    const nextTierObj = isPremium
        ? TIERS[TIERS.findIndex((t) => t.key === primeTier) + 1] || null
        : TIERS[0];

    const formatDate = (d) => {
        if (!d) return "";
        try { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }); }
        catch { return ""; }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse space-y-4">
                <div className="h-52 bg-gray-200 rounded-2xl" />
                <div className="grid grid-cols-3 gap-4">
                    {[0, 1, 2].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
                </div>
                <div className="h-8 bg-gray-200 rounded w-1/2" />
                {[0, 1, 2].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl" />)}
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

            {/* ── Hero ── */}
            <div className="rounded-2xl overflow-hidden text-white"
                style={{
                    background: primeTier === "platinum" ? "linear-gradient(135deg,#1a0533,#4a1d96)"
                        : primeTier === "gold" ? "linear-gradient(135deg,#1a1200,#92400e)"
                            : primeTier === "silver" ? "linear-gradient(135deg,#111,#334155)"
                                : "linear-gradient(135deg,#131921,#1a2744)"
                }}>
                <div className="p-8 flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-1">
                        <p className="text-amazon-yellow font-black text-3xl mb-1">
                            {currentTierObj ? <currentTierObj.icon className="inline text-2xl" /> : <FaCrown className="inline text-2xl" />} OmniKart Prime
                        </p>
                        {isPremium && currentTierObj && (
                            <p className="text-gray-300 text-sm mb-3">
                                {currentTierObj.name} Member · Since {formatDate(premiumSince)}
                            </p>
                        )}
                        {!isPremium && (
                            <p className="text-gray-300 text-sm mb-4">
                                Shop more, earn Prime. Place orders to unlock exclusive benefits!
                            </p>
                        )}

                        {canActivate && (
                            <button onClick={activate} disabled={activating}
                                className="bg-amazon-yellow hover:bg-amazon-orange text-black font-black py-2.5 px-7 rounded-xl transition-all hover:scale-105 disabled:opacity-60 text-sm">
                                {activating ? "Processing..." :
                                    tierRank[eligibleTier] > tierRank[primeTier]
                                        ? <><FaArrowUp className="inline" /> Upgrade to {eligibleTierObj.name}</>
                                        : <><FaStar className="inline" /> Activate {eligibleTierObj.name} Prime</>}
                            </button>
                        )}

                        {!canActivate && !isPremium && (
                            <p className="text-gray-400 text-sm">
                                Need {Math.max(0, 2 - totalOrders)} more order(s) or {fmt(Math.max(0, 5000 - totalSpend))} more spend to unlock Silver Prime
                            </p>
                        )}

                        {isPremium && primeTier === "platinum" && (
                            <span className="inline-block bg-amazon-yellow text-black font-bold px-4 py-1.5 rounded-full text-sm">
                                <FaGem className="inline" /> Maximum Tier — You're at the top!
                            </span>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="flex-shrink-0 w-28 h-28 rounded-full border-4 border-amazon-yellow border-opacity-40 bg-white bg-opacity-10 flex flex-col items-center justify-center text-center">
                        <p className="text-xl font-black text-amazon-yellow">{totalOrders}</p>
                        <p className="text-xs text-gray-400">Orders</p>
                        <p className="text-sm font-bold text-white mt-1">{fmt(totalSpend)}</p>
                        <p className="text-xs text-gray-400">Spent</p>
                    </div>
                </div>
            </div>

            {/* ── Savings row ── */}
            {isPremium && (
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { Icon: FaMoneyBillWave, val: fmt(savedAmount), label: "Total Saved" },
                        { Icon: FaBox, val: primeOrders, label: "Prime Orders" },
                        { Icon: FaTag, val: (currentTierObj?.discount || 0) + "% OFF", label: "Your Discount" },
                    ].map(({ Icon, val, label }) => (
                        <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
                            <Icon className="text-2xl mb-1 mx-auto text-gray-600" />
                            <p className="font-black text-lg text-gray-900">{val}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Tabs ── */}
            <div className="flex border-b border-gray-200 gap-1">
                {[["overview", "Overview"], ["tiers", "Tiers & Criteria"], ["benefits", "Benefits"]].map(([k, label]) => (
                    <button key={k} onClick={() => setTab(k)}
                        className={"px-5 py-3 text-sm font-bold transition-colors " +
                            (tab === k ? "text-amazon-blue border-b-2 border-amazon-blue" : "text-gray-500 hover:text-gray-700")}>
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Overview ── */}
            {tab === "overview" && (
                <div className="space-y-5">
                    {/* How it works */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="font-bold text-lg mb-5 flex items-center gap-2"><FaClipboardList /> How Prime Works</h3>
                        <div className="grid sm:grid-cols-3 gap-4">
                            {[
                                { n: "1", Icon: FaShoppingBag, t: "Shop on OmniKart", d: "Place paid orders to build your history" },
                                { n: "2", Icon: FaChartLine, t: "Meet the Criteria", d: "Reach orders OR spend threshold for a tier" },
                                { n: "3", Icon: FaCrown, t: "Claim Your Tier", d: "Come here and activate your Prime badge" },
                            ].map(({ n, Icon, t, d }) => (
                                <div key={n} className="text-center bg-gray-50 rounded-xl p-4">
                                    <div className="w-7 h-7 bg-amazon-yellow text-black font-black text-sm rounded-full flex items-center justify-center mx-auto mb-2">{n}</div>
                                    <Icon className="text-xl mb-1 mx-auto text-gray-600" />
                                    <p className="font-bold text-sm text-gray-800 mb-1">{t}</p>
                                    <p className="text-xs text-gray-500 leading-relaxed">{d}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Progress */}
                    {nextTierObj && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h3 className="font-bold text-lg mb-5">
                                <FaArrowUp className="inline" /> Progress to {nextTierObj.name} Prime
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="text-gray-600">Paid Orders: {totalOrders} / {nextTierObj.minOrders}</span>
                                        <span className={"font-bold " + (totalOrders >= nextTierObj.minOrders ? "text-green-600" : "text-gray-700")}>
                                            {totalOrders >= nextTierObj.minOrders ? "✅ Met!" : (nextTierObj.minOrders - totalOrders) + " more needed"}
                                        </span>
                                    </div>
                                    <Bar value={totalOrders} max={nextTierObj.minOrders} color="#febd69" />
                                </div>
                                <div className="text-center text-xs text-gray-400 font-bold">— OR —</div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="text-gray-600">Total Spend: {fmt(totalSpend)} / {fmt(nextTierObj.minSpend)}</span>
                                        <span className={"font-bold " + (totalSpend >= nextTierObj.minSpend ? "text-green-600" : "text-gray-700")}>
                                            {totalSpend >= nextTierObj.minSpend ? "✅ Met!" : fmt(nextTierObj.minSpend - totalSpend) + " more"}
                                        </span>
                                    </div>
                                    <Bar value={totalSpend} max={nextTierObj.minSpend} color="#60a5fa" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Tiers ── */}
            {tab === "tiers" && (
                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
                        <FaLightbulb className="inline" /> Meet <strong>either</strong> the order count <strong>OR</strong> the spend amount to qualify for each tier.
                    </div>
                    {TIERS.map((tier) => {
                        const active = primeTier === tier.key;
                        const eligible = eligibleTier === tier.key && !active;
                        const oPct = Math.min(100, Math.round((totalOrders / tier.minOrders) * 100));
                        const sPct = Math.min(100, Math.round((totalSpend / tier.minSpend) * 100));
                        return (
                            <div key={tier.key}
                                className={"bg-white rounded-2xl border-2 p-5 " +
                                    (active ? "border-amber-400 shadow-lg" : eligible ? "border-green-400" : "border-gray-200")}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-3xl"><tier.icon className="inline" /></span>
                                        <div>
                                            <span className="font-black text-lg" style={{ color: tier.bg }}>{tier.name}</span>
                                            <span className="text-gray-400 text-sm ml-1">Prime</span>
                                        </div>
                                    </div>
                                    {active && <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">✅ Current</span>}
                                    {eligible && <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"><FaBullseye /> Eligible</span>}
                                </div>
                                <p className="text-sm font-bold mb-4" style={{ color: tier.bg }}>{tier.discount}% OFF + Free delivery</p>
                                <div className="space-y-2">
                                    <div>
                                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                                            <span>Orders: {totalOrders} / {tier.minOrders}</span>
                                            <span className={oPct >= 100 ? "text-green-600 font-bold" : ""}>{oPct >= 100 ? "✓" : oPct + "%"}</span>
                                        </div>
                                        <Bar value={totalOrders} max={tier.minOrders} color="#febd69" />
                                    </div>
                                    <p className="text-center text-xs text-gray-400">— OR —</p>
                                    <div>
                                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                                            <span>Spend: {fmt(totalSpend)} / {fmt(tier.minSpend)}</span>
                                            <span className={sPct >= 100 ? "text-green-600 font-bold" : ""}>{sPct >= 100 ? "✓" : sPct + "%"}</span>
                                        </div>
                                        <Bar value={totalSpend} max={tier.minSpend} color="#60a5fa" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Benefits ── */}
            {tab === "benefits" && (
                <div className="space-y-4">
                    {TIERS.map((tier) => {
                        const active = primeTier === tier.key;
                        return (
                            <div key={tier.key} className={"rounded-2xl overflow-hidden border-2 " + (active ? "border-amber-400" : "border-gray-200")}>
                                <div className="px-6 py-4 flex items-center justify-between text-white"
                                    style={{ background: "linear-gradient(135deg," + tier.bg + "," + tier.bg + "aa)" }}>
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl"><tier.icon className="inline" /></span>
                                        <div>
                                            <p className="font-black text-xl">{tier.name} Prime</p>
                                            <p className="text-white text-opacity-80 text-sm">{tier.discount}% off all orders</p>
                                        </div>
                                    </div>
                                    {active && <span className="bg-white text-green-700 text-xs font-bold px-3 py-1 rounded-full">✅ Your Plan</span>}
                                </div>
                                <div className="bg-white p-5">
                                    <ul className="space-y-2 mb-4">
                                        {tier.benefits.map((b, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm">
                                                <span className={"font-bold flex-shrink-0 " + (active ? "text-green-500" : "text-gray-300")}>✓</span>
                                                <span className={active ? "text-gray-800" : "text-gray-500"}>{b}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="grid grid-cols-2 gap-3 border-t pt-4">
                                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                                            <p className="font-black text-gray-900">{tier.minOrders}+ orders</p>
                                            <p className="text-xs text-gray-500">to qualify</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                                            <p className="font-black text-gray-900">{fmt(tier.minSpend)}+</p>
                                            <p className="text-xs text-gray-500">total spend</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="text-center pt-2">
                <Link to="/products"
                    className="bg-amazon-yellow hover:bg-amazon-orange text-black font-bold py-3 px-10 rounded-xl text-base transition-colors inline-block">
                    {isPremium ? <><FaShoppingBag className="inline" /> Shop & Enjoy Prime Benefits</> : <><FaShoppingBag className="inline" /> Start Shopping to Earn Prime</>}
                </Link>
            </div>
        </div>
    );
}
