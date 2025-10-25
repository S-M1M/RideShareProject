import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { Plus, Search, Truck, Mail, Phone, Car, MapPin, Clock, X } from "lucide-react";
import api from "../../utils/api";

const DriverManagement = () => {
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
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

  const filteredDrivers = drivers.filter(
    (driver) =>
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <Layout title="Driver Management">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Driver Management">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search drivers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <Plus size={16} />
            <span>Add Driver</span>
          </button>
        </div>

        {/* Drivers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrivers.map((driver) => (
            <div key={driver._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0 h-12 w-12">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Truck className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{driver.name}</h3>
                  <p className="text-sm text-gray-500">
                    Driver ID: {driver._id.slice(-6)}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{driver.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{driver.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Car className="h-4 w-4 text-gray-400" />
                  <span>
                    {driver.assigned_vehicle_id
                      ? `${driver.assigned_vehicle_id.type} (${driver.assigned_vehicle_id.license_plate})`
                      : "No vehicle assigned"}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex space-x-2">
                <button 
                  onClick={() => {
                    setSelectedDriver(driver);
                    setShowAssignModal(true);
                  }}
                  className="flex-1 bg-green-100 text-green-700 px-3 py-1 rounded-md hover:bg-green-200 text-sm"
                >
                  Assign Route
                </button>
                <button className="flex-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200 text-sm">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredDrivers.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No drivers found.</p>
          </div>
        )}
      </div>

      {/* Add Driver Modal */}
      {showAddModal && (
        <AddDriverModal
          vehicles={vehicles}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchDrivers();
          }}
        />
      )}

      {/* Assign Route Modal */}
      {showAssignModal && selectedDriver && (
        <AssignRouteModal
          driver={selectedDriver}
          vehicles={vehicles}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedDriver(null);
          }}
          onSuccess={() => {
            setShowAssignModal(false);
            setSelectedDriver(null);
          }}
        />
      )}
    </Layout>
  );
};

const AddDriverModal = ({ vehicles, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    assigned_vehicle_id: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/admin/drivers", formData);
      onSuccess();
    } catch (error) {
      alert(
        "Error adding driver: " +
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
        <h3 className="text-lg font-semibold mb-4">Add New Driver</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign Vehicle
            </label>
            <select
              name="assigned_vehicle_id"
              value={formData.assigned_vehicle_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a vehicle</option>
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
              {loading ? "Adding..." : "Add Driver"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AssignRouteModal = ({ driver, vehicles, onClose, onSuccess }) => {
  const [presetRoutes, setPresetRoutes] = useState([]);
  const [formData, setFormData] = useState({
    presetRoute_id: "",
    vehicle_id: driver.assigned_vehicle_id?._id || "",
    scheduledStartTime: "08:00",
    scheduledDate: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);
  const [loadingRoutes, setLoadingRoutes] = useState(true);

  useEffect(() => {
    fetchPresetRoutes();
  }, []);

  const fetchPresetRoutes = async () => {
    try {
      const response = await api.get("/admin/preset-routes");
      setPresetRoutes(response.data.filter((r) => r.active));
    } catch (error) {
      console.error("Error fetching preset routes:", error);
    } finally {
      setLoadingRoutes(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/admin/driver-assignments", {
        driver_id: driver._id,
        ...formData,
      });
      alert("Route assigned successfully!");
      onSuccess();
    } catch (error) {
      alert(
        "Error assigning route: " +
          (error.response?.data?.error || error.message)
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

  const selectedRoute = presetRoutes.find((r) => r._id === formData.presetRoute_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Assign Route to {driver.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {loadingRoutes ? (
          <div className="text-center py-8">Loading routes...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Preset Route *
              </label>
              <select
                name="presetRoute_id"
                value={formData.presetRoute_id}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a route</option>
                {presetRoutes.map((route) => (
                  <option key={route._id} value={route._id}>
                    {route.name} - {route.stops.length} stops ({route.estimatedTime})
                  </option>
                ))}
              </select>
            </div>

            {selectedRoute && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center">
                  <MapPin size={16} className="mr-2" />
                  Route Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">From:</span>{" "}
                    <span className="font-medium">{selectedRoute.startPoint.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">To:</span>{" "}
                    <span className="font-medium">{selectedRoute.endPoint.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Stops:</span>{" "}
                    <span className="font-medium">{selectedRoute.stops.length} intermediate stops</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Fare:</span>{" "}
                    <span className="font-medium text-green-600">{selectedRoute.fare}</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Vehicle *
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Date *
                </label>
                <input
                  type="date"
                  name="scheduledDate"
                  value={formData.scheduledDate}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time *
                </label>
                <input
                  type="time"
                  name="scheduledStartTime"
                  value={formData.scheduledStartTime}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
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
        )}
      </div>
    </div>
  );
};

export default DriverManagement;
