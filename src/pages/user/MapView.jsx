import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import RideMap from '../../components/RideMap';
import axios from 'axios';

const MapView = () => {
  const [todayRides, setTodayRides] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodayRides();
  }, []);

  const fetchTodayRides = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/rides/today');
      setTodayRides(response.data);
      if (response.data.length > 0) {
        setSelectedRide(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching today rides:', error);
    } finally {
      setLoading(false);
    }
  };

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
        {todayRides.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No rides scheduled for today.</p>
          </div>
        ) : (
          <>
            {/* Ride Selector */}
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

            {/* Map */}
            {selectedRide && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold mb-4">Route Map</h3>
                <RideMap ride={selectedRide} />
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default MapView;