import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../contexts/AuthContext";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../utils/api";

const DriverDashboard = () => {
  const { user } = useAuth();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await api.get("/drivers/assignments");
      setRoutes(response.data);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
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
            <Link
              to="/subscription"
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              <Plus size={16} />
              <span>New Subscription</span>
            </Link>
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

        {/* Assigned Routes */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Assigned Routes
            </h3>
          </div>
          <div className="p-6">
            {routes.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No assignments found
              </p>
            ) : (
              <div className="space-y-6">
                {routes.map((assignment) => (
                  <div key={assignment._id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold">
                        {assignment.presetRoute_id?.name ||
                          `Assignment ${assignment._id.slice(-6)}`}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            assignment.status === "scheduled"
                              ? "bg-blue-100 text-blue-800"
                              : assignment.status === "in-progress"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {assignment.status}
                        </span>

                        {assignment.status === "scheduled" && (
                          <button
                            onClick={() =>
                              updateRouteStatus(assignment._id, "in-progress")
                            }
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700"
                          >
                            Start Route
                          </button>
                        )}

                        {assignment.status === "in-progress" && (
                          <button
                            onClick={() =>
                              updateRouteStatus(assignment._id, "completed")
                            }
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
                          >
                            Complete Route
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Scheduled</p>
                        <p className="font-medium">
                          {assignment.scheduledStartTime} •{" "}
                          {new Date(
                            assignment.scheduledDate
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Vehicle</p>
                        <p className="font-medium">
                          {assignment.vehicle_id
                            ? `${assignment.vehicle_id.model} (${assignment.vehicle_id.license_plate})`
                            : "No vehicle assigned"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Capacity</p>
                        <p className="font-medium">
                          {assignment.vehicle_id?.capacity || 0} seats
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h5 className="font-medium text-gray-700 mb-2">
                        Route Stops
                      </h5>
                      <div className="space-y-2">
                        {assignment.presetRoute_id?.stops?.map(
                          (stop, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-3 text-sm"
                            >
                              <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                                {index + 1}
                              </span>
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  stop.type === "pickup"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {stop.type}
                              </span>
                              <span>
                                {stop.name ||
                                  stop.location?.address ||
                                  "Location not set"}
                              </span>
                              {stop.time && (
                                <span className="text-gray-500">
                                  ({stop.time})
                                </span>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <Link
                        to={`/driver/assignments/${assignment._id}/map`}
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      >
                        Open Map
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DriverDashboard;
