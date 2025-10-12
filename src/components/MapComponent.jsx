import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const MapComponent = ({ ride }) => {
  const [vehiclePosition, setVehiclePosition] = useState([23.7576, 90.4208]); // Start at Rampura
  const [routePath, setRoutePath] = useState([]);

  useEffect(() => {
    const pickupCoords = [23.7576, 90.4208]; // Rampura
    const dropCoords = [23.7969, 90.4199]; // Notun Bazar
    setRoutePath([pickupCoords, dropCoords]);

    // Simulate vehicle movement if ride is active
    if (ride?.status === "active") {
      const interval = setInterval(() => {
        setVehiclePosition((current) => {
          const [currentLat, currentLng] = current;
          const latDiff = (dropCoords[0] - currentLat) * 0.1;
          const lngDiff = (dropCoords[1] - currentLng) * 0.1;

          const newLat = currentLat + latDiff;
          const newLng = currentLng + lngDiff;

          if (
            Math.abs(newLat - dropCoords[0]) < 0.001 &&
            Math.abs(newLng - dropCoords[1]) < 0.001
          ) {
            clearInterval(interval);
            return dropCoords;
          }

          return [newLat, newLng];
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [ride]);

  return (
    <MapContainer
      center={vehiclePosition}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Pickup and Drop Markers */}
      {routePath.length > 0 && (
        <>
          <Marker position={routePath[0]}>
            <Popup>
              <strong>Pickup Location</strong>
              <br />
              Rampura, Dhaka
            </Popup>
          </Marker>
          <Marker position={routePath[1]}>
            <Popup>
              <strong>Drop Location</strong>
              <br />
              Notun Bazar, Dhaka
            </Popup>
          </Marker>
        </>
      )}

      {/* Vehicle Marker */}
      {vehiclePosition && (
        <Marker position={vehiclePosition}>
          <Popup>
            <strong>Vehicle Location</strong>
          </Popup>
        </Marker>
      )}

      {/* Route Path */}
      {routePath.length > 1 && (
        <Polyline positions={routePath} color="blue" weight={3} opacity={0.7} />
      )}
    </MapContainer>
  );
};

export default MapComponent;
