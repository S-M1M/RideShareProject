import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  MapPin,
  CheckCircle,
  Navigation,
  ArrowRight,
  Users,
  X,
} from "lucide-react";
import Layout from "../../components/Layout";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../utils/api";

const DriverRideMapView = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const rideId = searchParams.get("rideId");

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);

  // Attendance modal state
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedStop, setSelectedStop] = useState(null);
  const [usersAtStop, setUsersAtStop] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [markingAttendance, setMarkingAttendance] = useState(false);

  // Fetch ride details
  useEffect(() => {
    if (!rideId) {
      alert("No ride ID provided");
      navigate("/driver/dashboard");
      return;
    }
    fetchRide();
  }, [rideId]);

  // Initialize map once
  useEffect(() => {
    // Don't wait for ride data, just make sure we haven't already initialized
    if (loading || mapRef.current) return;

    const initMap = async () => {
      console.log("=== INITIALIZING MAP ===");
      const L = (await import("leaflet")).default;

      // Import CSS only once
      if (
        !document.querySelector(
          'link[href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"]'
        )
      ) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      // Wait a bit for container to be ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check if container exists
      const container = document.getElementById("ride-map");
      if (!container) {
        console.error("Map container not found!");
        return;
      }

      // Create map centered on Dhaka, Bangladesh
      const map = L.map("ride-map", {
        center: [23.8103, 90.4125],
        zoom: 12,
        zoomControl: true,
      });

      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      mapRef.current = map;
      console.log("=== MAP INITIALIZED ===", map);

      // Force initial render and then mark map as ready
      setTimeout(() => {
        map.invalidateSize();
        setMapReady(true);
        console.log("=== MAP MARKED AS READY ===");
      }, 100);
    };

    initMap();

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [loading]);

  // Update map markers when ride changes
  useEffect(() => {
    console.log("=== UPDATE MAP USEEFFECT TRIGGERED ===");
    console.log("mapRef.current:", mapRef.current);
    console.log("mapReady:", mapReady);
    console.log("ride:", ride);
    console.log("ride.presetRoute_id:", ride?.presetRoute_id);

    if (!mapReady || !mapRef.current || !ride || !ride.presetRoute_id) {
      console.log("Skipping map update - missing requirements");
      return;
    }

    const updateMap = async () => {
      console.log("=== STARTING UPDATE MAP ===");
      console.log("Map reference:", mapRef.current);
      console.log(
        "Map container exists:",
        !!document.getElementById("ride-map")
      );
      console.log("Ride data:", ride);
      try {
        const L = (await import("leaflet")).default;

        // Verify map is still valid
        if (!mapRef.current || !mapRef.current.getContainer()) {
          console.error("Map reference lost or container removed!");
          return;
        }

        // Clear existing markers and polylines
        let clearedCount = 0;
        mapRef.current.eachLayer((layer) => {
          if (layer instanceof L.Marker || layer instanceof L.Polyline) {
            mapRef.current.removeLayer(layer);
            clearedCount++;
          }
        });
        console.log(`Cleared ${clearedCount} markers/polylines from map`);

        const markers = [];
        const route = ride.presetRoute_id;
        const allStops = [];

        // Add START point
        if (route.startPoint) {
          allStops.push({ ...route.startPoint, type: "start", name: "Start" });
        }

        // Add intermediate stops
        const stoppagesData = route.stoppages || route.stops || [];
        console.log("Stoppages data:", stoppagesData);
        console.log("Number of stoppages:", stoppagesData.length);
        stoppagesData.forEach((stop) => {
          allStops.push({ ...stop, type: "stop" });
        });

        // Add END point
        if (route.endPoint) {
          allStops.push({ ...route.endPoint, type: "end", name: "End" });
        }

        console.log("Creating markers for", allStops.length, "stops");
        console.log("All stops:", allStops);

        // Create markers for all stops
        let stoppageCounter = 0;
        allStops.forEach((stop, index) => {
          if (!stop.lat || !stop.lng) {
            console.warn(`Stop ${index} missing coordinates:`, stop);
            return;
          }

          const isCompleted = ride.completedStops?.some(
            (cs) => cs.stopIndex === index
          );
          const isCurrent = ride.currentStopIndex === index;

          let bgColor = "#3B82F6"; // Default blue
          let label;

          if (stop.type === "start") {
            bgColor = "#10B981"; // Green for start
            label = "S";
          } else if (stop.type === "end") {
            bgColor = "#EF4444"; // Red for end
            label = "E";
          } else {
            // This is a stoppage - use numeric label
            stoppageCounter++;
            label = stoppageCounter;
          }

          if (isCompleted) {
            bgColor = "#22C55E"; // Bright green for completed
          } else if (isCurrent) {
            bgColor = "#F59E0B"; // Orange for current
          }

          const iconHtml = `
            <div style="
              background: ${bgColor};
              border: 3px solid white;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: ${
                stop.type === "start" || stop.type === "end" ? "12px" : "14px"
              };
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              ${isCurrent ? "animation: pulse 2s infinite;" : ""}
            ">
              ${isCompleted ? "✓" : label}
            </div>
          `;

          const icon = L.divIcon({
            html: iconHtml,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            className: "custom-marker",
          });

          const statusText = isCompleted
            ? "Completed"
            : isCurrent
            ? "Current Stop"
            : "Upcoming";

          try {
            const marker = L.marker([stop.lat, stop.lng], { icon }).addTo(
              mapRef.current
            ).bindPopup(`
                <div style="min-width: 150px;">
                  <b>${stop.name}</b><br/>
                  <span style="color: ${bgColor}; font-weight: bold;">${statusText}</span>
                </div>
              `);

            markers.push(marker);
            console.log(
              `Added marker for ${stop.name} at [${stop.lat}, ${stop.lng}]`
            );
          } catch (err) {
            console.error("Error adding marker:", err, stop);
          }
        });

        console.log("Added", markers.length, "markers to map");
        console.log("Markers array:", markers);

        // Draw route line
        if (allStops.length > 1) {
          const coordinates = allStops
            .filter((stop) => stop.lat && stop.lng)
            .map((stop) => [stop.lat, stop.lng]);

          if (coordinates.length > 1) {
            L.polyline(coordinates, {
              color: "#3B82F6",
              weight: 4,
              opacity: 0.7,
              smoothFactor: 1,
            }).addTo(mapRef.current);
          }
        }

        // Fit map to show all markers
        if (markers.length > 0) {
          const group = L.featureGroup(markers);
          mapRef.current.fitBounds(group.getBounds().pad(0.1));
        }
      } catch (error) {
        console.error("Error updating map:", error);
      }
    };

    updateMap();
  }, [ride, mapReady]);

  const fetchRide = async (initialLoad = true) => {
    try {
      if (initialLoad) {
        setLoading(true);
      }
      const response = await api.get(`/rides/${rideId}`);
      console.log("=== FETCH RIDE RESPONSE ===");
      console.log("Full ride data:", response.data);
      console.log("Preset route:", response.data.presetRoute_id);
      console.log("Route stoppages:", response.data.presetRoute_id?.stoppages);
      console.log(
        "Route stops (old field):",
        response.data.presetRoute_id?.stops
      );
      setRide(response.data);
    } catch (error) {
      console.error("Error fetching ride:", error);
      alert(
        "Error loading ride: " + (error.response?.data?.error || error.message)
      );
      navigate("/driver/dashboard");
    } finally {
      if (initialLoad) {
        setLoading(false);
      }
    }
  };

  const markAsReached = async () => {
    if (!ride || ride.status !== "in-progress") {
      alert("Ride must be in progress to mark stops");
      return;
    }

    const route = ride.presetRoute_id;
    const allStops = [];

    // Build stops array
    if (route.startPoint) allStops.push(route.startPoint);
    const stoppagesData = route.stoppages || route.stops || [];
    stoppagesData.forEach((stop) => allStops.push(stop));
    if (route.endPoint) allStops.push(route.endPoint);

    const currentStop = allStops[ride.currentStopIndex];

    if (!currentStop) {
      alert("All stops have been completed!");
      return;
    }

    setUpdating(true);
    try {
      await api.put(`/rides/${rideId}/progress`, {
        stopIndex: ride.currentStopIndex,
      });

      await fetchRide(false); // Refresh ride data without toggling loading state
    } catch (error) {
      console.error("Error updating progress:", error);
      alert(
        "Error updating progress: " +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setUpdating(false);
    }
  };

  const openAttendanceModal = async (stop, stopId) => {
    setSelectedStop({ ...stop, stopId });
    setShowAttendanceModal(true);
    setLoadingUsers(true);

    try {
      const response = await api.get(
        `/rides/${rideId}/users-at-stop/${stopId}`
      );
      setUsersAtStop(response.data.users);
    } catch (error) {
      console.error("Error fetching users at stop:", error);
      // Don't show alert, just set empty array - modal will show appropriate message
      setUsersAtStop([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const markAttendance = async (userId, status) => {
    setMarkingAttendance(true);
    try {
      await api.put(`/rides/${rideId}/attendance`, {
        userId,
        stopId: selectedStop.stopId,
        status,
      });

      // Update local state
      setUsersAtStop((prev) =>
        prev.map((user) =>
          user.userId === userId
            ? {
                ...user,
                attendance: { status, timestamp: new Date() },
              }
            : user
        )
      );

      // Refresh ride data to update attendance
      await fetchRide(false);
    } catch (error) {
      console.error("Error marking attendance:", error);
      // Error will be visible in console, but won't interrupt the user experience
    } finally {
      setMarkingAttendance(false);
    }
  };

  const closeAttendanceModal = () => {
    setShowAttendanceModal(false);
    setSelectedStop(null);
    setUsersAtStop([]);
  };

  if (loading) {
    return (
      <Layout title="Ride Map">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading ride...</div>
        </div>
      </Layout>
    );
  }

  if (!ride) {
    return (
      <Layout title="Ride Map">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Ride not found</div>
        </div>
      </Layout>
    );
  }

  const route = ride.presetRoute_id;
  const allStops = [];

  // Build stops array
  if (route?.startPoint)
    allStops.push({ ...route.startPoint, type: "start", name: "Start" });
  const stoppagesData = route?.stoppages || route?.stops || [];
  stoppagesData.forEach((stop) => allStops.push({ ...stop, type: "stop" }));
  if (route?.endPoint)
    allStops.push({ ...route.endPoint, type: "end", name: "End" });

  const currentStop = allStops[ride.currentStopIndex];
  const nextStop = allStops[ride.currentStopIndex + 1];
  const completedCount = ride.completedStops?.length || 0;

  return (
    <Layout title="Ride Map">
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>

      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-200px)]">
        {/* Left Side - Route Diagram */}
        <div className="lg:w-1/4 bg-white rounded-lg shadow-md p-4 overflow-y-auto">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">{route?.name}</h2>
            <p className="text-sm text-gray-600 mt-1">{route?.description}</p>
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  ride.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : ride.status === "in-progress"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {ride.status.toUpperCase().replace("-", " ")}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              <div>Date: {new Date(ride.rideDate).toLocaleDateString()}</div>
              <div>Time: {ride.scheduledStartTime}</div>
              <div>
                Progress: {completedCount} / {allStops.length} stops
              </div>
            </div>
          </div>

          {/* Current Stop Action */}
          {ride.status === "in-progress" && currentStop && (
            <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-300">
              <div className="text-sm font-medium text-gray-700 mb-1">
                Current Stop:
              </div>
              <div className="text-lg font-bold text-blue-700 mb-3">
                {currentStop.name}
              </div>
              {nextStop && (
                <div className="text-sm text-gray-600 mb-3">
                  <span className="font-medium">Next:</span> {nextStop.name}
                </div>
              )}
              <button
                onClick={markAsReached}
                disabled={updating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium shadow-md"
              >
                <CheckCircle className="w-4 h-4" />
                {updating ? "Marking..." : "Mark as Reached"}
              </button>
            </div>
          )}

          {ride.status === "completed" && (
            <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg text-center">
              <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-2" />
              <div className="font-bold text-green-800">Ride Completed!</div>
            </div>
          )}

          <h3 className="text-lg font-semibold mb-3 text-gray-900">
            Route Diagram
          </h3>
          <div className="space-y-2">
            {/* Start Point */}
            {route?.startPoint && (
              <div className="flex items-start gap-2">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 border-2 ${
                      ride.completedStops?.some((cs) => cs.stopIndex === 0)
                        ? "bg-green-500 text-white border-green-600"
                        : ride.currentStopIndex === 0
                        ? "bg-orange-500 text-white border-orange-600 animate-pulse"
                        : "bg-green-500 text-white border-white"
                    }`}
                  >
                    {ride.completedStops?.some((cs) => cs.stopIndex === 0)
                      ? "✓"
                      : "S"}
                  </div>
                  <div className="w-0.5 h-8 bg-gray-300"></div>
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {route.startPoint.name}
                      </p>
                      <p className="text-xs text-gray-500">Starting Point</p>
                    </div>
                    <button
                      onClick={() =>
                        openAttendanceModal(
                          route.startPoint,
                          `start_${route._id}`
                        )
                      }
                      className="p-1 hover:bg-blue-100 rounded transition-colors"
                      title="View Attendance"
                    >
                      <Users className="w-4 h-4 text-blue-600" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Stoppages */}
            {(route?.stoppages || route?.stops || []).map((stoppage, index) => {
              const stopIndex = (route?.startPoint ? 1 : 0) + index;
              const isCompleted = ride.completedStops?.some(
                (cs) => cs.stopIndex === stopIndex
              );
              const isCurrent = ride.currentStopIndex === stopIndex;

              return (
                <div key={index} className="flex items-start gap-2">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 border-2 ${
                        isCompleted
                          ? "bg-green-500 text-white border-green-600"
                          : isCurrent
                          ? "bg-orange-500 text-white border-orange-600 animate-pulse"
                          : "bg-blue-500 text-white border-white"
                      }`}
                    >
                      {isCompleted ? "✓" : index + 1}
                    </div>
                    <div className="w-0.5 h-8 bg-gray-300"></div>
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {stoppage.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Stoppage {index + 1}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          openAttendanceModal(stoppage, stoppage._id)
                        }
                        className="p-1 hover:bg-blue-100 rounded transition-colors"
                        title="View Attendance"
                      >
                        <Users className="w-4 h-4 text-blue-600" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* End Point */}
            {route?.endPoint && (
              <div className="flex items-start gap-2">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 border-2 ${
                      ride.completedStops?.some(
                        (cs) => cs.stopIndex === allStops.length - 1
                      )
                        ? "bg-green-500 text-white border-green-600"
                        : ride.currentStopIndex === allStops.length - 1
                        ? "bg-orange-500 text-white border-orange-600 animate-pulse"
                        : "bg-red-500 text-white border-white"
                    }`}
                  >
                    {ride.completedStops?.some(
                      (cs) => cs.stopIndex === allStops.length - 1
                    )
                      ? "✓"
                      : "E"}
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {route.endPoint.name}
                      </p>
                      <p className="text-xs text-gray-500">End Point</p>
                    </div>
                    <button
                      onClick={() =>
                        openAttendanceModal(route.endPoint, `end_${route._id}`)
                      }
                      className="p-1 hover:bg-blue-100 rounded transition-colors"
                      title="View Attendance"
                    >
                      <Users className="w-4 h-4 text-blue-600" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Map */}
        <div className="lg:w-3/4 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              Live Route Map
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Track your progress through {allStops.length} stops
            </p>
          </div>
          <div id="ride-map" className="w-full h-full"></div>
        </div>
      </div>

      {/* Attendance Modal */}
      {showAttendanceModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{ zIndex: 10000 }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-blue-50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Attendance - {selectedStop?.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Mark users as present or absent at this stop
                </p>
              </div>
              <button
                onClick={closeAttendanceModal}
                className="p-2 hover:bg-blue-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto flex-1">
              {loadingUsers ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Loading users...</div>
                </div>
              ) : usersAtStop.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">
                    No users scheduled for pickup at this stop
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {usersAtStop.map((user) => (
                    <div
                      key={user.userId}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {user.name}
                          </h4>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          {user.phone && (
                            <p className="text-sm text-gray-600">
                              {user.phone}
                            </p>
                          )}
                          <div className="mt-2 text-xs text-gray-500">
                            <span className="font-medium">Pickup:</span>{" "}
                            {user.pickupStopName} →{" "}
                            <span className="font-medium">Drop:</span>{" "}
                            {user.dropStopName}
                          </div>
                        </div>

                        <div className="ml-4 flex flex-col gap-2">
                          {user.attendance ? (
                            <div
                              className={`px-3 py-2 rounded-lg text-sm font-semibold text-center ${
                                user.attendance.status === "present"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {user.attendance.status.toUpperCase()}
                              <div className="text-xs font-normal mt-1">
                                {new Date(
                                  user.attendance.timestamp
                                ).toLocaleTimeString()}
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() =>
                                  markAttendance(user.userId, "present")
                                }
                                disabled={markingAttendance}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                              >
                                Present
                              </button>
                              <button
                                onClick={() =>
                                  markAttendance(user.userId, "absent")
                                }
                                disabled={markingAttendance}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                              >
                                Absent
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {user.attendance && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <button
                            onClick={() =>
                              markAttendance(
                                user.userId,
                                user.attendance.status === "present"
                                  ? "absent"
                                  : "present"
                              )
                            }
                            disabled={markingAttendance}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:text-gray-400"
                          >
                            Change to{" "}
                            {user.attendance.status === "present"
                              ? "Absent"
                              : "Present"}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={closeAttendanceModal}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default DriverRideMapView;
