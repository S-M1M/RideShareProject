import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  console.log("ProtectedRoute:", { user, loading, role }); // Add debugging

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    const redirectPath =
      role === "driver"
        ? "/driver/login"
        : role === "admin"
          ? "/admin/login"
          : "/login";
    console.log("Redirecting to:", redirectPath); // Add debugging
    return <Navigate to={redirectPath} replace />;
  }

  if (role && !Array.isArray(role) && user.role !== role) {
    console.log("Wrong role, redirecting to login"); // Add debugging
    return <Navigate to="/login" replace />;
  }

  if (role && Array.isArray(role) && !role.includes(user.role)) {
    console.log("Wrong role, redirecting to login"); // Add debugging
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
