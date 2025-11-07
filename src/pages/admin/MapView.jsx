import React, { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import Layout from "../../components/Layout";
import api from "../../utils/api";

const AdminMapView = () => {
  const [presetRoutes, setPresetRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch all preset routes
  useEffect(() => {
    fetchPresetRoutes();
  }, []);

  // Initialize map
  useEffect(() => {
    if (loading) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      // Import CSS
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);

      // Create map centered on Dhaka, Bangladesh
      const map = L.map("map", {
        center: [23.8103, 90.4125],
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

      console.log("Selected route:", selectedRoute);
      console.log("Stoppages:", selectedRoute.stoppages);
      console.log("Old stops field:", selectedRoute.stops); // Check old field

      // Clear existing markers
      mapInstance.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          mapInstance.removeLayer(layer);
        }
      });

      const markers = [];

      // Check both new 'stoppages' and old 'stops' field for backward compatibility
      const stoppagesData = selectedRoute.stoppages || selectedRoute.stops || [];

      // Add START point marker (Green)
      if (selectedRoute.startPoint) {
        const startIconHtml = `
          <div style="
            background: #10B981;
            border: 3px solid white;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">
            S
          </div>
        `;

        const startIcon = L.divIcon({
          html: startIconHtml,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          className: "custom-start-marker",
        });

        const startMarker = L.marker([selectedRoute.startPoint.lat, selectedRoute.startPoint.lng], {
          icon: startIcon,
        })
          .addTo(mapInstance)
          .bindPopup(`<b>START: ${selectedRoute.startPoint.name}</b>`);

        markers.push(startMarker);
      }

      // Add blue stoppage markers
      if (stoppagesData.length > 0) {
        console.log(`Adding ${stoppagesData.length} stoppage markers`);
        stoppagesData.forEach((stoppage, index) => {
          console.log(`Stoppage ${index + 1}:`, stoppage);
          const stoppageIconHtml = `
            <div style="
              background: #3B82F6;
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

          const stoppageIcon = L.divIcon({
            html: stoppageIconHtml,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            className: "custom-stoppage-marker",
          });

          const marker = L.marker([stoppage.lat, stoppage.lng], {
            icon: stoppageIcon,
          })
            .addTo(mapInstance)
            .bindPopup(`<b>${stoppage.name}</b><br/>Stoppage ${index + 1}`);

          markers.push(marker);
        });
      } else {
        console.log("No stoppages found for this route");
      }

      // Add END point marker (Red)
      if (selectedRoute.endPoint) {
        const endIconHtml = `
          <div style="
            background: #EF4444;
            border: 3px solid white;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">
            E
          </div>
        `;

        const endIcon = L.divIcon({
          html: endIconHtml,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          className: "custom-end-marker",
        });

        const endMarker = L.marker([selectedRoute.endPoint.lat, selectedRoute.endPoint.lng], {
          icon: endIcon,
        })
          .addTo(mapInstance)
          .bindPopup(`<b>END: ${selectedRoute.endPoint.name}</b>`);

        markers.push(endMarker);
      }

      // Fit map to show all markers or center on Dhaka
      if (markers.length > 0) {
        const group = L.featureGroup(markers);
        mapInstance.fitBounds(group.getBounds().pad(0.1));
      } else {
        // No markers, center on Dhaka
        mapInstance.setView([23.8103, 90.4125], 12);
      }
    };

    updateMap();
  }, [mapInstance, selectedRoute]);

  const fetchPresetRoutes = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/preset-routes");
      setPresetRoutes(response.data);
      
      // Select first route by default
      if (response.data.length > 0) {
        setSelectedRoute(response.data[0]);
      }
    } catch (error) {
      console.error("Error fetching preset routes:", error);
      alert("Error loading routes: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Routes Map">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading routes...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Routes Map">
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-200px)]">
        {/* Left Sidebar - Route List */}
        <div className="lg:w-1/4 bg-white rounded-lg shadow p-4 overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4">Available Routes</h2>
          
          {presetRoutes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No routes available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {presetRoutes.map((route) => (
                <div
                  key={route._id}
                  onClick={() => setSelectedRoute(route)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedRoute?._id === route._id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                  }`}
                >
                  <h3 className="font-semibold text-lg mb-1">{route.name}</h3>
                  {route.description && (
                    <p className="text-sm text-gray-600 mb-2">{route.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <MapPin size={16} className="mr-1" />
                      <span>{(route.stoppages || route.stops || []).length} stoppages</span>
                    </div>
                    {route.fare && (
                      <span className="text-green-600 font-medium">{route.fare}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Middle - Map */}
        <div className="lg:w-1/2 bg-white rounded-lg shadow overflow-hidden">
          {selectedRoute ? (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-lg">{selectedRoute.name}</h3>
                <p className="text-sm text-gray-600">
                  {(selectedRoute.stoppages || selectedRoute.stops || []).length} stoppages on this route
                </p>
              </div>
              <div id="map" className="flex-1"></div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p>Select a route to view stoppages</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Route Diagram */}
        {selectedRoute && (
          <div className="lg:w-1/4 bg-white rounded-lg shadow p-4 overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Route Diagram</h2>
            <div className="space-y-2">
              {/* Start Point */}
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                    S
                  </div>
                  <div className="w-0.5 h-8 bg-gray-300"></div>
                </div>
                <div className="pt-1">
                  <p className="font-medium text-gray-900">{selectedRoute.startPoint?.name || 'Start'}</p>
                  <p className="text-xs text-gray-500">Starting Point</p>
                </div>
              </div>

              {/* Stoppages */}
              {(selectedRoute.stoppages || selectedRoute.stops || []).map((stoppage, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="w-0.5 h-8 bg-gray-300"></div>
                  </div>
                  <div className="pt-1">
                    <p className="font-medium text-gray-900">{stoppage.name}</p>
                    <p className="text-xs text-gray-500">Stoppage {index + 1}</p>
                  </div>
                </div>
              ))}

              {/* End Point */}
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                    E
                  </div>
                </div>
                <div className="pt-1">
                  <p className="font-medium text-gray-900">{selectedRoute.endPoint?.name || 'End'}</p>
                  <p className="text-xs text-gray-500">End Point</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminMapView;
