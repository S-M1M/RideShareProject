import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../contexts/AuthContext";
import {
  Plus,
  Users,
  MapPin,
  Phone,
  Mail,
  Clock,
  Calendar,
  Navigation,
  Play,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../utils/api";

const DriverDashboard = () => {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    fetchRides();
  }, [selectedDate]);

  const fetchRides = async () => {
    try {
      const response = await api.get(
        `/rides/driver/my-rides?date=${selectedDate}`
      );
      setRides(response.data);
    } catch (error) {
      console.error("Error fetching rides:", error);
    } finally {
      setLoading(false);
    }
  };

  const startRide = async (rideId) => {
    try {
      await api.put(`/rides/${rideId}/start`);
      alert("Ride started! You can now access the map.");
      fetchRides();
    } catch (error) {
      alert(
        "Error starting ride: " + (error.response?.data?.error || error.message)
      );
    }
  };

  if (loading) {
    return (
      <Layout title="Driver Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Driver Dashboard">
      <div className="space-y-6">
        {/* Driver Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Driver Information</h3>
            <div className="flex space-x-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium">{user?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium">{user?.phone}</p>
            </div>
          </div>
        </div>

        {/* My Assigned Rides */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              My Assigned Rides
            </h3>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {rides.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No rides assigned for{" "}
                  {new Date(selectedDate).toLocaleDateString()}
                </p>
              ) : (
                rides.map((ride) => (
                  <div
                    key={ride._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-lg">
                          {ride.presetRoute_id?.name || "Route"}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {ride.presetRoute_id?.description}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          ride.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : ride.status === "in-progress"
                            ? "bg-yellow-100 text-yellow-800"
                            : ride.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {ride.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{ride.scheduledStartTime}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>
                          {ride.presetRoute_id?.stops?.length || 0} stops
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {ride.status === "scheduled" && (
                        <button
                          onClick={() => startRide(ride._id)}
                          className="flex items-center space-x-1 bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 text-sm"
                        >
                          <Play className="w-4 h-4" />
                          <span>Start Ride</span>
                        </button>
                      )}

                      {ride.status === "in-progress" && (
                        <Link
                          to={`/driver/ride-map?rideId=${ride._id}`}
                          className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm"
                        >
                          <Navigation className="w-4 h-4" />
                          <span>View Map</span>
                        </Link>
                      )}

                      {ride.status === "completed" && (
                        <span className="flex items-center space-x-1 text-green-600 px-3 py-2 text-sm">
                          ✓ Ride Completed
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DriverDashboard;
