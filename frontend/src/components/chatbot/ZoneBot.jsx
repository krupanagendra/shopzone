import { useState, useRef, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { fetchCart } from "../../redux/slices/cartSlice";
import { fetchWishlist } from "../../redux/slices/wishlistSlice";
import { toast } from "react-toastify";
import { FaRobot, FaTimes, FaBox, FaShoppingCart, FaHeart } from "react-icons/fa";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const QUICK_ACTIONS = [
    { label: "Trending", msg: "Show me trending products" },
    { label: "My Cart", msg: "Show my cart" },
    { label: "Track Order", msg: "Track my order" },
    { label: "Returns", msg: "What is your return policy?" },
    { label: "Shipping", msg: "Tell me about shipping" },
    { label: "Payments", msg: "What payment methods do you accept?" },
    { label: "Coupons", msg: "Do you have any discount coupons?" },
    { label: "Best Sellers", msg: "Show me top rated products" },
];

// Window size presets
const SIZES = {
    minimized: { width: 320, height: 56, label: "Minimized" },
    small: { width: 360, height: 500, label: "Small" },
    normal: { width: 400, height: 620, label: "Normal" },
    large: { width: 520, height: 750, label: "Large" },
    fullscreen: { width: "100vw", height: "100vh", label: "Full" },
};

function getSessionId() {
    const k = "zonebot_sid";
    let id = sessionStorage.getItem(k);
    if (!id) { id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; sessionStorage.setItem(k, id); }
    return id;
}

function authHeaders() {
    try {
        const { token } = JSON.parse(localStorage.getItem("userInfo") || "{}");
        return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    } catch { return { "Content-Type": "application/json" }; }
}

// ── Typing dots ───────────────────────────────────────────────────────────────
function TypingDots() {
    return (
        <div className="flex items-center gap-1 px-4 py-3">
            {[0, 1, 2].map(i => (
                <span key={i} className="w-2 h-2 rounded-full bg-gray-300 inline-block animate-bounce"
                    style={{ animationDelay: `${i * 0.18}s` }} />
            ))}
        </div>
    );
}



// ── Read aloud ────────────────────────────────────────────────────────────────
function SpeakBtn({ text }) {
    const [on, setOn] = useState(false);
    const u = useRef(null);
    const go = () => {
        if (!window.speechSynthesis) return;
        if (on) { window.speechSynthesis.cancel(); setOn(false); return; }
        const clean = text.replace(/\*\*(.*?)\*\*/g, "$1").replace(/[^\x00-\x7F]/g, "").replace(/\n/g, " ").trim();
        const s = new SpeechSynthesisUtterance(clean);
        s.lang = "en-US"; s.rate = 0.95;
        s.onstart = () => setOn(true); s.onend = () => setOn(false); s.onerror = () => setOn(false);
        u.current = s; window.speechSynthesis.speak(s);
    };
    return (
        <button onClick={go} title={on ? "Stop" : "Read aloud"}
            className={`p-1 rounded transition-colors ${on ? "text-blue-500 bg-blue-50" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}>
            {on
                ? <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                : <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" /></svg>}
        </button>
    );
}

// ── Message text renderer ─────────────────────────────────────────────────────
function MsgText({ text }) {
    if (!text) return null;
    return (
        <div className="space-y-1">
            {text.split("\n").map((line, i) => {
                const html = line
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    .replace(/`([^`]+)`/g, "<code class='bg-gray-100 px-1 rounded text-xs font-mono'>$1</code>");
                return <p key={i} className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />;
            })}
        </div>
    );
}

// ── Out of stock badge ────────────────────────────────────────────────────────
function OOSBadge({ productName }) {
    return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 items-start">
            <span className="text-xl flex-shrink-0 text-amber-600 mt-1"><FaBox /></span>
            <div>
                <p className="text-xs font-bold text-amber-800">Out of Stock</p>
                <p className="text-xs text-amber-700 mt-0.5">
                    <strong>{productName}</strong> is currently unavailable.
                    We're restocking it shortly! It's been saved to your wishlist.
                </p>
                <p className="text-xs text-amber-600 mt-1">Here are similar available products 👇</p>
            </div>
        </div>
    );
}

// ── Product card ──────────────────────────────────────────────────────────────
function ProductCard({ product, onCart, onWishlist, size = "normal" }) {
    const small = size === "small" || size === "minimized";
    const fallback = `https://placehold.co/200x110/131921/febd69?text=${encodeURIComponent((product.name || "Product").slice(0, 10))}`;
    const inStock = product.countInStock > 0;

    return (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
            <Link to={`/product/${product._id}`} className="block relative overflow-hidden" style={{ height: small ? 80 : 96 }}>
                <img src={product.image} alt={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onError={e => { e.target.onerror = null; e.target.src = fallback; }} />
                {product.isFeatured && <span className="absolute top-1 left-1 bg-amazon-yellow text-black text-xs font-bold px-1.5 py-0.5 rounded-full">HOT</span>}
                {!inStock && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
                        <span className="text-white text-xs font-bold">Out of Stock</span>
                        <span className="text-amber-300 text-xs">Restocking soon ✨</span>
                    </div>
                )}
                {inStock && product.countInStock <= 5 && (
                    <span className="absolute bottom-1 right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                        Only {product.countInStock} left!
                    </span>
                )}
            </Link>
            <div className="p-2 flex flex-col gap-1 flex-1">
                <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug">{product.name}</p>
                <p className="text-xs text-gray-400">{product.brand}</p>
                <div className="flex items-center gap-0.5">
                    {"★★★★★".split("").map((s, i) => (
                        <span key={i} className={`text-xs ${i < Math.round(product.rating || 0) ? "text-amber-400" : "text-gray-200"}`}>{s}</span>
                    ))}
                    <span className="text-xs text-gray-400 ml-1">({product.rating || 0})</span>
                </div>
                <p className="text-sm font-bold text-gray-900">${product.price}</p>
                <div className="flex gap-1 mt-auto pt-1">
                    {inStock ? (
                        <button onClick={() => onCart(product)}
                            className="flex-1 bg-amazon-yellow hover:bg-amazon-orange text-black text-xs font-bold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1">
                            <FaShoppingCart /> Add to Cart
                        </button>
                    ) : (
                        <button onClick={() => onWishlist(product)}
                            className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-bold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1">
                            <FaHeart /> Save to Wishlist
                        </button>
                    )}
                    {inStock && (
                        <button onClick={() => onWishlist(product)}
                            className="w-8 border border-gray-200 hover:bg-red-50 hover:border-red-300 text-sm rounded-lg transition-colors flex items-center justify-center">
                            ♡
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Compare table ─────────────────────────────────────────────────────────────
function CompareTable({ products }) {
    if (!products?.length || products.length < 2) return null;
    return (
        <div className="mt-2 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
            <table className="w-full text-xs">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="p-2 text-left text-gray-500 font-medium">Feature</th>
                        {products.map(p => (
                            <th key={p._id} className="p-2 text-center">
                                <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded-lg mx-auto mb-1"
                                    onError={e => { e.target.onerror = null; e.target.src = "https://placehold.co/40x40/131921/febd69?text=?"; }} />
                                <span className="font-semibold text-gray-800 line-clamp-2 block">{p.name}</span>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {[["Brand", p => p.brand], ["Price", p => `$${p.price}`], ["Rating", p => `${p.rating}⭐`], ["Stock", p => p.countInStock > 0 ? `✅ ${p.countInStock}` : "❌ Out"]].map(([label, fn], ri) => (
                        <tr key={label} className={ri % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="p-2 font-medium text-gray-500">{label}</td>
                            {products.map(p => <td key={p._id} className="p-2 text-center font-semibold text-gray-800">{fn(p)}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ── Cart widget ───────────────────────────────────────────────────────────────
function CartWidget({ items }) {
    const navigate = useNavigate();
    if (!items) return null;
    if (!items.length) return (
        <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500">Your cart is empty</p>
            <Link to="/products" className="text-xs text-blue-600 hover:underline mt-1 block">Start shopping →</Link>
        </div>
    );
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
    return (
        <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-2"><FaShoppingCart /> Your Cart ({items.length} items)</p>
            <div className="space-y-2 max-h-36 overflow-y-auto">
                {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <img src={item.image} alt={item.name} className="w-9 h-9 object-cover rounded-lg flex-shrink-0"
                            onError={e => { e.target.onerror = null; e.target.src = "https://placehold.co/36x36/131921/febd69?text=?"; }} />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{item.name}</p>
                            <p className="text-xs text-gray-500">×{item.quantity} = ${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="border-t mt-2 pt-2 flex justify-between font-bold text-sm">
                <span>Total</span><span>${total.toFixed(2)}</span>
            </div>
            <button onClick={() => navigate("/checkout")}
                className="mt-2 w-full bg-amazon-yellow hover:bg-amazon-orange text-black text-xs font-bold py-2 rounded-lg transition-colors">
                Checkout →
            </button>
        </div>
    );
}

// ── Order tracking ────────────────────────────────────────────────────────────
function OrderWidget({ orders }) {
    if (!orders?.length) return <div className="bg-gray-50 rounded-xl p-3 text-center text-sm text-gray-500">No recent orders found</div>;
    return (
        <div className="space-y-2">
            {orders.map(o => (
                <div key={o.id} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
                    <div className="flex items-start justify-between mb-1.5">
                        <span className="font-bold text-sm text-gray-800">Order #{o.id}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${o.paid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                            {o.paid ? "✅ Paid" : "⏳ Pending"}
                        </span>
                    </div>
                    <div className="text-xs text-gray-500 space-y-0.5">
                        <p>💰 <span className="font-semibold text-gray-700">${Number(o.total).toFixed(2)}</span> · {o.itemCount} items</p>
                        <p>📅 {new Date(o.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                        <p>{o.delivered ? "✅ Delivered" : "🚚 In transit — Est. 3-5 business days"}</p>
                    </div>
                    <Link to={`/order/${o.fullId}`} className="mt-2 block text-center text-xs text-blue-600 hover:underline font-medium">
                        View Full Order →
                    </Link>
                </div>
            ))}
        </div>
    );
}

// =============================================================================
//  MAIN COMPONENT
// =============================================================================
export default function ZoneBot() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { userInfo } = useSelector(s => s.auth);

    const [open, setOpen] = useState(false);
    const [sizeKey, setSizeKey] = useState("normal");
    const [msgs, setMsgs] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [expanded, setExpanded] = useState({});
    const [unread, setUnread] = useState(0);
    const [showQuick, setShowQuick] = useState(true);
    const [oosProduct, setOosProduct] = useState(null); // out-of-stock product name

    const sessionId = getSessionId();
    const endRef = useRef(null);
    const inputRef = useRef(null);
    const recogRef = useRef(null);
    const sendRef = useRef(null);

    const size = SIZES[sizeKey];
    const isMinimized = sizeKey === "minimized";
    const isFullscreen = sizeKey === "fullscreen";

    // Welcome message
    useEffect(() => {
        if (userInfo && msgs.length === 0) {
            const name = userInfo.name?.split(" ")[0] || "there";
            setMsgs([{
                id: "welcome", role: "bot", time: new Date(),
                text: `Hey **${name}**! I'm **ZoneBot**, your AI shopping assistant.\n\nI can help you:\n**Find products** — "Show me laptops under $1500"\n**Add to cart** — "Add Sony headphones to my cart"\n**Track orders** — "Where is my order?"\n**Compare** — "Compare iPhone vs Samsung"`,
                products: [], suggestions: [],
            }]);
        }
    }, [userInfo]);

    // Auto scroll
    useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

    // Unread badge
    useEffect(() => {
        if (!open) setUnread(msgs.filter(m => m.role === "bot" && m.id !== "welcome").length);
        else setUnread(0);
    }, [msgs, open]);

    // ── Send message ────────────────────────────────────────────────────────────
    const sendMessage = useCallback(async (rawText) => {
        const text = (rawText || input).trim();
        setInput(""); setShowQuick(false); setOosProduct(null);
        setMsgs(prev => [...prev, { id: Date.now(), role: "user", text, time: new Date() }]);
        setLoading(true);

        try {
            // Translate if non-ASCII
            let processedText = text;
            if (!/^[\x00-\x7F]+$/.test(text)) {
                try {
                    const tr = await fetch(`${API_BASE}/api/chatbot/translate`, {
                        method: "POST", headers: authHeaders(), body: JSON.stringify({ text }),
                    });
                    const td = await tr.json();
                    if (td.wasTranslated && td.translated) processedText = td.translated;
                } catch { }
            }

            const res = await fetch(`${API_BASE}/api/chatbot/message`, {
                method: "POST", headers: authHeaders(),
                body: JSON.stringify({ message: processedText, history: history.slice(-8), sessionId }),
            });

            if (!res.ok) {
                const e = await res.json().catch(() => ({}));
                throw new Error(e.message || `Server error ${res.status}`);
            }

            const data = await res.json();

            const botMsg = {
                id: Date.now() + 1, role: "bot", time: new Date(),
                text: data.message || "I'm here to help!",
                products: data.products || [],
                compareProducts: data.compareProducts || null,
                cartItems: data.cartItems,
                orderData: data.orderData,
                suggestions: data.suggestions || [],
                action: data.action,
                oosProductName: data.actionResult?.reason === "out_of_stock" ? data.actionResult.productName : null,
            };

            setMsgs(prev => [...prev, botMsg]);
            setHistory(prev => [
                ...prev,
                { role: "user", content: processedText },
                { role: "assistant", content: data.message || "" },
            ]);

            // Handle action results
            const r = data.actionResult;
            if (r?.success) {
                if (r.type === "cart_added") { toast.success(`"${r.productName}" added to cart!`); dispatch(fetchCart()); }
                if (r.type === "cart_removed") { toast.success(`"${r.productName}" removed from cart!`); dispatch(fetchCart()); }
                if (r.type === "wishlist_added") { toast.success(`"${r.productName}" saved to wishlist!`); dispatch(fetchWishlist()); }
                if (r.type === "already_in_wishlist") toast.info(`"${r.productName}" already in wishlist`);
            }
            if (r?.success === false) {
                if (r.reason === "out_of_stock") {
                    toast.warning(`"${r.productName}" is out of stock — saved to wishlist!`);
                    dispatch(fetchWishlist());
                    setOosProduct(r.productName);
                }
                if (r.reason === "not_in_cart") toast.error("That item isn't in your cart");
            }

            if (data.action === "GO_CHECKOUT") setTimeout(() => navigate("/checkout"), 1200);

        } catch (err) {
            setMsgs(prev => [...prev, {
                id: Date.now() + 2, role: "bot", time: new Date(),
                text: `⚠️ ${err.message}\n\nPlease try again.`,
                products: [], suggestions: ["Try again", "Show products", "Contact support"],
            }]);
        } finally {
            setLoading(false);
            setTimeout(() => inputRef.current?.focus(), 80);
        }
    }, [input, loading, history, sessionId, dispatch, navigate]);

    sendRef.current = sendMessage;

    const onAddCart = useCallback(p => sendRef.current?.(`Add "${p.name}" to my cart`), []);
    const onAddWishlist = useCallback(p => sendRef.current?.(`Add "${p.name}" to my wishlist`), []);



    const cycleSize = () => {
        const keys = Object.keys(SIZES);
        const idx = keys.indexOf(sizeKey);
        setSizeKey(keys[(idx + 1) % keys.length]);
    };

    if (!userInfo) return null;

    // ── Window dimensions ────────────────────────────────────────────────────────
    const winStyle = isFullscreen
        ? { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, borderRadius: 0 }
        : {
            position: "fixed", bottom: "96px", right: "24px", zIndex: 50, width: size.width, height: isMinimized ? size.height : "620px",
            maxHeight: size.height === "100vh" ? "100vh" : size.height
        };

    return (
        <>
            <style>{`
        @keyframes zbOpen  { from{opacity:0;transform:translateY(16px) scale(.94)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes zbMsg   { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes zbWave  { from{transform:scaleY(.3)} to{transform:scaleY(1)} }
        @keyframes zbBlink { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes zbPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        .zb-open  { animation: zbOpen .3s cubic-bezier(.34,1.5,.64,1) forwards }
        .zb-msg   { animation: zbMsg .2s ease-out forwards }
        .zb-blink { animation: zbBlink 1.4s ease-in-out infinite }
        .zb-pulse { animation: zbPulse 2s ease-in-out infinite }
      `}</style>

            {/* Floating trigger button */}
            <button onClick={() => setOpen(v => !v)} aria-label="Open ZoneBot"
                className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-2xl select-none transition-all duration-300 hover:scale-110 active:scale-95 ${open ? "bg-gray-800 text-white" : "bg-amazon-yellow text-black zb-pulse"}`}>
                <span className={`transition-transform duration-300 ${open ? "rotate-90 text-lg" : ""}`}>{open ? <FaTimes /> : <FaRobot />}</span>
                {!open && unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {Math.min(unread, 9)}{unread > 9 ? "+" : ""}
                    </span>
                )}
            </button>

            {/* Chat window */}
            {open && (
                <div className="zb-open flex flex-col bg-white shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300"
                    style={{ ...winStyle, borderRadius: isFullscreen ? 0 : 16 }}>

                    {/* Header */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-amazon to-amazon-blue flex-shrink-0">
                        <div className="relative flex-shrink-0">
                            <div className="w-9 h-9 bg-amazon-yellow rounded-full flex items-center justify-center text-lg shadow"><FaRobot className="text-black" /></div>
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-amazon-blue zb-blink" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-white text-sm">ZoneBot AI</p>
                            {!isMinimized && <p className="text-xs text-gray-300">Always online · AI-powered shopping assistant</p>}
                        </div>

                        {/* Window controls */}
                        <div className="flex items-center gap-1">
                            {/* Size cycle button */}
                            <button onClick={cycleSize} title={`Current: ${size.label} — Click to change`}
                                className="text-gray-300 hover:text-white px-2 py-1 text-xs rounded hover:bg-white/10 transition-colors font-mono">
                                {sizeKey === "minimized" ? "⬜" : sizeKey === "small" ? "▪" : sizeKey === "normal" ? "◻" : sizeKey === "large" ? "⬛" : "⤢"}
                            </button>
                            {/* Minimize button */}
                            <button onClick={() => setSizeKey(sizeKey === "minimized" ? "normal" : "minimized")}
                                title={isMinimized ? "Restore" : "Minimize"}
                                className="text-gray-300 hover:text-white w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 transition-colors text-lg">
                                {isMinimized ? "▲" : "—"}
                            </button>
                            {/* Fullscreen toggle */}
                            <button onClick={() => setSizeKey(isFullscreen ? "normal" : "fullscreen")}
                                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                                className="text-gray-300 hover:text-white w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 transition-colors">
                                {isFullscreen
                                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0v5m0-5h5M15 9l5-5m0 0v5m0-5h-5M9 15l-5 5m0 0h5m-5 0v-5M15 15l5 5m0 0h-5m5 0v-5" /></svg>
                                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5M20 8V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5M20 16v4m0 0h-4m4 0l-5-5" /></svg>}
                            </button>
                            {/* Close */}
                            <button onClick={() => setOpen(false)} className="text-gray-300 hover:text-white w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 transition-colors text-xl">✕</button>
                        </div>
                    </div>

                    {/* Body — hidden when minimized */}
                    {!isMinimized && (
                        <>
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50">
                                {msgs.map((msg, idx) => (
                                    <div key={msg.id} className={`flex zb-msg ${msg.role === "user" ? "justify-end" : "justify-start"}`}>

                                        {msg.role === "bot" && (
                                            <div className="flex items-start gap-2 w-full max-w-[96%]">
                                                <div className="w-7 h-7 rounded-full bg-amazon-yellow flex items-center justify-center text-sm flex-shrink-0 mt-0.5 shadow-sm"><FaRobot className="text-black" /></div>
                                                <div className="flex-1 min-w-0 space-y-2">

                                                    {/* Text bubble */}
                                                    <div className="bg-white rounded-2xl rounded-tl-sm shadow-sm overflow-hidden">
                                                        <div className={`px-3 py-2.5 ${!expanded[idx] && msg.text?.length > 250 ? "line-clamp-4" : ""}`}>
                                                            <MsgText text={msg.text} />
                                                        </div>
                                                        {msg.text?.length > 250 && (
                                                            <button onClick={() => setExpanded(e => ({ ...e, [idx]: !e[idx] }))}
                                                                className="w-full text-xs text-blue-600 px-3 pb-2 text-left hover:underline">
                                                                {expanded[idx] ? "▲ Show less" : "▼ Read more"}
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Out of stock notice */}
                                                    {msg.oosProductName && <OOSBadge productName={msg.oosProductName} />}

                                                    {/* Cart */}
                                                    {msg.cartItems !== undefined && <CartWidget items={msg.cartItems} />}

                                                    {/* Orders */}
                                                    {msg.orderData !== undefined && <OrderWidget orders={msg.orderData} />}

                                                    {/* Products */}
                                                    {msg.products?.length > 0 && (
                                                        <div className={`grid gap-2 ${sizeKey === "large" || sizeKey === "fullscreen" ? "grid-cols-3" : "grid-cols-2"}`}>
                                                            {msg.products.map(p => (
                                                                <ProductCard key={p._id} product={p} onCart={onAddCart} onWishlist={onAddWishlist} size={sizeKey} />
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Compare */}
                                                    {msg.compareProducts && <CompareTable products={msg.compareProducts} />}

                                                    {/* Speak + suggestions */}
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <SpeakBtn text={msg.text} />
                                                        {msg.suggestions?.map((s, si) => (
                                                            <button key={si} onClick={() => sendRef.current?.(s)}
                                                                className="text-xs bg-white border border-gray-200 hover:border-amazon-yellow hover:bg-amber-50 text-gray-600 px-2.5 py-1 rounded-full transition-colors shadow-sm">
                                                                {s}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {msg.role === "user" && (
                                            <div className="max-w-[78%] bg-amazon-yellow text-black rounded-2xl rounded-tr-sm px-3 py-2 shadow-sm">
                                                <p className="text-sm font-medium">{msg.text}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {loading && (
                                    <div className="flex items-start gap-2 zb-msg">
                                        <div className="w-7 h-7 rounded-full bg-amazon-yellow flex items-center justify-center text-sm flex-shrink-0"><FaRobot className="text-black" /></div>
                                        <div className="bg-white rounded-2xl rounded-tl-sm shadow-sm"><TypingDots /></div>
                                    </div>
                                )}



                                <div ref={endRef} />
                            </div>

                            {/* Quick chips */}
                            {showQuick && (
                                <div className="px-3 py-2 flex gap-2 overflow-x-auto flex-shrink-0 bg-white border-t border-gray-100" style={{ scrollbarWidth: "none" }}>
                                    {QUICK_ACTIONS.map(({ label, msg }) => (
                                        <button key={label} onClick={() => sendRef.current?.(msg)}
                                            className="text-xs bg-gray-50 border border-gray-200 hover:border-amazon-yellow hover:bg-amber-50 text-gray-700 px-3 py-1.5 rounded-full whitespace-nowrap transition-colors flex-shrink-0 font-medium">
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="px-3 py-3 bg-white border-t border-gray-100 flex-shrink-0">
                                <div className="flex items-end gap-2">
                                    <textarea ref={inputRef} value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendRef.current?.(); } }}
                                        placeholder={"Ask anything about products, orders, shipping…"}
                                        rows={1} style={{ maxHeight: 80, resize: "none" }}
                                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amazon-yellow transition-colors overflow-y-auto" />
                                    <button onClick={() => sendRef.current?.()} disabled={!input.trim() || loading}
                                        className="w-9 h-9 bg-amazon-yellow hover:bg-amazon-orange disabled:opacity-40 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors shadow-sm">
                                        <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
}
