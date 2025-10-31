import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import {
  Car,
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  Truck,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import api from "../../utils/api";

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    type: "bus",
    model: "",
    year: new Date().getFullYear(),
    color: "Blue",
    capacity: "",
    license_plate: "",
    status: "active",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/vehicles");
      setVehicles(response.data);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      setError("Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      // Ensure capacity is a number and license plate is uppercase
      const vehicleData = {
        type: formData.type,
        model: formData.model.trim(),
        year: formData.year || new Date().getFullYear(),
        color: formData.color || "Blue",
        capacity: parseInt(formData.capacity, 10),
        license_plate: formData.license_plate.trim().toUpperCase(),
        status: formData.status,
      };

      console.log("Submitting vehicle data:", vehicleData);

      if (editingVehicle) {
        const response = await api.put(`/admin/vehicles/${editingVehicle._id}`, vehicleData);
        console.log("Update response:", response);
        setSuccess("Vehicle updated successfully");
      } else {
        const response = await api.post("/admin/vehicles", vehicleData);
        console.log("Create response:", response);
        setSuccess("Vehicle added successfully");
      }
      fetchVehicles();
      handleCloseModal();
      
      // Auto-clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error saving vehicle:", error);
      console.error("Error response:", error.response);
      setError(error.response?.data?.error || error.message || "Failed to save vehicle");
      
      // Auto-clear error message after 5 seconds
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      type: vehicle.type,
      model: vehicle.model,
      year: vehicle.year || new Date().getFullYear(),
      color: vehicle.color || "Blue",
      capacity: vehicle.capacity,
      license_plate: vehicle.license_plate,
      status: vehicle.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (vehicleId) => {
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      try {
        await api.delete(`/admin/vehicles/${vehicleId}`);
        setSuccess("Vehicle deleted successfully");
        fetchVehicles();
        
        // Auto-clear success message after 3 seconds
        setTimeout(() => setSuccess(""), 3000);
      } catch (error) {
        console.error("Error deleting vehicle:", error);
        setError(error.response?.data?.error || "Failed to delete vehicle");
        
        // Auto-clear error message after 5 seconds
        setTimeout(() => setError(""), 5000);
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingVehicle(null);
    setFormData({
      type: "bus",
      model: "",
      year: new Date().getFullYear(),
      color: "Blue",
      capacity: "",
      license_plate: "",
      status: "active",
    });
    setError("");
  };

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getVehicleIcon = (type) => {
    switch (type) {
      case "bus":
      case "van":
      case "microbus":
        return <Truck className="h-5 w-5" />;
      default:
        return <Car className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <Layout title="Vehicle Management">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Vehicle Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-600">
              Manage all vehicles in your fleet
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Vehicle
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            {success}
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by type, model, or license plate..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Vehicle Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Vehicles</div>
            <div className="text-2xl font-bold text-gray-900">
              {vehicles.length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Active</div>
            <div className="text-2xl font-bold text-green-600">
              {vehicles.filter((v) => v.status === "active").length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Maintenance</div>
            <div className="text-2xl font-bold text-yellow-600">
              {vehicles.filter((v) => v.status === "maintenance").length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Capacity</div>
            <div className="text-2xl font-bold text-blue-600">
              {vehicles.reduce((sum, v) => sum + v.capacity, 0)} seats
            </div>
          </div>
        </div>

        {/* Vehicles Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    License Plate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <Car className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium">No vehicles found</p>
                      <p className="text-sm mt-1">
                        {searchTerm
                          ? "Try adjusting your search"
                          : "Add your first vehicle to get started"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <tr key={vehicle._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                            {getVehicleIcon(vehicle.type)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {vehicle.model}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 capitalize">
                          {vehicle.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-gray-900">
                          {vehicle.license_plate}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {vehicle.capacity} seats
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusColor(
                            vehicle.status
                          )}`}
                        >
                          {vehicle.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(vehicle)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(vehicle._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    {editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Vehicle Type - Fixed to Bus */}
                  <input type="hidden" name="type" value="bus" />
                  {/* Year and Color - Hidden fields with default values */}
                  <input type="hidden" name="year" value={formData.year} />
                  <input type="hidden" name="color" value={formData.color} />

                  {/* Model */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bus Number *
                    </label>
                    <input
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., BS-123, RP-456"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>



                  {/* Capacity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Seating Capacity *
                    </label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      required
                      min="1"
                      max="100"
                      placeholder="Number of seats"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum number of passengers this vehicle can accommodate
                    </p>
                  </div>

                  {/* License Plate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      License Plate *
                    </label>
                    <input
                      type="text"
                      name="license_plate"
                      value={formData.license_plate}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., DHA-12345"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status *
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Error message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {editingVehicle ? "Update Vehicle" : "Add Vehicle"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default VehicleManagement;
