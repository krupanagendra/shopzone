import { useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { suggestionAPI } from '../services/api';
import Spinner from '../components/common/Spinner';

const SuggestProductPage = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    productName: '',
    category: '',
    description: '',
    expectedPrice: '',
    referenceLink: '',
    customerEmail: userInfo?.email || '',
  });

  const [loading, setLoading] = useState(false);

  const { productName, category, description, expectedPrice, referenceLink, customerEmail } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!productName || !category || !description || !expectedPrice || !customerEmail) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await suggestionAPI.createSuggestion(formData);
      toast.success('Thank you! Your suggestion will be considered shortly by our team.');
      setFormData({
        productName: '',
        category: '',
        description: '',
        expectedPrice: '',
        referenceLink: '',
        customerEmail: userInfo?.email || '',
      });
      // Optionally navigate away or stay
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit suggestion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-amazon-blue px-8 py-10 text-white text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">Suggest a New Product</h1>
          <p className="mt-2 text-blue-100 opacity-80">
            Tell us what you'd like to see in our shop! Our AI team and admins will review it.
          </p>
        </div>

        <form onSubmit={onSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Name */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 block">Product Name *</label>
              <input
                type="text"
                name="productName"
                value={productName}
                onChange={onChange}
                placeholder="e.g. Sony WH-1000XM5 Headphones"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amazon-yellow focus:border-transparent transition-all outline-none"
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 block">Product Category *</label>
              <select
                name="category"
                value={category}
                onChange={onChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amazon-yellow focus:border-transparent transition-all outline-none"
                required
              >
                <option value="">Select Category</option>
                <option value="Electronics">Electronics</option>
                <option value="Clothing">Clothing</option>
                <option value="Home & Kitchen">Home & Kitchen</option>
                <option value="Books">Books</option>
                <option value="Gaming">Gaming</option>
                <option value="Cameras">Cameras</option>
                <option value="Sports">Sports</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Expected Price */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 block">Expected Price (₹) *</label>
              <input
                type="number"
                name="expectedPrice"
                value={expectedPrice}
                onChange={onChange}
                placeholder="e.g. 25000"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amazon-yellow focus:border-transparent transition-all outline-none"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 block">Your Email Address *</label>
              <input
                type="email"
                name="customerEmail"
                value={customerEmail}
                onChange={onChange}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amazon-yellow focus:border-transparent transition-all outline-none"
                required
                disabled={!!userInfo}
              />
              {userInfo && <p className="text-xs text-gray-400">Logged in as {userInfo.email}</p>}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700 block">Detailed Description *</label>
            <textarea
              name="description"
              value={description}
              onChange={onChange}
              rows="4"
              placeholder="Tell us why this product is great and why we should stock it!"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amazon-yellow focus:border-transparent transition-all outline-none resize-none"
              required
            ></textarea>
          </div>

          {/* Reference Link */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700 block">Reference / Buy Link (Optional)</label>
            <input
              type="url"
              name="referenceLink"
              value={referenceLink}
              onChange={onChange}
              placeholder="https://amazon.com/product/..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amazon-yellow focus:border-transparent transition-all outline-none"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transform transition-all active:scale-95 ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-amazon-yellow hover:bg-amazon-orange text-black hover:shadow-xl'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Spinner size="sm" color="black" />
                  <span>Submitting Suggestion...</span>
                </div>
              ) : (
                'Submit Product Suggestion'
              )}
            </button>
          </div>
        </form>

        <div className="bg-amber-50 px-8 py-6 border-t border-amber-100">
          <p className="text-sm text-amber-800 flex items-center gap-2">
            <span className="font-medium">We value your input!</span> Your suggestion will be saved and reviewed by our admin team shortly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuggestProductPage;
