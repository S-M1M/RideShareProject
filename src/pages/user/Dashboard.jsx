import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/Layout";
import { useAuth } from "../../contexts/AuthContext";
import { Car, Calendar, DollarSign, MapPin, Bus, Clock, Package } from "lucide-react";
import api from "../../utils/api";

const Dashboard = () => {
  const { user } = useAuth();
  const [activeSubscriptions, setActiveSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveSubscriptions();
  }, []);

  const fetchActiveSubscriptions = async () => {
    setLoading(true);
    try {
      const response = await api.get("/subscriptions/active-with-rides");
      setActiveSubscriptions(response.data);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPlanTypeBadge = (planType) => {
    const colors = {
      daily: "bg-blue-100 text-blue-800",
      weekly: "bg-green-100 text-green-800",
      monthly: "bg-purple-100 text-purple-800",
    };
    return colors[planType?.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-2">
            Welcome back, {user?.first_name || user?.name || "User"}!
          </h2>
          <p className="text-gray-600">
            Manage your active subscriptions and rides
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Active Subscriptions */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Bus className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Active Subscriptions
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {activeSubscriptions.length}
                </p>
              </div>
            </div>
          </div>

          {/* Total Upcoming Rides */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Car className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Upcoming Rides
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {activeSubscriptions.reduce(
                    (total, sub) => total + sub.upcomingRidesCount,
                    0
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Stars Balance */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Stars Balance
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {user?.stars || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Subscriptions List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Active Subscriptions
            </h3>
          </div>
          <div className="p-6">
            {activeSubscriptions.length === 0 ? (
              <div className="text-center py-8">
                <Bus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">No active subscriptions</p>
                <p className="text-sm text-gray-400 mb-4">
                  Purchase a subscription to start riding
                </p>
                <Link
                  to="/subscription"
                  className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Buy Subscription
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {activeSubscriptions.map((subscription) => (
                  <div
                    key={subscription._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {subscription.preset_route_id?.name || "Unknown Route"}
                          </h4>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getPlanTypeBadge(
                              subscription.plan_type
                            )}`}
                          >
                            {subscription.plan_type?.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{subscription.scheduledTime || "Not specified"}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500 mb-1">
                          Upcoming Rides
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {subscription.upcomingRidesCount}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                      {/* Pickup Location */}
                      <div className="flex items-start gap-2">
                        <MapPin className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Pickup
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {subscription.pickup_location?.name ||
                              "Not specified"}
                          </div>
                        </div>
                      </div>

                      {/* Drop Location */}
                      <div className="flex items-start gap-2">
                        <MapPin className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Drop</div>
                          <div className="text-sm font-medium text-gray-900">
                            {subscription.drop_location?.name ||
                              "Not specified"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Next Ride Info */}
                    {subscription.nextRideDate && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-blue-800">
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">Next Ride:</span>
                          </div>
                          <span className="text-sm text-blue-900 font-medium">
                            {formatDate(subscription.nextRideDate)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Subscription Details */}
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        <span>
                          Expires: {formatDate(subscription.end_date)}
                        </span>
                      </div>
                      <span>{subscription.price} stars</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/buy-stars"
            className="bg-purple-600 text-white rounded-lg p-6 hover:bg-purple-700 transition-colors"
          >
            <h3 className="text-lg font-semibold mb-2">⭐ Buy Stars</h3>
            <p className="text-purple-100">
              Purchase stars to buy subscriptions
            </p>
          </Link>

          <Link
            to="/subscription"
            className="bg-blue-600 text-white rounded-lg p-6 hover:bg-blue-700 transition-colors"
          >
            <h3 className="text-lg font-semibold mb-2">New Subscription</h3>
            <p className="text-blue-100">
              Subscribe to daily, weekly, or monthly rides
            </p>
          </Link>

          <Link
            to="/map"
            className="bg-green-600 text-white rounded-lg p-6 hover:bg-green-700 transition-colors"
          >
            <h3 className="text-lg font-semibold mb-2">Track Rides</h3>
            <p className="text-green-100">
              View your vehicle location on the map
            </p>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
