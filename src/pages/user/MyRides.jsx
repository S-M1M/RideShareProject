import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Calendar, MapPin, DollarSign, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';


const MyRides = () => {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user && user.rides) {
      setRides(user.rides);
      setLoading(false);
    }
  }, [user]);

  const cancelRide = async (rideId) => {
    if (!confirm('Are you sure you want to cancel this ride? You will receive a 50% refund.')) {
      return;
    }

    try {
      await api.put(`/rides/${rideId}/cancel`);
      fetchRides();
      alert('Ride cancelled successfully. Refund will be processed.');
    } catch (error) {
      alert('Error cancelling ride: ' + (error.response?.data?.error || error.message));
    }
  };

  const filteredRides = rides.filter(ride => {
    if (filter === 'all') return true;
    return ride.status === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // if (loading) {
  //   return (
  //     <Layout title="My Rides">
  //       <div className="flex items-center justify-center h-64">
  //         <div className="text-lg">Loading...</div>
  //       </div>
  //     </Layout>
  //   );
  // }

  return (
    <Layout title="My Rides">
      <div className="space-y-6">
        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { key: 'all', label: 'All Rides' },
                { key: 'scheduled', label: 'Scheduled' },
                { key: 'completed', label: 'Completed' },
                { key: 'cancelled', label: 'Cancelled' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    filter === key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Rides List */}
        <div className="space-y-4">
          {filteredRides.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">No rides found for the selected filter.</p>
            </div>
          ) : (
            filteredRides.map((ride) => (
              <div key={ride._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {new Date(ride.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {ride.pickup.replace(', Bangladesh', '')} 
                        → {ride.destination.replace(', Bangladesh', '')}
                      </span>
                    </div>

                    {ride.pickup_time && (
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Pickup: {ride.pickup_time}
                        </span>
                      </div>
                    )}

                    {ride.refund_amount > 0 && (
                      <div className="flex items-center space-x-2 mb-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">
                          Refund: ৳{ride.refund_amount.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ride.status)}`}>
                      {ride.status.replace('_', ' ')}
                    </span>
                    
                    {ride.status === 'scheduled' && new Date(ride.date) > new Date() && (
                      <button
                        onClick={() => cancelRide(ride._id)}
                        className="px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MyRides;