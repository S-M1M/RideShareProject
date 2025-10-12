// Utility functions for managing subscription data in localStorage

export const getSubscriptionFormData = () => {
  try {
    const data = localStorage.getItem("subscriptionFormData");
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error reading subscription form data:", error);
    return null;
  }
};

export const saveSubscriptionFormData = (data) => {
  try {
    localStorage.setItem("subscriptionFormData", JSON.stringify(data));
  } catch (error) {
    console.error("Error saving subscription form data:", error);
  }
};

export const clearSubscriptionFormData = () => {
  try {
    localStorage.removeItem("subscriptionFormData");
  } catch (error) {
    console.error("Error clearing subscription form data:", error);
  }
};

export const getCurrentSubscription = () => {
  try {
    const data = localStorage.getItem("currentSubscription");
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error reading current subscription:", error);
    return null;
  }
};

export const saveCurrentSubscription = (subscriptionData) => {
  try {
    localStorage.setItem(
      "currentSubscription",
      JSON.stringify(subscriptionData)
    );
  } catch (error) {
    console.error("Error saving current subscription:", error);
  }
};

export const clearCurrentSubscription = () => {
  try {
    localStorage.removeItem("currentSubscription");
  } catch (error) {
    console.error("Error clearing current subscription:", error);
  }
};

// Get all subscription-related data
export const getAllSubscriptionData = () => {
  return {
    formData: getSubscriptionFormData(),
    currentSubscription: getCurrentSubscription(),
  };
};

// Clear all subscription data
export const clearAllSubscriptionData = () => {
  clearSubscriptionFormData();
  clearCurrentSubscription();
};

// Functions for managing user subscriptions list
export const getUserSubscriptions = (userId) => {
  try {
    const data = localStorage.getItem("userSubscriptions");
    const allSubscriptions = data ? JSON.parse(data) : [];
    return allSubscriptions.filter((sub) => sub.user_id === userId);
  } catch (error) {
    console.error("Error reading user subscriptions:", error);
    return [];
  }
};

export const addUserSubscription = (subscriptionData) => {
  try {
    const existingSubscriptions = JSON.parse(
      localStorage.getItem("userSubscriptions") || "[]"
    );
    existingSubscriptions.push(subscriptionData);
    localStorage.setItem(
      "userSubscriptions",
      JSON.stringify(existingSubscriptions)
    );
    return true;
  } catch (error) {
    console.error("Error adding user subscription:", error);
    return false;
  }
};

export const removeUserSubscription = (subscriptionId) => {
  try {
    const existingSubscriptions = JSON.parse(
      localStorage.getItem("userSubscriptions") || "[]"
    );
    const filteredSubscriptions = existingSubscriptions.filter(
      (sub) => sub.id !== subscriptionId
    );
    localStorage.setItem(
      "userSubscriptions",
      JSON.stringify(filteredSubscriptions)
    );
    return true;
  } catch (error) {
    console.error("Error removing user subscription:", error);
    return false;
  }
};

export const updateUserSubscription = (subscriptionId, updatedData) => {
  try {
    const existingSubscriptions = JSON.parse(
      localStorage.getItem("userSubscriptions") || "[]"
    );
    const subscriptionIndex = existingSubscriptions.findIndex(
      (sub) => sub.id === subscriptionId
    );

    if (subscriptionIndex !== -1) {
      existingSubscriptions[subscriptionIndex] = {
        ...existingSubscriptions[subscriptionIndex],
        ...updatedData,
      };
      localStorage.setItem(
        "userSubscriptions",
        JSON.stringify(existingSubscriptions)
      );
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error updating user subscription:", error);
    return false;
  }
};
