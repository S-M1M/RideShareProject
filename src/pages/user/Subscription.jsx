import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, MapPin, Clock, Bus } from 'lucide-react';
import Layout from '../../components/Layout';

// Mock data for routes and stoppages
const mockRoutes = [
  {
    id: 'route_1',
    name: 'Dhaka University - Uttara',
    description: 'Main city route covering major commercial areas',
    stoppages: [
      { id: 'stop_1', name: 'Dhaka University', lat: 23.7361, lng: 90.3922 },
      { id: 'stop_2', name: 'New Market', lat: 23.7264, lng: 90.3854 },
      { id: 'stop_3', name: 'Dhanmondi 32', lat: 23.7461, lng: 90.3742 },
      { id: 'stop_4', name: 'Panthapath', lat: 23.7515, lng: 90.3944 },
      { id: 'stop_5', name: 'Farmgate', lat: 23.7574, lng: 90.3888 },
      { id: 'stop_6', name: 'Karwan Bazar', lat: 23.7508, lng: 90.3915 },
      { id: 'stop_7', name: 'Mohakhali', lat: 23.7806, lng: 90.4083 },
      { id: 'stop_8', name: 'Banani', lat: 23.7939, lng: 90.4067 },
      { id: 'stop_9', name: 'Uttara Sector 7', lat: 23.8759, lng: 90.3795 }
    ],
    timeSlots: ['07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM', '09:00 AM', '05:00 PM', '05:30 PM', '06:00 PM']
  },
  {
    id: 'route_2',
    name: 'Mirpur - Motijheel',
    description: 'Business district connector route',
    stoppages: [
      { id: 'stop_10', name: 'Mirpur 1', lat: 23.7956, lng: 90.3537 },
      { id: 'stop_11', name: 'Mirpur 10', lat: 23.8067, lng: 90.3685 },
      { id: 'stop_12', name: 'Kazipara', lat: 23.7853, lng: 90.3642 },
      { id: 'stop_13', name: 'Shyamoli', lat: 23.7686, lng: 90.3598 },
      { id: 'stop_14', name: 'Kalabagan', lat: 23.7420, lng: 90.3856 },
      { id: 'stop_15', name: 'Shahbagh', lat: 23.7386, lng: 90.3950 },
      { id: 'stop_16', name: 'Press Club', lat: 23.7336, lng: 90.4086 },
      { id: 'stop_17', name: 'Motijheel', lat: 23.7330, lng: 90.4172 }
    ],
    timeSlots: ['06:45 AM', '07:15 AM', '07:45 AM', '08:15 AM', '08:45 AM', '04:45 PM', '05:15 PM', '05:45 PM']
  },
  {
    id: 'route_3',
    name: 'Gulshan - Old Dhaka',
    description: 'Heritage and modern area connector',
    stoppages: [
      { id: 'stop_18', name: 'Gulshan 1', lat: 23.7806, lng: 90.4178 },
      { id: 'stop_19', name: 'Gulshan 2', lat: 23.7925, lng: 90.4156 },
      { id: 'stop_20', name: 'Badda', lat: 23.7806, lng: 90.4281 },
      { id: 'stop_21', name: 'Rampura', lat: 23.7583, lng: 90.4289 },
      { id: 'stop_22', name: 'Malibagh', lat: 23.7489, lng: 90.4181 },
      { id: 'stop_23', name: 'Ramna', lat: 23.7378, lng: 90.4028 },
      { id: 'stop_24', name: 'Paltan', lat: 23.7311, lng: 90.4144 },
      { id: 'stop_25', name: 'Sadarghat', lat: 23.7058, lng: 90.4064 }
    ],
    timeSlots: ['07:30 AM', '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '05:00 PM', '05:30 PM', '06:00 PM']
  }
];

const MapComponent = ({ selectedRoute, selectedStoppages }) => {
  return (
    <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
      {selectedRoute ? (
        <div className="text-center">
          <Bus className="w-8 h-8 mx-auto mb-2 text-blue-600" />
          <p className="text-sm font-medium">{selectedRoute.name}</p>
          <p className="text-xs text-gray-600 mt-1">{selectedRoute.stoppages.length} stops available</p>
          {selectedStoppages.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-green-600">
                Selected: {selectedStoppages.map(s => s.name).join(' → ')}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-500">
          <MapPin className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">Select a route to view stops on map</p>
        </div>
      )}
    </div>
  );
};

const RouteSubscription = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    selectedRoute: null,
    selectedTimeSlot: '',
    pickupStop: null,
    dropStop: null,
    planType: 'monthly'
  });
  const [loading, setLoading] = useState(false);

  const calculatePrice = () => {
    if (!formData.pickupStop || !formData.dropStop || !formData.selectedRoute) return 0;
    
    const basePrice = 20; // Base price per stop
    const pickupIndex = formData.selectedRoute.stoppages.findIndex(s => s.id === formData.pickupStop.id);
    const dropIndex = formData.selectedRoute.stoppages.findIndex(s => s.id === formData.dropStop.id);
    const distance = Math.abs(dropIndex - pickupIndex);
    
    const planMultipliers = { daily: 1, weekly: 6, monthly: 25 };
    return basePrice * (distance + 1) * planMultipliers[formData.planType];
  };

  const handleRouteSelect = (route) => {
    setFormData(prev => ({
      ...prev,
      selectedRoute: route,
      selectedTimeSlot: '',
      pickupStop: null,
      dropStop: null
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      alert('Successfully subscribed!');
      // Reset form
      setStep(1);
      setFormData({
        selectedRoute: null,
        selectedTimeSlot: '',
        pickupStop: null,
        dropStop: null,
        planType: 'monthly'
      });
    }, 2000);
  };

  const calculateFareBreakdown = () => {
    if (!formData.pickupStop || !formData.dropStop || !formData.selectedRoute) return null;
    
    const pickupIndex = formData.selectedRoute.stoppages.findIndex(s => s.id === formData.pickupStop.id);
    const dropIndex = formData.selectedRoute.stoppages.findIndex(s => s.id === formData.dropStop.id);
    const distance = Math.abs(dropIndex - pickupIndex);
    const baseRatePerStop = 20;
    const totalStops = distance + 1;
    
    const planMultipliers = { daily: 1, weekly: 6, monthly: 25 };
    const planMultiplier = planMultipliers[formData.planType];
    
    const baseAmount = baseRatePerStop * totalStops;
    const totalAmount = baseAmount * planMultiplier;
    
    return {
      totalStops,
      distance,
      baseRatePerStop,
      baseAmount,
      planMultiplier,
      totalAmount,
      savings: formData.planType === 'weekly' ? (baseAmount * 7) - totalAmount : 
               formData.planType === 'monthly' ? (baseAmount * 30) - totalAmount : 0
    };
  };

  const selectedStoppages = formData.pickupStop && formData.dropStop 
    ? [formData.pickupStop, formData.dropStop]
    : formData.pickupStop 
    ? [formData.pickupStop]
    : [];

  return (
    <Layout>
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          {[1, 2, 3, 4].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= stepNum ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {stepNum}
              </div>
              {stepNum < 4 && (
                <div className={`w-16 h-1 mx-2 ${
                  step > stepNum ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-4">
          <span className="text-sm text-gray-600">
            Step {step} of 4: {
              step === 1 ? 'Select Route' :
              step === 2 ? 'Choose Time Slot' :
              step === 3 ? 'Select Stops' :
              'Confirm Subscription'
            }
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800">Choose Your Route</h3>
            <div className="space-y-4">
              {mockRoutes.map((route) => (
                <div
                  key={route.id}
                  onClick={() => handleRouteSelect(route)}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                    formData.selectedRoute?.id === route.id 
                      ? 'border-blue-600 bg-blue-50 shadow-md' 
                      : 'border-gray-300 hover:border-blue-400 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-lg text-gray-800">{route.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{route.description}</p>
                      <p className="text-xs text-blue-600 mt-2">{route.stoppages.length} stops • {route.timeSlots.length} time slots</p>
                    </div>
                    <Bus className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!formData.selectedRoute}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800">Select Time Slot</h3>
            <MapComponent selectedRoute={formData.selectedRoute} selectedStoppages={selectedStoppages} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {formData.selectedRoute?.timeSlots.map((timeSlot) => (
                <button
                  key={timeSlot}
                  onClick={() => setFormData(prev => ({ ...prev, selectedTimeSlot: timeSlot }))}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    formData.selectedTimeSlot === timeSlot
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:border-blue-400'
                  }`}
                >
                  <Clock className="w-4 h-4 mx-auto mb-1" />
                  {timeSlot}
                </button>
              ))}
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!formData.selectedTimeSlot}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800">Select Pickup & Drop Points</h3>
            <MapComponent selectedRoute={formData.selectedRoute} selectedStoppages={selectedStoppages} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pickup Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Pickup Stop
                </label>
                <select
                  value={formData.pickupStop?.id || ''}
                  onChange={(e) => {
                    const stop = formData.selectedRoute.stoppages.find(s => s.id === e.target.value);
                    setFormData(prev => ({ ...prev, pickupStop: stop }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select pickup stop</option>
                  {formData.selectedRoute?.stoppages.map((stop) => (
                    <option key={stop.id} value={stop.id}>{stop.name}</option>
                  ))}
                </select>
              </div>

              {/* Drop Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Drop Stop
                </label>
                <select
                  value={formData.dropStop?.id || ''}
                  onChange={(e) => {
                    const stop = formData.selectedRoute.stoppages.find(s => s.id === e.target.value);
                    setFormData(prev => ({ ...prev, dropStop: stop }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={!formData.pickupStop}
                >
                  <option value="">Select drop stop</option>
                  {formData.selectedRoute?.stoppages
                    .filter(stop => stop.id !== formData.pickupStop?.id)
                    .map((stop) => (
                    <option key={stop.id} value={stop.id}>{stop.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!formData.pickupStop || !formData.dropStop}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800">Confirm Your Subscription</h3>
            
            {/* Plan Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Choose Plan Type</label>
              <div className="grid grid-cols-3 gap-4">
                {['daily', 'weekly', 'monthly'].map((plan) => (
                  <div
                    key={plan}
                    onClick={() => setFormData(prev => ({ ...prev, planType: plan }))}
                    className={`border-2 rounded-lg p-3 cursor-pointer text-center transition-colors ${
                      formData.planType === plan 
                        ? 'border-blue-600 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <h4 className="font-semibold capitalize">{plan}</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {plan === 'daily' ? '1 day' :
                       plan === 'weekly' ? '7 days' :
                       '30 days'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Full Route Map */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Your Bus Route & Stops</h4>
              <MapComponent 
                selectedRoute={formData.selectedRoute} 
                selectedStoppages={selectedStoppages}
                pickupStop={formData.pickupStop}
                dropStop={formData.dropStop}
                showFullRoute={true}
              />
            </div>

            {/* Fare Breakdown */}
            {(() => {
              const fareBreakdown = calculateFareBreakdown();
              if (!fareBreakdown) return null;
              
              return (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
                  <h4 className="font-semibold mb-4 text-gray-800 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                    Fare Breakdown & Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Route:</span>
                        <span className="font-medium">{formData.selectedRoute?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time Slot:</span>
                        <span className="font-medium">{formData.selectedTimeSlot}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">From:</span>
                        <span className="font-medium text-green-700">{formData.pickupStop?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">To:</span>
                        <span className="font-medium text-red-700">{formData.dropStop?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Stops:</span>
                        <span className="font-medium">{fareBreakdown.totalStops} stops</span>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Base Rate:</span>
                        <span className="font-medium">{fareBreakdown.baseRatePerStop} points /stop</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Single Trip:</span>
                        <span className="font-medium">{fareBreakdown.baseAmount} points</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Plan:</span>
                        <span className="font-medium capitalize">{formData.planType} (×{fareBreakdown.planMultiplier})</span>
                      </div>
                      {fareBreakdown.savings > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>You Save:</span>
                          <span className="font-semibold">{fareBreakdown.savings} points</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg border-t pt-3 text-blue-700">
                        <span>Total:</span>
                        <span>{fareBreakdown.totalAmount} points</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex space-x-4">
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors font-semibold"
              >
                {loading ? 'Processing...' : `Subscribe for ৳${calculateFareBreakdown()?.totalAmount.toFixed(2) || '0.00'}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </Layout>

  );
};

export default RouteSubscription;