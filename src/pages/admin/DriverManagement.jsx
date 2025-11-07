import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { Plus, Search, Truck, Mail, Phone, Car, MapPin, Clock, X, Edit, Trash2, User } from "lucide-react";
import api from "../../utils/api";

const DriverManagement = () => {
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
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

  const handleDeleteDriver = async (driverId) => {
    if (window.confirm("Are you sure you want to delete this driver?")) {
      try {
        console.log("Attempting to delete driver with ID:", driverId);
        const response = await api.delete(`/admin/drivers/${driverId}`);
        console.log("Delete response:", response);
        alert("Driver deleted successfully");
        fetchDrivers();
      } catch (error) {
        console.error("Delete error:", error);
        console.error("Error response:", error.response);
        alert(
          "Error deleting driver: " +
            (error.response?.data?.error || error.message)
        );
      }
    }
  };

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
                    setShowDetailsModal(true);
                  }}
                  className="flex-1 bg-green-100 text-green-700 px-3 py-1 rounded-md hover:bg-green-200 text-sm flex items-center justify-center gap-1"
                >
                  <User size={14} />
                  View Details
                </button>
                <button 
                  onClick={() => {
                    setSelectedDriver(driver);
                    setShowEditModal(true);
                  }}
                  className="flex-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200 text-sm flex items-center justify-center gap-1"
                >
                  <Edit size={14} />
                  Edit
                </button>
                <button 
                  onClick={() => handleDeleteDriver(driver._id)}
                  className="bg-red-100 text-red-700 px-3 py-1 rounded-md hover:bg-red-200 text-sm flex items-center justify-center"
                >
                  <Trash2 size={14} />
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
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchDrivers();
          }}
        />
      )}

      {/* Edit Driver Modal */}
      {showEditModal && selectedDriver && (
        <EditDriverModal
          driver={selectedDriver}
          onClose={() => {
            setShowEditModal(false);
            setSelectedDriver(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedDriver(null);
            fetchDrivers();
          }}
        />
      )}

      {/* Driver Details Modal */}
      {showDetailsModal && selectedDriver && (
        <DriverDetailsModal
          driver={selectedDriver}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedDriver(null);
          }}
        />
      )}
    </Layout>
  );
};

const AddDriverModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/admin/drivers", formData);
      alert("Driver added successfully!");
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

const EditDriverModal = ({ driver, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: driver.name,
    email: driver.email,
    phone: driver.phone,
    password: "", // Optional - only if changing password
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Only send password if it's been filled in
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }
      
      await api.put(`/admin/drivers/${driver._id}`, updateData);
      alert("Driver updated successfully!");
      onSuccess();
    } catch (error) {
      alert(
        "Error updating driver: " +
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Edit Driver</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

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
              New Password (leave blank to keep current)
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter new password or leave blank"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
              {loading ? "Updating..." : "Update Driver"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AssignRouteModal = ({ driver, vehicles, onClose, onSuccess }) => {
  const [presetRoutes, setPresetRoutes] = useState([]);
  const today = new Date().toISOString().split("T")[0];
  const tenDaysLater = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const [formData, setFormData] = useState({
    presetRoute_id: "",
    vehicle_id: driver.assigned_vehicle_id?._id || "",
    scheduledStartTime: "08:00",
    scheduledDate: today,
    startDate: today,
    endDate: tenDaysLater,
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
      const assignmentData = {
        driver_id: driver._id,
        presetRoute_id: formData.presetRoute_id,
        vehicle_id: formData.vehicle_id,
        scheduledStartTime: formData.scheduledStartTime,
        scheduledDate: formData.scheduledDate,
        startDate: formData.startDate,
        endDate: formData.endDate,
      };
      
      console.log("Submitting assignment data:", assignmentData);
      
      await api.post("/admin/driver-assignments", assignmentData);
      alert("Route assigned successfully!");
      onSuccess();
    } catch (error) {
      console.error("Assignment error:", error);
      alert(
        "Error assigning route: " +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // When scheduledDate changes, update startDate if startDate is empty or before scheduledDate
    if (name === "scheduledDate") {
      const newFormData = {
        ...formData,
        scheduledDate: value,
        startDate: value, // Start date should match scheduled date
      };
      console.log("Updated form data (scheduledDate changed):", newFormData);
      setFormData(newFormData);
    } else {
      const newFormData = {
        ...formData,
        [name]: value,
      };
      console.log("Updated form data:", newFormData);
      setFormData(newFormData);
    }
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
                  Start Date *
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
                <p className="text-xs text-gray-500 mt-1">First day of route assignment</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  min={formData.scheduledDate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Last day of route assignment (e.g., 10 days)</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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

const DriverDetailsModal = ({ driver, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Driver Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Driver Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Full Name</label>
              <p className="mt-1 text-gray-900">{driver.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Driver ID</label>
              <p className="mt-1 text-gray-900 font-mono text-sm">{driver._id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="mt-1 text-gray-900">{driver.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Phone</label>
              <p className="mt-1 text-gray-900">{driver.phone || "Not provided"}</p>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-500">Assigned Vehicle</label>
              <p className="mt-1 text-gray-900">
                {driver.assigned_vehicle_id ? (
                  <span>
                    {driver.assigned_vehicle_id.type} - {driver.assigned_vehicle_id.license_plate}
                    <span className="text-gray-500 ml-2">
                      (Capacity: {driver.assigned_vehicle_id.capacity})
                    </span>
                  </span>
                ) : (
                  <span className="text-gray-500">No vehicle assigned</span>
                )}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Joined Date</label>
              <p className="mt-1 text-gray-900">
                {new Date(driver.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Last Updated</label>
              <p className="mt-1 text-gray-900">
                {new Date(driver.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverManagement;
