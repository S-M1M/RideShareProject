import React, { useEffect, useState } from "react";
import { MapPin, Clock, CheckCircle, Bus, RefreshCw } from "lucide-react";
import Layout from "../../components/Layout";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../utils/api";

const MapView = () => {
  const { user } = useAuth();
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedStop, setSelectedStop] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rides, setRides] = useState([]);

  // Fetch user's rides (all upcoming and in-progress rides)
  useEffect(() => {
    fetchUserRides();
  }, [user]);

  // Initialize map
  useEffect(() => {
    // Only initialize map when not loading and we have a container
    if (loading) return;
    
    const mapContainer = document.getElementById("map");
    if (!mapContainer) return;

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
  }, [loading]);

  // Update map markers when route changes
  useEffect(() => {
    if (!mapInstance || !selectedRoute) return;

    const updateMap = async () => {
      const L = (await import("leaflet")).default;

      // Clear existing layers
      mapInstance.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
          mapInstance.removeLayer(layer);
        }
      });

      // Add markers for each stop
      const markers = [];
      selectedRoute.stops.forEach((stop, index) => {
        const isSelected = selectedStop?.id === stop.id;
        const stopStatus = getStopStatus(selectedRoute.rideId, index);

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
            ${index + 1}
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
        })
          .addTo(mapInstance)
          .bindPopup(
            `<b>${stop.name}</b><br/>Stop ${index + 1}<br/>Status: ${stopStatus}`
          );

        marker.on("click", () => {
          setSelectedStop(stop);
        });

        markers.push(marker);
      });

      // Draw route line
      const routeCoordinates = selectedRoute.stops.map((stop) => [
        stop.lat,
        stop.lng,
      ]);
      L.polyline(routeCoordinates, {
        color: "#3B82F6",
        weight: 4,
        opacity: 0.7,
      }).addTo(mapInstance);

      // Fit map to show all markers
      if (markers.length > 0) {
        const group = L.featureGroup(markers);
        mapInstance.fitBounds(group.getBounds().pad(0.1));
      }
    };

    updateMap();
  }, [mapInstance, selectedRoute, selectedStop, rides]);

  const fetchUserRides = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        setRoutes([]);
        setLoading(false);
        return;
      }

      // Fetch all user's rides (sorted by date - scheduled and in-progress only)
      const response = await api.get(`/rides/user/my-rides?status=scheduled`);
      console.log("User's rides:", response.data);
      
      // Sort rides by date (earliest first)
      const sortedRides = response.data.sort((a, b) => {
        const dateA = new Date(a.rideDate);
        const dateB = new Date(b.rideDate);
        return dateA - dateB;
      });
      
      setRides(sortedRides);

      // Transform rides to route format (same as driver view)
      const transformedRoutes = sortedRides.map(ride => {
        const presetRoute = ride.presetRoute_id;
        const allStops = [];

        // Add start point
        if (presetRoute.startPoint) {
          allStops.push({
            id: `start_${presetRoute._id}`,
            name: presetRoute.startPoint.name,
            lat: presetRoute.startPoint.lat,
            lng: presetRoute.startPoint.lng,
            order: 0,
            type: 'start'
          });
        }

        // Add all intermediate stops
        if (presetRoute.stops && presetRoute.stops.length > 0) {
          presetRoute.stops.forEach(stop => {
            allStops.push({
              id: stop._id, // Use actual MongoDB ID
              name: stop.name,
              lat: stop.lat,
              lng: stop.lng,
              order: stop.order,
              type: 'stop'
            });
          });
        }

        // Add end point
        if (presetRoute.endPoint) {
          allStops.push({
            id: `end_${presetRoute._id}`,
            name: presetRoute.endPoint.name,
            lat: presetRoute.endPoint.lat,
            lng: presetRoute.endPoint.lng,
            order: 999,
            type: 'end'
          });
        }

        // Sort by order
        allStops.sort((a, b) => a.order - b.order);

        return {
          id: presetRoute._id,
          rideId: ride._id,
          name: presetRoute.name,
          description: presetRoute.description,
          totalStops: allStops.length,
          fare: presetRoute.fare,
          stops: allStops,
          ride: ride,
          rideDate: ride.rideDate,
          scheduledStartTime: ride.scheduledStartTime,
          currentStopIndex: ride.currentStopIndex || 0,
          attendanceStatus: ride.userSubscription?.attendanceStatus,
        };
      });

      console.log("Transformed rides:", transformedRoutes);

      setRoutes(transformedRoutes);
      if (transformedRoutes.length > 0) {
        setSelectedRoute(transformedRoutes[0]);
      }
    } catch (error) {
      console.error("Error fetching user rides:", error);
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  // Get stop status based on driver's progress
  const getStopStatus = (rideId, stopIndex) => {
    const ride = rides.find(r => r._id === rideId);
    if (!ride) return "upcoming";
    
    const currentIndex = ride.currentStopIndex || 0;
    if (stopIndex < currentIndex) return "completed";
    if (stopIndex === currentIndex) return "current";
    return "upcoming";
  };

  // Loading state
  if (loading) {
    return (
      <Layout title="My Rides - Map View">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading your rides...</div>
        </div>
      </Layout>
    );
  }

  // No routes state
  if (routes.length === 0) {
    return (
      <Layout title="My Rides - Map View">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Bus className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Upcoming Rides
          </h3>
          <p className="text-gray-500 mb-4">
            You don't have any scheduled rides at the moment.
          </p>
          <a
            href="/subscription"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Purchase Subscription
          </a>
        </div>
      </Layout>
    );
  }

  // Main render
  return (
    <Layout title="My Rides - Map View">
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                My Rides
              </h1>
              <p className="text-gray-600">
                Track real-time progress of your upcoming rides
              </p>
            </div>
            <button
              onClick={fetchUserRides}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Progress
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Route Selection Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-lg shadow-md p-4">
                <h2 className="text-xl font-semibold mb-4">My Rides</h2>
                <div className="space-y-3">
                  {routes.map((route) => (
                    <button
                      key={route.rideId}
                      onClick={() => {
                        setSelectedRoute(route);
                        setSelectedStop(null);
                      }}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedRoute.rideId === route.rideId
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="font-medium text-gray-900 mb-1">
                        {route.name}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        {new Date(route.rideDate).toLocaleDateString()} • {route.scheduledStartTime}
                      </div>
                      {route.attendanceStatus && (
                        <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded mb-2">
                          <CheckCircle size={12} />
                          <span>Present</span>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {route.totalStops} stops
                        </span>
                        <span className="font-medium text-green-600">
                          {route.fare}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Stop Details */}
              {selectedStop && (
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-lg font-semibold mb-3">Selected Stop</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="text-blue-500" size={16} />
                      <span className="font-medium">{selectedStop.name}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Stop{" "}
                      {selectedRoute.stops.findIndex(
                        (s) => s.id === selectedStop.id
                      ) + 1}{" "}
                      of {selectedRoute.stops.length}
                    </p>
                  </div>
                </div>
              )}

              {/* Driver Controls */}
              {user?.role === "driver" && (
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-lg font-semibold mb-3">
                    Driver Controls
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Completed</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>Current Stop</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                      <span>Upcoming</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Route Progress Column */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4">
                  Route Progress - {selectedRoute.name}
                </h3>
                <div className="relative">
                  {selectedRoute.stops.map((stop, index) => {
                    const stopStatus = getStopStatus(selectedRoute.id, index);
                    const isLast = index === selectedRoute.stops.length - 1;

                    return (
                      <div
                        key={stop.id}
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
                            ) : (
                              index + 1
                            )}
                          </div>
                        </div>

                        {/* Stop Info */}
                        <div className="ml-4 flex-grow">
                          <button
                            onClick={() => setSelectedStop(stop)}
                            className={`text-left w-full p-3 rounded-lg border transition-all ${
                              selectedStop?.id === stop.id
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            <div className="font-medium text-gray-900 mb-1">
                              {stop.name}
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
                                  markStopAsReached(selectedRoute.id, index)
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
              </div>
            </div>

            {/* Map */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                  <h3 className="text-lg font-semibold">
                    {selectedRoute.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {user?.role === "driver"
                      ? "Click on stops in the progress column to mark them as reached"
                      : "View real-time route progress"}
                  </p>
                </div>
                <div id="map" className="w-full h-[600px]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MapView;
