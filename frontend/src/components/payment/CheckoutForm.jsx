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

// ─── Online Payment Form ────────────────────────────────────────────────────────
export const OnlinePaymentForm = ({ shippingAddress }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  useState(() => {
    paymentAPI.getKey().then(res => {
      if (res.data?.demoMode) setDemoMode(true);
    }).catch(err => console.warn("Failed to fetch demo mode status", err));
  }, []);

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Get Razorpay key & check demo mode
      const keyRes = await paymentAPI.getKey();
      const { keyId, demoMode: isDemo } = keyRes.data;

      // 2. Create order on backend
      const orderRes = await paymentAPI.createOrder();
      const { orderId, amount, currency } = orderRes.data;

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) throw new Error("Razorpay SDK failed to load");

      const options = {
        key: keyId,
        amount,
        currency,
        name: "OmniKart",
        description: "Order Payment",
        order_id: orderId,
        handler: async function (response) {
          try {
            // Verify payment
            const verifyRes = await paymentAPI.verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.data.success) {
              setSuccess(true);
              const finalOrder = await orderAPI.createOrder({
                shippingAddress,
                paymentMethod: "razorpay",
                paymentResult: {
                  id: verifyRes.data.paymentId,
                  status: "completed",
                  update_time: new Date().toISOString(),
                  email_address: JSON.parse(localStorage.getItem("userInfo") || "{}").email || ""
                },
                razorpayPaymentId: verifyRes.data.paymentId,
                razorpayOrderId: verifyRes.data.orderId,
                isPaid: true
              });
              
              dispatch(clearCart());
              toast.success("✅ Payment Successful!");
              setTimeout(() => navigate(`/order/${finalOrder.data._id}`), 2000);
            }
          } catch (err) {
            toast.error("Payment verification failed");
            setError("Payment verification failed");
          }
        },
        prefill: {
          name: JSON.parse(localStorage.getItem("userInfo") || "{}").name || "Test User",
          email: JSON.parse(localStorage.getItem("userInfo") || "{}").email || "test@example.com",
        },
        theme: {
          color: "#3399cc"
        }
      };

      const rzp = new window.Razorpay(options);
      
      // Override failures if in demo mode
      rzp.on("payment.failed", async function (response) {
        if (isDemo) {
          console.log("[DEMO MODE] Intercepting payment failure and forcing success...");
          try {
            const failedPaymentId = response?.error?.metadata?.payment_id || `demo_fail_${Date.now()}`;
            const failedOrderId = response?.error?.metadata?.order_id || orderId;

            // Just simulate a successful verification
            const verifyRes = await paymentAPI.verifyPayment({
              razorpay_payment_id: failedPaymentId,
              razorpay_order_id: failedOrderId,
              razorpay_signature: "demo_signature",
            });

            if (verifyRes.data.success) {
              setSuccess(true);
              const finalOrder = await orderAPI.createOrder({
                shippingAddress,
                paymentMethod: "razorpay",
                paymentResult: {
                  id: verifyRes.data.paymentId,
                  status: "completed",
                  update_time: new Date().toISOString(),
                  email_address: JSON.parse(localStorage.getItem("userInfo") || "{}").email || ""
                },
                razorpayPaymentId: verifyRes.data.paymentId,
                razorpayOrderId: verifyRes.data.orderId,
                isPaid: true
              });
              
              dispatch(clearCart());
              toast.success("✅ Payment Successful (Demo Mode Override)!");
              setTimeout(() => navigate(`/order/${finalOrder.data._id}`), 2000);
            }
          } catch (err) {
            setError("Demo mode fallback failed: " + err.message);
          }
        } else {
          setError(`Payment Failed: ${response.error.description}`);
          toast.error("Payment Failed");
        }
      });

      rzp.open();

    } catch (err) {
      console.error("Payment Initiation Error:", err);
      const msg = err.response?.data?.message || err.message || "Failed to initiate payment";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="text-xl font-bold text-green-800">Payment Successful & Order Confirmed</h3>
        <p className="text-green-700 mt-2">Redirecting to your order details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 p-3 rounded-lg flex items-start gap-2">
          <span className="flex-shrink-0">❌</span>
          <span>{error}</span>
        </div>
      )}

      {demoMode && (
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🧪</span>
            <div>
              <p className="font-semibold text-blue-800 text-sm">Demo Mode Active</p>
              <p className="text-blue-700 text-xs mt-1">
                You can use real Razorpay test credentials or simulate a failure. Even if it fails, the system will record it as a success!
              </p>
            </div>
          </div>
        </div>
      )}

      <button onClick={handlePayment} disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg text-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-4">
        {loading ? <><Spinner /> Processing...</> : "💳 Pay Online (Razorpay)"}
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
