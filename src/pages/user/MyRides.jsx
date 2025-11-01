import React, { useState, useEffect } from "react";
import { Calendar, MapPin, Clock, Bus, AlertCircle, CheckCircle, XCircle, DollarSign } from "lucide-react";
import Layout from "../../components/Layout";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../utils/api";

const MyRides = () => {
  const { user, reloadUser } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // all, scheduled, in-progress, completed, cancelled
  const [cancellingRide, setCancellingRide] = useState(null);

  useEffect(() => {
    fetchRides();
  }, [activeTab]);

  const fetchRides = async () => {
    setLoading(true);
    try {
      const response = await api.get("/rides/user/my-rides", {
        params: { status: activeTab },
      });
      setRides(response.data);
    } catch (error) {
      console.error("Error fetching rides:", error);
    } finally {
      setLoading(false);
    }
  };

  const canCancelRide = (ride) => {
    if (ride.isCancelled || ride.effectiveStatus !== "scheduled") {
      return { canCancel: false, reason: "Ride cannot be cancelled" };
    }

    // Check 12-hour deadline
    const rideDateTime = new Date(ride.rideDate);
    const [time, period] = ride.scheduledStartTime.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    rideDateTime.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    const hoursUntilRide = (rideDateTime - now) / (1000 * 60 * 60);
    
    if (hoursUntilRide < 12) {
      return { 
        canCancel: false, 
        reason: `Cannot cancel within 12 hours (${hoursUntilRide.toFixed(1)}h remaining)` 
      };
    }

    return { canCancel: true, hoursUntilRide };
  };

  const handleCancelRide = async (ride) => {
    // Double-check cancellation status
    if (ride.isCancelled) {
      alert("This ride has already been cancelled.");
      return;
    }

    const check = canCancelRide(ride);
    if (!check.canCancel) {
      alert(check.reason);
      return;
    }

    const confirmed = window.confirm(
      `Cancel ride on ${new Date(ride.rideDate).toLocaleDateString()}?\n\n` +
      `You will receive 50% refund of single day cost.`
    );

    if (!confirmed) return;

    // Prevent double-clicking
    if (cancellingRide === ride._id) {
      return;
    }

    setCancellingRide(ride._id);
    try {
      const response = await api.post("/subscriptions/cancel-ride", {
        subscription_id: ride.userSubscription?.subscription_id,
        ride_id: ride._id,
      });

      alert(
        `Ride cancelled successfully!\n` +
        `Refund: ${response.data.refundAmount} stars\n` +
        `New balance: ${response.data.starsBalance} stars`
      );

      // Reload user and rides
      await reloadUser();
      await fetchRides();
    } catch (error) {
      console.error("Error cancelling ride:", error);
      const errorMsg = error.response?.data?.error || "Failed to cancel ride";
      alert(errorMsg);
      
      // If already cancelled, refresh the list
      if (errorMsg.includes("already cancelled")) {
        await fetchRides();
      }
    } finally {
      setCancellingRide(null);
    }
  };

  const getStatusBadge = (ride) => {
    const status = ride.effectiveStatus;
    const colors = {
      scheduled: "bg-blue-100 text-blue-800",
      "in-progress": "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status]}`}>
        {status.toUpperCase().replace('-', ' ')}
      </span>
    );
  };

  const tabs = [
    { id: "all", label: "All" },
    { id: "scheduled", label: "Scheduled" },
    { id: "in-progress", label: "In Progress" },
    { id: "completed", label: "Completed" },
    { id: "cancelled", label: "Cancelled" },
  ];

  return (
    <Layout title="My Rides">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Rides</h1>
          <p className="text-gray-600">View and manage your ride bookings</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Rides List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading rides...</div>
          </div>
        ) : rides.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No rides found</h3>
            <p className="text-gray-500 mb-6">
              {activeTab === "all"
                ? "You don't have any rides yet. Purchase a subscription to get started!"
                : `No ${activeTab.replace('-', ' ')} rides at the moment.`}
            </p>
            <a
              href="/subscription"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Purchase Subscription
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {rides.map((ride) => {
              const cancelCheck = canCancelRide(ride);
              
              return (
                <div
                  key={ride._id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {ride.presetRoute_id?.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {ride.presetRoute_id?.description}
                      </p>
                    </div>
                    {getStatusBadge(ride)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Date & Time */}
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Date & Time</p>
                        <p className="text-sm text-gray-600">
                          {new Date(ride.rideDate).toLocaleDateString()} at {ride.scheduledStartTime}
                        </p>
                      </div>
                    </div>

                    {/* Driver */}
                    <div className="flex items-start gap-3">
                      <Bus className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Driver</p>
                        <p className="text-sm text-gray-600">{ride.driver_id?.name || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Pickup */}
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Pickup</p>
                        <p className="text-sm text-gray-600">
                          {ride.userSubscription?.pickup_stop_name || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Drop */}
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-red-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Drop</p>
                        <p className="text-sm text-gray-600">
                          {ride.userSubscription?.drop_stop_name || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Status */}
                  {ride.attendanceStatus && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-800">
                          Attendance: {ride.attendanceStatus.toUpperCase()}
                        </span>
                        {ride.attendanceTimestamp && (
                          <span className="text-green-600">
                            at {new Date(ride.attendanceTimestamp).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Cancellation Info */}
                  {ride.isCancelled && ride.cancellationInfo && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="font-medium text-red-800">Cancelled</span>
                          <span className="text-red-600">
                            on {new Date(ride.cancellationInfo.cancelled_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-red-700 font-semibold">
                          <DollarSign className="w-4 h-4" />
                          Refund: {ride.cancellationInfo.refund_amount} stars
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    {cancelCheck.canCancel && (
                      <button
                        onClick={() => handleCancelRide(ride)}
                        disabled={cancellingRide === ride._id}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                      >
                        <XCircle className="w-4 h-4" />
                        {cancellingRide === ride._id ? "Cancelling..." : "Cancel Ride"}
                      </button>
                    )}
                    {!cancelCheck.canCancel && ride.effectiveStatus === "scheduled" && (
                      <div className="text-sm text-gray-500 italic flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {cancelCheck.reason}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyRides;

