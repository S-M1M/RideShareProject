import React, { useEffect, useState } from "react";
import { MapPin, Clock, CheckCircle, RefreshCw } from "lucide-react";
import Layout from "../../components/Layout";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../utils/api";

const MapView = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedStop, setSelectedStop] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch driver assignments
  useEffect(() => {
    if (user?.role === "driver") {
      fetchAssignments();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchAssignments = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await api.get(`/drivers/assignments?date=${today}`);
      setAssignments(response.data);
      if (response.data.length > 0) {
        setSelectedAssignment(response.data[0]);
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get all stops including start and end points
  const getAllStops = (assignment) => {
    if (!assignment?.presetRoute_id) return [];
    
    const route = assignment.presetRoute_id;
    const allStops = [
      { ...route.startPoint, order: -1, type: "start" },
      ...route.stops.map(stop => ({ ...stop, type: "intermediate" })),
      { ...route.endPoint, order: route.stops.length, type: "end" }
    ];
    
    return allStops.sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  // Get current stop index for an assignment
  const getCurrentStopIndex = (assignment) => {
    return assignment?.currentStopIndex || 0;
  };

  // Get stop status
  const getStopStatus = (assignment, stopIndex) => {
    const currentIndex = getCurrentStopIndex(assignment);
    if (stopIndex < currentIndex) return "completed";
    if (stopIndex === currentIndex) return "current";
    return "upcoming";
  };

  // Mark a stop as reached (driver only)
  const markStopAsReached = async (assignment, stopIndex) => {
    if (user?.role !== "driver") return;

    try {
      const response = await api.put(`/drivers/assignments/${assignment._id}/progress`, {
        stopIndex,
      });
      
      // Update the assignment in state
      setAssignments(assignments.map(a => 
        a._id === assignment._id ? response.data : a
      ));
      setSelectedAssignment(response.data);
    } catch (error) {
      alert("Error updating progress: " + (error.response?.data?.error || error.message));
    }
  };

  // Reset assignment for next day
  const resetAssignment = async (assignment) => {
    if (user?.role !== "driver") return;
    
    if (!window.confirm("Are you sure you want to reset this route? This will clear all progress.")) {
      return;
    }

    try {
      const response = await api.post(`/drivers/assignments/${assignment._id}/reset`);
      
      // Update the assignment in state
      setAssignments(assignments.map(a => 
        a._id === assignment._id ? response.data.assignment : a
      ));
      setSelectedAssignment(response.data.assignment);
      alert("Route reset successfully!");
    } catch (error) {
      alert("Error resetting route: " + (error.response?.data?.error || error.message));
    }
  };

  // Check if all stops are completed
  const isAllStopsCompleted = (assignment) => {
    if (!assignment) return false;
    const allStops = getAllStops(assignment);
    return getCurrentStopIndex(assignment) >= allStops.length;
  };

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      const L = (await import("leaflet")).default;

      // Import CSS
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);

      // Create map
      const map = L.map("map", {
        center: [23.7808, 90.4176], // Gulshan, Dhaka
        zoom: 12,
        zoomControl: true,
      });

      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      setMapInstance(map);
    };

    initMap();

    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, []);

  // Update map markers when assignment changes
  useEffect(() => {
    if (!mapInstance || !selectedAssignment?.presetRoute_id) return;

    const updateMap = async () => {
      const L = (await import("leaflet")).default;

      // Clear existing layers
      mapInstance.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
          mapInstance.removeLayer(layer);
        }
      });

      const allStops = getAllStops(selectedAssignment);

      // Add markers for each stop
      const markers = [];
      allStops.forEach((stop, index) => {
        const isSelected = selectedStop?.name === stop.name;
        const stopStatus = getStopStatus(selectedAssignment, index);

        // Define colors based on status
        let backgroundColor = "#6B7280"; // Default gray
        if (stopStatus === "completed") backgroundColor = "#10B981"; // Green
        else if (stopStatus === "current") backgroundColor = "#EF4444"; // Red
        else if (isSelected) backgroundColor = "#3B82F6"; // Blue

        // Create custom icon
        const iconHtml = `
          <div style="
            background: ${backgroundColor};
            border: 3px solid white;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">
            ${stop.type === "start" ? "S" : stop.type === "end" ? "E" : index}
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          className: "custom-marker",
        });

        const marker = L.marker([stop.lat, stop.lng], {
          icon: customIcon,
        }).addTo(mapInstance).bindPopup(`
            <div style="min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold;">${stop.name}</h3>
              <p style="margin: 0; color: #666;">${
                stop.type === "start" ? "Start Point" : 
                stop.type === "end" ? "End Point" : 
                `Stop ${index} of ${allStops.length - 2}`
              }</p>
              <p style="margin: 4px 0 0 0; color: ${
                stopStatus === "completed"
                  ? "#10B981"
                  : stopStatus === "current"
                  ? "#EF4444"
                  : "#6B7280"
              };">
                Status: ${
                  stopStatus === "completed"
                    ? "Completed"
                    : stopStatus === "current"
                    ? "Current Stop"
                    : "Upcoming"
                }
              </p>
            </div>
          `);

        markers.push(marker);

        // Add click event
        marker.on("click", () => {
          setSelectedStop(stop);
        });
      });

      // Create route line
      const routeCoordinates = allStops.map((stop) => [stop.lat, stop.lng]);
      const routeLine = L.polyline(routeCoordinates, {
        color: "#3B82F6",
        weight: 4,
        opacity: 0.7,
        dashArray: "10, 5",
      }).addTo(mapInstance);

      // Fit map to show all markers
      const group = new L.featureGroup(markers);
      mapInstance.fitBounds(group.getBounds().pad(0.1));
    };

    updateMap();
  }, [mapInstance, selectedAssignment, selectedStop]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </Layout>
    );
  }

  // For regular users, show the old mock data view
  if (user?.role !== "driver") {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Route Explorer
              </h1>
              <p className="text-gray-600">
                View available bus routes and their stops in Dhaka
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Map view is available for drivers with assigned routes.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Driver view
  if (assignments.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                My Route
              </h1>
              <p className="text-gray-600">View and track your assigned route</p>
            </div>
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                No routes assigned for today.
              </p>
              <p className="text-sm text-gray-500">
                Check back later or contact your administrator.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const allStops = getAllStops(selectedAssignment);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              My Route
            </h1>
            <p className="text-gray-600">Track your assigned route progress</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Route Selection Sidebar */}
            {assignments.length > 1 && (
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h2 className="text-xl font-semibold mb-4">My Routes Today</h2>
                  <div className="space-y-3">
                    {assignments.map((assignment) => (
                      <button
                        key={assignment._id}
                        onClick={() => setSelectedAssignment(assignment)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          selectedAssignment?._id === assignment._id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="font-medium text-gray-900 mb-1">
                          {assignment.presetRoute_id.name}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          Start: {assignment.scheduledStartTime}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {assignment.presetRoute_id.stops.length + 2} stops
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {assignment.presetRoute_id.estimatedTime}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Route Progress Column */}
            <div className={assignments.length > 1 ? "lg:col-span-1" : "lg:col-span-1"}>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">
                    Route Progress
                  </h3>
                  {isAllStopsCompleted(selectedAssignment) && (
                    <button
                      onClick={() => resetAssignment(selectedAssignment)}
                      className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                    >
                      <RefreshCw size={14} />
                      Reset for Next Day
                    </button>
                  )}
                </div>
                
                <div className="text-sm text-gray-600 mb-4">
                  {selectedAssignment?.presetRoute_id.name}
                  <br />
                  Start Time: {selectedAssignment?.scheduledStartTime}
                </div>

                <div className="relative">
                  {allStops.map((stop, index) => {
                    const stopStatus = getStopStatus(selectedAssignment, index);
                    const isLast = index === allStops.length - 1;

                    return (
                      <div
                        key={index}
                        className="relative flex items-start mb-6"
                      >
                        {/* Vertical Line */}
                        {!isLast && (
                          <div
                            className={`absolute left-4 top-8 w-0.5 h-12 ${
                              stopStatus === "completed"
                                ? "bg-green-500"
                                : "bg-gray-300"
                            }`}
                          />
                        )}

                        {/* Stop Marker */}
                        <div className="flex-shrink-0 relative">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium border-2 border-white shadow-md ${
                              stopStatus === "completed"
                                ? "bg-green-500"
                                : stopStatus === "current"
                                ? "bg-red-500"
                                : "bg-gray-500"
                            }`}
                          >
                            {stopStatus === "completed" ? (
                              <CheckCircle size={16} />
                            ) : stop.type === "start" ? (
                              "S"
                            ) : stop.type === "end" ? (
                              "E"
                            ) : (
                              index
                            )}
                          </div>
                        </div>

                        {/* Stop Info */}
                        <div className="ml-4 flex-grow">
                          <button
                            onClick={() => setSelectedStop(stop)}
                            className={`text-left w-full p-3 rounded-lg border transition-all ${
                              selectedStop?.name === stop.name
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            <div className="font-medium text-gray-900 mb-1">
                              {stop.name}
                            </div>
                            <div className="text-xs text-gray-500 mb-1">
                              {stop.type === "start" ? "Start Point" : 
                               stop.type === "end" ? "End Point" : 
                               `Stop ${index}`}
                            </div>
                            <div
                              className={`text-sm ${
                                stopStatus === "completed"
                                  ? "text-green-600"
                                  : stopStatus === "current"
                                  ? "text-red-600"
                                  : "text-gray-500"
                              }`}
                            >
                              {stopStatus === "completed"
                                ? "Completed"
                                : stopStatus === "current"
                                ? "Current Stop"
                                : "Upcoming"}
                            </div>
                          </button>

                          {/* Driver Action Button */}
                          {user?.role === "driver" &&
                            stopStatus === "current" && (
                              <button
                                onClick={() =>
                                  markStopAsReached(selectedAssignment, index)
                                }
                                className="mt-2 w-full px-3 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 transition-colors"
                              >
                                Mark as Reached
                              </button>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Completion Message */}
                {isAllStopsCompleted(selectedAssignment) && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">
                      🎉 All stops completed!
                    </h4>
                    <p className="text-sm text-green-700 mb-3">
                      Great job! You've reached all stops on this route.
                    </p>
                    <button
                      onClick={() => resetAssignment(selectedAssignment)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <RefreshCw size={16} />
                      Reset for Next Day
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Map */}
            <div className={assignments.length > 1 ? "lg:col-span-2" : "lg:col-span-3"}>
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                  <h3 className="text-lg font-semibold">
                    {selectedAssignment?.presetRoute_id.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Click "Mark as Reached" to update your progress
                  </p>
                </div>
                <div id="map" className="w-full h-[600px]"></div>
              </div>

              {/* Legend */}
              <div className="bg-white rounded-lg shadow-md p-4 mt-4">
                <h4 className="font-semibold mb-3">Legend</h4>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <span>Current Stop</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                    <span>Upcoming</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MapView;
