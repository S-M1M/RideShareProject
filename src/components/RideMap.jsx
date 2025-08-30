import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for the default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const dropIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const vehicleIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Default center coordinates (Dhaka)
const defaultCenter = [23.7805, 90.4091];

const RideMap = ({ ride }) => {
  const [vehiclePosition, setVehiclePosition] = useState(null);
  const [routePath, setRoutePath] = useState([]);

  useEffect(() => {
    const pickupCoords = [23.7576, 90.4208]; // Rampura
    const dropCoords = [23.7969, 90.4199]; // Notun Bazar
    
    setRoutePath([pickupCoords, dropCoords]);

    // Set initial vehicle position
    if (ride?.currentLocation) {
      setVehiclePosition([ride.currentLocation.latitude, ride.currentLocation.longitude]);
    } else {
      setVehiclePosition(pickupCoords);
    }

    // Simulate vehicle movement if ride is active
    if (ride?.status === 'active') {
      const interval = setInterval(() => {
        setVehiclePosition(current => {
          if (!current) return pickupCoords;
          
          const [currentLat, currentLng] = current;
          const latDiff = (dropCoords[0] - currentLat) * 0.1;
          const lngDiff = (dropCoords[1] - currentLng) * 0.1;
          
          const newLat = currentLat + latDiff;
          const newLng = currentLng + lngDiff;
          
          // Stop when close to destination
          if (Math.abs(newLat - dropCoords[0]) < 0.001 && Math.abs(newLng - dropCoords[1]) < 0.001) {
            clearInterval(interval);
            return dropCoords;
          }
          
          return [newLat, newLng];
        });
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [ride]);

  if (!ride) {
    return (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">No route data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="h-96 w-full rounded-lg overflow-hidden border">
        <MapContainer
          center={vehiclePosition || defaultCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Pickup and Drop Markers */}
          {routePath.length > 0 && (
            <>
              <Marker position={routePath[0]} icon={pickupIcon}>
                <Popup>
                  <strong>Pickup Location</strong><br />
                  Rampura, Dhaka
                </Popup>
              </Marker>
              <Marker position={routePath[1]} icon={dropIcon}>
                <Popup>
                  <strong>Drop Location</strong><br />
                  Notun Bazar, Dhaka
                </Popup>
              </Marker>
            </>
          )}
          
          {/* Vehicle Marker */}
          {vehiclePosition && (
            <Marker position={vehiclePosition} icon={vehicleIcon}>
              <Popup>
                <strong>Your Vehicle</strong><br />
                Current Position
              </Popup>
            </Marker>
          )}
          
          {/* Route Path */}
          {routePath.length > 1 && (
            <Polyline positions={routePath} color="blue" weight={3} opacity={0.7} />
          )}
        </MapContainer>
      </div>

      {/* Route Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Route Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Status</p>
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
              ride?.status === 'active' ? 'bg-yellow-100 text-yellow-800' :
              ride?.status === 'completed' ? 'bg-green-100 text-green-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {ride?.status || 'Not Available'}
            </span>
          </div>
          <div>
            <p className="text-gray-600">From</p>
            <p className="font-medium">Rampura, Dhaka</p>
          </div>
          <div>
            <p className="text-gray-600">To</p>
            <p className="font-medium">Notun Bazar, Dhaka</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideMap;