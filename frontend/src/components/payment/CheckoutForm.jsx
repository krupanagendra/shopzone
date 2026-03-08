import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useDispatch } from "react-redux";
import { paymentAPI, orderAPI } from "../../services/api";
import { clearCart } from "../../redux/slices/cartSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const cardStyle = {
  style: {
    base: { color: "#32325d", fontFamily: "Arial, sans-serif", fontSmoothing: "antialiased", fontSize: "16px", "::placeholder": { color: "#aab7c4" } },
    invalid: { color: "#fa755a", iconColor: "#fa755a" },
  },
};

const Spinner = () => (
  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
);

// ─── Component 1: Only used for ONLINE payment (inside <Elements>) ────────
export const OnlinePaymentForm = ({ shippingAddress }) => {
  const stripe = useStripe();   // ✅ safe — always inside <Elements>
  const elements = useElements(); // ✅ safe — always inside <Elements>
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await paymentAPI.createPaymentIntent();
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: { name: shippingAddress.fullName || "Customer" },
        },
      });

      if (result.error) {
        setError(result.error.message);
        toast.error(result.error.message);
      } else if (result.paymentIntent.status === "succeeded") {
        const orderRes = await orderAPI.createOrder({
          shippingAddress,
          paymentMethod: "online",
          paymentResult: { id: result.paymentIntent.id, status: result.paymentIntent.status, update_time: new Date().toISOString() },
          stripePaymentIntentId: result.paymentIntent.id,
          isPaid: true,
        });
        dispatch(clearCart());
        toast.success("Payment successful! 🎉");
        navigate(`/order/${orderRes.data._id}`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Payment failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border-2 border-gray-200 focus-within:border-amazon-yellow rounded-xl p-4 transition-colors">
        <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Card Details</label>
        <CardElement options={cardStyle} />
      </div>
      {error && <div className="text-red-500 text-sm bg-red-50 border border-red-200 p-3 rounded-lg">{error}</div>}
      <div className="text-sm bg-blue-50 border border-blue-100 p-3 rounded-lg">
        <p className="font-semibold text-blue-700 mb-1">🧪 Test Card:</p>
        <p className="text-blue-600 font-mono text-xs">4242 4242 4242 4242 · Any future date · Any CVC</p>
      </div>
      <button type="submit" disabled={!stripe || loading}
        className="w-full btn-primary py-3 text-lg disabled:opacity-50 flex items-center justify-center gap-2">
        {loading ? <><Spinner /> Processing...</> : "💳 Pay Now"}
      </button>
    </form>
  );
};

// ─── Component 2: COD — NO Stripe hooks at all ────────────────────────────
export const CashOnDeliveryForm = ({ shippingAddress }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCOD = async () => {
    setLoading(true);
    setError(null);
    try {
      const orderRes = await orderAPI.createOrder({
        shippingAddress,
        paymentMethod: "cod",
        paymentResult: { id: `COD-${Date.now()}`, status: "pending", update_time: new Date().toISOString() },
        isPaid: false,
      });
      dispatch(clearCart());
      toast.success("Order placed! Pay on delivery 💵");
      navigate(`/order/${orderRes.data._id}`);
    } catch (err) {
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
            <p className="text-sm text-green-700 mt-1">Your order will be placed immediately. Pay when it arrives.</p>
            <ul className="text-sm text-green-700 mt-2 space-y-1">
              <li>✅ No payment needed now</li>
              <li>✅ Pay when you receive the package</li>
              <li>✅ Free cancellation before dispatch</li>
            </ul>
          </div>
        </div>
      </div>
      {error && <div className="text-red-500 text-sm bg-red-50 border border-red-200 p-3 rounded-lg">{error}</div>}
      <button onClick={handleCOD} disabled={loading}
        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg text-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
        {loading ? <><Spinner /> Placing Order...</> : "📦 Place Order (Cash on Delivery)"}
      </button>
    </div>
  );
};

// ─── Default export (kept for backward compat) ────────────────────────────
const CheckoutForm = ({ shippingAddress, paymentMethod }) => {
  if (paymentMethod === "cod") return <CashOnDeliveryForm shippingAddress={shippingAddress} />;
  return null; // OnlinePaymentForm is used directly in CheckoutPage inside <Elements>
};

export default CheckoutForm;
