import React, { useEffect, useState } from "react";
import { MapPin, Clock, CheckCircle, Bus } from "lucide-react";
import Layout from "../../components/Layout";
import { useAuth } from "../../contexts/AuthContext";
import { getUserSubscriptions } from "../../utils/subscriptionStorage";

const MapView = () => {
  const { user } = useAuth();
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedStop, setSelectedStop] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [routeProgress, setRouteProgress] = useState({});

  // Fetch user's subscribed routes from localStorage
  useEffect(() => {
    fetchUserRoutes();
  }, [user]);

  // Load route progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem("routeProgress");
    if (savedProgress) {
      setRouteProgress(JSON.parse(savedProgress));
    }
  }, []);

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
        const stopStatus = getStopStatus(selectedRoute.id, index);

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
  }, [mapInstance, selectedRoute, selectedStop, routeProgress]);

  const fetchUserRoutes = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        setRoutes([]);
        setLoading(false);
        return;
      }

      // Get user ID (support both _id and id)
      const userId = user._id || user.id;
      
      // Get subscriptions from localStorage
      const subscriptions = getUserSubscriptions(userId);
      console.log("User's subscriptions from localStorage:", subscriptions);
      
      // Filter active subscriptions
      const activeSubscriptions = subscriptions.filter(sub => {
        const endDate = new Date(sub.endDate);
        const now = new Date();
        return sub.status === 'active' && endDate >= now;
      });

      console.log("Active subscriptions:", activeSubscriptions);
      
      // Transform subscriptions to route format
      // Group by route to avoid duplicates
      const routesMap = new Map();
      
      activeSubscriptions.forEach(sub => {
        const routeId = sub.routeId || sub.preset_route_id;
        
        if (!routesMap.has(routeId)) {
          // Extract stops from subscription or create from pickup/drop
          const stops = [];
          
          // Add pickup stop
          if (sub.pickupStopName && sub.pickup_location) {
            stops.push({
              id: sub.pickupStopId || `pickup_${routeId}`,
              name: sub.pickupStopName,
              lat: sub.pickup_location.latitude,
              lng: sub.pickup_location.longitude,
              type: 'pickup'
            });
          }
          
          // Add drop stop
          if (sub.dropStopName && sub.drop_location) {
            stops.push({
              id: sub.dropStopId || `drop_${routeId}`,
              name: sub.dropStopName,
              lat: sub.drop_location.latitude,
              lng: sub.drop_location.longitude,
              type: 'drop'
            });
          }

          routesMap.set(routeId, {
            id: routeId,
            name: sub.routeName || "My Route",
            description: `${sub.plan_type} subscription - ${sub.timeSlot}`,
            totalStops: stops.length,
            estimatedTime: "N/A",
            fare: `${sub.price} points`,
            stops: stops,
            subscription: sub
          });
        }
      });

      const transformedRoutes = Array.from(routesMap.values());
      console.log("Transformed routes:", transformedRoutes);

      setRoutes(transformedRoutes);
      if (transformedRoutes.length > 0) {
        setSelectedRoute(transformedRoutes[0]);
      }
    } catch (error) {
      console.error("Error fetching user routes:", error);
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  // Save route progress to localStorage
  const saveProgress = (progress) => {
    setRouteProgress(progress);
    localStorage.setItem("routeProgress", JSON.stringify(progress));
  };

  // Get current stop index for a route
  const getCurrentStopIndex = (routeId) => {
    return routeProgress[routeId]?.currentStopIndex || 0;
  };

  // Mark a stop as reached (driver only)
  const markStopAsReached = (routeId, stopIndex) => {
    if (user?.role !== "driver") return;

    const newProgress = {
      ...routeProgress,
      [routeId]: {
        currentStopIndex: stopIndex + 1,
      },
    };
    saveProgress(newProgress);
  };

  // Get stop status
  const getStopStatus = (routeId, stopIndex) => {
    const currentIndex = getCurrentStopIndex(routeId);
    if (stopIndex < currentIndex) return "completed";
    if (stopIndex === currentIndex) return "current";
    return "upcoming";
  };

  // Loading state
  if (loading) {
    return (
      <Layout title="My Routes - Map View">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading your routes...</div>
        </div>
      </Layout>
    );
  }

  // No routes state
  if (routes.length === 0) {
    return (
      <Layout title="My Routes - Map View">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Bus className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Subscribed Routes
          </h3>
          <p className="text-gray-500 mb-4">
            You haven't subscribed to any routes yet.
          </p>
          <a
            href="/subscription"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Subscribe to a Route
          </a>
        </div>
      </Layout>
    );
  }

  // Main render
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Route Explorer
            </h1>
            <p className="text-gray-600">
              Explore different bus routes and their stops in Dhaka
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Route Selection Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-lg shadow-md p-4">
                <h2 className="text-xl font-semibold mb-4">My Routes</h2>
                <div className="space-y-3">
                  {routes.map((route) => (
                    <button
                      key={route.id}
                      onClick={() => {
                        setSelectedRoute(route);
                        setSelectedStop(null);
                      }}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedRoute.id === route.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="font-medium text-gray-900 mb-1">
                        {route.name}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {route.description}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {route.totalStops} stops
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {route.estimatedTime}
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
