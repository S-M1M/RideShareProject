import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { Car, Calendar, DollarSign, MapPin } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeSubscriptions: 0,
    totalRides: 0,
    totalRefunds: 0
  });
  const [todayRides, setTodayRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load local data
    const loadLocalData = () => {
      const rides = JSON.parse(localStorage.getItem('rides') || '[]');
      const subscriptions = JSON.parse(localStorage.getItem('subscriptions') || '[]');
      
      // Filter rides for current user
      const userRides = rides.filter(ride => ride.userId === user?.id);
      
      // Filter active subscriptions for current user
      const activeUserSubscriptions = subscriptions.filter(
        sub => sub.userId === user?.id && new Date(sub.endDate) > new Date()
      );

      // Calculate total refunds (mock data for now)
      const totalRefunds = userRides.reduce((total, ride) => 
        total + (ride.refundAmount || 0), 0);

      // Set stats
      setStats({
        activeSubscriptions: activeUserSubscriptions.length,
        totalRides: userRides.length,
        totalRefunds: totalRefunds
      });

      // Get today's rides
      const today = new Date().toISOString().split('T')[0];
      const todaysRides = userRides.filter(ride => 
        ride.date?.startsWith(today)
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
          <h2 className="text-lg font-semibold mb-2">Welcome back, {user?.name || 'User'}!</h2>
          <p className="text-gray-600">Here's your ride sharing overview for today.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Subscriptions</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeSubscriptions || 0}</p>
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
                <p className="text-2xl font-semibold text-gray-900">{stats.totalRides || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Refunds</p>
                <p className="text-2xl font-semibold text-gray-900">${stats.totalRefunds || 0}</p>
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
            <p className="text-gray-500 text-center py-4">No rides scheduled for today</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link 
            to="/subscription"
            className="bg-blue-600 text-white rounded-lg p-6 hover:bg-blue-700 transition-colors"
          >
            <h3 className="text-lg font-semibold mb-2">New Subscription</h3>
            <p className="text-blue-100">Subscribe to daily, weekly, or monthly rides</p>
          </Link>
          
          <Link 
            to="/map"
            className="bg-green-600 text-white rounded-lg p-6 hover:bg-green-700 transition-colors"
          >
            <h3 className="text-lg font-semibold mb-2">Track Rides</h3>
            <p className="text-green-100">View your vehicle location on the map</p>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;