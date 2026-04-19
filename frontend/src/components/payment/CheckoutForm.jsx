import { useState } from "react";
import { useDispatch } from "react-redux";
import { paymentAPI, orderAPI } from "../../services/api";
import { clearCart } from "../../redux/slices/cartSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Spinner = () => (
  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
);

// ── Email confirmation banner ─────────────────────────────────────────────────
const EmailConfirmBanner = ({ email }) => (
  <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
    <span className="text-2xl flex-shrink-0">📧</span>
    <div>
      <p className="font-bold text-green-800 text-sm">Confirmation email sent!</p>
      <p className="text-green-700 text-xs mt-0.5">
        Full order details have been sent to <strong>{email}</strong>
      </p>
    </div>
  </div>
);

// ── Load Razorpay SDK ─────────────────────────────────────────────────────────
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      // Script tag exists but Razorpay not on window yet — wait for it
      const check = setInterval(() => {
        if (window.Razorpay) { clearInterval(check); resolve(true); }
      }, 100);
      setTimeout(() => { clearInterval(check); resolve(!!window.Razorpay); }, 5000);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// ─── Online Payment Form (Razorpay) ──────────────────────────────────────────
export const OnlinePaymentForm = ({ shippingAddress }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Load Razorpay script
      console.log("[RAZORPAY] Loading Razorpay SDK...");
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError("Failed to load Razorpay SDK. Check your internet connection.");
        setLoading(false);
        return;
      }
      console.log("[RAZORPAY] ✅ SDK loaded");

      // 2. Create order on backend (with timeout)
      console.log("[RAZORPAY] Creating order...");
      let data;
      try {
        const response = await paymentAPI.createOrder();
        data = response.data;
        console.log("[RAZORPAY] ✅ Order created:", data.orderId);
      } catch (orderErr) {
        console.error("[RAZORPAY] ❌ Order creation failed:", orderErr);
        const serverMsg = orderErr.response?.data?.message || "";
        const serverHint = orderErr.response?.data?.hint || "";
        const errMsg = serverMsg
          ? `${serverMsg}${serverHint ? " — " + serverHint : ""}`
          : "Failed to create payment order. Server may be unreachable.";
        setError(errMsg);
        toast.error(errMsg);
        setLoading(false);
        return;
      }

      // 3. Get user info for prefill
      let userInfo = {};
      try {
        userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      } catch {}

      // 4. Open Razorpay checkout
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "OmniKart",
        description: "Order Payment",
        order_id: data.orderId,
        prefill: {
          name: shippingAddress.fullName || userInfo.name || "Customer",
          email: userInfo.email || "",
          contact: userInfo.phone || "",
        },
        theme: {
          color: "#131921",
          backdrop_color: "rgba(0,0,0,0.6)",
        },
        config: {
          display: {
            hide: [{ method: "card" }, { method: "wallet" }]
          }
        },
        handler: async function (response) {
          try {
            console.log("[RAZORPAY] Payment response received, verifying...");
            // 5. Verify payment on server
            const verifyRes = await paymentAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.data.success) {
              console.log("[RAZORPAY] ✅ Payment verified! Creating order...");
              // 6. Create order in our system
              const orderRes = await orderAPI.createOrder({
                shippingAddress,
                paymentMethod: "online",
                paymentResult: {
                  id: response.razorpay_payment_id,
                  status: "completed",
                  update_time: new Date().toISOString(),
                },
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                isPaid: true,
              });

              console.log("[RAZORPAY] ✅ Order created:", orderRes.data._id);
              dispatch(clearCart());

              // Show email confirmation
              try {
                setUserEmail(userInfo.email || "");
                setEmailSent(true);
              } catch {}

              toast.success("✅ Payment successful! Order confirmed & email sent 📧");
              setTimeout(() => navigate(`/order/${orderRes.data._id}`), 2500);
            } else {
              setError("Payment verification failed. Please contact support.");
              toast.error("Payment verification failed");
            }
          } catch (err) {
            console.error("[RAZORPAY] ❌ Verification error:", err);
            const msg = err.response?.data?.message || "Payment verification failed";
            setError(msg);
            toast.error(msg);
          }
          setLoading(false);
        },
        modal: {
          ondismiss: function () {
            console.log("[RAZORPAY] Payment modal dismissed");
            setLoading(false);
            toast.info("Payment cancelled");
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on("payment.failed", function (response) {
        console.error("[RAZORPAY] ❌ Payment failed:", response.error);
        setError(response.error.description || "Payment failed");
        toast.error(response.error.description || "Payment failed");
        setLoading(false);
      });
      razorpayInstance.open();
    } catch (err) {
      console.error("[RAZORPAY] ❌ Error:", err);
      const serverMsg = err.response?.data?.message || "";
      const serverHint = err.response?.data?.hint || "";
      const msg = serverMsg
        ? `${serverMsg}${serverHint ? " — " + serverHint : ""}`
        : "Payment failed. Please try again.";
      setError(msg);
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 p-3 rounded-lg flex items-start gap-2">
          <span className="flex-shrink-0">❌</span>
          <span>{error}</span>
        </div>
      )}

      {emailSent && <EmailConfirmBanner email={userEmail} />}

      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <p className="font-semibold text-blue-700 text-sm">Secure Payment via Razorpay</p>
            <p className="text-blue-600 text-xs mt-1">
              You'll be redirected to Razorpay's secure checkout. Supports UPI, Net Banking & more.
            </p>
          </div>
        </div>
      </div>

      <div className="text-sm bg-amber-50 border border-amber-200 p-3 rounded-lg">
        <p className="font-semibold text-amber-700 mb-1">🧪 Test Mode Enabled</p>
        <p className="text-amber-600 text-xs">
          Use Razorpay test credentials:
        </p>
        <ul className="text-amber-600 text-xs mt-1 space-y-0.5 ml-4 list-disc">
          <li>UPI: <code className="bg-amber-100 px-1 rounded">success@razorpay</code></li>
          <li>Net Banking: Select any bank, then click Success</li>
        </ul>
      </div>

      <button onClick={handlePayment} disabled={loading}
        className="w-full btn-primary py-3 text-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all hover:shadow-lg">
        {loading ? <><Spinner /> Processing...</> : "💳 Pay with Razorpay"}
      </button>
    </div>
  );
};

// ─── COD Form ─────────────────────────────────────────────────────────────────
export const CashOnDeliveryForm = ({ shippingAddress }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const handleCOD = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("[COD] Placing order...");
      const orderRes = await orderAPI.createOrder({
        shippingAddress,
        paymentMethod: "cod",
        paymentResult: {
          id: `COD-${Date.now()}`,
          status: "pending",
          update_time: new Date().toISOString(),
        },
        isPaid: false,
      });

      console.log("[COD] ✅ Order placed:", orderRes.data._id);
      dispatch(clearCart());

      // Show email confirmation banner
      try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
        setUserEmail(userInfo.email || "");
        setEmailSent(true);
      } catch { }

      toast.success("📦 Order placed! Confirmation email sent 📧");

      setTimeout(() => navigate(`/order/${orderRes.data._id}`), 2500);
    } catch (err) {
      console.error("[COD] ❌ Error:", err);
      const msg = err.response?.data?.message || "Failed to place order";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-3xl">💵</span>
          <div>
            <p className="font-bold text-green-800">Cash on Delivery Selected</p>
            <p className="text-sm text-green-700 mt-1">
              Your order will be placed immediately. Pay when it arrives.
            </p>
            <ul className="text-sm text-green-700 mt-2 space-y-1">
              <li>✅ No payment needed now</li>
              <li>✅ Pay when you receive the package</li>
              <li>✅ Free cancellation before dispatch</li>
              <li>✅ Order confirmation email will be sent</li>
            </ul>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 p-3 rounded-lg flex items-start gap-2">
          <span className="flex-shrink-0">❌</span>
          <span>{error}</span>
        </div>
      )}

      {emailSent && <EmailConfirmBanner email={userEmail} />}

      <button onClick={handleCOD} disabled={loading}
        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg text-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
        {loading ? <><Spinner /> Placing Order...</> : "📦 Place Order (Cash on Delivery)"}
      </button>
    </div>
  );
};

// ─── Default export (backward compat) ────────────────────────────────────────
const CheckoutForm = ({ shippingAddress, paymentMethod }) => {
  if (paymentMethod === "cod") return <CashOnDeliveryForm shippingAddress={shippingAddress} />;
  return <OnlinePaymentForm shippingAddress={shippingAddress} />;
};

export default CheckoutForm;
