import React, { useState, useEffect } from "react";
import {
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Star,
  AlertCircle,
  CheckCircle,
  Users,
} from "lucide-react";
import Layout from "../../components/Layout";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../utils/api";

const Subscription = () => {
  const { user, reloadUser } = useAuth();

  // Step management
  const [step, setStep] = useState(1); // 1: Date & Route, 2: Select Ride, 3: Stops & Plan, 4: Confirm

  // Data states
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [availableRides, setAvailableRides] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const [pickupStop, setPickupStop] = useState(null);
  const [dropStop, setDropStop] = useState(null);
  const [planType, setPlanType] = useState("daily");

  // UI states
  const [loading, setLoading] = useState(false);
  const [starsBalance, setStarsBalance] = useState(0);
  const [error, setError] = useState("");

  // Fetch stars balance
  useEffect(() => {
    const fetchStars = async () => {
      try {
        const response = await api.get("/users/stars/balance");
        setStarsBalance(response.data.stars);
      } catch (error) {
        console.error("Error fetching stars:", error);
      }
    };
    fetchStars();
  }, []);

  // Fetch routes
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await api.get("/users/routes");
        setRoutes(response.data);
      } catch (error) {
        console.error("Error fetching routes:", error);
        setError("Failed to load routes");
      }
    };
    fetchRoutes();
  }, []);

  // Fetch available rides when route is selected
  useEffect(() => {
    if (selectedRoute && selectedDate) {
      fetchAvailableRides();
    }
  }, [selectedRoute, selectedDate]);

  const fetchAvailableRides = async () => {
    setLoading(true);
    try {
      const response = await api.get("/rides/available-for-subscription", {
        params: {
          route_id: selectedRoute._id,
          date: selectedDate,
        },
      });
      setAvailableRides(response.data);
      setError("");
    } catch (error) {
      console.error("Error fetching rides:", error);
      setError("Failed to load available rides");
      setAvailableRides([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stops between pickup and drop
  const calculateStopsBetween = () => {
    if (!pickupStop || !dropStop || !selectedRoute) return 0;

    const stoppagesData = selectedRoute.stoppages || selectedRoute.stops || [];

    const stops = [
      { id: `start_${selectedRoute._id}`, order: 0 },
      ...stoppagesData.map((s, idx) => ({ id: s._id, order: idx + 1 })),
      { id: `end_${selectedRoute._id}`, order: stoppagesData.length + 1 },
    ];

    const pickupIndex = stops.findIndex((s) => s.id === pickupStop._id);
    const dropIndex = stops.findIndex((s) => s.id === dropStop._id);

    if (pickupIndex === -1 || dropIndex === -1 || pickupIndex >= dropIndex)
      return 0;

    return dropIndex - pickupIndex;
  };

  // Calculate pricing
  const calculatePricing = () => {
    const stopsCount = calculateStopsBetween();
    const dailyCost = stopsCount * 10;

    let days, payableDays;
    switch (planType) {
      case "daily":
        days = 1;
        payableDays = 1;
        break;
      case "weekly":
        days = 7;
        payableDays = 6; // 1 day free
        break;
      case "monthly":
        days = 30;
        payableDays = 25; // 5 days free
        break;
      default:
        days = 1;
        payableDays = 1;
    }

    const totalCost = dailyCost * payableDays;
    const savings = dailyCost * (days - payableDays);

    return { stopsCount, dailyCost, days, payableDays, totalCost, savings };
  };

  // Handle purchase
  const handlePurchase = async () => {
    if (!selectedRide || !pickupStop || !dropStop) {
      setError("Please complete all selections");
      return;
    }

    const pricing = calculatePricing();

    if (starsBalance < pricing.totalCost) {
      setError(
        `Insufficient stars! You need ${
          pricing.totalCost - starsBalance
        } more stars.`
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/subscriptions/purchase-with-rides", {
        ride_id: selectedRide._id,
        preset_route_id: selectedRoute._id,
        pickup_stop_id: pickupStop._id,
        pickup_stop_name: pickupStop.name,
        drop_stop_id: dropStop._id,
        drop_stop_name: dropStop.name,
        plan_type: planType,
        stops_count: pricing.stopsCount,
      });

      alert(
        `Success! Subscription purchased for ${pricing.days} days (${response.data.ridesCount} rides)`
      );

      // Reload user data to update stars
      await reloadUser();

      // Reset form
      resetForm();
      setStep(1);
    } catch (error) {
      console.error("Error purchasing subscription:", error);
      setError(
        error.response?.data?.error || "Failed to purchase subscription"
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedRoute(null);
    setSelectedRide(null);
    setPickupStop(null);
    setDropStop(null);
    setPlanType("daily");
    setAvailableRides([]);
  };

  // Get available stops for selection
  const getAvailableStops = () => {
    if (!selectedRoute) return [];

    const stoppagesData = selectedRoute.stoppages || selectedRoute.stops || [];

    return [
      {
        _id: `start_${selectedRoute._id}`,
        name: selectedRoute.startPoint?.name || "Start",
        type: "start",
      },
      ...stoppagesData.map((s) => ({ _id: s._id, name: s.name, type: "stop" })),
      {
        _id: `end_${selectedRoute._id}`,
        name: selectedRoute.endPoint?.name || "End",
        type: "end",
      },
    ];
  };

  const pricing = calculatePricing();

  return (
    <Layout title="Purchase Subscription">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Purchase Subscription
          </h1>
          <p className="text-gray-600">
            Select a ride and customize your subscription plan
          </p>

          {/* Stars Balance */}
          <div className="mt-4 inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 px-4 py-2 rounded-lg">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <span className="font-semibold text-yellow-800">
              {starsBalance} Stars Available
            </span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-center gap-4">
          {[1, 2, 3, 4].map((num) => (
            <React.Fragment key={num}>
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                  step >= num
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {num}
              </div>
              {num < 4 && (
                <div
                  className={`w-12 h-1 ${
                    step > num ? "bg-blue-600" : "bg-gray-200"
                  }`}
                ></div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Date & Route Selection */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <h2 className="text-xl font-semibold mb-4">
              Step 1: Select Date & Route
            </h2>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Route Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Select Route
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {routes.map((route) => (
                  <button
                    key={route._id}
                    onClick={() => setSelectedRoute(route)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      selectedRoute?._id === route._id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <h3 className="font-semibold text-lg">{route.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {route.description}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                      <span>
                        {(route.stoppages || route.stops)?.length || 0} stops
                      </span>
                      <span>{route.estimatedTime}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!selectedRoute}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Next: View Available Rides
            </button>
          </div>
        )}

        {/* Step 2: Select Ride */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <h2 className="text-xl font-semibold mb-4">
              Step 2: Select a Ride
            </h2>

            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Route:</strong> {selectedRoute?.name}
                <br />
                <strong>Date:</strong>{" "}
                {new Date(selectedDate).toLocaleDateString()}
              </p>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Loading available rides...</div>
              </div>
            ) : availableRides.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">
                  No rides available for this route on this date
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableRides.map((ride) => (
                  <button
                    key={ride._id}
                    onClick={() => !ride.isFull && setSelectedRide(ride)}
                    disabled={ride.isFull}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                      selectedRide?._id === ride._id
                        ? "border-blue-500 bg-blue-50"
                        : ride.isFull
                        ? "border-red-200 bg-red-50 cursor-not-allowed opacity-60"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Clock className="w-5 h-5 text-gray-500" />
                          <span className="text-lg font-semibold">
                            {ride.scheduledStartTime}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            <strong>Driver:</strong>{" "}
                            {ride.driver_id?.name || "N/A"}
                          </p>
                          <p>
                            <strong>Vehicle:</strong> {ride.vehicle_id?.model} (
                            {ride.vehicle_id?.license_plate})
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {ride.isFull ? (
                          <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                            FULL
                          </span>
                        ) : (
                          <div className="text-sm">
                            <Users className="w-4 h-4 inline mr-1" />
                            <span className="font-semibold text-green-600">
                              {ride.availableSeats} seats left
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedRide}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Next: Select Stops & Plan
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Stops & Plan Selection */}
        {step === 3 && (
          <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <h2 className="text-xl font-semibold mb-4">
              Step 3: Select Pickup/Drop & Plan
            </h2>

            {/* Stop Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pickup Stop
                </label>
                <select
                  value={pickupStop?._id || ""}
                  onChange={(e) => {
                    const stop = getAvailableStops().find(
                      (s) => s._id === e.target.value
                    );
                    setPickupStop(stop);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select pickup stop</option>
                  {getAvailableStops().map((stop) => (
                    <option key={stop._id} value={stop._id}>
                      {stop.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Drop Stop
                </label>
                <select
                  value={dropStop?._id || ""}
                  onChange={(e) => {
                    const stop = getAvailableStops().find(
                      (s) => s._id === e.target.value
                    );
                    setDropStop(stop);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select drop stop</option>
                  {getAvailableStops().map((stop) => (
                    <option key={stop._id} value={stop._id}>
                      {stop.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Plan Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Plan
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { type: "daily", label: "Daily", days: 1, discount: 0 },
                  { type: "weekly", label: "Weekly", days: 7, discount: 1 },
                  { type: "monthly", label: "Monthly", days: 30, discount: 5 },
                ].map((plan) => (
                  <button
                    key={plan.type}
                    onClick={() => setPlanType(plan.type)}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      planType === plan.type
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <h3 className="font-semibold text-lg mb-1">{plan.label}</h3>
                    <p className="text-sm text-gray-600">{plan.days} days</p>
                    {plan.discount > 0 && (
                      <p className="text-xs text-green-600 mt-1 font-semibold">
                        {plan.discount} day{plan.discount > 1 ? "s" : ""} FREE!
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing Preview */}
            {pricing.stopsCount > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">
                  Pricing Summary
                </h3>
                <div className="space-y-1 text-sm text-green-700">
                  <p>
                    Stops: {pricing.stopsCount} × 10 stars = {pricing.dailyCost}{" "}
                    stars/day
                  </p>
                  <p>
                    Duration: {pricing.days} days (pay for {pricing.payableDays}{" "}
                    days)
                  </p>
                  {pricing.savings > 0 && (
                    <p className="text-green-600 font-semibold">
                      Savings: {pricing.savings} stars!
                    </p>
                  )}
                  <p className="text-lg font-bold text-green-800 mt-2">
                    Total: {pricing.totalCost} stars
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!pickupStop || !dropStop || pricing.stopsCount === 0}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Review & Purchase
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <h2 className="text-xl font-semibold mb-4">
              Step 4: Confirm Purchase
            </h2>

            <div className="space-y-4">
              <div className="border-b pb-3">
                <h3 className="font-semibold text-gray-700">Route Details</h3>
                <p className="text-gray-600">{selectedRoute?.name}</p>
                <p className="text-sm text-gray-500">
                  {selectedRide?.scheduledStartTime}
                </p>
              </div>

              <div className="border-b pb-3">
                <h3 className="font-semibold text-gray-700">Your Journey</h3>
                <p className="text-gray-600">Pickup: {pickupStop?.name}</p>
                <p className="text-gray-600">Drop: {dropStop?.name}</p>
              </div>

              <div className="border-b pb-3">
                <h3 className="font-semibold text-gray-700">
                  Subscription Plan
                </h3>
                <p className="text-gray-600">
                  {planType.charAt(0).toUpperCase() + planType.slice(1)} (
                  {pricing.days} days)
                </p>
                <p className="text-sm text-gray-500">
                  Starting: {new Date(selectedDate).toLocaleDateString()}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-blue-900">
                    Total Cost:
                  </span>
                  <span className="text-2xl font-bold text-blue-900">
                    {pricing.totalCost} ⭐
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-blue-700">Your Balance:</span>
                  <span className="font-semibold text-blue-700">
                    {starsBalance} ⭐
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-blue-700">After Purchase:</span>
                  <span className="font-semibold text-blue-700">
                    {starsBalance - pricing.totalCost} ⭐
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                disabled={loading}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handlePurchase}
                disabled={loading || starsBalance < pricing.totalCost}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  "Processing..."
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Confirm Purchase
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Subscription;
