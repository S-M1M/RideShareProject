import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { User, Phone, Mail, Save } from 'lucide-react';
import axios from 'axios';

const Profile = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || ''
      });
    }
    fetchSubscriptions();
  }, [user]);

  const fetchSubscriptions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/subscriptions');
      setSubscriptions(response.data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.put('http://localhost:5000/api/users/profile', formData);
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Error updating profile: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const cancelSubscription = async (subscriptionId) => {
    if (!confirm('Are you sure you want to cancel this subscription? Future rides will be cancelled with 50% refunds.')) {
      return;
    }

    try {
      await axios.put(`http://localhost:5000/api/subscriptions/${subscriptionId}/cancel`);
      fetchSubscriptions();
      alert('Subscription cancelled successfully.');
    } catch (error) {
      alert('Error cancelling subscription: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <Layout title="Profile">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={16} />
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </form>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Active Subscriptions</h3>
          
          {subscriptions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No active subscriptions found.</p>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((subscription) => (
                <div key={subscription._id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium capitalize">{subscription.plan_type} Plan</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          subscription.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {subscription.active ? 'Active' : 'Cancelled'}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Route: {subscription.pickup_location?.address} → {subscription.drop_location?.address}</p>
                        <p>Distance: {subscription.distance} km</p>
                        <p>Price: ${subscription.price}</p>
                        <p>
                          Period: {new Date(subscription.start_date).toLocaleDateString()} - {new Date(subscription.end_date).toLocaleDateString()}
                        </p>
                        <p>Days: {subscription.schedule?.days?.join(', ') || 'N/A'}</p>
                        <p>Time: {subscription.schedule?.time || 'N/A'}</p>
                      </div>
                    </div>

                    {subscription.active && (
                      <button
                        onClick={() => cancelSubscription(subscription._id)}
                        className="ml-4 px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Profile;