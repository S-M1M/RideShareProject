import React, { useState } from "react";
import { X } from "lucide-react";
import api from "../utils/api";
import RouteMapSelector from "./RouteMapSelector";

const RouteFormModal = ({ route, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: route?.name || "",
    description: route?.description || "",
    startPoint: route?.startPoint || { name: "", lat: 23.7808, lng: 90.4176 },
    endPoint: route?.endPoint || { name: "", lat: 23.7808, lng: 90.4176 },
    stoppages: route?.stoppages || route?.stops || [], // Check both new and old field names
    estimatedTime: route?.estimatedTime || "",
    fare: route?.fare || "",
    active: route?.active !== undefined ? route.active : true,
  });
  const [loading, setLoading] = useState(false);
  const [showStartMap, setShowStartMap] = useState(false);
  const [showEndMap, setShowEndMap] = useState(false);
  const [showStopMap, setShowStopMap] = useState(false);
  const [newStop, setNewStop] = useState({ name: "", lat: 23.7808, lng: 90.4176, order: 0 });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const stoppagesWithOrder = formData.stoppages.map((stoppage, idx) => ({
        ...stoppage,
        order: stoppage.order !== undefined ? stoppage.order : idx,
      })).sort((a, b) => a.order - b.order);

      const dataToSubmit = {
        ...formData,
        stoppages: stoppagesWithOrder,
      };

      if (route) {
        const response = await api.put(`/admin/preset-routes/${route._id}`, dataToSubmit);
        onSuccess(response.data.route);
      } else {
        const response = await api.post("/admin/preset-routes", dataToSubmit);
        onSuccess(response.data.route);
      }
    } catch (error) {
      alert("Error saving route: " + (error.response?.data?.error || error.message));
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

  const handleAddStop = () => {
    if (!newStop.name) {
      alert("Please enter a stoppage name");
      return;
    }

    const stoppageWithOrder = {
      ...newStop,
      order: formData.stoppages.length,
    };

    setFormData({
      ...formData,
      stoppages: [...formData.stoppages, stoppageWithOrder],
    });
    setNewStop({ name: "", lat: 23.7808, lng: 90.4176, order: 0 });
    setShowStopMap(false);
  };

  const handleRemoveStop = (index) => {
    setFormData({
      ...formData,
      stoppages: formData.stoppages.filter((_, i) => i !== index).map((stoppage, idx) => ({
        ...stoppage,
        order: idx,
      })),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full my-8">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">
              {route ? "Edit Preset Route" : "Create Preset Route"}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Route Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Gulshan to Motijheel"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g., Express route via Tejgaon"
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="border rounded-lg p-4 bg-gray-50">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Point *
            </label>
            <input
              type="text"
              value={formData.startPoint.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  startPoint: { ...formData.startPoint, name: e.target.value },
                })
              }
              placeholder="Enter start point name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
            />
            <button
              type="button"
              onClick={() => setShowStartMap(!showStartMap)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {showStartMap ? "Hide Map" : "Select on Map"}
            </button>
            {showStartMap && (
              <div className="mt-2">
                <RouteMapSelector
                  position={formData.startPoint}
                  onPositionChange={(pos) =>
                    setFormData({ ...formData, startPoint: pos })
                  }
                />
              </div>
            )}
            <p className="text-xs text-gray-600 mt-2">
              Lat: {formData.startPoint.lat.toFixed(4)}, Lng: {formData.startPoint.lng.toFixed(4)}
            </p>
          </div>

          <div className="border rounded-lg p-4 bg-gray-50">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Point *
            </label>
            <input
              type="text"
              value={formData.endPoint.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  endPoint: { ...formData.endPoint, name: e.target.value },
                })
              }
              placeholder="Enter end point name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
            />
            <button
              type="button"
              onClick={() => setShowEndMap(!showEndMap)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {showEndMap ? "Hide Map" : "Select on Map"}
            </button>
            {showEndMap && (
              <div className="mt-2">
                <RouteMapSelector
                  position={formData.endPoint}
                  onPositionChange={(pos) =>
                    setFormData({ ...formData, endPoint: pos })
                  }
                />
              </div>
            )}
            <p className="text-xs text-gray-600 mt-2">
              Lat: {formData.endPoint.lat.toFixed(4)}, Lng: {formData.endPoint.lng.toFixed(4)}
            </p>
          </div>

          <div className="border rounded-lg p-4 bg-gray-50">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stoppages
            </label>
            
            {formData.stoppages.length > 0 && (
              <div className="space-y-2 mb-3">
                {formData.stoppages
                  .sort((a, b) => a.order - b.order)
                  .map((stoppage, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white p-2 rounded border"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{stoppage.name}</p>
                        <p className="text-xs text-gray-500">
                          Stoppage {index + 1} - Lat: {stoppage.lat.toFixed(4)}, Lng: {stoppage.lng.toFixed(4)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveStop(index)}
                        className="text-red-600 hover:text-red-700 ml-2"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
              </div>
            )}

            <div className="border-t pt-3 mt-3">
              <input
                type="text"
                value={newStop.name}
                onChange={(e) => setNewStop({ ...newStop, name: e.target.value })}
                placeholder="Enter stoppage name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
              />
              <button
                type="button"
                onClick={() => setShowStopMap(!showStopMap)}
                className="text-sm text-blue-600 hover:text-blue-700 mb-2"
              >
                {showStopMap ? "Hide Map" : "Select Location on Map"}
              </button>
              {showStopMap && (
                <div className="mb-2">
                  <RouteMapSelector
                    position={newStop}
                    onPositionChange={(pos) =>
                      setNewStop({ ...newStop, lat: pos.lat, lng: pos.lng })
                    }
                  />
                </div>
              )}
              <button
                type="button"
                onClick={handleAddStop}
                className="w-full bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300 text-sm"
              >
                Add Stoppage
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Time
              </label>
              <input
                type="text"
                name="estimatedTime"
                value={formData.estimatedTime}
                onChange={handleChange}
                placeholder="e.g., 45 min"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fare
              </label>
              <input
                type="text"
                name="fare"
                value={formData.fare}
                onChange={handleChange}
                placeholder="e.g., ৳35"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) =>
                setFormData({ ...formData, active: e.target.checked })
              }
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="active" className="ml-2 text-sm text-gray-700">
              Active (available for assignment)
            </label>
          </div>
        </form>

        <div className="p-6 border-t bg-gray-50 flex space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : route ? "Update Route" : "Create Route"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RouteFormModal;
