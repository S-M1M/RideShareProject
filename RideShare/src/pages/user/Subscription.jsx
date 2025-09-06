import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import MapSelector from '../../components/MapSelector';
import { Calendar, DollarSign, MapPin } from 'lucide-react';
import axios from 'axios';

const Subscription = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    plan_type: 'weekly',
    pickup_location: null,
    drop_location: null,
    schedule: {
      days: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
      time: '08:30'
    }
  });
  const [distance, setDistance] = useState(0);
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (formData.pickup_location && formData.drop_location) {
      calculateDistance();
    }
  }, [formData.pickup_location, formData.drop_location]);

  useEffect(() => {
    calculatePrice();
  }, [distance, formData.plan_type]);

  const calculateDistance = () => {
    if (!formData.pickup_location || !formData.drop_location) return;
    
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(formData.drop_location.latitude - formData.pickup_location.latitude);
    const dLon = toRad(formData.drop_location.longitude - formData.pickup_location.longitude);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(formData.pickup_location.latitude)) * Math.cos(toRad(formData.drop_location.latitude)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const dist = R * c;
    
    setDistance(Math.round(dist * 100) / 100);
  };

  const toRad = (value) => value * Math.PI / 180;

  const calculatePrice = () => {
    const baseRate = 60; // 60 taka per km
    const multipliers = { daily: 1, weekly: 6, monthly: 25 };
    setPrice(distance * baseRate * multipliers[formData.plan_type]);
  };

  const handleLocationSelect = (location, type) => {
    setFormData(prev => ({
      ...prev,
      [type]: location
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post('http://localhost:5000/api/subscriptions', {
        ...formData,
        distance
      });
      
      alert('Subscription created successfully!');
      setStep(1);
      setFormData({
        plan_type: 'weekly',
        pickup_location: null,
        drop_location: null,
        schedule: {
          days: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
          time: '08:30'
        }
      });
    } catch (error) {
      alert('Error creating subscription: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Create Subscription">
      <div className="max-w-4xl mx-auto">
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
                step === 1 ? 'Plan Selection' :
                step === 2 ? 'Pickup Location' :
                step === 3 ? 'Drop Location' :
                'Schedule & Confirm'
              }
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Choose Your Plan</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['daily', 'weekly', 'monthly'].map((plan) => (
                  <div
                    key={plan}
                    onClick={() => setFormData(prev => ({ ...prev, plan_type: plan }))}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      formData.plan_type === plan 
                        ? 'border-blue-600 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <h4 className="font-semibold capitalize">{plan}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {plan === 'daily' ? '1 day access' :
                       plan === 'weekly' ? '7 days access' :
                       '30 days access'}
                    </p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Select Pickup Location</h3>
              <MapSelector 
                onLocationSelect={(location) => handleLocationSelect(location, 'pickup_location')}
                selectedLocation={formData.pickup_location}
              />
              <div className="flex space-x-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!formData.pickup_location}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Select Drop Location</h3>
              <MapSelector 
                onLocationSelect={(location) => handleLocationSelect(location, 'drop_location')}
                selectedLocation={formData.drop_location}
                pickupLocation={formData.pickup_location}
              />
              <div className="flex space-x-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!formData.drop_location}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Schedule & Confirm</h3>
              
              {/* Schedule */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Days
                </label>
                <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                  {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const days = formData.schedule.days.includes(day)
                          ? formData.schedule.days.filter(d => d !== day)
                          : [...formData.schedule.days, day];
                        setFormData(prev => ({
                          ...prev,
                          schedule: { ...prev.schedule, days }
                        }));
                      }}
                      className={`p-2 text-xs rounded-md ${
                        formData.schedule.days.includes(day)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {day.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pickup Time
                </label>
                <input
                  type="time"
                  value={formData.schedule.time}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    schedule: { ...prev.schedule, time: e.target.value }
                  }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold mb-3">Subscription Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Plan:</span>
                    <span className="capitalize">{formData.plan_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Distance:</span>
                    <span>{distance} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Days:</span>
                    <span>{formData.schedule.days.length} days/week</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total Price:</span>
                    <span>৳{price.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : `Subscribe for ৳${price.toFixed(2)}`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Subscription;