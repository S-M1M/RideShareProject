import axios from "axios";

// Use environment variable for API URL, fallback to production URL
// In development (localhost), Vite proxy will handle /api requests
// In production (Netlify), it will use the full Render URL
const getBaseURL = () => {
  // Check if we're in development mode (localhost)
  if (import.meta.env.DEV) {
    // Use relative path - Vite proxy will forward to localhost:5000
    console.log("Development mode: Using Vite proxy /api");
    return "/api";
  }
  // Production - use full Render URL
  const apiUrl = import.meta.env.VITE_API_URL || "https://rideshareproject-vyu1.onrender.com/api";
  console.log("Production mode: Using API URL:", apiUrl);
  return apiUrl;
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000, // 30 second timeout for slow Render cold starts
});

// Add a request interceptor to include the token in headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`API Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error(`API Error Response: ${error.response.status}`, error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error("API No Response:", error.message);
      console.error("Check if backend server is running at:", getBaseURL());
    } else {
      // Something else happened
      console.error("API Setup Error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
