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
};

// Farmer Profile API
export const farmerProfileAPI = {
  getProfile: () => api.get('/farmer/profile'),
  createProfile: (data) => api.post('/farmer/profile', data),
  updateProfile: (data) => api.put('/farmer/profile', data),
};

// Farmer Products API
export const farmerProductsAPI = {
  createProduct: (data) => api.post('/farmer/products', data),
  getMyProducts: () => api.get('/farmer/products/my-products'),
  getProductById: (id) => api.get(`/farmer/products/${id}`),
  updateProduct: (id, data) => api.put(`/farmer/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/farmer/products/${id}`),
};

// Buyer Products API
export const buyerProductsAPI = {
  getAllProducts: () => api.get('/buyer/products'),
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
