import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const res = await api.get("/auth/me");
        setUser(res.data.user);
      } catch (err) {
        console.error(err);
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (credentials, role = "user") => {
    try {
      const endpoint =
        role === "driver"
          ? "/auth/driver/login"
          : role === "admin"
            ? "/auth/admin/login"
            : "/auth/login";
      const res = await api.post(endpoint, credentials);
      localStorage.setItem("token", res.data.token);
      await loadUser(); // Fetch user after login
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Login failed",
      };
    }
  };

  const register = async (userData, role = "user") => {
    try {
      const endpoint =
        role === "driver"
          ? "/auth/driver/register"
          : role === "admin"
            ? "/auth/admin/register"
            : "/auth/register";
      const res = await api.post(endpoint, userData);
      localStorage.setItem("token", res.data.token);
      setUser(res.data.user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Registration failed",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    reloadUser: loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
