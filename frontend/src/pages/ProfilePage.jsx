import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateProfile } from "../redux/slices/authSlice";
import { toast } from "react-toastify";
import { FaUser } from "react-icons/fa";

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { userInfo, loading } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  useEffect(() => {
    if (userInfo) setForm({ name: userInfo.name, email: userInfo.email, password: "" });
  }, [userInfo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { name: form.name, email: form.email };
    if (form.password) payload.password = form.password;
    const res = await dispatch(updateProfile(payload));
    if (res.meta.requestStatus === "fulfilled") toast.success("Profile updated!");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-16 h-16 rounded-full bg-amazon-blue flex items-center justify-center">
            <FaUser className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{userInfo?.name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full ${userInfo?.role === "admin" ? "bg-orange-100 text-orange-600 font-semibold" : "bg-gray-100 text-gray-600"}`}>
              {userInfo?.role}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Full Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">New Password (leave blank to keep current)</label>
            <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className="input-field" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary py-3 w-full">
            {loading ? "Updating..." : "Update Profile"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;