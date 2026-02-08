import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  getPermissions: () => api.get('/auth/permissions'),
};

// Users API
export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// Categories API
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Products API
export const productsAPI = {
  getAll: () => api.get('/products'),
  search: (query) => api.get(`/products/search?q=${query}`),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  importExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/products/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  exportExcel: () => api.get('/products/export', { responseType: 'blob' }),
};

// Customers API
export const customersAPI = {
  getAll: () => api.get('/customers'),
  getById: (id) => api.get(`/customers/${id}`),
  getHistory: (id) => api.get(`/customers/${id}/history`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

// Sales API
export const salesAPI = {
  getAll: (limit = 100) => api.get(`/sales?limit=${limit}`),
  getById: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  anular: (id) => api.post(`/sales/${id}/anular`),
};

// Quotes API
export const quotesAPI = {
  getAll: () => api.get('/quotes'),
  getById: (id) => api.get(`/quotes/${id}`),
  create: (data) => api.post('/quotes', data),
  update: (id, data) => api.put(`/quotes/${id}`, data),
  convertToSale: (id) => api.post(`/quotes/${id}/convertir`),
};

// Dashboard Stats API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

// Warehouses API
export const warehousesAPI = {
  getAll: () => api.get('/warehouses'),
  create: (data) => api.post('/warehouses', data),
  update: (id, data) => api.put(`/warehouses/${id}`, data),
  delete: (id) => api.delete(`/warehouses/${id}`),
};

// Suppliers API
export const suppliersAPI = {
  getAll: () => api.get('/suppliers'),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
  importPrices: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/suppliers/${id}/import-prices`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Purchases API
export const purchasesAPI = {
  getAll: () => api.get('/purchases'),
  create: (data) => api.post('/purchases', data),
  receive: (id) => api.post(`/purchases/${id}/receive`),
};

// Supplier Prices API
export const supplierPricesAPI = {
  getProductPrices: (productId) => api.get(`/products/${productId}/prices`),
  comparePrices: (productId) => api.get(`/products/${productId}/compare-prices`),
  addPrice: (data) => api.post('/supplier-prices', data),
};

// Product Stock API
export const productStockAPI = {
  getByWarehouse: (productId) => api.get(`/products/${productId}/stock-by-warehouse`),
};

export default api;
