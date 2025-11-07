import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { Users, Car, Calendar, DollarSign, Truck, MapPin } from "lucide-react";
import api from "../../utils/api";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get("/admin/dashboard");
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Admin Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Admin Dashboard">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalUsers || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Active Subscriptions
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.activeSubscriptions || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Car className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Today's Rides
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.todayRides || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Truck className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Drivers
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalDrivers || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MapPin className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Vehicles
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalVehicles || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Revenue
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${stats.totalRevenue || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <button
            onClick={() => navigate("/admin/users")}
            className="bg-white border border-gray-200 rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-center"
          >
            <Users className="h-8 w-8 mx-auto mb-3 text-blue-600" />
            <span className="block font-medium text-gray-900">Manage Users</span>
          </button>

          <button
            onClick={() => navigate("/admin/drivers")}
            className="bg-white border border-gray-200 rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-center"
          >
            <Truck className="h-8 w-8 mx-auto mb-3 text-green-600" />
            <span className="block font-medium text-gray-900">Manage Drivers</span>
          </button>

          <button
            onClick={() => navigate("/admin/vehicles")}
            className="bg-white border border-gray-200 rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-center"
          >
            <Car className="h-8 w-8 mx-auto mb-3 text-indigo-600" />
            <span className="block font-medium text-gray-900">Manage Vehicles</span>
          </button>

          <button
            onClick={() => navigate("/admin/routes")}
            className="bg-white border border-gray-200 rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-center"
          >
            <MapPin className="h-8 w-8 mx-auto mb-3 text-yellow-600" />
            <span className="block font-medium text-gray-900">Route Assignment</span>
          </button>

          <button
            onClick={() => navigate("/admin/finance")}
            className="bg-white border border-gray-200 rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-center"
          >
            <DollarSign className="h-8 w-8 mx-auto mb-3 text-purple-600" />
            <span className="block font-medium text-gray-900">Financial Overview</span>
          </button>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              System Overview
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-3">
                  Platform Health
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Server Status:</span>
                    <span className="text-green-600 font-medium">Online</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Database:</span>
                    <span className="text-green-600 font-medium">
                      Connected
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Routes:</span>
                    <span className="font-medium">0</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-3">
                  Recent Activity
                </h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• System initialized</p>
                  <p>• Ready for ride management</p>
                  <p>• No active routes currently</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
