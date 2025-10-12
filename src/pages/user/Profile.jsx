import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../contexts/AuthContext";
import { User, Phone, Mail, Save } from "lucide-react";
import api from "../../utils/api";

const Profile = () => {
  const { user, reloadUser } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.put("/users/profile", formData);
      await reloadUser();
      alert("Profile updated successfully!");
    } catch (error) {
      alert(
        "Error updating profile: " +
          (error.response?.data?.error || error.message),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const cancelSubscription = async (subscriptionId) => {
    if (
      !confirm(
        "Are you sure you want to cancel this subscription? Future rides will be cancelled with 50% refunds.",
      )
    ) {
      return;
    }

    try {
      await api.put(`/subscriptions/${subscriptionId}/cancel`);
      await reloadUser();
      alert("Subscription cancelled successfully.");
    } catch (error) {
      alert(
        "Error cancelling subscription: " +
          (error.response?.data?.error || error.message),
      );
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
                  value={user?.email || ""}
                  disabled
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={16} />
              <span>{loading ? "Saving..." : "Save Changes"}</span>
            </button>
          </form>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Active Subscriptions</h3>

          {!user?.subscription ? (
            <p className="text-gray-500 text-center py-4">
              No active subscriptions found.
            </p>
          ) : (
            <div className="space-y-4">
              <div key={user.subscription.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium capitalize">
                        {user.subscription.plan_type} Plan
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          user.subscription.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.subscription.status === "active"
                          ? "Active"
                          : "Cancelled"}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        Route: {user.subscription.pickup_location?.address} →{" "}
                        {user.subscription.drop_location?.address}
                      </p>
                      <p>Distance: {user.subscription.distance || "10"} km</p>
                      <p>Price: ৳{user.subscription.price}</p>
                      <p>
                        Period:{" "}
                        {new Date(
                          user.subscription.start_date,
                        ).toLocaleDateString()}{" "}
                        -{" "}
                        {new Date(
                          user.subscription.end_date,
                        ).toLocaleDateString()}
                      </p>
                      <p>
                        Days:{" "}
                        {user.subscription.schedule?.days?.join(", ") ||
                          "Sunday - Thursday"}
                      </p>
                      <p>Time: {user.subscription.schedule?.time || "08:30"}</p>
                    </div>
                  </div>

                  {user.subscription.status === "active" && (
                    <button
                      onClick={() => cancelSubscription(user.subscription.id)}
                      className="ml-4 px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
