import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import MapComponent from '../../components/MapComponent';
import { useAuth } from '../../contexts/AuthContext';

const MapView = () => {
  const { user } = useAuth();
  const [selectedRide, setSelectedRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todayRides, setTodayRides] = useState([]);

  useEffect(() => {
    if (user?.rides) {
      const activeRide = user.rides.find(ride => ride.status === 'active');
      setSelectedRide(activeRide);
      setTodayRides(user.rides);
    }
    setLoading(false);
  }, [user]);

  if (loading) {
    return (
      <Layout title="Map View">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Track Your Rides">
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Route Map</h3>
          </div>
          
          {/* Map Container */}
          <div className="h-[600px] relative">
            <MapComponent ride={selectedRide} />
          </div>

          {/* Ride Details */}
          <div className="p-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">From</p>
                <p className="font-medium">{selectedRide?.subscription_id?.pickup_location?.address || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">To</p>
                <p className="font-medium">{selectedRide?.subscription_id?.drop_location?.address || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium capitalize">{selectedRide?.status?.replace('_', ' ') || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ride List */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4">Today's Rides</h3>
          <div className="space-y-2">
            {todayRides.map((ride) => (
              <button
                key={ride._id}
                onClick={() => setSelectedRide(ride)}
                className={`w-full text-left p-3 rounded-md border ${
                  selectedRide?._id === ride._id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {ride.subscription_id?.pickup_location?.address || 'Pickup'} 
                    → {ride.subscription_id?.drop_location?.address || 'Drop'}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    ride.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                    ride.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                    ride.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {ride.status.replace('_', ' ')}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MapView;