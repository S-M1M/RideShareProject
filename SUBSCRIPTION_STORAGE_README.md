# Subscription Storage System

This system provides local storage functionality for subscription data in the RideShare application, allowing users to save and resume their subscription process across browser sessions.

## Features

- **Persistent Form Data**: Save subscription form progress locally
- **Resume Functionality**: Continue subscription process from where you left off
- **Cross-Page Access**: Access subscription data from any component
- **Data Validation**: Proper error handling for localStorage operations

## Files

### Core Utilities (`src/utils/subscriptionStorage.js`)

Contains all the utility functions for managing subscription data in localStorage:

- `getSubscriptionFormData()` - Get saved form data
- `saveSubscriptionFormData(data)` - Save form data
- `clearSubscriptionFormData()` - Clear form data
- `getCurrentSubscription()` - Get current active subscription
- `saveCurrentSubscription(data)` - Save subscription details
- `clearCurrentSubscription()` - Clear subscription details
- `getAllSubscriptionData()` - Get all subscription-related data
- `clearAllSubscriptionData()` - Clear all subscription data

### Updated Components

1. **Subscription.jsx** - Enhanced with:
   - Auto-save form progress
   - Resume from saved state
   - Clear saved data option
   - Proper user_id and plan_type fields
   - Fixed price calculation (basePrice defined)

2. **Dashboard.jsx** - Shows current subscription info from localStorage

3. **MyRides.jsx** - Accesses subscription data for ride context

## Usage Examples

### Basic Usage in Components

```jsx
import { getCurrentSubscription } from '../utils/subscriptionStorage';

function MyComponent() {
  const [subscription, setSubscription] = useState(null);
  
  useEffect(() => {
    const currentSub = getCurrentSubscription();
    setSubscription(currentSub);
  }, []);
  
  if (subscription) {
    return (
      <div>
        <h3>Route: {subscription.routeName}</h3>
        <p>From: {subscription.pickupStopName} → {subscription.dropStopName}</p>
        <p>Time: {subscription.timeSlot}</p>
        <p>Plan: {subscription.plan_type}</p>
      </div>
    );
  }
  
  return <p>No subscription found</p>;
}
```

### Checking for Incomplete Forms

```jsx
import { getSubscriptionFormData } from '../utils/subscriptionStorage';

function CheckIncompleteForm() {
  const formData = getSubscriptionFormData();
  
  if (formData && formData.selectedRoute && !formData.dropStop) {
    return (
      <div className="alert">
        <p>You have an incomplete subscription.</p>
        <Link to="/subscription">Continue</Link>
      </div>
    );
  }
  
  return null;
}
```

### Clearing Data on Logout

```jsx
import { clearAllSubscriptionData } from '../utils/subscriptionStorage';

function logout() {
  clearAllSubscriptionData();
  localStorage.removeItem('token');
  // ... rest of logout logic
}
```

## Data Structure

### Form Data Structure
```javascript
{
  selectedRoute: {
    _id: "route_1",
    name: "Dhaka University - Uttara",
    stoppages: [...],
    timeSlots: [...]
  },
  selectedTimeSlot: "07:00 AM",
  pickupStop: {
    _id: "stop_1",
    name: "Dhaka University",
    lat: 23.7361,
    lng: 90.3922
  },
  dropStop: {
    _id: "stop_9",
    name: "Uttara Sector 7",
    lat: 23.8759,
    lng: 90.3795
  },
  planType: "monthly"
}
```

### Current Subscription Structure
```javascript
{
  user_id: "user123",
  routeId: "route_1",
  routeName: "Dhaka University - Uttara",
  timeSlot: "07:00 AM",
  pickupStopId: "stop_1",
  pickupStopName: "Dhaka University",
  dropStopId: "stop_9",
  dropStopName: "Uttara Sector 7",
  plan_type: "monthly",
  price: 500,
  distance: 8,
  pickup_location: {
    latitude: 23.7361,
    longitude: 90.3922,
    address: "Dhaka University"
  },
  drop_location: {
    latitude: 23.8759,
    longitude: 90.3795,
    address: "Uttara Sector 7"
  },
  createdAt: "2025-10-12T10:30:00.000Z"
}
```

## Fixed Issues

1. **NaN Price Error**: Added proper `basePrice` definition in `calculatePrice()` function
2. **Missing user_id**: Now gets user ID from auth context
3. **Wrong field name**: Changed `planType` to `plan_type` to match backend schema
4. **No persistence**: Added localStorage functionality for form data and subscription details

## Error Handling

All localStorage operations are wrapped in try-catch blocks to handle:
- Browser storage limitations
- JSON parsing errors
- Storage quota exceeded errors

## Browser Compatibility

Works in all modern browsers that support localStorage (IE8+, Chrome, Firefox, Safari, Edge).

## Security Considerations

- Data is stored in browser's localStorage (not secure for sensitive data)
- Data persists until manually cleared or browser data is cleared
- Consider implementing data encryption for sensitive information in production
- Automatically clears form data after successful subscription creation

## Best Practices

1. Always check if data exists before using it
2. Clear unnecessary data after successful operations
3. Implement fallbacks for when localStorage is not available
4. Use meaningful error messages for better user experience
5. Validate data structure before saving/loading