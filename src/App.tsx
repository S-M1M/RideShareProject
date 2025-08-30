import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// User Pages
import Login from './pages/user/Login';
import Register from './pages/user/Register';
import Dashboard from './pages/user/Dashboard';
import Profile from './pages/user/Profile';
import MyRides from './pages/user/MyRides';
import MapView from './pages/user/MapView';
import Subscription from './pages/user/Subscription';

// Driver Pages
import DriverLogin from './pages/driver/DriverLogin';
import DriverDashboard from './pages/driver/DriverDashboard';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import DriverManagement from './pages/admin/DriverManagement';
import RouteAssignment from './pages/admin/RouteAssignment';
import Finance from './pages/admin/Finance';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/driver/login" element={<DriverLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected User Routes */}
          <Route element={<ProtectedRoute userType="user" />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/my-rides" element={<MyRides />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/subscription" element={<Subscription />} />
            </Route>
          </Route>

          {/* Protected Driver Routes */}
          <Route element={<ProtectedRoute userType="driver" />}>
            <Route element={<Layout />}>
              <Route path="/driver/dashboard" element={<DriverDashboard />} />
            </Route>
          </Route>

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute userType="admin" />}>
            <Route element={<Layout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/drivers" element={<DriverManagement />} />
              <Route path="/admin/routes" element={<RouteAssignment />} />
              <Route path="/admin/finance" element={<Finance />} />
            </Route>
          </Route>

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
