import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../contexts/AuthContext";
import { MapPin, Clock, Phone, User, Navigation, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const DriverDashboard = () => {
  const { user } = useAuth();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodayRoutes();
  }, []);

  const fetchTodayRoutes = async () => {
    try {
      const response = await api.get("/drivers/routes/today");
      setRoutes(response.data);
    } catch (error) {
      console.error("Error fetching routes:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateRouteStatus = async (routeId, status) => {
    try {
      await api.put(`/drivers/routes/${routeId}/status`, { status });
      fetchTodayRoutes();
    } catch (error) {
      alert(
        "Error updating route status: " +
          (error.response?.data?.error || error.message),
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
            <Link to="/subscription" className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
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
                  ? `${user.vehicle.type} (${user.vehicle.license_plate})`
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

        {/* Today's Routes */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Today's Routes
            </h3>
          </div>
          <div className="p-6">
            {routes.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No routes assigned for today
              </p>
            ) : (
              <div className="space-y-6">
                {routes.map((route) => (
                  <div key={route._id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold">
                        Route #{route._id.slice(-6)}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            route.status === "planned"
                              ? "bg-blue-100 text-blue-800"
                              : route.status === "active"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                          }`}
                        >
                          {route.status}
                        </span>

                        {route.status === "planned" && (
                          <button
                            onClick={() =>
                              updateRouteStatus(route._id, "active")
                            }
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700"
                          >
                            Start Route
                          </button>
                        )}

                        {route.status === "active" && (
                          <button
                            onClick={() =>
                              updateRouteStatus(route._id, "completed")
                            }
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
                          >
                            Complete Route
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Passengers */}
                    <div className="space-y-3">
                      <h5 className="font-medium text-gray-700">
                        Passengers ({route.passengers?.length || 0})
                      </h5>
                      {route.passengers?.map((passenger, index) => (
                        <div key={index} className="bg-gray-50 rounded-md p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <User className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="font-medium">
                                  {passenger.user_id?.name || "Passenger"}
                                </p>
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <Phone className="h-3 w-3" />
                                  <span>{passenger.user_id?.phone}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right text-sm">
                              <p className="text-gray-600">
                                Pickup: {passenger.pickup_time || "TBD"}
                              </p>
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  passenger.status === "scheduled"
                                    ? "bg-blue-100 text-blue-800"
                                    : passenger.status === "picked_up"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-green-100 text-green-800"
                                }`}
                              >
                                {passenger.status || "scheduled"}
                              </span>
                            </div>
                          </div>

                          <div className="mt-2 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>
                                Pickup:{" "}
                                {passenger.pickup_location?.address ||
                                  "Address not set"}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 mt-1">
                              <Navigation className="h-3 w-3" />
                              <span>
                                Drop:{" "}
                                {passenger.drop_location?.address ||
                                  "Address not set"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Route Stops */}
                    <div className="mt-4">
                      <h5 className="font-medium text-gray-700 mb-2">
                        Route Stops
                      </h5>
                      <div className="space-y-2">
                        {route.stops?.map((stop, index) => (
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
                              {stop.location?.address || "Location not set"}
                            </span>
                            {stop.time && (
                              <span className="text-gray-500">
                                ({stop.time})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
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
