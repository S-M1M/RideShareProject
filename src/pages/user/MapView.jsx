import React, { useEffect, useState } from 'react';
import { MapPin, Clock } from 'lucide-react';
import Layout from '../../components/Layout';
// Mock data for routes and their stoppages
const mockRoutes = [
  {
    id: 1,
    name: "Route A - Gulshan to Motijheel",
    description: "Express route via Tejgaon",
    totalStops: 8,
    estimatedTime: "45 min",
    fare: "৳35",
    stops: [
      { id: 1, name: "Gulshan Circle 1", lat: 23.7808, lng: 90.4176 },
      { id: 2, name: "Gulshan Avenue", lat: 23.7756, lng: 90.4125 },
      { id: 3, name: "Banani Road 11", lat: 23.7741, lng: 90.4067 },
      { id: 4, name: "Mohakhali Bus Stand", lat: 23.7697, lng: 90.3938 },
      { id: 5, name: "Tejgaon Industrial Area", lat: 23.7547, lng: 90.3914 },
      { id: 6, name: "Farmgate", lat: 23.7515, lng: 90.3896 },
      { id: 7, name: "Karwan Bazar", lat: 23.7502, lng: 90.3897 },
      { id: 8, name: "Motijheel", lat: 23.7338, lng: 90.4065 }
    ]
  },
  {
    id: 2,
    name: "Route B - Dhanmondi to Uttara",
    description: "North-bound express",
    totalStops: 10,
    estimatedTime: "55 min",
    fare: "৳45",
    stops: [
      { id: 9, name: "Dhanmondi 27", lat: 23.7461, lng: 90.3742 },
      { id: 10, name: "Dhanmondi 32", lat: 23.7489, lng: 90.3706 },
      { id: 11, name: "Science Lab", lat: 23.7358, lng: 90.3753 },
      { id: 12, name: "New Market", lat: 23.7268, lng: 90.3804 },
      { id: 13, name: "Azimpur", lat: 23.7194, lng: 90.3847 },
      { id: 14, name: "Nilkhet", lat: 23.7267, lng: 90.3889 },
      { id: 15, name: "Shahbagh", lat: 23.7389, lng: 90.3944 },
      { id: 16, name: "Matsya Bhaban", lat: 23.7542, lng: 90.3879 },
      { id: 17, name: "Airport Road", lat: 23.8103, lng: 90.4125 },
      { id: 18, name: "Uttara Sector 3", lat: 23.8759, lng: 90.3795 }
    ]
  },
  {
    id: 3,
    name: "Route C - Mirpur to Wari",
    description: "Central route via Newmarket",
    totalStops: 9,
    estimatedTime: "50 min",
    fare: "৳40",
    stops: [
      { id: 19, name: "Mirpur 10", lat: 23.8069, lng: 90.3683 },
      { id: 20, name: "Kazipara", lat: 23.7958, lng: 90.3747 },
      { id: 21, name: "Shewrapara", lat: 23.7847, lng: 90.3811 },
      { id: 22, name: "Agargaon", lat: 23.7736, lng: 90.3875 },
      { id: 23, name: "Sher-e-Bangla Nagar", lat: 23.7625, lng: 90.3939 },
      { id: 24, name: "Dhanmondi", lat: 23.7461, lng: 90.3742 },
      { id: 25, name: "New Market", lat: 23.7268, lng: 90.3804 },
      { id: 26, name: "Paltan", lat: 23.7347, lng: 90.4161 },
      { id: 27, name: "Wari", lat: 23.7234, lng: 90.4289 }
    ]
  }
];

const MapView = () => {
  const [selectedRoute, setSelectedRoute] = useState(mockRoutes[0]);
  const [selectedStop, setSelectedStop] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      const L = (await import('leaflet')).default;
      
      // Import CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      // Create map
      const map = L.map('map', {
        center: [23.7808, 90.4176], // Gulshan, Dhaka
        zoom: 12,
        zoomControl: true
      });

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
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
    if (!mapInstance) return;

    const updateMap = async () => {
      const L = (await import('leaflet')).default;
      
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
        
        // Create custom icon
        const iconHtml = `
          <div style="
            background: ${isSelected ? '#3B82F6' : '#10B981'};
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
          className: 'custom-marker'
        });

        const marker = L.marker([stop.lat, stop.lng], { icon: customIcon })
          .addTo(mapInstance)
          .bindPopup(`
            <div style="min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold;">${stop.name}</h3>
              <p style="margin: 0; color: #666;">Stop ${index + 1} of ${selectedRoute.stops.length}</p>
            </div>
          `);

        markers.push(marker);

        // Add click event
        marker.on('click', () => {
          setSelectedStop(stop);
        });
      });

      // Create route line
      const routeCoordinates = selectedRoute.stops.map(stop => [stop.lat, stop.lng]);
      const routeLine = L.polyline(routeCoordinates, {
        color: '#3B82F6',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 5'
      }).addTo(mapInstance);

      // Fit map to show all markers
      const group = new L.featureGroup(markers);
      mapInstance.fitBounds(group.getBounds().pad(0.1));
    };

    updateMap();
  }, [mapInstance, selectedRoute, selectedStop]);

  return (
    <Layout>
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Route Explorer</h1>
          <p className="text-gray-600">Explore different bus routes and their stops in Dhaka</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Route Selection Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-xl font-semibold mb-4">Available Routes</h2>
              <div className="space-y-3">
                {mockRoutes.map((route) => (
                  <button
                    key={route.id}
                    onClick={() => {
                      setSelectedRoute(route);
                      setSelectedStop(null);
                    }}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedRoute.id === route.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-gray-900 mb-1">{route.name}</div>
                    <div className="text-sm text-gray-600 mb-2">{route.description}</div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {route.totalStops} stops
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {route.estimatedTime}
                      </span>
                      <span className="font-medium text-green-600">{route.fare}</span>
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
                    Stop {selectedRoute.stops.findIndex(s => s.id === selectedStop.id) + 1} of {selectedRoute.stops.length}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="text-lg font-semibold">{selectedRoute.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Click on any stop marker to view details
                </p>
              </div>
              <div id="map" className="w-full h-[600px]"></div>
            </div>
          </div>
        </div>

        {/* Stops List */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">All Stops - {selectedRoute.name}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedRoute.stops.map((stop, index) => (
              <button
                key={stop.id}
                onClick={() => setSelectedStop(stop)}
                className={`text-left p-4 rounded-lg border-2 transition-all ${
                  selectedStop?.id === stop.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="font-medium text-gray-900">{stop.name}</div>
                    <div className="text-sm text-gray-500">Stop {index + 1}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
    </Layout>
  );
};

export default MapView;