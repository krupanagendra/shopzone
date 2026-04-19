import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../redux/slices/authSlice";
import { toast } from "react-toastify";
import BrandLogo from "../components/common/BrandLogo";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaShoppingCart, FaBox, FaUndo, FaShieldAlt } from "react-icons/fa";

function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(16)].map((_, i) => (
        <div key={i} className="absolute rounded-full opacity-10"
          style={{
            width: `${4 + (i % 4) * 5}px`, height: `${4 + (i % 4) * 5}px`,
            background: i % 3 === 0 ? "#febd69" : i % 3 === 1 ? "#f90" : "#fff",
            left: `${5 + (i * 6.1) % 90}%`, top: `${5 + (i * 8.7) % 85}%`,
            animation: `lgFloat ${3 + (i % 4)}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.25}s`,
          }} />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading } = useSelector(s => s.auth);

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [focused, setFocused] = useState("");
  const redirect = location.state?.from || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await dispatch(login(form));
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Welcome back!");
      navigate(redirect);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gray-50 dark:bg-omnikart-dark transition-colors duration-300">
      <style>{`
        @keyframes lgFloat   { from{transform:translateY(0)} to{transform:translateY(-18px)} }
        @keyframes lgSlide   { from{opacity:0;transform:translateX(-30px)} to{opacity:1;transform:translateX(0)} }
        @keyframes lgSlideR  { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:translateX(0)} }
        @keyframes lgPulse   { 0%,100%{opacity:.6} 50%{opacity:1} }
        @keyframes lgSpin    { to{transform:rotate(360deg)} }
        @keyframes lgBorderGlow { 0%,100% { border-color: rgba(254,189,105,0.3); } 50% { border-color: rgba(254,189,105,0.8); } }
        .lg-left   { animation: lgSlide .6s cubic-bezier(.34,1.4,.64,1) forwards }
        .lg-right  { animation: lgSlideR .6s cubic-bezier(.34,1.4,.64,1) .1s forwards; opacity:0 }
        .lg-spin   { animation: lgSpin 1s linear infinite }
        .inp-light { width:100%; background:#f8fafc; border:1px solid #e2e8f0; color:#1e293b; border-radius:12px; padding:16px; font-size:15px; outline:none; transition:all .3s ease; }
        .inp-light:focus { border-color:#febd69; box-shadow:0 0 15px rgba(254,189,105,.2); background:#ffffff; }
        .inp-light::placeholder { color:#94a3b8; }
        .inp-light:-webkit-autofill { -webkit-box-shadow:0 0 0 100px #f8fafc inset !important; -webkit-text-fill-color:#1e293b !important; }
        .glass-panel { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.5); }
      `}</style>

      <Particles />

      {/* Modern Ambient Glows for the background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-amazon-orange rounded-full mix-blend-multiply filter blur-[100px] opacity-[0.15] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-amazon-yellow rounded-full mix-blend-multiply filter blur-[100px] opacity-[0.15] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Left decorative panel — hidden on mobile */}
      <div className="hidden lg:flex flex-col justify-center items-center w-5/12 relative px-12 lg-left">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(#1e293b 1px,transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative z-10 text-center">
          <div className="flex justify-center mb-6 drop-shadow-lg"><BrandLogo className="h-24" /></div>
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amazon-blue to-gray-800 dark:from-white dark:to-gray-300 mb-4 leading-tight tracking-tight">OmniKart</h1>
          <p className="text-gray-600 text-lg leading-relaxed max-w-xs font-medium">
            Discover millions of products across 14 categories at unbeatable prices
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 max-w-xs">
            {[["250+", "Products"], ["14", "Categories"], ["⭐ 4.8", "Rating"], ["Free", "Shipping*"]].map(([val, lbl]) => (
              <div key={lbl} className="bg-white bg-opacity-80 rounded-2xl p-4 shadow-sm border border-gray-100 hover:-translate-y-1 transition-transform duration-300">
                <p className="text-amazon-orange font-black text-xl">{val}</p>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mt-1">{lbl.replace('⭐ ', '')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg-right relative z-10">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3 drop-shadow-lg">
              <BrandLogo className="h-12" />
            </Link>
          </div>

          <div className="glass-panel rounded-3xl shadow-xl p-8 sm:p-10 relative overflow-hidden">
            {/* Subtle top edge highlight */}
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-amazon-yellow to-amazon-orange opacity-80"></div>
            
            <div className="mb-8 text-center sm:text-left">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Welcome back</h2>
              <p className="text-gray-500 text-sm font-medium">Sign in to continue shopping on OmniKart</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Email Address</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"><FaEnvelope /></span>
                  <input type="email" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    onFocus={() => setFocused("email")} onBlur={() => setFocused("")}
                    className="inp-light" style={{ paddingLeft: "48px" }} placeholder="you@gmail.com" required />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">Password</label>
                  <button type="button" className="text-xs text-amazon-blue font-bold hover:text-amazon-orange transition-colors">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"><FaLock /></span>
                  <input type={showPwd ? "text" : "password"} value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    onFocus={() => setFocused("pwd")} onBlur={() => setFocused("")}
                    className="inp-light" style={{ paddingLeft: "48px", paddingRight: "48px" }} placeholder="Your password" required />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors text-lg flex items-center justify-center">
                    {showPwd ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full mt-2 py-4 rounded-xl font-bold text-[#131921] text-lg transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 relative overflow-hidden group"
                style={{ background: "linear-gradient(135deg, #febd69, #f90)", boxShadow: "0 8px 25px rgba(254,189,105,0.25)" }}>
                <span className="absolute inset-0 w-full h-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
                {loading
                  ? <><span className="w-5 h-5 border-2 border-[#131921] border-t-transparent rounded-full lg-spin" />Signing in…</>
                  : "Sign In"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">OR</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                [<FaShoppingCart />, "Easy Cart"], 
                [<FaBox />, "Fast Delivery"], 
                [<FaUndo />, "30-Day Returns"]
              ].map(([icon, text], i) => (
                <div key={i} className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100 hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                  <p className="text-xl mb-1.5 text-gray-700 flex justify-center">{icon}</p>
                  <p className="text-xs text-gray-600 font-bold">{text}</p>
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-gray-500 font-medium">
              New to OmniKart?{" "}
              <Link to="/register" className="text-amazon-blue hover:text-amazon-orange font-bold transition-colors">
                Create Account →
              </Link>
            </p>
          </div>

          <p className="flex items-center justify-center gap-1 text-xs text-gray-400 font-medium mt-6">
            <FaShieldAlt /> Protected by industry-standard encryption
          </p>
        </div>
      </div>
    </div>
  );
}
