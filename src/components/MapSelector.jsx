import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
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

const MapSelector = ({
  onLocationSelect,
  selectedLocation,
  pickupLocation,
}) => {
  const [position, setPosition] = useState([37.7749, -122.4194]); // Default to San Francisco

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPosition([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.log("Error getting location:", error);
        },
      );
    }
  }, []);

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        const location = {
          latitude: lat,
          longitude: lng,
          address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, // Simplified address
        };
        onLocationSelect(location);
      },
    });

    return selectedLocation ? (
      <Marker
        position={[selectedLocation.latitude, selectedLocation.longitude]}
      >
        <Popup>
          Selected Location
          <br />
          {selectedLocation.address}
        </Popup>
      </Marker>
    ) : null;
  };

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden border">
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Show pickup location if available */}
        {pickupLocation && (
          <Marker
            position={[pickupLocation.latitude, pickupLocation.longitude]}
            icon={
              new L.Icon({
                iconUrl:
                  "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
                shadowUrl:
                  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41],
              })
            }
          >
            <Popup>Pickup Location</Popup>
          </Marker>
        )}

        <LocationMarker />
      </MapContainer>

      <div className="mt-2 text-sm text-gray-600">
        Click on the map to select a location
        {selectedLocation && (
          <div className="mt-1 text-blue-600">
            Selected: {selectedLocation.address}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapSelector;
