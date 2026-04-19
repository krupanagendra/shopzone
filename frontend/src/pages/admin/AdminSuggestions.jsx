import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { suggestionAPI } from '../../services/api';
import Spinner from '../../components/common/Spinner';

const AdminSuggestions = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchSuggestions = async () => {
    try {
      const { data } = await suggestionAPI.getSuggestions();
      setSuggestions(data.data);
    } catch (err) {
      toast.error('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const handleStatusUpdate = async (id, currentStatus) => {
    const newStatus = currentStatus === 'pending' ? 'reviewed' : 'pending';
    try {
      await suggestionAPI.updateStatus(id, { status: newStatus });
      toast.success(`Marked as ${newStatus}`);
      setSuggestions(suggestions.map(s => s._id === id ? { ...s, status: newStatus } : s));
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const filteredSuggestions = suggestions.filter(s => 
    filterStatus === 'all' ? true : s.status === filterStatus
  );

  if (loading) return (
    <div className="flex justify-center items-center min-h-[400px]">
      <Spinner size="lg" color="indigo" />
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Product Suggestions</h1>
          <p className="text-gray-500 text-sm mt-1">Manage product ideas submitted by customers.</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-600">Filter Status:</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="all">All Suggestions</option>
            <option value="pending">Pending Review</option>
            <option value="reviewed">Reviewed</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Product</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Price</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredSuggestions.length > 0 ? filteredSuggestions.map((s) => (
                <tr key={s._id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{s.productName}</div>
                    <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={s.description}>{s.description}</div>
                    {s.referenceLink && (
                      <a href={s.referenceLink} target="_blank" rel="noreferrer" className="text-indigo-600 text-[10px] hover:underline mt-1 block font-medium">
                        🔗 External Reference
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                      {s.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-gray-800">₹{s.expectedPrice.toLocaleString('en-IN')}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700">{s.customerEmail}</div>
                    <div className="text-[10px] text-gray-400 mt-1">{new Date(s.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      s.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleStatusUpdate(s._id, s.status)}
                      className={`text-xs px-3 py-1.5 rounded-lg transition-all hover:scale-105 ${
                        s.status === 'pending' 
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200'
                          : 'bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50'
                      }`}
                    >
                      {s.status === 'pending' ? 'Mark Reviewed' : 'Mark Pending'}
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400 italic">
                    No suggestions found for the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSuggestions;
