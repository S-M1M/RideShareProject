import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const RideMap = ({ ride }) => {
  const [vehiclePosition, setVehiclePosition] = useState(null);
  const [routePath, setRoutePath] = useState([]);

  useEffect(() => {
    if (ride?.subscription_id) {
      const pickup = ride.subscription_id.pickup_location;
      const drop = ride.subscription_id.drop_location;
      
      if (pickup && drop) {
        setRoutePath([
          [pickup.latitude, pickup.longitude],
          [drop.latitude, drop.longitude]
        ]);
        
        // Simulate vehicle movement
        simulateVehicleMovement(pickup, drop);
      }
    }
  }, [ride]);

  const simulateVehicleMovement = (pickup, drop) => {
    // Start at pickup location
    setVehiclePosition([pickup.latitude, pickup.longitude]);
    
    // Simulate movement towards drop location
    const interval = setInterval(() => {
      setVehiclePosition(current => {
        if (!current) return [pickup.latitude, pickup.longitude];
        
        const [currentLat, currentLng] = current;
        const latDiff = (drop.latitude - currentLat) * 0.1;
        const lngDiff = (drop.longitude - currentLng) * 0.1;
        
        const newLat = currentLat + latDiff;
        const newLng = currentLng + lngDiff;
        
        // Stop when close to destination
        if (Math.abs(newLat - drop.latitude) < 0.001 && Math.abs(newLng - drop.longitude) < 0.001) {
          clearInterval(interval);
          return [drop.latitude, drop.longitude];
        }
        
        return [newLat, newLng];
      });
    }, 2000);

    return () => clearInterval(interval);
  };

  if (!ride?.subscription_id) {
    return (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">No route data available</p>
      </div>
    );
  }

  const pickup = ride.subscription_id.pickup_location;
  const drop = ride.subscription_id.drop_location;
  const center = pickup ? [pickup.latitude, pickup.longitude] : [37.7749, -122.4194];

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

  return (
    <div className="space-y-4">
      <div className="h-96 w-full rounded-lg overflow-hidden border">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Pickup Marker */}
          {pickup && (
            <Marker position={[pickup.latitude, pickup.longitude]} icon={pickupIcon}>
              <Popup>
                <strong>Pickup Location</strong><br />
                {pickup.address}
              </Popup>
            </Marker>
          )}
          
          {/* Drop Marker */}
          {drop && (
            <Marker position={[drop.latitude, drop.longitude]} icon={dropIcon}>
              <Popup>
                <strong>Drop Location</strong><br />
                {drop.address}
              </Popup>
            </Marker>
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
              ride.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
              ride.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
              ride.status === 'completed' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {ride.status.replace('_', ' ')}
            </span>
          </div>
          <div>
            <p className="text-gray-600">Distance</p>
            <p className="font-medium">{ride.subscription_id.distance} km</p>
          </div>
          <div>
            <p className="text-gray-600">Scheduled Time</p>
            <p className="font-medium">{ride.subscription_id.schedule?.time || 'Not set'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideMap;