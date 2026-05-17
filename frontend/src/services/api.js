import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({ baseURL: `${API_URL.replace(/\/$/, '')}/api` });

api.interceptors.request.use((config) => {
  const userInfo = localStorage.getItem('userInfo');
  if (userInfo) {
    const { token } = JSON.parse(userInfo);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('userInfo');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Products
export const productAPI = {
  getProducts: (params) => api.get('/products', { params }),
  getProductById: (id) => api.get(`/products/${id}`),
  getCategories: () => api.get('/products/categories'),
  getFeatured: () => api.get('/products/featured'),
  createProduct: (data) => api.post('/products', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateProduct: (id, data) => api.put(`/products/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  createReview: (id, data) => api.post(`/products/${id}/reviews`, data instanceof FormData ? data : data, data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}),
  createReviewJSON: (id, data) => api.post(`/products/${id}/reviews`, data),
  getSimilarProducts: (id) => api.get(`/products/${id}/similar`),
  getReviewSummary: (id) => api.get(`/products/${id}/review-summary`),
};

// Cart
export const cartAPI = {
  getCart: () => api.get('/cart'),
  addToCart: (data) => api.post('/cart', data),
  updateCartItem: (itemId, data) => api.put(`/cart/${itemId}`, data),
  removeFromCart: (itemId) => api.delete(`/cart/${itemId}`),
  clearCart: () => api.delete('/cart/clear'),
};

// Orders
export const orderAPI = {
  createOrder: (data) => api.post('/orders', data),
  getMyOrders: () => api.get('/orders/mine'),
  getOrderById: (id) => api.get(`/orders/${id}`),
  getAllOrders: () => api.get('/orders'),
  updateOrderStatus: (id, data) => api.put(`/orders/${id}/status`, data),
};

// Payment (Razorpay) — with timeout to prevent indefinite hanging
export const paymentAPI = {
  createOrder: () => api.post('/payment/create-order', {}, { timeout: 20000 }),
  verifyPayment: (data) => api.post('/payment/verify', data, { timeout: 20000 }),
  getKey: () => api.get('/payment/key', { timeout: 10000 }),
};

// Wishlist
export const wishlistAPI = {
  getWishlist: () => api.get('/wishlist'),
  toggleWishlist: (productId) => api.post(`/wishlist/${productId}`),
};

// Admin
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getAllUsers: () => api.get('/admin/users'),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  updateUserRole: (id, data) => api.put(`/admin/users/${id}/role`, data),
};

// System Monitoring
export const systemAPI = {
  getStatus: () => api.get('/system/status', { timeout: 5000 }),
  getDashboardStats: () => api.get('/system/dashboard-stats', { timeout: 8000 }),
  triggerAgent: (agent) => api.post('/system/trigger-agent', { agent }),
};

// Admin AI
export const adminAiAPI = {
  getLogs: () => api.get('/admin-ai/logs', { timeout: 5000 }),
  queryAI: (data) => api.post('/admin-ai/query', data, { timeout: 20000 }), // Long timeout for LLM inference
};

// Suggestions
export const suggestionAPI = {
  createSuggestion: (data) => api.post('/suggestions', data),
  getSuggestions: () => api.get('/suggestions'),
  updateStatus: (id, data) => api.patch(`/suggestions/${id}`, data),
};

export default api;