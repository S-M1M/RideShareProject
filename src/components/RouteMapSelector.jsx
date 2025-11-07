import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const RouteMapSelector = ({ position, onPositionChange }) => {
  const [mapCenter] = useState([23.8103, 90.4125]); // Dhaka, Bangladesh

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        onPositionChange({
          ...position,
          lat: lat,
          lng: lng,
        });
      },
    });

    return position ? (
      <Marker position={[position.lat, position.lng]} />
    ) : null;
  };

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden border">
      <MapContainer
        center={position ? [position.lat, position.lng] : mapCenter}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker />
      </MapContainer>

      <div className="mt-2 text-sm text-gray-600">
        Click on the map to drop a pin
        {position && (
          <div className="mt-1 text-blue-600">
            Selected: Lat {position.lat.toFixed(4)}, Lng {position.lng.toFixed(4)}
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteMapSelector;
