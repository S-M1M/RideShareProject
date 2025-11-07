import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { MapPin, Plus, Edit2, Trash2 } from "lucide-react";
import api from "../../utils/api";
import RouteFormModal from "../../components/RouteFormModal";

const RouteAssignment = () => {
  const [presetRoutes, setPresetRoutes] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPresetRoutes();
  }, []);

  const fetchPresetRoutes = async () => {
    try {
      const response = await api.get("/admin/preset-routes");
      setPresetRoutes(response.data);
    } catch (error) {
      console.error("Error fetching preset routes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoute = async (id) => {
    if (!window.confirm("Are you sure you want to delete this preset route?")) {
      return;
    }

    try {
      await api.delete(`/admin/preset-routes/${id}`);
      setPresetRoutes(presetRoutes.filter((r) => r._id !== id));
    } catch (error) {
      alert("Error deleting route: " + (error.response?.data?.error || error.message));
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
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h2 className="text-xl font-semibold">Preset Routes</h2>
              <p className="text-sm text-gray-600 mt-1">
                Create and manage route templates for driver assignments
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              <Plus size={16} />
              <span>Create Preset Route</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {presetRoutes.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow p-8 text-center">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No preset routes created yet.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Create your first preset route
              </button>
            </div>
          ) : (
            presetRoutes.map((route) => (
              <div key={route._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {route.name}
                    </h3>
                    <p className="text-sm text-gray-600">{route.description}</p>
                  </div>
                  <div className="flex space-x-2 ml-2">
                    <button
                      onClick={() => {
                        setSelectedRoute(route);
                        setShowEditModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteRoute(route._id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">Start Point:</p>
                    <p className="font-medium">{route.startPoint.name}</p>
                  </div>

                  <div>
                    <p className="text-gray-500 mb-1">End Point:</p>
                    <p className="font-medium">{route.endPoint.name}</p>
                  </div>

                  <div>
                    <p className="text-gray-500 mb-1">Stoppages:</p>
                    <p className="font-medium">{route.stoppages?.length || 0} stoppages</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      <p className="text-gray-500">Est. Time:</p>
                      <p className="font-medium">{route.estimatedTime || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Fare:</p>
                      <p className="font-medium text-green-600">{route.fare || "N/A"}</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        route.active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {route.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showCreateModal && (
        <RouteFormModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newRoute) => {
            setPresetRoutes([newRoute, ...presetRoutes]);
            setShowCreateModal(false);
          }}
        />
      )}

      {showEditModal && selectedRoute && (
        <RouteFormModal
          route={selectedRoute}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRoute(null);
          }}
          onSuccess={(updatedRoute) => {
            setPresetRoutes(
              presetRoutes.map((r) => (r._id === updatedRoute._id ? updatedRoute : r))
            );
            setShowEditModal(false);
            setSelectedRoute(null);
          }}
        />
      )}
    </Layout>
  );
};

export default RouteAssignment;
