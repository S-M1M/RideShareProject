import React, { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import Layout from "../../components/Layout";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../utils/api";

const DriverMapView = () => {
  const { user } = useAuth();
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

      // Clear existing markers
      mapInstance.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          mapInstance.removeLayer(layer);
        }
      });

      const markers = [];

      // Add blue stoppage markers
      if (selectedRoute.stoppages && selectedRoute.stoppages.length > 0) {
        selectedRoute.stoppages.forEach((stoppage, index) => {
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
      }

      // Fit map to show all markers
      if (markers.length > 0) {
        const group = L.featureGroup(markers);
        mapInstance.fitBounds(group.getBounds().pad(0.1));
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
        <div className="lg:w-1/3 bg-white rounded-lg shadow p-4 overflow-y-auto">
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
                      <span>{route.stoppages?.length || 0} stoppages</span>
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

        {/* Right Side - Map */}
        <div className="lg:w-2/3 bg-white rounded-lg shadow overflow-hidden">
          {selectedRoute ? (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-lg">{selectedRoute.name}</h3>
                <p className="text-sm text-gray-600">
                  {selectedRoute.stoppages?.length || 0} stoppages on this route
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
      </div>
    </Layout>
  );
};

export default DriverMapView;
