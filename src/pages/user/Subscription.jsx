import React, { useState, useEffect } from "react";
import { Calendar, DollarSign, MapPin, Clock, Bus } from "lucide-react";
import Layout from "../../components/Layout";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../utils/api";
import {
  getSubscriptionFormData,
  saveSubscriptionFormData,
  clearSubscriptionFormData,
  saveCurrentSubscription,
  getUserSubscriptions,
  addUserSubscription,
} from "../../utils/subscriptionStorage";

const MapComponent = ({ selectedRoute, selectedStoppages }) => {
  return (
    <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
      {selectedRoute ? (
        <div className="text-center">
          <Bus className="w-8 h-8 mx-auto mb-2 text-blue-600" />
          <p className="text-sm font-medium">{selectedRoute.name}</p>
          <p className="text-xs text-gray-600 mt-1">
            {selectedRoute.stoppages.length} stops available
          </p>
          {selectedStoppages.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-green-600">
                Selected: {selectedStoppages.map((s) => s.name).join(" → ")}
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
  const { user, reloadUser } = useAuth();
  const [step, setStep] = useState(1);
  const [routes, setRoutes] = useState([]);
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [starsBalance, setStarsBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [formData, setFormData] = useState({
    selectedRoute: null,
    selectedTimeSlot: "",
    pickupStop: null,
    dropStop: null,
    planType: "monthly",
  });

  // Function to calculate stars cost based on plan type
  const calculateStarsCost = (planType) => {
    const starsCostMap = {
      daily: 10,
      weekly: 60, // 10% discount
      monthly: 200, // ~33% discount
    };
    return starsCostMap[planType] || 0;
  };

  // Fetch stars balance
  const fetchStarsBalance = async () => {
    try {
      const response = await api.get("/users/stars/balance");
      setStarsBalance(response.data.stars);
    } catch (error) {
      console.error("Error fetching stars balance:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      // Set default stars to 0 if there's an error
      setStarsBalance(0);
    }
  };

  // Function to get user's local subscriptions
  const loadUserSubscriptions = () => {
    if (!user) return [];
    const userId = user._id || user.id;
    return getUserSubscriptions(userId);
  };

  // Fetch preset routes from API
  const fetchPresetRoutes = async () => {
    setLoadingRoutes(true);
    try {
      console.log("Fetching routes from API...");
      const response = await api.get("/users/routes");
      const presetRoutes = response.data;

      console.log("Routes fetched successfully:", presetRoutes.length);

      // Transform preset routes to match the expected format
      const transformedRoutes = presetRoutes
        .filter((route) => route.active) // Only show active routes
        .map((route) => {
          // Combine startPoint, stops, and endPoint into stoppages array
          const stoppages = [
            {
              _id: `start_${route._id}`,
              name: route.startPoint.name,
              lat: route.startPoint.lat,
              lng: route.startPoint.lng,
            },
            ...route.stops
              .sort((a, b) => a.order - b.order)
              .map((stop, index) => ({
                _id: `stop_${route._id}_${index}`,
                name: stop.name,
                lat: stop.lat,
                lng: stop.lng,
              })),
            {
              _id: `end_${route._id}`,
              name: route.endPoint.name,
              lat: route.endPoint.lat,
              lng: route.endPoint.lng,
            },
          ];

          // Generate default time slots (can be customized based on route)
          const timeSlots = [
            "07:00 AM",
            "07:30 AM",
            "08:00 AM",
            "08:30 AM",
            "09:00 AM",
            "05:00 PM",
            "05:30 PM",
            "06:00 PM",
          ];

          return {
            _id: route._id,
            name: route.name,
            description: route.description,
            stoppages,
            timeSlots,
            estimatedTime: route.estimatedTime,
            fare: route.fare,
          };
        });

      console.log("Transformed routes:", transformedRoutes.length);
      setRoutes(transformedRoutes);
    } catch (error) {
      console.error("Error fetching preset routes:", error);

      // More detailed error handling
      if (error.response) {
        // Server responded with error status
        console.error(
          "Server error:",
          error.response.status,
          error.response.data
        );

        // Show user-friendly error message
        if (error.response.status === 404) {
          console.error("Routes endpoint not found - Check API URL");
        } else if (error.response.status === 500) {
          console.error("Server error - Check backend logs");
        }
      } else if (error.request) {
        // Request made but no response
        console.error("No response from server - Check if backend is running");
        console.error("Request details:", error.request);
      } else {
        // Something else happened
        console.error("Error:", error.message);
      }

      // Set empty routes array to show "no routes" message
      setRoutes([]);
    } finally {
      setLoadingRoutes(false);
    }
  };

  // Debug: Log user object to see its structure
  useEffect(() => {
    if (user) {
      console.log("Current user object:", user);
      console.log("User ID field (_id):", user._id);
      console.log("User ID field (id):", user.id);
    }
  }, [user]);

  useEffect(() => {
    // Fetch preset routes from API
    fetchPresetRoutes();

    // Load user's existing subscriptions
    if (user) {
      const subscriptions = loadUserSubscriptions();
      setUserSubscriptions(subscriptions);
      fetchStarsBalance(); // Fetch stars balance
    }

    // Load saved subscription data from localStorage
    const savedData = getSubscriptionFormData();
    if (savedData) {
      setFormData(savedData);
      // If we have saved data, continue from the appropriate step
      if (
        savedData.selectedRoute &&
        savedData.selectedTimeSlot &&
        savedData.pickupStop &&
        savedData.dropStop
      ) {
        setStep(4);
      } else if (
        savedData.selectedRoute &&
        savedData.selectedTimeSlot &&
        savedData.pickupStop
      ) {
        setStep(3);
      } else if (savedData.selectedRoute && savedData.selectedTimeSlot) {
        setStep(2);
      } else if (savedData.selectedRoute) {
        setStep(2);
      }
    }
  }, [user]);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    saveSubscriptionFormData(formData);
  }, [formData]);

  const calculatePrice = () => {
    if (!formData.pickupStop || !formData.dropStop || !formData.selectedRoute)
      return 0;

    const pickupIndex = formData.selectedRoute.stoppages.findIndex(
      (s) => s._id === formData.pickupStop._id
    );
    const dropIndex = formData.selectedRoute.stoppages.findIndex(
      (s) => s._id === formData.dropStop._id
    );
    const distance = Math.abs(dropIndex - pickupIndex);
    const basePrice = 20; // Define base price per stop

    const planMultipliers = { daily: 1, weekly: 6, monthly: 25 };
    return basePrice * (distance + 1) * planMultipliers[formData.planType];
  };

  const handleRouteSelect = (route) => {
    setFormData((prev) => ({
      ...prev,
      selectedRoute: route,
      selectedTimeSlot: "",
      pickupStop: null,
      dropStop: null,
    }));
  };

  const clearSavedData = () => {
    clearSubscriptionFormData();
    setFormData({
      selectedRoute: null,
      selectedTimeSlot: "",
      pickupStop: null,
      dropStop: null,
      planType: "monthly",
    });
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const starsCost = calculateStarsCost(formData.planType);

      // Check stars balance
      if (starsBalance < starsCost) {
        alert(
          `Insufficient stars! You need ${starsCost - starsBalance} more stars.`
        );
        setLoading(false);
        return;
      }

      if (!user || (!user._id && !user.id)) {
        console.log("User object:", user);
        alert("User not authenticated. Please log in again.");
        setLoading(false);
        return;
      }

      // Prepare API request data
      const subscriptionRequest = {
        preset_route_id: formData.selectedRoute._id,
        pickup_stop_id: formData.pickupStop._id,
        pickup_stop_name: formData.pickupStop.name,
        drop_stop_id: formData.dropStop._id,
        drop_stop_name: formData.dropStop.name,
        plan_type: formData.planType,
        time_slot: formData.selectedTimeSlot,
        pickup_location: {
          latitude: formData.pickupStop.lat,
          longitude: formData.pickupStop.lng,
          address: formData.pickupStop.name,
        },
        drop_location: {
          latitude: formData.dropStop.lat,
          longitude: formData.dropStop.lng,
          address: formData.dropStop.name,
        },
        distance: calculateFareBreakdown().distance,
      };

      console.log("Creating subscription via API:", subscriptionRequest);

      // Call backend API to create subscription
      const response = await api.post(
        "/subscriptions/create-with-stars",
        subscriptionRequest
      );

      console.log("Subscription created successfully:", response.data);

      // Also save locally for offline access
      const subscriptionData = {
        ...response.data.subscription,
        routeName: formData.selectedRoute.name,
        timeSlot: formData.selectedTimeSlot,
        pickupStopName: formData.pickupStop.name,
        dropStopName: formData.dropStop.name,
      };

      addUserSubscription(subscriptionData);
      saveCurrentSubscription(subscriptionData);

      // Update stars balance
      await fetchStarsBalance();

      // Update the local state
      setUserSubscriptions(loadUserSubscriptions());

      // Clear the form data from localStorage after successful submission
      clearSubscriptionFormData();

      alert(
        `Successfully subscribed! ${starsCost} stars deducted. Remaining: ${response.data.starsRemaining} stars`
      );
      setStep(1);
      setFormData({
        selectedRoute: null,
        selectedTimeSlot: "",
        pickupStop: null,
        dropStop: null,
        planType: "monthly",
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      const errorMessage = error.response?.data?.error || error.message;
      alert("Error creating subscription: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const calculateFareBreakdown = () => {
    if (!formData.pickupStop || !formData.dropStop || !formData.selectedRoute)
      return null;

    const pickupIndex = formData.selectedRoute.stoppages.findIndex(
      (s) => s._id === formData.pickupStop._id
    );
    const dropIndex = formData.selectedRoute.stoppages.findIndex(
      (s) => s._id === formData.dropStop._id
    );
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
      savings:
        formData.planType === "weekly"
          ? baseAmount * 7 - totalAmount
          : formData.planType === "monthly"
          ? baseAmount * 30 - totalAmount
          : 0,
    };
  };

  const selectedStoppages =
    formData.pickupStop && formData.dropStop
      ? [formData.pickupStop, formData.dropStop]
      : formData.pickupStop
      ? [formData.pickupStop]
      : [];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Existing Subscriptions Section */}
        {userSubscriptions.length > 0 && (
          <div className="mb-8 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Bus className="w-5 h-5 mr-2 text-green-600" />
              Your Active Subscriptions
            </h3>
            <div className="space-y-4">
              {userSubscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">
                        {subscription.routeName}
                      </h4>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1 text-green-600" />
                          From: {subscription.pickupStopName}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1 text-red-600" />
                          To: {subscription.dropStopName}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1 text-blue-600" />
                          {subscription.timeSlot}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center space-x-4 text-sm">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full capitalize">
                          {subscription.plan_type}
                        </span>
                        <span className="text-green-600 font-semibold">
                          {subscription.starsCost || subscription.price} stars
                        </span>
                        <span className="text-gray-500">
                          Expires:{" "}
                          {new Date(
                            subscription.endDate || subscription.end_date
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        {subscription.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Subscription Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {userSubscriptions.length > 0
              ? "Subscribe to Another Route"
              : "Subscribe to a Route"}
          </h2>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              {[1, 2, 3, 4].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= stepNum
                        ? "bg-blue-600 text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {stepNum}
                  </div>
                  {stepNum < 4 && (
                    <div
                      className={`w-16 h-1 mx-2 ${
                        step > stepNum ? "bg-blue-600" : "bg-gray-300"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-4">
              <span className="text-sm text-gray-600">
                Step {step} of 4:{" "}
                {step === 1
                  ? "Select Route"
                  : step === 2
                  ? "Choose Time Slot"
                  : step === 3
                  ? "Select Stops"
                  : "Confirm Subscription"}
              </span>
            </div>
          </div>
          {/* Show clear data button if there's saved data */}
          {getSubscriptionFormData() && step > 1 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm text-yellow-800">
                  You have saved subscription data. Continue from where you left
                  off or start fresh.
                </p>
                <button
                  onClick={clearSavedData}
                  className="text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transition-colors"
                >
                  Start Fresh
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800">
                Choose Your Route
              </h3>

              {loadingRoutes ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading routes...</p>
                  </div>
                </div>
              ) : routes.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Bus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No routes available</p>
                  <p className="text-sm text-gray-500">
                    Please contact the administrator to create routes.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {routes.map((route) => (
                      <div
                        key={route._id}
                        onClick={() => handleRouteSelect(route)}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                          formData.selectedRoute?._id === route._id
                            ? "border-blue-600 bg-blue-50 shadow-md"
                            : "border-gray-300 hover:border-blue-400 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-lg text-gray-800">
                              {route.name}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {route.description}
                            </p>
                            <p className="text-xs text-blue-600 mt-2">
                              {route.stoppages.length} stops •{" "}
                              {route.timeSlots.length} time slots
                            </p>
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
                </>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800">
                Select Time Slot
              </h3>
              <MapComponent
                selectedRoute={formData.selectedRoute}
                selectedStoppages={selectedStoppages}
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {formData.selectedRoute?.timeSlots.map((timeSlot) => (
                  <button
                    key={timeSlot}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        selectedTimeSlot: timeSlot,
                      }))
                    }
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                      formData.selectedTimeSlot === timeSlot
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-300 text-gray-700 hover:border-blue-400"
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
              <h3 className="text-xl font-semibold text-gray-800">
                Select Pickup & Drop Points
              </h3>
              <MapComponent
                selectedRoute={formData.selectedRoute}
                selectedStoppages={selectedStoppages}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pickup Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Pickup Stop
                  </label>
                  <select
                    value={formData.pickupStop?._id || ""}
                    onChange={(e) => {
                      const stop = formData.selectedRoute.stoppages.find(
                        (s) => s._id === e.target.value
                      );
                      setFormData((prev) => ({ ...prev, pickupStop: stop }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select pickup stop</option>
                    {formData.selectedRoute?.stoppages.map((stop) => (
                      <option key={stop._id} value={stop._id}>
                        {stop.name}
                      </option>
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
                    value={formData.dropStop?._id || ""}
                    onChange={(e) => {
                      const stop = formData.selectedRoute.stoppages.find(
                        (s) => s._id === e.target.value
                      );
                      setFormData((prev) => ({ ...prev, dropStop: stop }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={!formData.pickupStop}
                  >
                    <option value="">Select drop stop</option>
                    {formData.selectedRoute?.stoppages
                      .filter((stop) => stop._id !== formData.pickupStop?._id)
                      .map((stop) => (
                        <option key={stop._id} value={stop._id}>
                          {stop.name}
                        </option>
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
              <h3 className="text-xl font-semibold text-gray-800">
                Confirm Your Subscription
              </h3>

              {/* Stars Balance Display */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm opacity-90">Your Stars Balance</p>
                    <p className="text-3xl font-bold">⭐ {starsBalance}</p>
                  </div>
                  <a
                    href="/buy-stars"
                    className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
                  >
                    Buy Stars
                  </a>
                </div>
              </div>

              {/* Plan Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choose Plan Type
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {["daily", "weekly", "monthly"].map((plan) => (
                    <div
                      key={plan}
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, planType: plan }))
                      }
                      className={`border-2 rounded-lg p-4 cursor-pointer text-center transition-colors ${
                        formData.planType === plan
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <h4 className="font-semibold capitalize text-lg">
                        {plan}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {plan === "daily"
                          ? "1 day"
                          : plan === "weekly"
                          ? "7 days"
                          : "30 days"}
                      </p>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-2xl font-bold text-purple-600">
                          ⭐ {calculateStarsCost(plan)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">stars</p>
                      </div>
                    </div>
                  ))}
                </div>
                {starsBalance < calculateStarsCost(formData.planType) && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">
                      ⚠️ Insufficient stars! You need{" "}
                      {calculateStarsCost(formData.planType) - starsBalance}{" "}
                      more stars to purchase this subscription.
                    </p>
                  </div>
                )}
              </div>

              {/* Full Route Map */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3">
                  Your Bus Route & Stops
                </h4>
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
                          <span className="font-medium">
                            {formData.selectedRoute?.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Time Slot:</span>
                          <span className="font-medium">
                            {formData.selectedTimeSlot}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">From:</span>
                          <span className="font-medium text-green-700">
                            {formData.pickupStop?.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">To:</span>
                          <span className="font-medium text-red-700">
                            {formData.dropStop?.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Stops:</span>
                          <span className="font-medium">
                            {fareBreakdown.totalStops} stops
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Base Rate:</span>
                          <span className="font-medium">
                            {fareBreakdown.baseRatePerStop} stars /stop
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Single Trip:</span>
                          <span className="font-medium">
                            {fareBreakdown.baseAmount} stars
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Plan:</span>
                          <span className="font-medium capitalize">
                            {formData.planType} (×{fareBreakdown.planMultiplier}
                            )
                          </span>
                        </div>
                        {fareBreakdown.savings > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>You Save:</span>
                            <span className="font-semibold">
                              {fareBreakdown.savings} stars
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-lg border-t pt-3 text-blue-700">
                          <span>Total:</span>
                          <span>{fareBreakdown.totalAmount} stars</span>
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
                  disabled={
                    loading ||
                    starsBalance < calculateStarsCost(formData.planType)
                  }
                  className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  {loading
                    ? "Processing..."
                    : starsBalance < calculateStarsCost(formData.planType)
                    ? "Insufficient Stars"
                    : `Subscribe for ⭐ ${calculateStarsCost(
                        formData.planType
                      )} stars`}
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
