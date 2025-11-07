import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../utils/api";
import { MapPin, CheckCircle, Clock, Bus, Users, UserCheck, UserX, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useSearchParams, useNavigate } from "react-router-dom";

const DriverMapView = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const rideId = searchParams.get("rideId");
  
  const [ride, setRide] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedStop, setSelectedStop] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [passengers, setPassengers] = useState([]);
  const [loadingPassengers, setLoadingPassengers] = useState(false);

  useEffect(() => {
    fetchRideAndRoutes();
  }, [user, rideId]);

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      const L = (await import("leaflet")).default;

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);

      const map = L.map("map", {
        center: [23.7808, 90.4176],
        zoom: 12,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "� OpenStreetMap contributors",
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

      mapInstance.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          mapInstance.removeLayer(layer);
        }
      });

      const markers = [];
      selectedRoute.stops.forEach((stop, index) => {
        const isSelected = selectedStop?.id === stop.id;
        const stopStatus = getStopStatus(selectedRoute.rideId, index);

        let backgroundColor = "#6B7280";
        if (stopStatus === "completed") backgroundColor = "#10B981";
        else if (stopStatus === "current") backgroundColor = "#EF4444";
        else if (isSelected) backgroundColor = "#3B82F6";

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

      // Add blue stoppage markers from preset route stoppages
      if (selectedRoute.ride?.presetRoute_id?.stoppages) {
        selectedRoute.ride.presetRoute_id.stoppages.forEach((stoppage) => {
          const stoppageIconHtml = `
            <div style="
              background: #3B82F6;
              border: 3px solid white;
              border-radius: 50%;
              width: 30px;
              height: 30px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 10px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">
              S
            </div>
          `;

          const stoppageIcon = L.divIcon({
            html: stoppageIconHtml,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            className: "custom-stoppage-marker",
          });

          L.marker([stoppage.lat, stoppage.lng], {
            icon: stoppageIcon,
          })
            .addTo(mapInstance)
            .bindPopup(`<b>Stoppage: ${stoppage.name}</b>`);
        });
      }

      if (markers.length > 0) {
        const group = L.featureGroup(markers);
        mapInstance.fitBounds(group.getBounds().pad(0.1));
      }
    };

    updateMap();
  }, [mapInstance, selectedRoute, selectedStop, ride]);

  const fetchRideAndRoutes = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        setRoutes([]);
        setLoading(false);
        return;
      }

      // Check if rideId is provided
      if (!rideId) {
        alert("No ride ID provided");
        navigate("/driver/dashboard");
        return;
      }

      // Fetch the specific ride
      const rideResponse = await api.get(`/rides/${rideId}`);
      const fetchedRide = rideResponse.data;
      
      // Check if ride status is in-progress
      if (fetchedRide.status !== "in-progress") {
        alert("This ride is not active. Please start the ride first.");
        navigate("/driver/dashboard");
        return;
      }

      setRide(fetchedRide);
      console.log("Fetched ride:", fetchedRide);

      // Transform ride to route format
      const presetRoute = fetchedRide.presetRoute_id;
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

      // Add all intermediate stops (from ride data, not stoppages)
      if (presetRoute.stoppages && presetRoute.stoppages.length > 0) {
        presetRoute.stoppages.forEach(stoppage => {
          allStops.push({
            id: stoppage._id, // Use actual MongoDB ID
            name: stoppage.name,
            lat: stoppage.lat,
            lng: stoppage.lng,
            order: stoppage.order,
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

      const transformedRoute = {
        id: presetRoute._id,
        rideId: fetchedRide._id,
        name: presetRoute.name,
        description: presetRoute.description,
        totalStops: allStops.length,
        fare: presetRoute.fare,
        stops: allStops,
        ride: fetchedRide,
        scheduledStartTime: fetchedRide.scheduledStartTime,
        currentStopIndex: fetchedRide.currentStopIndex || 0,
      };

      console.log("Transformed route:", transformedRoute);

      setRoutes([transformedRoute]);
      setSelectedRoute(transformedRoute);
    } catch (error) {
      console.error("Error fetching ride:", error);
      alert("Error loading ride: " + (error.response?.data?.error || error.message));
      navigate("/driver/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const getStopStatus = (rideId, stopIndex) => {
    if (!ride) return "upcoming";
    
    const currentIndex = ride.currentStopIndex || 0;
    if (stopIndex < currentIndex) return "completed";
    if (stopIndex === currentIndex) return "current";
    return "upcoming";
  };

  const markStopAsReached = async (rideId, stopIndex) => {
    try {
      await api.put(`/rides/${rideId}/progress`, {
        stopIndex: stopIndex,
      });
      
      // Refresh ride data
      await fetchRideAndRoutes();
    } catch (error) {
      console.error("Error marking stop:", error);
      alert("Error updating stop: " + (error.response?.data?.error || error.message));
    }
  };

  const fetchPassengersAtStop = async (rideId, stopId) => {
    try {
      setLoadingPassengers(true);
      const response = await api.get(`/rides/${rideId}/passengers-at-stop?stopId=${stopId}`);
      setPassengers(response.data.passengers || []);
      setShowPassengerModal(true);
    } catch (error) {
      console.error("Error fetching passengers:", error);
      alert("Error loading passengers: " + (error.response?.data?.error || error.message));
    } finally {
      setLoadingPassengers(false);
    }
  };

  const markAttendance = async (rideId, userId, stopId, status) => {
    try {
      await api.put(`/rides/${rideId}/attendance`, {
        userId,
        stopId,
        status
      });
      
      // Refresh passenger list
      await fetchPassengersAtStop(rideId, stopId);
      
      // Show success message
      alert(`Attendance marked as ${status}`);
    } catch (error) {
      console.error("Error marking attendance:", error);
      alert("Error marking attendance: " + (error.response?.data?.error || error.message));
    }
  };

  if (loading) {
    return (
      <Layout title="My Routes - Map View">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading your routes...</div>
        </div>
      </Layout>
    );
  }

  if (routes.length === 0) {
    return (
      <Layout title="My Routes - Map View">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Bus className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Routes Assigned for Today
          </h3>
          <p className="text-gray-500 mb-4">
            You don't have any routes assigned for today.
          </p>
        </div>
      </Layout>
    );
  }

  // Main render
  return (
    <Layout title="Driver Route Map">
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Today's Routes
            </h1>
            <p className="text-gray-600">
              View and manage your assigned routes for today
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
                        selectedRoute?.id === route.id
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
                          {route.scheduledStartTime}
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
            </div>

            {/* Route Progress Column */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4">
                  Route Progress - {selectedRoute?.name}
                </h3>
                <div className="relative">
                  {selectedRoute?.stops.map((stop, index) => {
                    const stopStatus = getStopStatus(selectedRoute.rideId, index);
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

                          {/* Mark as Reached Button */}
                          {stopStatus === "current" && (
                            <div className="mt-2 space-y-2">
                              <button
                                onClick={() =>
                                  markStopAsReached(selectedRoute.rideId, index)
                                }
                                className="w-full px-3 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                              >
                                <CheckCircle size={16} />
                                Mark as Reached
                              </button>
                              <button
                                onClick={() => fetchPassengersAtStop(selectedRoute.rideId, stop.id)}
                                className="w-full px-3 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                              >
                                <Users size={16} />
                                View Passengers ({loadingPassengers ? '...' : '?'})
                              </button>
                            </div>
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
                    {selectedRoute?.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Progress stops in chronological order by clicking "Mark as Reached"
                  </p>
                </div>
                <div id="map" className="w-full h-[600px]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Passenger Modal */}
        {showPassengerModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              {/* Modal Header */}
              <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Users size={24} />
                  <h2 className="text-xl font-bold">Passengers at This Stop</h2>
                </div>
                <button
                  onClick={() => setShowPassengerModal(false)}
                  className="text-white hover:bg-blue-700 rounded p-1"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
                {loadingPassengers ? (
                  <div className="text-center py-8">
                    <div className="text-lg">Loading passengers...</div>
                  </div>
                ) : passengers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      No Passengers
                    </h3>
                    <p className="text-gray-500">
                      No passengers are scheduled to board at this stop.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {passengers.map((passenger, index) => (
                      <div
                        key={passenger.subscriptionId}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-grow">
                            {/* Passenger Info */}
                            <div className="mb-3">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {passenger.user.name}
                              </h3>
                              <div className="text-sm text-gray-600 mt-1 space-y-1">
                                <p>📧 {passenger.user.email}</p>
                                <p>📱 {passenger.user.phone}</p>
                              </div>
                            </div>

                            {/* Pickup & Drop Info */}
                            <div className="bg-gray-50 rounded p-3 text-sm">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <span className="font-medium text-green-700">Pickup:</span>
                                  <p className="text-gray-700">{passenger.pickupStop.name}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-red-700">Drop:</span>
                                  <p className="text-gray-700">{passenger.dropStop.name}</p>
                                </div>
                              </div>
                            </div>

                            {/* Attendance Status */}
                            {passenger.attendance && (
                              <div className="mt-3">
                                <span
                                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                                    passenger.attendance.status === "present"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {passenger.attendance.status === "present" ? (
                                    <>
                                      <UserCheck size={14} />
                                      Present
                                    </>
                                  ) : (
                                    <>
                                      <UserX size={14} />
                                      Absent
                                    </>
                                  )}
                                </span>
                                <span className="text-xs text-gray-500 ml-2">
                                  at {new Date(passenger.attendance.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Attendance Buttons */}
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() =>
                              markAttendance(
                                selectedRoute.rideId,
                                passenger.user.id,
                                passenger.pickupStop.id,
                                "present"
                              )
                            }
                            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                          >
                            <UserCheck size={16} />
                            Mark Present
                          </button>
                          <button
                            onClick={() =>
                              markAttendance(
                                selectedRoute.rideId,
                                passenger.user.id,
                                passenger.pickupStop.id,
                                "absent"
                              )
                            }
                            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                          >
                            <UserX size={16} />
                            Mark Absent
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 p-4 flex justify-end">
                <button
                  onClick={() => setShowPassengerModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DriverMapView;
