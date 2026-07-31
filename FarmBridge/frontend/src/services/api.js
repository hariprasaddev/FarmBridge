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

export default api;
