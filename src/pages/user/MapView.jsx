import React, { useEffect, useState } from "react";
import {
  MapPin,
  Clock,
  CheckCircle,
  Bus,
  RefreshCw,
  Calendar,
} from "lucide-react";
import Layout from "../../components/Layout";
import { useAuth } from "../../contexts/AuthContext";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../utils/api";

const MapView = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const rideId = searchParams.get("rideId");

  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedStop, setSelectedStop] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rides, setRides] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Fetch user's rides based on selected date or rideId
  useEffect(() => {
    fetchUserRides();
  }, [user, selectedDate, rideId]);

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
            `<b>${stop.name}</b><br/>Stop ${
              index + 1
            }<br/>Status: ${stopStatus}`
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
  }, [mapInstance, selectedRoute, selectedStop, routes]);

  const fetchUserRides = async () => {
    try {
      setLoading(true);

      if (!user) {
        setRoutes([]);
        setLoading(false);
        return;
      }

      let ridesData = [];

      // If rideId is provided, fetch that specific ride
      if (rideId) {
        try {
          const rideResponse = await api.get(`/rides/${rideId}`);
          ridesData = [rideResponse.data];
        } catch (error) {
          console.error("Error fetching specific ride:", error);
          alert(
            "Could not load the requested ride. Showing all your rides instead."
          );
          // Fall back to fetching all rides (both scheduled and in-progress)
          const response = await api.get(`/rides/user/my-rides`);
          ridesData = response.data.filter(
            (ride) =>
              ride.status === "scheduled" || ride.status === "in-progress"
          );
        }
      } else {
        // Fetch all user rides
        const response = await api.get(`/rides/user/my-rides`);
        const allRides = response.data;

        // Get rides scheduled for the selected date
        const ridesForDate = allRides.filter((ride) => {
          const rideDate = new Date(ride.rideDate).toISOString().split("T")[0];
          return rideDate === selectedDate;
        });

        // Get all in-progress rides (for route matching)
        const inProgressRides = allRides.filter(
          (ride) => ride.status === "in-progress"
        );

        // Build a map of routeId -> in-progress ride
        const inProgressByRoute = new Map();
        inProgressRides.forEach((ride) => {
          if (ride.presetRoute_id) {
            const routeId = ride.presetRoute_id._id || ride.presetRoute_id;
            inProgressByRoute.set(routeId.toString(), ride);
          }
        });

        // For each route scheduled on the selected date, use in-progress ride if it exists
        const routeMap = new Map();
        ridesForDate.forEach((ride) => {
          if (!ride.presetRoute_id) return;

          const routeId = (
            ride.presetRoute_id._id || ride.presetRoute_id
          ).toString();

          // Check if there's an in-progress ride for this route
          const inProgressRide = inProgressByRoute.get(routeId);

          // Use in-progress ride if it exists, otherwise use the scheduled ride
          const rideToUse = inProgressRide || ride;

          // Only add if not already in map or if this one has higher priority
          const existing = routeMap.get(routeId);
          if (!existing) {
            routeMap.set(routeId, rideToUse);
          } else {
            // Prioritize: in-progress > scheduled > completed > cancelled
            const priority = {
              "in-progress": 1,
              scheduled: 2,
              completed: 3,
              cancelled: 4,
            };
            if (priority[rideToUse.status] < priority[existing.status]) {
              routeMap.set(routeId, rideToUse);
            }
          }
        });

        // Convert map back to array
        ridesData = Array.from(routeMap.values());

        console.log(
          `Selected date: ${selectedDate}, found ${ridesForDate.length} rides, ${inProgressRides.length} in-progress rides (any date), showing ${ridesData.length} unique routes`
        );
      }

      console.log("User's rides:", ridesData);

      // Sort rides by date (earliest first)
      const sortedRides = ridesData.sort((a, b) => {
        const dateA = new Date(a.rideDate);
        const dateB = new Date(b.rideDate);
        return dateA - dateB;
      });

      // Log detailed ride info for debugging
      sortedRides.forEach((ride, index) => {
        console.log(`Ride ${index}:`, {
          id: ride._id,
          status: ride.status,
          currentStopIndex: ride.currentStopIndex,
          rideDate: ride.rideDate,
        });
      });

      setRides(sortedRides);

      // Transform rides to route format (same as driver view)
      const transformedRoutes = sortedRides
        .filter((ride) => ride.presetRoute_id) // Filter out rides without route data
        .map((ride) => {
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
              type: "start",
            });
          }

          // Add all intermediate stops
          if (presetRoute.stops && presetRoute.stops.length > 0) {
            presetRoute.stops.forEach((stop) => {
              allStops.push({
                id: stop._id, // Use actual MongoDB ID
                name: stop.name,
                lat: stop.lat,
                lng: stop.lng,
                order: stop.order,
                type: "stop",
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
              type: "end",
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
      console.log(
        "Transformed routes with currentStopIndex:",
        transformedRoutes.map((r) => ({
          rideId: r.rideId,
          name: r.name,
          currentStopIndex: r.currentStopIndex,
          status: r.ride.status,
        }))
      );

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
    // Find the route (transformed data) by rideId
    const route = routes.find((r) => r.rideId === rideId);
    if (!route) {
      console.log(`getStopStatus: Route not found for rideId ${rideId}`);
      return "upcoming";
    }

    const currentIndex = route.currentStopIndex || 0;
    console.log(
      `getStopStatus: rideId=${rideId}, stopIndex=${stopIndex}, currentIndex=${currentIndex}`
    );

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
            No Rides for {new Date(selectedDate).toLocaleDateString()}
          </h3>
          <p className="text-gray-500 mb-4">
            You don't have any scheduled rides for this date.
          </p>
          <div className="flex gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <a
              href="/subscription"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Purchase Subscription
            </a>
          </div>
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
                Track real-time progress of your rides
              </p>
            </div>
            <div className="flex gap-3">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={fetchUserRides}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
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
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium text-gray-900">
                          {route.name}
                        </div>
                        {route.ride.status === "in-progress" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            Live
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        {new Date(route.rideDate).toLocaleDateString()} •{" "}
                        {route.scheduledStartTime}
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
                    const stopStatus = getStopStatus(
                      selectedRoute.rideId,
                      index
                    );
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
