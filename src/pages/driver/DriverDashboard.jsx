import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../contexts/AuthContext";
import { Plus, Users, MapPin, Phone, Mail, Clock, Calendar, Navigation } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../utils/api";

const DriverDashboard = () => {
  const { user } = useAuth();
  const [routes, setRoutes] = useState([]);
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [passengersLoading, setPassengersLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('assignments'); // 'assignments' or 'passengers'

  useEffect(() => {
    fetchAssignments();
    fetchPassengers();
  }, [selectedDate]);

  const fetchAssignments = async () => {
    try {
      const response = await api.get(`/drivers/assignments?date=${selectedDate}`);
      setRoutes(response.data);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPassengers = async () => {
    setPassengersLoading(true);
    try {
      const response = await api.get(`/drivers/passengers?date=${selectedDate}`);
      setPassengers(response.data);
      console.log("Passengers data:", response.data);
    } catch (error) {
      console.error("Error fetching passengers:", error);
    } finally {
      setPassengersLoading(false);
    }
  };

  const updateRouteStatus = async (assignmentId, status) => {
    try {
      await api.put(`/drivers/assignments/${assignmentId}/status`, { status });
      fetchAssignments();
    } catch (error) {
      alert(
        "Error updating assignment status: " +
          (error.response?.data?.error || error.message)
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
            <div>
              <p className="text-sm text-gray-600">Vehicle</p>
              <p className="font-medium">
                {user?.vehicle
                  ? `${user.vehicle.model} (${user.vehicle.license_plate})`
                  : "No vehicle assigned"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Capacity</p>
              <p className="font-medium">
                {user?.vehicle?.capacity || 0} passengers
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('assignments')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'assignments'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                My Assignments
              </button>
              <button
                onClick={() => setActiveTab('passengers')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'passengers'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Passengers ({passengers.reduce((acc, r) => acc + r.passengers.length, 0)})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Assignments Tab */}
            {activeTab === 'assignments' && (
              <div className="space-y-4">
                {routes.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No assignments for {new Date(selectedDate).toLocaleDateString()}
                  </p>
                ) : (
                  routes.map((assignment) => (
                    <div
                      key={assignment._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">
                            {assignment.presetRoute_id?.name || "Route"}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {assignment.presetRoute_id?.description}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            assignment.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : assignment.status === "in-progress"
                              ? "bg-yellow-100 text-yellow-800"
                              : assignment.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {assignment.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>{assignment.scheduledStartTime}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>
                            {assignment.presetRoute_id?.stops?.length || 0} stops
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          to={`/driver/map/${assignment._id}`}
                          className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm"
                        >
                          <Navigation className="w-4 h-4" />
                          <span>View Map</span>
                        </Link>

                        {assignment.status === "scheduled" && (
                          <button
                            onClick={() =>
                              updateRouteStatus(assignment._id, "in-progress")
                            }
                            className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 text-sm"
                          >
                            Start Route
                          </button>
                        )}

                        {assignment.status === "in-progress" && (
                          <button
                            onClick={() =>
                              updateRouteStatus(assignment._id, "completed")
                            }
                            className="bg-purple-600 text-white px-3 py-2 rounded-md hover:bg-purple-700 text-sm"
                          >
                            Complete Route
                          </button>
                        )}

                        {assignment.status !== "cancelled" &&
                          assignment.status !== "completed" && (
                            <button
                              onClick={() =>
                                updateRouteStatus(assignment._id, "cancelled")
                              }
                              className="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 text-sm"
                            >
                              Cancel
                            </button>
                          )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Passengers Tab */}
            {activeTab === 'passengers' && (
              <div className="space-y-6">
                {passengersLoading ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500">Loading passengers...</div>
                  </div>
                ) : passengers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No passengers for this date</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Passengers with active subscriptions will appear here
                    </p>
                  </div>
                ) : (
                  passengers.map((routeData) => (
                    <div
                      key={routeData.assignment._id}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      {/* Route Header */}
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
                        <h3 className="font-semibold text-lg flex items-center">
                          <MapPin className="w-5 h-5 mr-2" />
                          {routeData.route.name}
                        </h3>
                        <p className="text-sm text-blue-100 mt-1">
                          {routeData.route.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-sm">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {routeData.assignment.scheduledStartTime}
                          </span>
                          <span className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {routeData.passengers.length} passenger(s)
                          </span>
                        </div>
                      </div>

                      {/* Passengers List */}
                      <div className="divide-y divide-gray-200">
                        {routeData.passengers.map((passenger, index) => (
                          <div
                            key={passenger.subscriptionId}
                            className="p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {index + 1}. {passenger.user.name}
                                </h4>
                                <div className="flex flex-col space-y-1 mt-2 text-sm text-gray-600">
                                  <div className="flex items-center">
                                    <Phone className="w-3 h-3 mr-2" />
                                    <a
                                      href={`tel:${passenger.user.phone}`}
                                      className="text-blue-600 hover:underline"
                                    >
                                      {passenger.user.phone}
                                    </a>
                                  </div>
                                  <div className="flex items-center">
                                    <Mail className="w-3 h-3 mr-2" />
                                    <span>{passenger.user.email}</span>
                                  </div>
                                </div>
                              </div>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
                                {passenger.planType}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 p-3 bg-gray-50 rounded-lg">
                              <div>
                                <div className="flex items-start">
                                  <MapPin className="w-4 h-4 mr-2 text-green-600 mt-1" />
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase font-medium">
                                      Pickup
                                    </p>
                                    <p className="text-sm font-medium text-gray-900">
                                      {passenger.pickup.stopName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {passenger.pickup.location.latitude.toFixed(4)}, {passenger.pickup.location.longitude.toFixed(4)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <div className="flex items-start">
                                  <MapPin className="w-4 h-4 mr-2 text-red-600 mt-1" />
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase font-medium">
                                      Drop-off
                                    </p>
                                    <p className="text-sm font-medium text-gray-900">
                                      {passenger.drop.stopName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {passenger.drop.location.latitude.toFixed(4)}, {passenger.drop.location.longitude.toFixed(4)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {passenger.schedule && (
                              <div className="mt-3 text-xs text-gray-500">
                                <Clock className="w-3 h-3 inline mr-1" />
                                Schedule: {passenger.schedule.time}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DriverDashboard;
