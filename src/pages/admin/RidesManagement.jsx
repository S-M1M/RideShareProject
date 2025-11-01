import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import api from "../../utils/api";
import { Calendar, Plus, Edit2, Trash2, Eye, Play, MapPin } from "lucide-react";

const RidesManagement = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);
  
  // Filter states
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [activeTab, setActiveTab] = useState("all"); // all, scheduled, in-progress, completed
  
  // Form states
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  
  useEffect(() => {
    fetchRides();
    fetchDrivers();
    fetchRoutes();
    fetchVehicles();
  }, [selectedDate, activeTab]);

  const fetchRides = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        date: selectedDate,
      });
      
      if (activeTab !== "all") {
        params.append("status", activeTab);
      }
      
      const response = await api.get(`/rides?${params.toString()}`);
      setRides(response.data);
    } catch (error) {
      console.error("Error fetching rides:", error);
      alert("Error loading rides: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await api.get("/admin/drivers");
      setDrivers(response.data);
    } catch (error) {
      console.error("Error fetching drivers:", error);
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await api.get("/admin/preset-routes");
      setRoutes(response.data);
    } catch (error) {
      console.error("Error fetching routes:", error);
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

  const handleDeleteRide = async (rideId) => {
    if (!confirm("Are you sure you want to delete this ride?")) return;
    
    try {
      await api.delete(`/rides/${rideId}`);
      alert("Ride deleted successfully");
      fetchRides();
    } catch (error) {
      console.error("Error deleting ride:", error);
      alert("Error deleting ride: " + (error.response?.data?.error || error.message));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Layout title="Rides Management">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rides Management</h1>
            <p className="text-gray-600 mt-1">Create, view, and manage all rides</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <Plus size={20} />
            Create Rides
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Date Filter */}
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-gray-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            {/* Status Tabs */}
            <div className="flex gap-2 ml-auto">
              {["all", "scheduled", "in-progress", "completed"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1).replace("-", " ")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Rides Table */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading rides...</div>
          </div>
        ) : rides.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Rides Found</h3>
            <p className="text-gray-500 mb-4">
              No rides scheduled for the selected date and status.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Create First Ride
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Driver
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Passengers
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rides.map((ride) => (
                    <tr key={ride._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(ride.rideDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ride.scheduledStartTime}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {ride.presetRoute_id?.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {ride.driver_id?.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ride.vehicle_id?.license_plate || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ride.passengerCount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            ride.status
                          )}`}
                        >
                          {ride.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => {
                            setSelectedRide(ride);
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteRide(ride._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Ride Modal */}
      {showCreateModal && (
        <CreateRideModal
          drivers={drivers}
          routes={routes}
          vehicles={vehicles}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchRides();
          }}
        />
      )}

      {/* Edit Ride Modal */}
      {showEditModal && selectedRide && (
        <EditRideModal
          ride={selectedRide}
          drivers={drivers}
          vehicles={vehicles}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRide(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedRide(null);
            fetchRides();
          }}
        />
      )}
    </Layout>
  );
};

// Create Ride Modal Component
const CreateRideModal = ({ drivers, routes, vehicles, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    driver_id: "",
    presetRoute_id: "",
    vehicle_id: "",
    scheduledStartTime: "08:00",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.driver_id || !formData.presetRoute_id || !formData.vehicle_id) {
      alert("Please fill in all required fields");
      return;
    }
    
    try {
      setSubmitting(true);
      await api.post("/rides", formData);
      alert("Rides created successfully!");
      onSuccess();
    } catch (error) {
      console.error("Error creating rides:", error);
      alert("Error creating rides: " + (error.response?.data?.error || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-blue-600 text-white p-4">
          <h2 className="text-xl font-bold">Create New Rides</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Driver Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Driver *
            </label>
            <select
              value={formData.driver_id}
              onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            >
              <option value="">Select Driver</option>
              {drivers.map((driver) => (
                <option key={driver._id} value={driver._id}>
                  {driver.name} ({driver.email})
                </option>
              ))}
            </select>
          </div>

          {/* Route Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Route *
            </label>
            <select
              value={formData.presetRoute_id}
              onChange={(e) => setFormData({ ...formData, presetRoute_id: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            >
              <option value="">Select Route</option>
              {routes.map((route) => (
                <option key={route._id} value={route._id}>
                  {route.name}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle *
            </label>
            <select
              value={formData.vehicle_id}
              onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            >
              <option value="">Select Vehicle</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle._id} value={vehicle._id}>
                  {vehicle.license_plate} - {vehicle.model}
                </option>
              ))}
            </select>
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time *
            </label>
            <input
              type="time"
              value={formData.scheduledStartTime}
              onChange={(e) => setFormData({ ...formData, scheduledStartTime: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                min={formData.startDate}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
          </div>

          {/* Info Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Creating rides from {formData.startDate} to {formData.endDate} will
              generate {Math.max(1, Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24)) + 1)} individual ride(s).
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create Rides"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Ride Modal Component
const EditRideModal = ({ ride, drivers, vehicles, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    driver_id: ride.driver_id?._id || "",
    vehicle_id: ride.vehicle_id?._id || "",
    scheduledStartTime: ride.scheduledStartTime || "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      await api.put(`/rides/${ride._id}`, formData);
      alert("Ride updated successfully!");
      onSuccess();
    } catch (error) {
      console.error("Error updating ride:", error);
      alert("Error updating ride: " + (error.response?.data?.error || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="bg-blue-600 text-white p-4">
          <h2 className="text-xl font-bold">Edit Ride</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Route (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Route
            </label>
            <input
              type="text"
              value={ride.presetRoute_id?.name || "N/A"}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
              disabled
            />
          </div>

          {/* Date (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="text"
              value={new Date(ride.rideDate).toLocaleDateString()}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
              disabled
            />
          </div>

          {/* Driver Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Driver
            </label>
            <select
              value={formData.driver_id}
              onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Select Driver</option>
              {drivers.map((driver) => (
                <option key={driver._id} value={driver._id}>
                  {driver.name}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle
            </label>
            <select
              value={formData.vehicle_id}
              onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Select Vehicle</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle._id} value={vehicle._id}>
                  {vehicle.license_plate} - {vehicle.model}
                </option>
              ))}
            </select>
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <input
              type="time"
              value={formData.scheduledStartTime}
              onChange={(e) => setFormData({ ...formData, scheduledStartTime: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              disabled={submitting}
            >
              {submitting ? "Updating..." : "Update Ride"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RidesManagement;
