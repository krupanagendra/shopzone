import { useEffect, useState } from "react";
import { adminAPI } from "../../services/api";
import Spinner from "../../components/common/Spinner";
import { toast } from "react-toastify";
import { FaTrash, FaUserShield } from "react-icons/fa";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    adminAPI.getAllUsers().then((r) => { setUsers(r.data); setLoading(false); });
  };
  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete user?")) return;
    await adminAPI.deleteUser(id);
    toast.success("Deleted");
    fetchUsers();
  };

  const toggleAdmin = async (id, role) => {
    await adminAPI.updateUserRole(id, { role: role === "admin" ? "user" : "admin" });
    toast.success("Role updated");
    fetchUsers();
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Users ({users.length})</h1>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>{["Name","Email","Role","Joined","Actions"].map((h)=><th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
            <tbody className="divide-y">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${u.role === "admin" ? "bg-orange-100 text-orange-600 font-semibold" : "bg-gray-100 text-gray-600"}`}>{u.role}</span></td>
                  <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => toggleAdmin(u._id, u.role)} className="text-orange-500 hover:text-orange-700 text-sm" title="Toggle admin"><FaUserShield /></button>
                      <button onClick={() => handleDelete(u._id)} className="text-red-500 hover:text-red-700"><FaTrash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;