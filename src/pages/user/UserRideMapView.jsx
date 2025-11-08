import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { MapPin, Clock, ArrowRight, Navigation } from "lucide-react";
import Layout from "../../components/Layout";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../utils/api";

const UserRideMapView = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const rideId = searchParams.get("rideId");

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);

  // Auto-refresh ride data every 10 seconds to see live updates
  useEffect(() => {
    if (!rideId) {
      alert("No ride ID provided");
      navigate("/my-rides");
      return;
    }

    fetchRide();

    // Set up polling for live updates
    const interval = setInterval(() => {
      fetchRide();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [rideId]);

  // Initialize map once
  useEffect(() => {
    if (loading || !ride || mapRef.current) return;

    const initMap = async () => {
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
      const container = document.getElementById("ride-map-user");
      if (!container) {
        console.error("Map container not found!");
        return;
      }

      // Create map centered on Dhaka, Bangladesh
      const map = L.map("ride-map-user", {
        center: [23.8103, 90.4125],
        zoom: 12,
        zoomControl: true,
      });

      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      mapRef.current = map;

      // Force initial render
      setTimeout(() => {
        map.invalidateSize();
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
  }, [loading, ride]);

  // Update map markers when ride changes
  useEffect(() => {
    if (!mapRef.current || !ride || !ride.presetRoute_id) return;

    const updateMap = async () => {
      try {
        const L = (await import("leaflet")).default;

        // Clear existing markers and polylines
        mapRef.current.eachLayer((layer) => {
          if (layer instanceof L.Marker || layer instanceof L.Polyline) {
            mapRef.current.removeLayer(layer);
          }
        });

        const markers = [];
        const route = ride.presetRoute_id;
        const allStops = [];

        // Add START point
        if (route.startPoint) {
          allStops.push({ ...route.startPoint, type: "start", name: "Start" });
        }

        // Add intermediate stops
        const stoppagesData = route.stoppages || route.stops || [];
        stoppagesData.forEach((stop) => {
          allStops.push({ ...stop, type: "stop" });
        });

        // Add END point
        if (route.endPoint) {
          allStops.push({ ...route.endPoint, type: "end", name: "End" });
        }

        console.log("Creating markers for", allStops.length, "stops");

        // Highlight user's pickup and drop stops
        const userPickupStop = ride.userSubscription?.pickup_stop_name;
        const userDropStop = ride.userSubscription?.drop_stop_name;

        // Create markers for all stops
        allStops.forEach((stop, index) => {
          if (!stop.lat || !stop.lng) {
            console.warn(`Stop ${index} missing coordinates:`, stop);
            return;
          }

          const isCompleted = ride.completedStops?.some(
            (cs) => cs.stopIndex === index
          );
          const isCurrent = ride.currentStopIndex === index;
          const isUserPickup = stop.name === userPickupStop;
          const isUserDrop = stop.name === userDropStop;

          let bgColor = "#3B82F6"; // Default blue
          let label = index + 1;
          let borderColor = "white";

          if (stop.type === "start") {
            bgColor = "#10B981"; // Green for start
            label = "S";
          } else if (stop.type === "end") {
            bgColor = "#EF4444"; // Red for end
            label = "E";
          }

          if (isCompleted) {
            bgColor = "#22C55E"; // Bright green for completed
          } else if (isCurrent) {
            bgColor = "#F59E0B"; // Orange for current
          }

          // Special border for user's stops
          if (isUserPickup || isUserDrop) {
            borderColor = "#8B5CF6"; // Purple border for user's stops
          }

          const iconHtml = `
            <div style="
              background: ${bgColor};
              border: 3px solid ${borderColor};
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
          let popupContent = `<div style="min-width: 150px;"><b>${stop.name}</b><br/>`;
          popupContent += `<span style="color: ${bgColor}; font-weight: bold;">${statusText}</span>`;

          if (isUserPickup) {
            popupContent += `<br/><span style="color: #8B5CF6; font-weight: bold;">📍 Your Pickup</span>`;
          }
          if (isUserDrop) {
            popupContent += `<br/><span style="color: #8B5CF6; font-weight: bold;">📍 Your Drop</span>`;
          }
          popupContent += `</div>`;

          try {
            const marker = L.marker([stop.lat, stop.lng], { icon })
              .addTo(mapRef.current)
              .bindPopup(popupContent);

            markers.push(marker);
          } catch (err) {
            console.error("Error adding marker:", err, stop);
          }
        });

        console.log("Added", markers.length, "markers to map");

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
  }, [ride]);

  const fetchRide = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/rides/${rideId}`);
      setRide(response.data);
    } catch (error) {
      console.error("Error fetching ride:", error);
      if (loading) {
        // Only show alert on first load
        alert(
          "Error loading ride: " +
            (error.response?.data?.error || error.message)
        );
        navigate("/my-rides");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && !ride) {
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
                    : ride.status === "cancelled"
                    ? "bg-red-100 text-red-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {ride.status.toUpperCase().replace("-", " ")}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              <div>Date: {new Date(ride.rideDate).toLocaleDateString()}</div>
              <div>Time: {ride.scheduledStartTime}</div>
              <div>Driver: {ride.driver_id?.name || "N/A"}</div>
              <div>
                Progress: {completedCount} / {allStops.length} stops
              </div>
            </div>
          </div>

          {/* User's Pickup/Drop Info */}
          {ride.userSubscription && (
            <div className="mb-4 p-4 bg-purple-50 border-2 border-purple-300 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Your Stops
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <div>
                    <div className="text-xs text-gray-500">Pickup</div>
                    <div className="font-medium">
                      {ride.userSubscription.pickup_stop_name}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <div>
                    <div className="text-xs text-gray-500">Drop</div>
                    <div className="font-medium">
                      {ride.userSubscription.drop_stop_name}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Live Progress */}
          {ride.status === "in-progress" && currentStop && (
            <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-300">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-blue-700">
                  LIVE TRACKING
                </span>
                <span className="ml-auto text-xs text-gray-500 italic">
                  Auto-updates
                </span>
              </div>
              <div className="text-sm font-medium text-gray-700 mb-1">
                Current Stop:
              </div>
              <div className="text-lg font-bold text-blue-700 mb-2">
                {currentStop.name}
              </div>
              {nextStop && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Next:</span> {nextStop.name}
                </div>
              )}
            </div>
          )}

          {ride.status === "completed" && (
            <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg text-center">
              <div className="text-4xl mb-2">✓</div>
              <div className="font-bold text-green-800">Ride Completed!</div>
              <div className="text-sm text-green-700">Thank you for riding</div>
            </div>
          )}

          {ride.status === "scheduled" && (
            <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg text-center">
              <Clock className="w-10 h-10 text-blue-600 mx-auto mb-2" />
              <div className="font-bold text-blue-800">Ride Scheduled</div>
              <div className="text-sm text-blue-700">Not started yet</div>
            </div>
          )}

          <h3 className="text-lg font-semibold mb-3 text-gray-900">
            Route Diagram
          </h3>
          <div className="space-y-2">
            {/* Start Point */}
            {route?.startPoint && (
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 border-2 ${
                      ride.completedStops?.some((cs) => cs.stopIndex === 0)
                        ? "bg-green-500 text-white border-green-600"
                        : ride.currentStopIndex === 0
                        ? "bg-orange-500 text-white border-orange-600 animate-pulse"
                        : "bg-green-500 text-white border-white"
                    } ${
                      route.startPoint.name ===
                      ride.userSubscription?.pickup_stop_name
                        ? "ring-4 ring-purple-300"
                        : ""
                    }`}
                  >
                    {ride.completedStops?.some((cs) => cs.stopIndex === 0)
                      ? "✓"
                      : "S"}
                  </div>
                  <div className="w-0.5 h-8 bg-gray-300"></div>
                </div>
                <div className="pt-1">
                  <p className="font-medium text-gray-900">
                    {route.startPoint.name}
                  </p>
                  <p className="text-xs text-gray-500">Starting Point</p>
                  {route.startPoint.name ===
                    ride.userSubscription?.pickup_stop_name && (
                    <p className="text-xs text-purple-600 font-semibold">
                      📍 Your Pickup
                    </p>
                  )}
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
              const isUserPickup =
                stoppage.name === ride.userSubscription?.pickup_stop_name;
              const isUserDrop =
                stoppage.name === ride.userSubscription?.drop_stop_name;

              return (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 border-2 ${
                        isCompleted
                          ? "bg-green-500 text-white border-green-600"
                          : isCurrent
                          ? "bg-orange-500 text-white border-orange-600 animate-pulse"
                          : "bg-blue-500 text-white border-white"
                      } ${
                        isUserPickup || isUserDrop
                          ? "ring-4 ring-purple-300"
                          : ""
                      }`}
                    >
                      {isCompleted ? "✓" : index + 1}
                    </div>
                    <div className="w-0.5 h-8 bg-gray-300"></div>
                  </div>
                  <div className="pt-1">
                    <p className="font-medium text-gray-900">{stoppage.name}</p>
                    <p className="text-xs text-gray-500">
                      Stoppage {index + 1}
                    </p>
                    {isUserPickup && (
                      <p className="text-xs text-purple-600 font-semibold">
                        📍 Your Pickup
                      </p>
                    )}
                    {isUserDrop && (
                      <p className="text-xs text-purple-600 font-semibold">
                        📍 Your Drop
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* End Point */}
            {route?.endPoint && (
              <div className="flex items-start gap-3">
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
                    } ${
                      route.endPoint.name ===
                      ride.userSubscription?.drop_stop_name
                        ? "ring-4 ring-purple-300"
                        : ""
                    }`}
                  >
                    {ride.completedStops?.some(
                      (cs) => cs.stopIndex === allStops.length - 1
                    )
                      ? "✓"
                      : "E"}
                  </div>
                </div>
                <div className="pt-1">
                  <p className="font-medium text-gray-900">
                    {route.endPoint.name}
                  </p>
                  <p className="text-xs text-gray-500">End Point</p>
                  {route.endPoint.name ===
                    ride.userSubscription?.drop_stop_name && (
                    <p className="text-xs text-purple-600 font-semibold">
                      📍 Your Drop
                    </p>
                  )}
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
              Track the ride progress • {allStops.length} stops total
            </p>
          </div>
          <div id="ride-map-user" className="w-full h-full"></div>
        </div>
      </div>
    </Layout>
  );
};

export default UserRideMapView;
