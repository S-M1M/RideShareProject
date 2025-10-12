/**
 * Example Usage of Subscription Storage Utilities
 * 
 * This file demonstrates how to use the subscription storage utilities
 * in different components throughout your application.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  getCurrentSubscription, 
  getSubscriptionFormData,
  getAllSubscriptionData,
  clearAllSubscriptionData 
} from '../utils/subscriptionStorage';
import api from '../utils/api';

// Example 1: Using subscription data in a component
function ExampleComponent() {
  const [subscription, setSubscription] = useState(null);
  
  useEffect(() => {
    // Get the current active subscription
    const currentSub = getCurrentSubscription();
    setSubscription(currentSub);
    
    // Or get all subscription-related data
    const allData = getAllSubscriptionData();
    console.log('Form data:', allData.formData);
    console.log('Current subscription:', allData.currentSubscription);
  }, []);

  if (subscription) {
    return (
      <div>
        <h3>Your Current Subscription</h3>
        <p>Route: {subscription.routeName}</p>
        <p>From: {subscription.pickupStopName}</p>
        <p>To: {subscription.dropStopName}</p>
        <p>Time: {subscription.timeSlot}</p>
        <p>Plan: {subscription.plan_type}</p>
        <p>Price: {subscription.price} points</p>
      </div>
    );
  }

  return <p>No active subscription found</p>;
}

// Example 2: Checking if user has an incomplete subscription form
function CheckIncompleteSubscription() {
  const [hasIncompleteForm, setHasIncompleteForm] = useState(false);
  
  useEffect(() => {
    const formData = getSubscriptionFormData();
    if (formData && formData.selectedRoute && !formData.dropStop) {
      setHasIncompleteForm(true);
    }
  }, []);
  
  if (hasIncompleteForm) {
    return (
      <div className="alert">
        <p>You have an incomplete subscription. Would you like to continue?</p>
        <Link to="/subscription">Continue Subscription</Link>
      </div>
    );
  }
  
  return null;
}

// Example 3: Using subscription data for ride suggestions
function RideSuggestions() {
  const [suggestions, setSuggestions] = useState([]);
  
  useEffect(() => {
    const subscription = getCurrentSubscription();
    if (subscription) {
      // Use subscription data to suggest rides
      const suggestedRides = generateRideSuggestions(subscription);
      setSuggestions(suggestedRides);
    }
  }, []);
  
  return (
    <div>
      <h3>Suggested Rides Based on Your Subscription</h3>
      {suggestions.map(ride => (
        <div key={ride.id}>
          <p>{ride.pickup} → {ride.drop}</p>
          <p>Time: {ride.time}</p>
        </div>
      ))}
    </div>
  );
}

// Example 4: Admin/Driver dashboard showing user subscriptions
function AdminSubscriptionView() {
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  
  // Admin could check localStorage of different users or 
  // fetch from API and compare with local storage data
  
  const syncLocalDataWithServer = async () => {
    const localSub = getCurrentSubscription();
    if (localSub) {
      // Sync with server if needed
      await api.post('/sync-subscription', localSub);
    }
  };
  
  return (
    <div>
      <button onClick={syncLocalDataWithServer}>
        Sync Local Data
      </button>
    </div>
  );
}

// Example 5: Clearing data on logout
function LogoutComponent() {
  const handleLogout = () => {
    // Clear all subscription data when user logs out
    clearAllSubscriptionData();
    
    // Continue with logout process
    localStorage.removeItem('token');
    // ... other logout logic
  };
  
  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  );
}

// Helper function for ride suggestions
function generateRideSuggestions(subscription) {
  // Generate ride suggestions based on subscription data
  return [
    {
      id: 1,
      pickup: subscription.pickupStopName,
      drop: subscription.dropStopName,
      time: subscription.timeSlot,
    }
  ];
}

export {
  ExampleComponent,
  CheckIncompleteSubscription,
  RideSuggestions,
  AdminSubscriptionView,
  LogoutComponent
};