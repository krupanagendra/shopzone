import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { OnlinePaymentForm, CashOnDeliveryForm } from "../components/payment/CheckoutForm";
import { FaBox, FaCreditCard, FaMoneyBillWave, FaMapMarkerAlt, FaReceipt, FaCrown, FaTruck, FaCheck } from "react-icons/fa";

const API = import.meta.env.VITE_API_URL;

const fmt = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;

const STEPS = ["Shipping", "Payment Method", "Complete"];

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { userInfo } = useSelector((s) => s.auth);
  const { cart } = useSelector((s) => s.cart);

  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isPrime, setIsPrime] = useState(false);
  const [primeDiscount, setPrimeDiscount] = useState(10);
  const [address, setAddress] = useState({
    fullName: "", address: "", city: "", postalCode: "", country: ""
  });

  useEffect(() => {
    if (!userInfo) navigate("/login", { state: { from: "/checkout" } });
    if (!cart?.items?.length) navigate("/cart");
  }, [userInfo, cart, navigate]);

  useEffect(() => {
    if (!userInfo) return;
    try {
      const { token } = JSON.parse(localStorage.getItem("userInfo") || "{}");
      fetch(`${API}/api/prime/status`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => {
          setIsPrime(d.isPremium);
          if (d.isPremium && d.tierDetails) setPrimeDiscount(d.tierDetails.discountPercent || 10);
        }).catch(() => { });
    } catch { }
  }, [userInfo]);

  const items = cart?.items || [];
  const itemsPrice = items.reduce((a, i) => a + i.price * i.quantity, 0);
  const primeDiscountAmt = isPrime ? Math.round(itemsPrice * primeDiscount / 100) : 0;
  const shippingPrice = isPrime || itemsPrice > 8400 ? 0 : 840; // Prime = free shipping always
  const taxPrice = itemsPrice * 0.15;
  const totalPrice = itemsPrice - primeDiscountAmt + shippingPrice + taxPrice;

  const handleAddressSubmit = (e) => { e.preventDefault(); setStep(2); };
  const handlePaymentSelect = (method) => { setPaymentMethod(method); setStep(3); };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      {/* Step indicator */}
      <div className="flex flex-wrap items-center gap-y-3 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
              ${step > i + 1 ? "bg-green-500 text-white" : step === i + 1 ? "bg-amazon-yellow text-black" : "bg-gray-200 text-gray-500"}`}>
              {step > i + 1 ? "✓" : i + 1}
            </div>
            <span className={`ml-2 text-sm ${step === i + 1 ? "font-bold" : "text-gray-400"}`}>{s}</span>
            {i < STEPS.length - 1 && (
              <div className={`w-10 h-0.5 mx-3 transition-colors ${step > i + 1 ? "bg-green-500" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left — steps */}
        <div className="md:col-span-2">

          {/* ── STEP 1: Shipping ── */}
          {step === 1 && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><FaBox /> Shipping Address</h2>
              <form onSubmit={handleAddressSubmit} className="space-y-4">
                {[
                  ["fullName", "Full Name"],
                  ["address", "Street Address"],
                  ["city", "City"],
                  ["postalCode", "Postal Code"],
                  ["country", "Country"],
                ].map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-sm font-semibold mb-1">{label}</label>
                    <input type="text" value={address[key]}
                      onChange={(e) => setAddress({ ...address, [key]: e.target.value })}
                      className="input-field" required />
                  </div>
                ))}
                <button type="submit" className="w-full btn-primary py-3 font-bold">
                  Continue to Payment Method →
                </button>
              </form>
            </div>
          )}

          {/* ── STEP 2: Choose Payment Method ── */}
          {step === 2 && (
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2"><FaCreditCard /> Choose Payment Method</h2>
                <button onClick={() => setStep(1)} className="text-amazon-blue text-sm hover:underline">← Edit Address</button>
              </div>

              {/* Address summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6 text-sm">
                <p className="font-semibold text-gray-700 flex items-center gap-1"><FaMapMarkerAlt /> Delivering to:</p>
                <p className="text-gray-500 mt-0.5">
                  {address.fullName} · {address.address}, {address.city}, {address.postalCode}, {address.country}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Online Payment */}
                <button onClick={() => handlePaymentSelect("online")}
                  className="group border-2 border-gray-200 hover:border-amazon-yellow rounded-xl p-6 text-left transition-all hover:shadow-lg hover:-translate-y-0.5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FaCreditCard className="text-2xl text-blue-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">Online Payment (Demo)</p>
                      <p className="text-xs text-gray-500">Pay securely via Card, UPI, etc.</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-medium">UPI</span>
                    <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded font-medium">Cards</span>
                    <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded font-medium">Net Banking</span>
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded font-medium">Wallets</span>
                  </div>
                  <p className="text-xs text-green-600 mt-3 font-medium flex items-center gap-1"><FaCheck /> Instant confirmation</p>
                </button>

                {/* Cash on Delivery */}
                <button onClick={() => handlePaymentSelect("cod")}
                  className="group border-2 border-gray-200 hover:border-amazon-yellow rounded-xl p-6 text-left transition-all hover:shadow-lg hover:-translate-y-0.5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FaMoneyBillWave className="text-2xl text-green-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">Cash on Delivery</p>
                      <p className="text-xs text-gray-500">Pay when you receive</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded font-medium">Cash</span>
                    <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded font-medium">No card needed</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-3 font-medium flex items-center gap-1"><FaTruck /> Pay at your door</p>
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Complete Payment ── */}
          {step === 3 && (
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">
                  {paymentMethod === "online" ? <><FaCreditCard className="inline" /> Online Payment (Demo)</> : <><FaMoneyBillWave className="inline" /> Cash on Delivery</>}
                </h2>
                <button onClick={() => setStep(2)} className="text-amazon-blue text-sm hover:underline">← Change Method</button>
              </div>

              {/* Address summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-sm">
                <p className="font-semibold text-gray-700 flex items-center gap-1"><FaMapMarkerAlt /> Delivering to:</p>
                <p className="text-gray-500 mt-0.5">
                  {address.fullName} · {address.address}, {address.city}, {address.postalCode}, {address.country}
                </p>
              </div>

              {/* Payment method badge */}
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg mb-5 text-sm font-semibold
                ${paymentMethod === "online" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}`}>
                {paymentMethod === "online" ? <><FaCreditCard className="inline" /> Paying online securely</> : <><FaMoneyBillWave className="inline" /> Paying cash on delivery</>}
              </div>

              {/* Online payment — Razorpay popup (no wrapper needed) */}
              {paymentMethod === "online" && (
                <OnlinePaymentForm shippingAddress={address} />
              )}

              {/* COD — no payment gateway needed */}
              {paymentMethod === "cod" && (
                <CashOnDeliveryForm shippingAddress={address} />
              )}
            </div>
          )}
        </div>

        {/* Right — Order Summary */}
        <div className="bg-white rounded-xl shadow p-6 h-fit sticky top-24">
          <h2 className="font-bold mb-4 flex items-center gap-2"><FaReceipt /> Order Summary</h2>

          <div className="space-y-2 mb-4 max-h-52 overflow-y-auto">
            {items.map((item) => (
              <div key={item._id} className="flex gap-2 text-sm">
                <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded flex-shrink-0"
                  onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/40x40/131921/febd69?text=?"; }} />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{item.name}</p>
                  <p className="text-gray-500">×{item.quantity} = {fmt(item.price * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>

          <hr />
          <div className="space-y-2 text-sm mt-3">
            {isPrime && (
              <div className="flex justify-between text-amazon-yellow font-semibold">
                <span><FaCrown className="inline" /> Prime Discount ({primeDiscount}%)</span>
                <span>- {fmt(primeDiscountAmt)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{fmt(itemsPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span className={shippingPrice === 0 ? "text-green-600 font-semibold" : "font-medium"}>
                {shippingPrice === 0 ? "FREE" : fmt(shippingPrice)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax (15%)</span>
              <span className="font-medium">{fmt(taxPrice)}</span>
            </div>
            <hr />
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span className="text-amazon-blue">{fmt(totalPrice)}</span>
            </div>
          </div>

          {shippingPrice === 0 && (
            <p className="text-xs text-green-600 mt-2 text-center font-medium">
               You qualify for FREE shipping!
            </p>
          )}

          {paymentMethod && (
            <div className={`mt-3 text-xs px-3 py-2 rounded-lg font-medium text-center
              ${paymentMethod === "online" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}`}>
               {paymentMethod === "online" ? <><FaCreditCard className="inline" /> Online Payment selected</> : <><FaMoneyBillWave className="inline" /> Cash on Delivery selected</>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
