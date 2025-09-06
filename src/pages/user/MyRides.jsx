import React, { useState, useEffect } from 'react';
import { MapPin, DollarSign, ArrowRight } from 'lucide-react';

const UserMap = () => {
  const [selectedPickup, setSelectedPickup] = useState('');
  const [selectedDrop, setSelectedDrop] = useState('');
  const [calculatedFare, setCalculatedFare] = useState(0);

  // Mock bus stoppage data
  const busStoppages = [
    { id: 1, name: 'Central Station', lat: 23.7465, lng: 90.3763, address: 'Motijheel, Dhaka' },
    { id: 2, name: 'Dhanmondi 27', lat: 23.7508, lng: 90.3753, address: 'Dhanmondi, Dhaka' },
    { id: 3, name: 'Shahbag Square', lat: 23.7383, lng: 90.3939, address: 'Shahbag, Dhaka' },
    { id: 4, name: 'Gulshan Circle 1', lat: 23.7806, lng: 90.4152, address: 'Gulshan, Dhaka' },
    { id: 5, name: 'Uttara Sector 7', lat: 23.8759, lng: 90.3795, address: 'Uttara, Dhaka' }
  ];

  // Mock fare calculation based on distance between stops
  const fareMatrix = {
    1: { 2: 25, 3: 30, 4: 45, 5: 60 },
    2: { 1: 25, 3: 20, 4: 35, 5: 50 },
    3: { 1: 30, 2: 20, 4: 25, 5: 40 },
    4: { 1: 45, 2: 35, 3: 25, 5: 30 },
    5: { 1: 60, 2: 50, 3: 40, 4: 30 }
  };

  // Calculate fare when pickup and drop locations change
  useEffect(() => {
    if (selectedPickup && selectedDrop && selectedPickup !== selectedDrop) {
      const pickupId = parseInt(selectedPickup);
      const dropId = parseInt(selectedDrop);
      const fare = fareMatrix[pickupId]?.[dropId] || 0;
      setCalculatedFare(fare);
    } else {
      setCalculatedFare(0);
    }
  }, [selectedPickup, selectedDrop]);

  // Simple map visualization using CSS
  const MapVisualization = () => (
    <div className="relative bg-gradient-to-br from-blue-50 to-green-50 rounded-lg overflow-hidden" style={{ height: '400px' }}>
      {/* Map background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full" style={{
          backgroundImage: `
            linear-gradient(45deg, #ccc 25%, transparent 25%),
            linear-gradient(-45deg, #ccc 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #ccc 75%),
            linear-gradient(-45deg, transparent 75%, #ccc 75%)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
        }} />
      </div>

      {/* Bus stoppages */}
      {busStoppages.map((stop, index) => {
        const isPickup = selectedPickup === stop.id.toString();
        const isDrop = selectedDrop === stop.id.toString();
        const isSelected = isPickup || isDrop;
        
        return (
          <div
            key={stop.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 hover:scale-110"
            style={{
              left: `${20 + (index * 15)}%`,
              top: `${30 + (index % 2 === 0 ? 0 : 20)}%`
            }}
          >
            <div className={`relative ${isSelected ? 'z-20' : 'z-10'}`}>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                isPickup ? 'bg-green-500 border-green-600 shadow-lg scale-125' :
                isDrop ? 'bg-red-500 border-red-600 shadow-lg scale-125' :
                'bg-blue-500 border-blue-600 hover:bg-blue-600'
              }`}>
                <MapPin className="w-3 h-3 text-white" />
              </div>
              
              {/* Stop label */}
              <div className={`absolute top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-white rounded shadow-md text-xs whitespace-nowrap ${
                isSelected ? 'font-semibold border-2' : 'border'
              } ${
                isPickup ? 'border-green-500 text-green-700' :
                isDrop ? 'border-red-500 text-red-700' :
                'border-gray-200 text-gray-700'
              }`}>
                {stop.name}
              </div>
            </div>
          </div>
        );
      })}

      {/* Route line */}
      {selectedPickup && selectedDrop && selectedPickup !== selectedDrop && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#f59e0b" />
            </marker>
          </defs>
          <line
            x1={`${20 + ((parseInt(selectedPickup) - 1) * 15)}%`}
            y1={`${30 + ((parseInt(selectedPickup) - 1) % 2 === 0 ? 0 : 20)}%`}
            x2={`${20 + ((parseInt(selectedDrop) - 1) * 15)}%`}
            y2={`${30 + ((parseInt(selectedDrop) - 1) % 2 === 0 ? 0 : 20)}%`}
            stroke="#f59e0b"
            strokeWidth="3"
            strokeDasharray="5,5"
            markerEnd="url(#arrowhead)"
            className="animate-pulse"
          />
        </svg>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <h1 className="text-2xl font-bold mb-2">Bus Route Map</h1>
          <p className="text-blue-100">Select your pickup and drop locations to view fare</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Location Selectors */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pickup Location
              </label>
              <select
                value={selectedPickup}
                onChange={(e) => setSelectedPickup(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Select pickup location</option>
                {busStoppages.map((stop) => (
                  <option key={stop.id} value={stop.id}>
                    {stop.name} - {stop.address}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Drop Location
              </label>
              <select
                value={selectedDrop}
                onChange={(e) => setSelectedDrop(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Select drop location</option>
                {busStoppages.map((stop) => (
                  <option 
                    key={stop.id} 
                    value={stop.id}
                    disabled={selectedPickup === stop.id.toString()}
                  >
                    {stop.name} - {stop.address}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Map Visualization */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Route Map</h3>
            <MapVisualization />
            
            {/* Map Legend */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span>Pickup Location</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span>Drop Location</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span>Available Stops</span>
              </div>
            </div>
          </div>

          {/* Fare Display */}
          {calculatedFare > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border-l-4 border-green-500 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <DollarSign className="w-8 h-8 text-green-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Trip Fare</h3>
                    <div className="flex items-center text-sm text-gray-600 space-x-2">
                      <span>{busStoppages.find(s => s.id.toString() === selectedPickup)?.name}</span>
                      <ArrowRight className="w-4 h-4" />
                      <span>{busStoppages.find(s => s.id.toString() === selectedDrop)?.name}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600">৳{calculatedFare}</div>
                  <div className="text-sm text-gray-500">Per person</div>
                </div>
              </div>
            </div>
          )}

          {/* Route Information */}
          {selectedPickup && selectedDrop && selectedPickup !== selectedDrop && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-md font-semibold text-gray-800 mb-3">Route Information</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Estimated Duration:</span>
                  <span className="font-medium">15-25 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Type:</span>
                  <span className="font-medium">Regular Bus Service</span>
                </div>
                <div className="flex justify-between">
                  <span>Operating Hours:</span>
                  <span className="font-medium">6:00 AM - 10:00 PM</span>
                </div>
              </div>
            </div>
          )}

          {/* Bus Stoppages List */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-md font-semibold text-gray-800 mb-3">All Bus Stoppages</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {busStoppages.map((stop) => (
                <div
                  key={stop.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                    selectedPickup === stop.id.toString() || selectedDrop === stop.id.toString()
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <MapPin className={`w-5 h-5 ${
                    selectedPickup === stop.id.toString() ? 'text-green-600' :
                    selectedDrop === stop.id.toString() ? 'text-red-600' :
                    'text-blue-600'
                  }`} />
                  <div>
                    <div className="font-medium text-gray-800">{stop.name}</div>
                    <div className="text-sm text-gray-500">{stop.address}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserMap;