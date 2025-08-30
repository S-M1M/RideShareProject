import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  driverLogin: (data) => api.post('/auth/driver/login', data),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getStats: () => api.get('/users/stats'),
};

// Subscription API
export const subscriptionAPI = {
  create: (data) => api.post('/subscriptions', data),
  getAll: () => api.get('/subscriptions'),
  cancel: (id) => api.put(`/subscriptions/${id}/cancel`),
};

// Ride API
export const rideAPI = {
  getAll: () => api.get('/rides'),
  getToday: () => api.get('/rides/today'),
  cancel: (id) => api.put(`/rides/${id}/cancel`),
};

// Driver API
export const driverAPI = {
  getTodayRoutes: () => api.get('/drivers/routes/today'),
  updateRouteStatus: (id, status) => api.put(`/drivers/routes/${id}/status`, { status }),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: () => api.get('/admin/users'),
  getDrivers: () => api.get('/admin/drivers'),
  addDriver: (data) => api.post('/admin/drivers', data),
  getVehicles: () => api.get('/admin/vehicles'),
  addVehicle: (data) => api.post('/admin/vehicles', data),
  assignRoute: (data) => api.post('/admin/routes', data),
};

export default api;