import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// ── Trucks ────────────────────────────────────────────────
export const trucksAPI = {
  getAll: () => api.get('/trucks'),
  getById: (id) => api.get(`/trucks/${id}`),
  getNumbers: () => api.get('/trucks/numbers'),
  add: (data) => api.post('/trucks', data),
  update: (id, data) => api.put(`/trucks/${id}`, data),
  delete: (id) => api.delete(`/trucks/${id}`),
};

// ── Drivers ───────────────────────────────────────────────
export const driversAPI = {
  getAll: () => api.get('/drivers'),
  getById: (id) => api.get(`/drivers/${id}`),
  add: (data) => api.post('/drivers', data),
  update: (id, data) => api.put(`/drivers/${id}`, data),
  delete: (id) => api.delete(`/drivers/${id}`),
};

// ── Fuel ──────────────────────────────────────────────────
export const fuelAPI = {
  getAll: () => api.get('/fuel'),
  add: (data) => api.post('/fuel', data),
  update: (id, data) => api.put(`/fuel/${id}`, data),
  delete: (id) => api.delete(`/fuel/${id}`),
  getByTruck: (truckNumber) => api.get(`/fuel/truck/${truckNumber}`),
  getMonthly: (month, year) => api.get(`/fuel/monthly?month=${month}&year=${year}`),
  getExcessReport: (month, year) => api.get(`/fuel/excess-report?month=${month}&year=${year}`),
};

// ── Trips ─────────────────────────────────────────────────
export const tripsAPI = {
  getAll: () => api.get('/trips'),
  getById: (id) => api.get(`/trips/${id}`),
  add: (data) => api.post('/trips', data),
  update: (id, data) => api.put(`/trips/${id}`, data),
  delete: (id) => api.delete(`/trips/${id}`),
  getByTruck: (truckNumber) => api.get(`/trips/truck/${truckNumber}`),
  getSummary: () => api.get('/trips/summary'),
};

// ── Spare Parts ───────────────────────────────────────────
export const sparePartsAPI = {
  getAll: () => api.get('/spare-parts'),
  add: (data) => api.post('/spare-parts', data),
  update: (id, data) => api.put(`/spare-parts/${id}`, data),
  delete: (id) => api.delete(`/spare-parts/${id}`),
  getPurchases: () => api.get('/spare-parts/purchases'),
  purchase: (data) => api.post('/spare-parts/purchases', data),
  updatePurchase: (id, data) => api.put(`/spare-parts/purchases/${id}`, data),
  deletePurchase: (id) => api.delete(`/spare-parts/purchases/${id}`),
  getIssues: () => api.get('/spare-parts/issues'),
  getIssuesByTruck: (truckNumber) => api.get(`/spare-parts/issues/truck/${truckNumber}`),
  issue: (data) => api.post('/spare-parts/issues', data),
  getStockReport: () => api.get('/spare-parts/stock-report'),
  deleteIssue: (id) => api.delete(`/spare-parts/issues/${id}`),
  cancelIssue: (id, data) => api.put(`/spare-parts/issues/${id}/cancel`, data),
};

// ── Tyres ─────────────────────────────────────────────────
export const tyresAPI = {
  getAll: () => api.get('/tyres'),
  add: (data) => api.post('/tyres', data),
  update: (id, data) => api.put(`/tyres/${id}`, data),
  delete: (id) => api.delete(`/tyres/${id}`),
  purchase: (data) => api.post('/tyres/purchases', data),
  getIssues: () => api.get('/tyres/issues'),
  getIssuesByTruck: (truckNumber) => api.get(`/tyres/issues/truck/${truckNumber}`),
  issue: (data) => api.post('/tyres/issues', data),
  updateIssue: (id, data) => api.put(`/tyres/issues/${id}`, data),
  deleteIssue: (id) => api.delete(`/tyres/issues/${id}`),
  getStockReport: () => api.get('/tyres/stock-report'),
  swapTyre: (data) => api.post('/tyres/swap', data),
};

// ── Maintenance ───────────────────────────────────────────
export const maintenanceAPI = {
  getAll: () => api.get('/maintenance'),
  getById: (id) => api.get(`/maintenance/${id}`),
  add: (data) => api.post('/maintenance', data),
  update: (id, data) => api.put(`/maintenance/${id}`, data),
  delete: (id) => api.delete(`/maintenance/${id}`),
  getByTruck: (truckNumber) => api.get(`/maintenance/truck/${truckNumber}`),
};

// ── Admin Users ───────────────────────────────────────────
export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  assignModules: (id, data) => api.put(`/admin/users/${id}/assign-modules`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};

export default api;

// ── Revenue ───────────────────────────────────────────────
export const revenueAPI = {
  getAll: (params) => api.get('/revenues', { params }),
  getSummary: (params) => api.get('/revenues/summary', { params }),
  add: (data) => api.post('/revenues', data),
  update: (id, data) => api.put(`/revenues/${id}`, data),
  delete: (id) => api.delete(`/revenues/${id}`),
  bulkImport: (data) => api.post('/revenues/bulk', data),
};

// ── Expenditure ───────────────────────────────────────────
export const expenditureAPI = {
  getAll: (params) => api.get('/expenditures', { params }),
  getSummary: (params) => api.get('/expenditures/summary', { params }),
  add: (data) => api.post('/expenditures', data),
  update: (id, data) => api.put(`/expenditures/${id}`, data),
  delete: (id) => api.delete(`/expenditures/${id}`),
  bulkImport: (data) => api.post('/expenditures/bulk', data),
};
