import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/Layout";
import { useAuth } from "../../contexts/AuthContext";
import { Car, Calendar, DollarSign, MapPin, Bus, Clock } from "lucide-react";
import { getCurrentSubscription } from "../../utils/subscriptionStorage";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeSubscriptions: 0,
    totalRides: 0,
    totalRefunds: 0,
  });
  const [todayRides, setTodayRides] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load local data
    const loadLocalData = () => {
      // Get current subscription from localStorage
      const savedSubscription = getCurrentSubscription();
      setCurrentSubscription(savedSubscription);

      // Get user's active subscription
      const hasActiveSubscription =
        user?.subscription && new Date(user.subscription.end_date) > new Date();

      // Get user's rides
      const userRides = user?.rides || [];

      // Calculate total refunds (mock data for now)
      const totalRefunds = userRides.reduce(
        (total, ride) => total + (ride.refundAmount || 0),
        0
      );

      // Set stats
      setStats({
        activeSubscriptions: hasActiveSubscription || savedSubscription ? 1 : 0,
        totalRides: userRides.length,
        totalRefunds: totalRefunds,
      });

      // Get today's rides
      const today = new Date().toISOString().split("T")[0];
      const todaysRides = userRides.filter((ride) =>
        new Date(ride.date).toISOString().startsWith(today)
      );

      setTodayRides(todaysRides);
      setLoading(false);
    };

    if (user) {
      loadLocalData();
    } else {
      setLoading(false);
    }
  }, [user]);

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
          <h2 className="text-lg font-semibold mb-2">
            Welcome back, {user?.name || "User"}!
          </h2>
          <p className="text-gray-600">
            Here's your ride sharing overview for today.
          </p>
        </div>

        {/* Active Subscription Details */}
        {currentSubscription && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Subscription</h3>
              <Bus className="w-6 h-6 text-blue-600" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Route:</span>
                  <span className="font-medium">
                    {currentSubscription.routeName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Plan Type:</span>
                  <span className="font-medium capitalize">
                    {currentSubscription.plan_type}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium">
                    {currentSubscription.price} points
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Pickup:</span>
                  <span className="font-medium text-green-700">
                    {currentSubscription.pickupStopName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Drop:</span>
                  <span className="font-medium text-red-700">
                    {currentSubscription.dropStopName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Time Slot:</span>
                  <span className="font-medium flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {currentSubscription.timeSlot}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Subscribed on:{" "}
                {new Date(currentSubscription.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {/* Active Subscription Details from API */}
        {user?.subscription &&
          new Date(user.subscription.end_date) > new Date() && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">
                Active Subscription
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Plan Type:</span>
                  <span className="font-medium capitalize">
                    {user.subscription.plan_type}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium">
                    {user.subscription.price} Taka
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Valid Until:</span>
                  <span className="font-medium">
                    {new Date(user.subscription.end_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium mb-2">Route Details:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>
                        From:{" "}
                        {user.subscription.pickup_location.address.replace(
                          ", Bangladesh",
                          ""
                        )}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>
                        To:{" "}
                        {user.subscription.drop_location.address.replace(
                          ", Bangladesh",
                          ""
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Subscription Status
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {user?.subscription &&
                  new Date(user.subscription.end_date) > new Date()
                    ? "Active"
                    : "Inactive"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Car className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Rides</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalRides || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total points
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalRefunds || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Rides */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Today's Rides</h3>
          </div>
          <div className="p-6">
            <p className="text-gray-500 text-center py-4">
              No rides scheduled for today
            </p>
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
