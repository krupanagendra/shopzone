import { useState, useRef, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { FaLock, FaGamepad, FaDice, FaUsers, FaMoneyBillWave, FaLink, FaCopy, FaGift } from "react-icons/fa";

const API = import.meta.env.VITE_API_URL;

const getToken = () => {
    try { return JSON.parse(localStorage.getItem("userInfo") || "{}").token || ""; }
    catch { return ""; }
};

const authH = () => ({
    "Content-Type": "application/json",
    Authorization: "Bearer " + getToken(),
});

// ── Canvas Scratch Card ───────────────────────────────────────────────────────
const ScratchCanvas = ({ onScratched, prize }) => {
    const canvasRef = useRef(null);
    const isDrawing = useRef(false);
    const scratched = useRef(false);
    const [revealed, setRevealed] = useState(false);
    const [pct, setPct] = useState(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const W = canvas.width = 280;
        const H = canvas.height = 160;

        // Silver scratch surface
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, "#c0c0c0");
        grad.addColorStop(0.5, "#e8e8e8");
        grad.addColorStop(1, "#a8a8a8");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Pattern overlay
        ctx.fillStyle = "rgba(0,0,0,0.05)";
        for (let i = 0; i < W; i += 20) {
            for (let j = 0; j < H; j += 20) {
                ctx.fillRect(i, j, 10, 10);
            }
        }

        // Scratch text instruction
        ctx.fillStyle = "#666";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.fillText("🪙 Scratch Here!", W / 2, H / 2 - 8);
        ctx.font = "12px Arial";
        ctx.fillStyle = "#888";
        ctx.fillText("Rub to reveal your prize", W / 2, H / 2 + 14);
    }, []);

    const getPos = (e, canvas) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        if (e.touches) {
            return {
                x: (e.touches[0].clientX - rect.left) * scaleX,
                y: (e.touches[0].clientY - rect.top) * scaleY,
            };
        }
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    };

    const scratch = useCallback((e) => {
        if (!isDrawing.current || revealed) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const pos = getPos(e, canvas);

        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 22, 0, Math.PI * 2);
        ctx.fill();

        // Check % revealed
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        let transparent = 0;
        for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] < 128) transparent++;
        }
        const percent = Math.round((transparent / (pixels.length / 4)) * 100);
        setPct(percent);

        if (percent > 45 && !scratched.current) {
            scratched.current = true;
            setRevealed(true);
            // Clear entirely for clean look
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            onScratched();
        }
    }, [revealed, onScratched]);

    return (
        <div className="relative select-none" style={{ width: 280, height: 160 }}>
            {/* Prize underneath */}
            <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center"
                style={{ background: prize?.color || "#22c55e" }}>
                <p className="text-white text-5xl font-black">{prize?.label || "???"}</p>
                <p className="text-white text-sm mt-1 opacity-90">Use code: <strong>{prize?.code}</strong></p>
            </div>
            {/* Scratch overlay */}
            {!revealed && (
                <canvas ref={canvasRef}
                    className="absolute inset-0 rounded-2xl cursor-crosshair touch-none"
                    style={{ width: 280, height: 160 }}
                    onMouseDown={e => { isDrawing.current = true; scratch(e); }}
                    onMouseMove={e => { if (isDrawing.current) scratch(e); }}
                    onMouseUp={() => { isDrawing.current = false; }}
                    onMouseLeave={() => { isDrawing.current = false; }}
                    onTouchStart={e => { isDrawing.current = true; scratch(e); }}
                    onTouchMove={e => scratch(e)}
                    onTouchEnd={() => { isDrawing.current = false; }}
                />
            )}
            {/* Progress hint */}
            {!revealed && pct > 0 && pct < 45 && (
                <div className="absolute bottom-2 left-0 right-0 text-center">
                    <span className="text-xs text-gray-600 bg-white bg-opacity-70 px-2 py-0.5 rounded-full">
                        {pct}% scratched — keep going!
                    </span>
                </div>
            )}
        </div>
    );
};

// ── Main ScratchCard Page ─────────────────────────────────────────────────────
export default function ScratchCardPage() {
    const { userInfo } = useSelector(s => s.auth);
    const [loading, setLoading] = useState(true);
    const [scratching, setScratching] = useState(false);
    const [status, setStatus] = useState(null);   // {used, coupon, discount}
    const [prize, setPrize] = useState(null);   // revealed prize
    const [showResult, setShowResult] = useState(false);
    const [copied, setCopied] = useState(false);

    // Referral state
    const [refData, setRefData] = useState(null);
    const [refCode, setRefCode] = useState("");
    const [applyingRef, setApplyingRef] = useState(false);
    const [tab, setTab] = useState("scratch");

    useEffect(() => {
        if (!userInfo) return;
        loadData();
    }, [userInfo]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [r1, r2] = await Promise.all([
                fetch(API + "/api/gamification/scratch-status", { headers: authH() }),
                fetch(API + "/api/gamification/referral", { headers: authH() }),
            ]);
            const d1 = await r1.json();
            const d2 = await r2.json();
            setStatus(d1);
            setRefData(d2);
            if (d1.used && d1.coupon) {
                setPrize({ label: d1.discount + "% OFF", code: d1.coupon, color: "#22c55e" });
                setShowResult(true);
            }
        } catch { toast.error("Failed to load. Is backend running?"); }
        finally { setLoading(false); }
    };

    const handleScratched = async () => {
        setScratching(true);
        try {
            const r = await fetch(API + "/api/gamification/scratch", { method: "POST", headers: authH() });
            const data = await r.json();
            if (!r.ok) { toast.error(data.message); return; }
            setPrize({ label: data.label, code: data.coupon, color: data.color, discount: data.discount });
            setShowResult(true);
            setStatus({ used: true, coupon: data.coupon, discount: data.discount });
            toast.success(data.message);
        } catch { toast.error("Failed to reveal. Try again."); }
        finally { setScratching(false); }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(prize?.code || status?.coupon || "");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Coupon code copied!");
    };

    const copyRefLink = () => {
        navigator.clipboard.writeText(refData?.shareLink || "");
        toast.success("Referral link copied! Share with friends.");
    };

    const applyReferral = async () => {
        if (!refCode.trim()) return;
        setApplyingRef(true);
        try {
            const r = await fetch(API + "/api/gamification/apply-referral", {
                method: "POST", headers: authH(), body: JSON.stringify({ code: refCode.trim() }),
            });
            const data = await r.json();
            if (!r.ok) { toast.error(data.message); }
            else { toast.success(data.message); setRefCode(""); loadData(); }
        } catch { toast.error("Failed to apply referral."); }
        finally { setApplyingRef(false); }
    };

    if (!userInfo) return (
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
            <FaLock className="text-5xl mb-4 text-gray-400" />
            <p className="text-xl font-bold text-gray-700 mb-4">Sign in to access rewards</p>
            <a href="/login" className="bg-amazon-yellow text-black font-bold px-8 py-3 rounded-xl">Sign In</a>
        </div>
    );

    if (loading) return (
        <div className="max-w-2xl mx-auto px-4 py-8 animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-1/2 mx-auto" />
            <div className="h-64 bg-gray-200 rounded-2xl" />
            <div className="h-32 bg-gray-200 rounded-2xl" />
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-black text-gray-900 text-center mb-2 flex items-center justify-center gap-2"><FaGamepad /> Rewards Center</h1>
            <p className="text-gray-500 text-center text-sm mb-6">Scratch cards, referral bonuses & exclusive coupons</p>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                {[["scratch", "Scratch Card"], ["referral", "Referral Program"]].map(([k, label]) => (
                    <button key={k} onClick={() => setTab(k)}
                        className={"flex-1 py-3 text-sm font-bold transition-colors " +
                            (tab === k ? "text-amazon-blue border-b-2 border-amazon-blue" : "text-gray-500 hover:text-gray-700")}>
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Scratch Card Tab ── */}
            {tab === "scratch" && (
                <div className="space-y-5">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                        <h2 className="font-black text-xl mb-1 flex items-center justify-center gap-2"><FaDice /> Lucky Scratch Card</h2>
                        <p className="text-gray-500 text-sm mb-6">
                            {status?.used ? "You have already revealed your prize!" : "Every new member gets ONE scratch card. Scratch to reveal your discount!"}
                        </p>

                        {/* Scratch card */}
                        <div className="flex justify-center mb-6">
                            {status?.used && showResult ? (
                                // Already revealed — show prize
                                <div className="rounded-2xl flex flex-col items-center justify-center p-8"
                                    style={{ width: 280, height: 160, background: prize?.color || "#22c55e" }}>
                                    <p className="text-white text-5xl font-black">{prize?.label || (status.discount + "% OFF")}</p>
                                    <p className="text-white text-sm mt-1 opacity-90">Code: <strong>{prize?.code || status.coupon}</strong></p>
                                </div>
                            ) : (
                                <ScratchCanvas prize={prize} onScratched={handleScratched} />
                            )}
                        </div>

                        {/* Result */}
                        {showResult && (status?.coupon || prize?.code) && (
                            <div className="space-y-3">
                                <p className="text-green-600 font-bold text-lg">
                                    You won {status?.discount || prize?.discount}% OFF!
                                </p>
                                <div className="flex items-center justify-center gap-3">
                                    <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl px-6 py-3">
                                        <p className="font-black text-xl text-gray-800 tracking-widest">
                                            {prize?.code || status?.coupon}
                                        </p>
                                    </div>
                                    <button onClick={copyCode}
                                        className={"px-4 py-3 rounded-xl font-bold text-sm transition-all " +
                                            (copied ? "bg-green-500 text-white" : "bg-amazon-yellow hover:bg-amazon-orange text-black")}>
                                        {copied ? "✓ Copied!" : "Copy"}
                                    </button>
                                </div>
                                <p className="text-gray-500 text-xs">Use this code at checkout to get your discount</p>
                            </div>
                        )}

                        {scratching && (
                            <p className="text-gray-500 text-sm animate-pulse">Revealing your prize...</p>
                        )}
                    </div>

                    {/* How it works */}
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                        <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-1"><FaDice /> Possible Prizes</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { label: "5% OFF", prob: "35%" },
                                { label: "10% OFF", prob: "30%" },
                                { label: "15% OFF", prob: "20%" },
                                { label: "20% OFF", prob: "10%" },
                                { label: "25% OFF", prob: "4%" },
                                { label: "50% OFF", prob: "1%" },
                            ].map(({ label, prob }) => (
                                <div key={label} className="bg-white rounded-xl p-2 text-center border border-amber-100">
                                    <p className="font-black text-gray-800 text-sm">{label}</p>
                                    <p className="text-xs text-gray-400">{prob} chance</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Referral Tab ── */}
            {tab === "referral" && refData && (
                <div className="space-y-5">

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { Icon: FaUsers, val: refData.count, label: "Friends Referred" },
                            { Icon: FaMoneyBillWave, val: "₹" + (refData.credits || 0).toLocaleString("en-IN"), label: "Credits Earned" },
                        ].map(({ Icon, val, label }) => (
                            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
                                <Icon className="text-3xl mb-1 mx-auto text-gray-600" />
                                <p className="font-black text-xl text-gray-900">{val}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Your referral code */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="font-bold text-lg mb-1 flex items-center gap-1"><FaLink /> Your Referral Code</h3>
                        <p className="text-gray-500 text-sm mb-4">
                            Share this code with friends. You earn <strong>₹500 credits</strong> for every friend who joins. They get <strong>10% off</strong> their first order!
                        </p>
                        <div className="flex gap-3 mb-4">
                            <div className="flex-1 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl px-4 py-3 text-center">
                                <p className="font-black text-2xl text-gray-800 tracking-widest">{refData.code}</p>
                            </div>
                            <button onClick={copyRefLink}
                                className="bg-amazon-yellow hover:bg-amazon-orange text-black font-bold px-4 rounded-xl transition-colors text-sm">
                                <FaCopy className="inline" /> Copy Link
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-2 break-all">{refData.shareLink}</p>
                    </div>

                    {/* Apply referral code */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="font-bold text-lg mb-1 flex items-center gap-1"><FaGift /> Have a Referral Code?</h3>
                        <p className="text-gray-500 text-sm mb-4">Enter a friend's code to get 10% off your first order!</p>
                        <div className="flex gap-3">
                            <input type="text" value={refCode}
                                onChange={e => setRefCode(e.target.value.toUpperCase())}
                                placeholder="Enter referral code"
                                className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-amazon-yellow uppercase" />
                            <button onClick={applyReferral} disabled={applyingRef || !refCode.trim()}
                                className="bg-amazon-yellow hover:bg-amazon-orange text-black font-bold px-5 rounded-xl transition-colors disabled:opacity-50 text-sm">
                                {applyingRef ? "Applying..." : "Apply"}
                            </button>
                        </div>
                    </div>

                    {/* Referred users list */}
                    {refData.referredUsers?.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-1"><FaUsers /> Friends You Referred ({refData.count})</h3>
                            <div className="space-y-2">
                                {refData.referredUsers.map((u, i) => (
                                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-amazon-blue flex items-center justify-center text-white text-xs font-bold">
                                                {u.name[0].toUpperCase()}
                                            </div>
                                            <span className="text-sm font-medium text-gray-800">{u.name}</span>
                                        </div>
                                        <span className="text-xs text-gray-400">
                                            {new Date(u.joinedAt).toLocaleDateString("en-IN")}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
