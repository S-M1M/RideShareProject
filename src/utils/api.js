import axios from "axios";

// Use environment variable for API URL, fallback to production URL
// In development (localhost), Vite proxy will handle /api requests
// In production (Netlify), it will use the full Render URL
const getBaseURL = () => {
  // Check if we're in development mode (localhost)
  if (import.meta.env.DEV) {
    // Use relative path - Vite proxy will forward to localhost:5000
    return "/api";
  }
  // Production - use full Render URL
  return (
    import.meta.env.VITE_API_URL ||
    "https://rideshareproject-vyu1.onrender.com/api"
  );
};

const api = axios.create({
  baseURL: getBaseURL(),
});

// Add a request interceptor to include the token in headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
