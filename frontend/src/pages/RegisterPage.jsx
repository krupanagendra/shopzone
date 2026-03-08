import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { register } from "../redux/slices/authSlice";
import { toast } from "react-toastify";

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error("Passwords do not match"); return; }
    const res = await dispatch(register(form));
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Registered successfully!");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Create Account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[["name", "Full Name", "text"], ["email", "Email", "email"], ["password", "Password", "password"], ["confirmPassword", "Confirm Password", "password"]].map(([key, label, type]) => (
            <div key={key}>
              <label className="block text-sm font-semibold mb-1">{label}</label>
              <input type={type} value={form[key]} onChange={(e) => setForm({...form, [key]: e.target.value})} className="input-field" required />
            </div>
          ))}
          <button type="submit" disabled={loading} className="w-full btn-primary py-3 disabled:opacity-50">
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>
        <p className="text-center mt-4 text-sm text-gray-600">Already have an account? <Link to="/login" className="text-amazon-blue hover:underline font-semibold">Sign In</Link></p>
      </div>
    </div>
  );
};

export default RegisterPage;