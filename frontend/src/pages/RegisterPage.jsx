import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "../redux/slices/authSlice";
import { toast } from "react-toastify";
import BrandLogo from "../components/common/BrandLogo";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaGift } from "react-icons/fa";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Floating particle background
function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div key={i} className="absolute rounded-full opacity-10"
          style={{
            width: `${4 + (i % 5) * 6}px`,
            height: `${4 + (i % 5) * 6}px`,
            background: i % 3 === 0 ? "#febd69" : i % 3 === 1 ? "#f90" : "#fff",
            left: `${5 + (i * 4.7) % 90}%`,
            top: `${5 + (i * 7.3) % 85}%`,
            animation: `zbFloat ${4 + (i % 4)}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.3}s`,
          }} />
      ))}
    </div>
  );
}

// Strength indicator
function PasswordStrength({ password }) {
  const checks = [
    { test: password.length >= 6, label: "6+ characters" },
    { test: /[A-Z]/.test(password), label: "Uppercase" },
    { test: /[0-9]/.test(password), label: "Number" },
    { test: /[^A-Za-z0-9]/.test(password), label: "Special char" },
  ];
  const score = checks.filter(c => c.test).length;
  const colors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-400", "bg-emerald-500"];
  const labels = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"];
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i < score ? colors[score] : "bg-gray-200"}`} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {checks.map(c => (
            <span key={c.label} className={`text-xs flex items-center gap-1 transition-colors ${c.test ? "text-green-600" : "text-gray-400"}`}>
              <span>{c.test ? "✓" : "○"}</span>{c.label}
            </span>
          ))}
        </div>
        {score > 0 && <span className={`text-xs font-bold ${score >= 3 ? "text-green-600" : score >= 2 ? "text-yellow-600" : "text-red-500"}`}>{labels[score]}</span>}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Read referral code from URL ?ref=XXXXXX
  const refCode = new URLSearchParams(location.search).get("ref") || "";

  const [step, setStep] = useState(1); // 1=form, 2=otp
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showPwd, setShowPwd] = useState(false);
  const [showCPwd, setShowCPwd] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [shake, setShake] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [referralApplied, setReferralApplied] = useState(false);

  const otpRefs = useRef([]);
  const timerRef = useRef(null);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [countdown]);

  // Step 1 — Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error("Passwords do not match"); return; }
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message); return; }
      setSentEmail(form.email);
      setStep(2);
      setCountdown(60);
      toast.success("OTP sent! Check your email");
      setTimeout(() => otpRefs.current[0]?.focus(), 300);
    } catch { toast.error("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  // OTP input handling
  const handleOtpChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[idx] = val.slice(-1);
    setOtp(newOtp);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
    if (newOtp.every(d => d) && newOtp.join("").length === 6) {
      setTimeout(() => handleVerifyOTP(newOtp.join("")), 100);
    }
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (paste.length === 6) {
      setOtp(paste.split(""));
      setTimeout(() => handleVerifyOTP(paste), 100);
    }
  };

  // Step 2 — Verify OTP
  const handleVerifyOTP = async (otpVal) => {
    const code = otpVal || otp.join("");
    if (code.length !== 6) { toast.error("Enter all 6 digits"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: sentEmail, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setShake(true); setTimeout(() => setShake(false), 600);
        setOtp(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
        toast.error(data.message);
        return;
      }
      localStorage.setItem("userInfo", JSON.stringify(data));
      dispatch(setCredentials(data));

      // Auto-apply referral code if present in URL
      if (refCode.trim()) {
        try {
          const refRes = await fetch(`${API}/api/gamification/apply-referral`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.token}` },
            body: JSON.stringify({ code: refCode.trim().toUpperCase() }),
          });
          const refData = await refRes.json();
          if (refRes.ok) {
            setReferralApplied(true);
            toast.success(`Referral applied! ${refData.discountAwarded}% off your first order!`);
          }
        } catch {
          // Referral failure must never block registration
        }
      }

      toast.success("Account created successfully! Welcome to OmniKart!");
      navigate("/");
    } catch { toast.error("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  // Resend OTP
  const handleResend = async () => {
    if (countdown > 0) return;
    setResending(true);
    try {
      const res = await fetch(`${API}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: sentEmail, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message); return; }
      setOtp(["", "", "", "", "", ""]);
      setCountdown(60);
      toast.success("New OTP sent! Check your email.");
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch { toast.error("Failed to resend. Try again."); }
    finally { setResending(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8 bg-gray-50 dark:bg-omnikart-dark transition-colors duration-300">
      <style>{`
        @keyframes zbFloat   { from{transform:translateY(0) rotate(0deg)} to{transform:translateY(-20px) rotate(180deg)} }
        @keyframes zbSlideIn { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes zbShake   { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
        @keyframes zbGlow    { 0%,100%{box-shadow:0 0 20px rgba(254,189,105,0.3)} 50%{box-shadow:0 0 40px rgba(254,189,105,0.6)} }
        @keyframes zbSpin    { to{transform:rotate(360deg)} }
        @keyframes zbPop     { 0%{transform:scale(0.8);opacity:0} 60%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
        .zb-slide  { animation: zbSlideIn .5s cubic-bezier(.34,1.4,.64,1) forwards }
        .zb-shake  { animation: zbShake .5s ease-in-out }
        .zb-glow   { animation: zbGlow 2s ease-in-out infinite }
        .zb-pop    { animation: zbPop .4s cubic-bezier(.34,1.4,.64,1) forwards }
        .zb-spin   { animation: zbSpin 1s linear infinite }
        .inp-field { width:100%;background:#f8fafc;border:1px solid #e2e8f0;color:#1e293b;border-radius:12px;padding:16px;font-size:15px;outline:none;transition:all .3s ease; }
        .inp-field:focus { border-color:#febd69;box-shadow:0 0 15px rgba(254,189,105,.2);background:#ffffff; }
        .inp-field::placeholder { color:#94a3b8; }
        .inp-field:-webkit-autofill { -webkit-box-shadow:0 0 0 100px #f8fafc inset !important; -webkit-text-fill-color:#1e293b !important; }
        .glass-panel { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.5); }
      `}</style>

      <Particles />

      {/* Modern Ambient Glows for the background */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amazon-orange rounded-full mix-blend-multiply filter blur-[100px] opacity-[0.15] animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amazon-yellow rounded-full mix-blend-multiply filter blur-[100px] opacity-[0.15] animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 zb-slide">
          <Link to="/" className="inline-flex items-center gap-3 mb-2 drop-shadow-lg">
            <BrandLogo className="h-12" />
            <span className="text-3xl font-black text-transparent bg-clip-text tracking-tight bg-gradient-to-r from-amazon-blue to-gray-800 dark:from-white dark:to-gray-300">OmniKart</span>
          </Link>
          <p className="text-gray-500 text-sm font-medium">Join millions of happy shoppers on OmniKart</p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-3xl shadow-2xl overflow-hidden relative">
          {/* Subtle top edge highlight */}
          <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-amazon-yellow to-amazon-orange opacity-90"></div>
          
          {/* Progress bar */}
          <div className="h-1 bg-gray-100">
            <div className="h-full bg-gradient-to-r from-amazon-yellow to-amazon-orange transition-all duration-700 ease-in-out"
              style={{ width: step === 1 ? "50%" : "100%", boxShadow: "0 0 10px rgba(254,189,105,0.3)" }} />
          </div>

          <div className="p-8 sm:p-10">
            {/* Step indicators */}
            <div className="flex items-center gap-3 mb-8">
              {[{ n: 1, label: "Details" }, { n: 2, label: "Verify" }].map(({ n, label }) => (
                <div key={n} className="flex items-center gap-2 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all duration-300 ${step >= n ? "bg-amazon-yellow text-amazon-blue" : "bg-gray-100 text-gray-400"}`}>
                    {step > n ? "✓" : n}
                  </div>
                  <span className={`text-sm font-bold transition-colors ${step >= n ? "text-gray-900" : "text-gray-400"}`}>{label}</span>
                  {n < 2 && <div className={`flex-1 h-[2px] rounded-full transition-colors duration-500 ${step > n ? "bg-amazon-yellow" : "bg-gray-100"}`} />}
                </div>
              ))}
            </div>

            {/* ── STEP 1: Registration Form ── */}
            {step === 1 && (
              <form onSubmit={handleSendOTP} className="space-y-6 zb-slide">
                <div className="text-center sm:text-left mb-2">
                  <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Create Account</h2>
                  <p className="text-gray-500 font-medium text-sm">Enter your details to get started</p>
                </div>

                {/* Referral banner */}
                {refCode && (
                  <div className="flex items-center gap-3 bg-green-900 bg-opacity-40 border border-green-500 border-opacity-50 rounded-xl px-4 py-3">
                    <span className="text-2xl flex-shrink-0 text-green-400 mt-1"><FaGift /></span>
                    <div>
                      <p className="text-green-400 font-bold text-sm">Referral code detected!</p>
                      <p className="text-green-300 text-xs mt-0.5">
                        Code <span className="font-mono font-bold tracking-widest">{refCode.toUpperCase()}</span> will be applied automatically after registration — you get <strong>10% OFF</strong> your first order!
                      </p>
                    </div>
                  </div>
                )}

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Full Name</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><FaUser /></span>
                    <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                      className="inp-field" style={{ paddingLeft: "48px" }} placeholder="John Doe" required />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Email Address</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><FaEnvelope /></span>
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                      className="inp-field" style={{ paddingLeft: "48px" }} placeholder="you@gmail.com" required />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Password</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><FaLock /></span>
                    <input type={showPwd ? "text" : "password"} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                      className="inp-field" style={{ paddingLeft: "48px", paddingRight: "48px" }} placeholder="Min. 6 characters" required />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors text-lg flex items-center justify-center">
                      {showPwd ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                    </button>
                  </div>
                  <PasswordStrength password={form.password} />
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Confirm Password</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><FaLock /></span>
                    <input type={showCPwd ? "text" : "password"} value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                      className="inp-field" style={{ paddingLeft: "48px", paddingRight: "48px" }} placeholder="Re-enter password" required />
                    <button type="button" onClick={() => setShowCPwd(!showCPwd)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors text-lg flex items-center justify-center">
                      {showCPwd ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                    </button>
                  </div>
                  {form.confirmPassword && (
                    <p className={`text-xs mt-1 flex items-center gap-1 font-bold ${form.password === form.confirmPassword ? "text-green-500" : "text-red-500"}`}>
                      {form.password === form.confirmPassword ? "✓ Passwords match" : "✗ Passwords don't match"}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button type="submit" disabled={loading}
                  className="w-full mt-4 py-4 rounded-xl font-bold text-[#131921] text-lg transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden group"
                  style={{ background: "linear-gradient(135deg, #febd69, #f90)", boxShadow: "0 8px 25px rgba(254,189,105,0.3)" }}>
                  <span className="absolute inset-0 w-full h-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
                  {loading ? <><span className="w-5 h-5 border-2 border-[#131921] border-t-transparent rounded-full zb-spin" />Sending OTP…</> : <>Send Verification Code</>}
                </button>

                <p className="text-center text-sm text-gray-500 font-medium mt-4">
                  Already have an account?{" "}
                  <Link to="/login" className="text-amazon-blue hover:text-amazon-orange font-bold transition-colors">Sign In</Link>
                </p>
              </form>
            )}

            {/* ── STEP 2: OTP Verification ── */}
            {step === 2 && (
              <div className="zb-pop">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-amazon-yellow bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 zb-glow">
                    <span className="text-4xl drop-shadow-md text-amazon-yellow"><FaEnvelope /></span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Check Your Email</h2>
                  <p className="text-gray-500 text-sm leading-relaxed font-medium">
                    We sent a 6-digit code to<br />
                    <span className="text-amazon-blue font-bold">{sentEmail}</span>
                  </p>
                </div>

                {/* OTP boxes */}
                <div className={`flex gap-3 justify-center mb-8 ${shake ? "zb-shake" : ""}`} onPaste={handleOtpPaste}>
                  {otp.map((digit, idx) => (
                    <input key={idx} ref={el => otpRefs.current[idx] = el}
                      type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={e => handleOtpChange(idx, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(idx, e)}
                      className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black rounded-xl border transition-all duration-300 outline-none backdrop-blur-sm"
                      style={{
                        background: digit ? "rgba(34, 197, 94, 0.1)" : "rgba(255, 255, 255, 0.9)",
                        borderColor: digit ? "#22c55e" : "#e2e8f0",
                        color: digit ? "#166534" : "#1e293b",
                        boxShadow: digit ? "0 0 15px rgba(34,197,94,0.3)" : "none",
                      }} />
                  ))}
                </div>

                {/* Timer */}
                <div className="text-center mb-6">
                  {countdown > 0 ? (
                    <p className="text-gray-500 font-medium text-sm">
                      Resend OTP in{" "}
                      <span className="text-amazon-blue font-bold tabular-nums">
                        0:{String(countdown).padStart(2, "0")}
                      </span>
                    </p>
                  ) : (
                    <button onClick={handleResend} disabled={resending}
                      className="text-amazon-blue hover:text-amazon-orange text-sm font-extrabold transition-colors disabled:opacity-50 hover:underline">
                      {resending ? "Sending…" : "↺ Resend OTP"}
                    </button>
                  )}
                </div>

                {/* Verify button */}
                <button onClick={() => handleVerifyOTP()} disabled={loading || otp.join("").length !== 6}
                  className="w-full py-4 rounded-xl font-bold text-[#131921] text-lg transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden group"
                  style={{ background: "linear-gradient(135deg, #febd69, #f90)", boxShadow: "0 8px 25px rgba(254,189,105,0.3)" }}>
                  <span className="absolute inset-0 w-full h-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
                  {loading ? <><span className="w-5 h-5 border-2 border-[#131921] border-t-transparent rounded-full zb-spin" />Verifying…</> : <>✓ Verify & Create Account</>}
                </button>

                <button onClick={() => { setStep(1); setOtp(["", "", "", "", "", ""]); }} className="w-full mt-3 py-3 text-sm text-gray-500 font-bold hover:text-gray-800 transition-colors">
                  ← Back to edit details
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 font-medium mt-6 px-4">
          By creating an account, you agree to OmniKart's Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
