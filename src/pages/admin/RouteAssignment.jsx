import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { Calendar, MapPin, Users, Plus } from "lucide-react";

const RouteAssignment = () => {
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchDrivers(), fetchVehicles()]);
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await api.get("/admin/drivers");
      setDrivers(response.data);
    } catch (error) {
      console.error("Error fetching drivers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await api.get("/admin/vehicles");
      setVehicles(response.data);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  };

  if (loading) {
    return (
      <Layout title="Route Assignment">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Route Assignment">
      <div className="space-y-6">
        {/* Date Selector and Actions */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              onClick={() => setShowAssignModal(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              <Plus size={16} />
              <span>Assign Route</span>
            </button>
          </div>
        </div>

        {/* Routes for Selected Date */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Routes for {new Date(selectedDate).toLocaleDateString()}
            </h3>
          </div>

          <div className="p-6">
            {routes.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  No routes assigned for this date.
                </p>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Assign your first route
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {routes.map((route) => (
                  <div key={route._id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">
                        Route #{route._id.slice(-6)}
                      </h4>
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Driver</p>
                        <p className="font-medium">
                          {route.driver_id?.name || "Unassigned"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Vehicle</p>
                        <p className="font-medium">
                          {route.vehicle_id
                            ? `${route.vehicle_id.type} (${route.vehicle_id.license_plate})`
                            : "Unassigned"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Passengers</p>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span className="font-medium">
                            {route.passengers?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Truck className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Available Drivers
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {drivers.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Car className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Available Vehicles
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {vehicles.filter((v) => v.available).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Active Routes
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {routes.filter((r) => r.status === "active").length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Route Modal */}
      {showAssignModal && (
        <AssignRouteModal
          drivers={drivers}
          vehicles={vehicles}
          selectedDate={selectedDate}
          onClose={() => setShowAssignModal(false)}
          onSuccess={() => {
            setShowAssignModal(false);
            // In a real app, you'd fetch routes here
          }}
        />
      )}
    </Layout>
  );
};

const AssignRouteModal = ({
  drivers,
  vehicles,
  selectedDate,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    driver_id: "",
    vehicle_id: "",
    passengers: [],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/admin/routes", {
        ...formData,
        date: selectedDate,
      });
      onSuccess();
    } catch (error) {
      alert(
        "Error assigning route: " +
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold mb-4">Assign New Route</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Driver
            </label>
            <select
              name="driver_id"
              value={formData.driver_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose a driver</option>
              {drivers.map((driver) => (
                <option key={driver._id} value={driver._id}>
                  {driver.name} - {driver.phone}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Vehicle
            </label>
            <select
              name="vehicle_id"
              value={formData.vehicle_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose a vehicle</option>
              {vehicles
                .filter((v) => v.available)
                .map((vehicle) => (
                  <option key={vehicle._id} value={vehicle._id}>
                    {vehicle.type} - {vehicle.license_plate} (Capacity:{" "}
                    {vehicle.capacity})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Assigning..." : "Assign Route"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RouteAssignment;
