# Quick Start Guide - Testing Vehicle Management & Capacity System

## Prerequisites
- Backend server running on http://localhost:5000
- Frontend running on http://localhost:5173 (or your configured port)
- MongoDB connected
- Admin account created

---

## Step-by-Step Testing Guide

### Part 1: Vehicle Management

#### 1. Login as Admin
1. Navigate to: `http://localhost:5173/admin/login`
2. Enter admin credentials
3. You'll be redirected to Admin Dashboard

#### 2. Access Vehicle Management
1. From Admin Dashboard, click **"Manage Vehicles"** button (Indigo colored)
2. Or navigate directly to: `http://localhost:5173/admin/vehicles`

#### 3. Add a New Vehicle
1. Click **"Add Vehicle"** button (top right)
2. Fill in the form:
   ```
   Vehicle Type: Bus
   Model: Toyota Coaster
   Year: 2020
   Color: White
   Seating Capacity: 30
   License Plate: DHA-12345
   Status: Active
   ```
3. Click **"Add Vehicle"**
4. You should see success message and the vehicle in the list

#### 4. Test Search Feature
1. Type in search box: "Toyota" or "DHA-12345" or "White"
2. Vehicle list should filter in real-time

#### 5. Edit Vehicle
1. Click the **Edit icon** (pencil) on any vehicle
2. Change any field (e.g., status to "Maintenance")
3. Click **"Update Vehicle"**
4. Changes should reflect immediately

#### 6. Test Vehicle Deletion
1. Click the **Delete icon** (trash) on an unassigned vehicle
2. Confirm deletion
3. Vehicle should be removed from list

#### 7. Add More Test Vehicles
Add these vehicles for testing:
```
Vehicle 2:
- Type: Van
- Model: Toyota Hiace
- Year: 2019
- Color: Silver
- Capacity: 14
- License Plate: DHA-67890

Vehicle 3:
- Type: Microbus
- Model: Nissan Urvan
- Year: 2021
- Color: Blue
- Capacity: 18
- License Plate: CTG-11111
```

---

### Part 2: Driver Management & Assignment

#### 1. Assign Vehicle to Driver
1. Navigate to: `http://localhost:5173/admin/drivers`
2. Either create a new driver or select existing
3. Assign one of the vehicles created above
4. Save the driver

#### 2. Create Preset Route
1. Navigate to: `http://localhost:5173/admin/routes`
2. Create a new preset route (or use existing)
3. Example route:
   ```
   Name: Dhaka University - Uttara Express
   Description: Morning commute route
   Start: Dhaka University (23.7361, 90.3922)
   End: Uttara Sector 7 (23.8759, 90.3795)
   Estimated Time: 45 min
   Fare: ৳50
   ```

#### 3. Create Driver Assignment
1. On Route Assignment page
2. Click "Assign Route to Driver"
3. Select:
   - Driver: (the driver you just assigned vehicle to)
   - Route: (the route you created)
   - Vehicle: (should auto-populate or select)
   - Date: Tomorrow's date
   - Time: 08:00 AM
4. Create assignment

---

### Part 3: Testing Capacity System

#### 1. View Available Routes (As User)
1. Logout from admin account
2. Login as regular user
3. Navigate to: `http://localhost:5173/subscription`
4. You should see the route you created with capacity information:
   ```
   Vehicle: Toyota Coaster
   Capacity: 30 seats
   Available: 30 seats
   Status: Not Full
   ```

#### 2. Check Capacity via API (Optional - Using Browser DevTools or Postman)
```javascript
// Open browser console on subscription page
fetch('http://localhost:5000/api/subscriptions/available-routes', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => console.log(data))
```

Expected response:
```json
[
  {
    "vehicleCapacity": 30,
    "subscribedCount": 0,
    "availableSeats": 30,
    "isFull": false,
    // ... other route details
  }
]
```

#### 3. Create First Subscription
1. On subscription page, select the route
2. Choose plan type (e.g., Weekly)
3. Set pickup and drop locations
4. Submit subscription
5. Should succeed with message: "Subscription created successfully"

#### 4. Check Updated Capacity
1. Refresh the subscription page
2. Capacity should now show:
   ```
   Vehicle: Toyota Coaster
   Capacity: 30 seats
   Available: 29 seats (decreased by 1)
   ```

#### 5. Test Capacity Limit (Create 30 Subscriptions)
This tests the most important feature - capacity validation.

**Option A: Multiple User Accounts (Realistic)**
1. Create 30 different user accounts
2. Subscribe each to the same route
3. 30th subscription should succeed
4. 31st subscription should FAIL with error:
   ```
   "Vehicle is at full capacity. Please choose another route or time."
   ```

**Option B: Backend Test Script (Quick Testing)**
Create a test script to simulate multiple subscriptions:

```javascript
// test-capacity.js
// Run this with node after setting up proper imports

const createSubscription = async (userId) => {
  const response = await fetch('http://localhost:5000/api/subscriptions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_TOKEN'
    },
    body: JSON.stringify({
      driver_assignment_id: 'YOUR_ASSIGNMENT_ID',
      preset_route_id: 'YOUR_ROUTE_ID',
      plan_type: 'daily',
      pickup_location: {
        latitude: 23.7361,
        longitude: 90.3922,
        address: 'Dhaka University'
      },
      drop_location: {
        latitude: 23.7574,
        longitude: 90.3888,
        address: 'Farmgate'
      },
      schedule: {
        days: ['monday'],
        time: '08:00'
      },
      distance: 5.2
    })
  });
  return response.json();
};

// Test: Try to create 31 subscriptions (vehicle capacity is 30)
for (let i = 1; i <= 31; i++) {
  console.log(`Creating subscription ${i}...`);
  const result = await createSubscription();
  console.log(result);
}
```

---

### Part 4: Testing Safety Features

#### 1. Test Vehicle Deletion with Assignment
1. Try to delete a vehicle that's assigned to a driver assignment
2. Should show error: "Cannot delete vehicle. It has active assignments."

#### 2. Test Duplicate License Plate
1. Try to add a vehicle with existing license plate
2. Should show error: "Vehicle with this license plate already exists"

#### 3. Test Capacity Check Before Subscription
1. Check available routes endpoint
2. Verify `isFull` flag is `true` when capacity reached
3. Verify UI prevents subscription when full

---

## Verification Checklist

### Vehicle Management
- [ ] Can add vehicle with all fields
- [ ] Can edit vehicle information
- [ ] Can delete unassigned vehicle
- [ ] Cannot delete assigned vehicle
- [ ] Search works across all fields
- [ ] Statistics update correctly
- [ ] Status badges show correct colors

### Capacity System
- [ ] Available routes show capacity info
- [ ] Capacity decreases when user subscribes
- [ ] Capacity increases when subscription cancelled
- [ ] Cannot subscribe when vehicle full
- [ ] Error message clear when capacity reached
- [ ] Multiple users can subscribe until capacity reached

### Integration
- [ ] Vehicle → Driver → Route → Assignment flow works
- [ ] Users can see routes with assigned vehicles
- [ ] Subscription links to correct driver assignment
- [ ] Admin dashboard shows updated vehicle count

---

## Troubleshooting

### Problem: Vehicle Management page not loading
**Solution:** 
- Check console for errors
- Verify backend is running
- Check API endpoint: `http://localhost:5000/api/admin/vehicles`
- Verify authentication token

### Problem: Capacity not updating
**Solution:**
- Check subscription creation is successful
- Verify `driver_assignment_id` is included in subscription
- Check MongoDB for subscription count
- Refresh the page to see updated capacity

### Problem: Cannot delete vehicle
**Solution:**
- This is expected if vehicle is assigned
- First remove assignment, then delete vehicle
- Or mark vehicle as "Inactive" instead

### Problem: Subscription fails even with available seats
**Solution:**
- Verify vehicle is assigned to the driver assignment
- Check `driver_assignment_id` is correct in subscription request
- Verify vehicle capacity field exists and has correct value
- Check backend logs for detailed error

---

## Database Verification (MongoDB Shell)

### Check Vehicles
```javascript
db.vehicles.find().pretty()
```

### Check Driver Assignments
```javascript
db.driverassignments.find().populate('vehicle_id').pretty()
```

### Check Subscriptions with Capacity
```javascript
db.subscriptions.aggregate([
  {
    $group: {
      _id: "$driver_assignment_id",
      count: { $sum: 1 }
    }
  }
])
```

### Check Vehicle Capacity vs Subscriptions
```javascript
// Find assignment with most subscriptions
db.subscriptions.aggregate([
  { $match: { active: true } },
  { $group: { _id: "$driver_assignment_id", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

---

## API Testing with cURL

### Get All Vehicles
```bash
curl http://localhost:5000/api/admin/vehicles \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Add Vehicle
```bash
curl -X POST http://localhost:5000/api/admin/vehicles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "bus",
    "model": "Toyota Coaster",
    "year": 2020,
    "color": "White",
    "capacity": 30,
    "license_plate": "TEST-001",
    "status": "active"
  }'
```

### Check Available Routes
```bash
curl http://localhost:5000/api/subscriptions/available-routes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Check Specific Route Capacity
```bash
curl http://localhost:5000/api/subscriptions/check-capacity/ASSIGNMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Expected Results Summary

✅ **Vehicle Management Works**: CRUD operations functional
✅ **Capacity Tracking Works**: Real-time seat availability
✅ **Validation Works**: Cannot exceed vehicle capacity
✅ **Safety Features Work**: Protected deletion, unique constraints
✅ **User Flow Works**: Can browse and subscribe to routes
✅ **Admin Flow Works**: Can manage entire system from dashboard

---

## Next Steps After Testing

1. **Add More Routes**: Create multiple routes for different areas
2. **Add More Vehicles**: Build your fleet
3. **Create Schedules**: Set up multiple time slots
4. **Test Edge Cases**: Same user multiple subscriptions, peak hours, etc.
5. **Monitor Performance**: Check with many subscriptions
6. **User Feedback**: Get real user feedback on UI/UX

---

## Support

If you encounter any issues during testing:
1. Check the browser console for errors
2. Check the backend server logs
3. Verify MongoDB connection
4. Review the API_REFERENCE.md for correct endpoints
5. Check IMPLEMENTATION_SUMMARY.md for system overview

Happy Testing! 🚀
