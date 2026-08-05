import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT Bearer token
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 (expired token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid — clear auth
      localStorage.removeItem('token');
      localStorage.removeItem('email');
      localStorage.removeItem('role');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('email');
      sessionStorage.removeItem('role');

      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// Farmer Profile API
export const farmerProfileAPI = {
  getProfile: () => api.get('/farmer/profile'),
  createProfile: (data) => api.post('/farmer/profile', data),
  updateProfile: (data) => api.put('/farmer/profile', data),
};

// Farmer Verification API
// The verification form posts multipart/form-data (fields + documents).
export const farmerVerificationAPI = {
  getVerification: () => api.get('/farmer/profile/verification'),
  submitVerification: (formData) =>
    api.post('/farmer/profile/verification', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Farmer Products API
export const farmerProductsAPI = {
  createProduct: (data) => api.post('/farmer/products', data),
  getMyProducts: () => api.get('/farmer/products/my-products'),
  getProductById: (id) => api.get(`/farmer/products/${id}`),
  updateProduct: (id, data) => api.put(`/farmer/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/farmer/products/${id}`),

  // Upload (or replace) the image of an existing product.
  // Sends multipart/form-data. The Content-Type is overridden to
  // multipart/form-data because this axios instance defaults to
  // application/json, which would make axios's transformRequest
  // JSON-stringify the FormData instead of uploading it as a file
  // (the browser appends the boundary automatically).
  uploadProductImage: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/farmer/products/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Buyer Products API
export const buyerProductsAPI = {
  getAllProducts: () => api.get('/buyer/products'),
  getProductById: (id) => api.get(`/buyer/products/${id}`),
  getProductsByCategory: (category) =>
    api.get(`/buyer/products/category/${encodeURIComponent(category)}`),
};

// Buyer Reviews API
export const buyerReviewsAPI = {
  getReviews: (productId) =>
    api.get(`/buyer/products/${productId}/reviews`),
  getMyReview: (productId) =>
    api.get(`/buyer/products/${productId}/reviews/mine`),
  createReview: (productId, data) =>
    api.post(`/buyer/products/${productId}/reviews`, data),
  updateReview: (reviewId, data) =>
    api.put(`/buyer/reviews/${reviewId}`, data),
  deleteReview: (reviewId) =>
    api.delete(`/buyer/reviews/${reviewId}`),
};

// Buyer Wishlist API
export const buyerWishlistAPI = {
  getWishlist: () => api.get('/buyer/wishlist'),
  add: (productId) => api.post(`/buyer/wishlist/${productId}`),
  remove: (productId) => api.delete(`/buyer/wishlist/${productId}`),
  check: (productId) => api.get(`/buyer/wishlist/check/${productId}`),
};

// Notifications API
export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  getUnread: () => api.get('/notifications/unread'),
  getUnreadCount: () => api.get('/notifications/unread/count'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  clearAll: () => api.delete('/notifications'),
};

// Buyer Orders API
export const buyerOrdersAPI = {
  placeOrder: (data) => api.post('/buyer/orders', data),
  getMyOrders: () => api.get('/buyer/orders'),
};

// Farmer Orders API
export const farmerOrdersAPI = {
  getOrders: () => api.get('/farmer/orders'),
  updateStatus: (orderId, status) =>
    api.put(`/farmer/orders/${orderId}/status`, { status }),
};

// Analytics API
// Each dashboard fetches its full payload from a single endpoint;
// the dedicated series endpoints support drill-down.
export const analyticsAPI = {
  // Admin
  adminAnalytics: () => api.get('/admin/analytics'),
  adminRevenue: () => api.get('/admin/analytics/revenue'),
  adminOrders: () => api.get('/admin/analytics/orders'),
  topProducts: () => api.get('/admin/top-products'),
  topFarmers: () => api.get('/admin/top-farmers'),
  topBuyers: () => api.get('/admin/top-buyers'),
  // Farmer
  farmerAnalytics: () => api.get('/farmer/analytics'),
  farmerSales: () => api.get('/farmer/analytics/sales'),
  // Buyer
  buyerAnalytics: () => api.get('/buyer/analytics'),
  buyerSpending: () => api.get('/buyer/analytics/spending'),
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getAllUsers: () => api.get('/admin/users'),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getAllProducts: () => api.get('/admin/products'),
  getAllOrders: () => api.get('/admin/orders'),
  getUnverifiedFarmers: () => api.get('/admin/farmers/unverified'),
  verifyFarmer: (profileId) => api.put(`/admin/farmers/${profileId}/verify`),
  rejectFarmer: (profileId, reason) =>
    api.put(`/admin/farmers/${profileId}/reject`, { reason }),
};

// ==========================================
// ERROR MESSAGE HELPER
// ==========================================

/**
 * Extracts a clear, user-friendly message from an API failure.
 * Priority: server-provided message > validation field error >
 * connection / server outage > the provided fallback.
 * The fallback must be a meaningful, context-specific message.
 */
export function getErrorMessage(err, fallback) {
  if (err?.response) {
    const data = err.response.data;

    // Plain-string error body (some auth endpoints)
    if (typeof data === 'string' && data.trim()) {
      return data;
    }

    // Server-provided message (e.g. "Email already in use")
    const serverMessage = data?.message;
    if (typeof serverMessage === 'string' && serverMessage.trim()) {
      return serverMessage;
    }

    // Bean-validation field errors — array (Spring default) or map form
    const errors = data?.errors;
    if (errors) {
      if (Array.isArray(errors)) {
        const first = errors[0]?.defaultMessage;
        if (typeof first === 'string' && first.trim()) return first;
      } else if (typeof errors === 'object') {
        const firstValue = Object.values(errors)[0];
        if (typeof firstValue === 'string' && firstValue.trim()) {
          return firstValue;
        }
      }
    }

    // Server-side outage
    if (err.response.status >= 500) {
      return 'The server is having trouble right now. Please try again in a few moments.';
    }
  } else {
    // No response at all — network or backend unreachable
    return 'Unable to reach the server. Please check your connection and try again.';
  }

  return fallback;
}

export default api;
