import { useEffect, useState } from "react";
import { productAPI } from "../../services/api";
import Spinner from "../../components/common/Spinner";
import { toast } from "react-toastify";
import { FaTrash, FaEdit, FaPlus } from "react-icons/fa";

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({ name: "", brand: "", category: "", description: "", price: "", countInStock: "", image: "" });

  const fetchProducts = () => {
    productAPI.getProducts({ pageSize: 100 }).then((r) => { setProducts(r.data.products); setLoading(false); });
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editProduct) {
        await productAPI.updateProduct(editProduct._id, form);
        toast.success("Product updated!");
      } else {
        await productAPI.createProduct(form);
        toast.success("Product created!");
      }
      setShowForm(false);
      setEditProduct(null);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const handleEdit = (p) => {
    setEditProduct(p);
    setForm({ name: p.name, brand: p.brand, category: p.category, description: p.description, price: p.price, countInStock: p.countInStock, image: p.image });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    await productAPI.deleteProduct(id);
    toast.success("Deleted");
    fetchProducts();
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products ({products.length})</h1>
        <button onClick={() => { setShowForm(true); setEditProduct(null); setForm({ name:"",brand:"",category:"",description:"",price:"",countInStock:"",image:"" }); }}
          className="btn-primary flex items-center gap-2"><FaPlus /> Add Product</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="font-bold mb-4">{editProduct ? "Edit Product" : "Add New Product"}</h2>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
            {[["name","Name"],["brand","Brand"],["category","Category"],["price","Price"],["countInStock","Stock"],["image","Image URL"]].map(([key,label]) => (
              <div key={key}>
                <label className="block text-sm font-semibold mb-1">{label}</label>
                <input type={["price","countInStock"].includes(key) ? "number" : "text"} value={form[key]} onChange={(e) => setForm({...form,[key]:e.target.value})} className="input-field" required={key !== "image"} />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="input-field" rows={3} required />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary px-6">{editProduct ? "Update" : "Create"}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary px-6">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>{["Image","Name","Category","Price","Stock","Actions"].map((h) => <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
            <tbody className="divide-y">
              {products.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded" onError={(e)=>{e.target.src="https://via.placeholder.com/40"}} /></td>
                  <td className="px-4 py-3 max-w-xs truncate">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500">{p.category}</td>
                  <td className="px-4 py-3 font-semibold">${p.price}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs ${p.countInStock === 0 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>{p.countInStock}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(p)} className="text-blue-500 hover:text-blue-700"><FaEdit /></button>
                      <button onClick={() => handleDelete(p._id)} className="text-red-500 hover:text-red-700"><FaTrash /></button>
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

export default AdminProducts;