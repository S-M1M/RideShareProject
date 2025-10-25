# Ride Share Project - Complete System Flow

## Overview
This ride-sharing system allows admins to manage the entire operation, including drivers, vehicles, and routes. Users can subscribe to specific routes based on their needs, with automatic capacity management.

## System Architecture

### 1. Admin Management System

#### Vehicle Management
- **Location**: `/admin/vehicles`
- **Features**:
  - Add new vehicles with details (type, model, year, color, capacity, license plate, status)
  - Edit existing vehicle information
  - Delete vehicles (with validation to prevent deletion of assigned vehicles)
  - View all vehicles with real-time capacity tracking
  - Filter vehicles by type, model, license plate, or color
  - Vehicle statuses: Active, Maintenance, Inactive

#### Driver Management
- **Location**: `/admin/drivers`
- **Features**:
  - Add new drivers
  - Assign vehicles to drivers
  - View all drivers and their assigned vehicles
  - Edit driver information
  - Remove drivers from the system

#### Route Management
- **Location**: `/admin/routes`
- **Features**:
  - Create preset routes with multiple stops
  - Define start and end points with coordinates
  - Set estimated time and fare
  - Activate/deactivate routes

#### Route Assignment
- **Process**:
  1. Admin creates a preset route (or uses existing)
  2. Admin assigns a driver to the route
  3. Admin assigns a vehicle to the assignment
  4. Admin sets scheduled date and time
  5. System tracks the assignment status (scheduled, in-progress, completed)

### 2. User Subscription System

#### How Users Subscribe

1. **Browse Available Routes**
   - Users can view all available driver assignments
   - Each assignment shows:
     - Route details (start, end, stops)
     - Driver information
     - Vehicle information and capacity
     - Available seats
     - Scheduled time

2. **Check Capacity**
   - Before subscribing, users can check if seats are available
   - System shows: Total capacity, current subscriptions, available seats
   - If vehicle is full, users cannot subscribe

3. **Create Subscription**
   - User selects a route assignment
   - Chooses subscription plan (daily, weekly, monthly)
   - Provides pickup and drop locations
   - System validates capacity before confirming
   - If capacity exceeded, subscription is rejected

4. **Subscription Tracking**
   - Active subscriptions are linked to specific driver assignments
   - System automatically creates rides for the subscription period
   - Users can view and manage their subscriptions

### 3. Capacity Management

#### How It Works

1. **Vehicle Capacity Definition**
   - Each vehicle has a defined seating capacity
   - Capacity is set when vehicle is added to the system

2. **Real-time Tracking**
   - System counts active subscriptions for each driver assignment
   - Available seats = Vehicle capacity - Active subscriptions

3. **Validation**
   - Before accepting a new subscription:
     - System checks the driver assignment
     - Validates vehicle is assigned
     - Counts current active subscriptions
     - Compares with vehicle capacity
     - Rejects if capacity reached

4. **Automatic Updates**
   - When user subscribes: Available seats decrease
   - When subscription expires/cancelled: Available seats increase
   - Dashboard shows real-time capacity status

## Database Models

### Vehicle Model
```javascript
{
  type: String (bus, van, microbus, sedan, suv),
  model: String,
  year: Number,
  color: String,
  capacity: Number, // Maximum seats
  license_plate: String (unique),
  status: String (active, maintenance, inactive),
  available: Boolean
}
```

### PresetRoute Model
```javascript
{
  name: String,
  description: String,
  startPoint: { name, lat, lng },
  endPoint: { name, lat, lng },
  stops: [{ name, lat, lng, order }],
  estimatedTime: String,
  fare: String,
  active: Boolean
}
```

### DriverAssignment Model
```javascript
{
  driver_id: ObjectId (ref: Driver),
  presetRoute_id: ObjectId (ref: PresetRoute),
  vehicle_id: ObjectId (ref: Vehicle),
  scheduledStartTime: String,
  scheduledDate: Date,
  status: String (scheduled, in-progress, completed),
  currentStopIndex: Number,
  completedStops: [{ stopIndex, completedAt }]
}
```

### Subscription Model
```javascript
{
  user_id: ObjectId (ref: User),
  driver_assignment_id: ObjectId (ref: DriverAssignment),
  preset_route_id: ObjectId (ref: PresetRoute),
  plan_type: String (daily, weekly, monthly),
  start_date: Date,
  end_date: Date,
  price: Number,
  pickup_location: { latitude, longitude, address },
  drop_location: { latitude, longitude, address },
  active: Boolean,
  schedule: { days: [String], time: String },
  distance: Number
}
```

## API Endpoints

### Admin Endpoints

#### Vehicles
- `GET /api/admin/vehicles` - Get all vehicles
- `GET /api/admin/vehicles/:id` - Get single vehicle
- `POST /api/admin/vehicles` - Add new vehicle
- `PUT /api/admin/vehicles/:id` - Update vehicle
- `DELETE /api/admin/vehicles/:id` - Delete vehicle

#### Preset Routes
- `GET /api/admin/preset-routes` - Get all preset routes
- `GET /api/admin/preset-routes/:id` - Get single preset route
- `POST /api/admin/preset-routes` - Create preset route
- `PUT /api/admin/preset-routes/:id` - Update preset route
- `DELETE /api/admin/preset-routes/:id` - Delete preset route

#### Driver Assignments
- `GET /api/admin/driver-assignments` - Get all assignments
- `POST /api/admin/driver-assignments` - Create assignment
- `PUT /api/admin/driver-assignments/:id` - Update assignment
- `DELETE /api/admin/driver-assignments/:id` - Delete assignment

### User Endpoints

#### Subscriptions
- `GET /api/subscriptions/available-routes` - Get all available routes with capacity
- `GET /api/subscriptions/check-capacity/:assignmentId` - Check capacity for specific route
- `POST /api/subscriptions` - Create new subscription (with capacity validation)
- `GET /api/subscriptions` - Get user's subscriptions
- `PUT /api/subscriptions/:id/cancel` - Cancel subscription

## Complete Workflow Example

### Admin Setup
1. Admin logs in at `/admin/login`
2. Goes to Vehicle Management (`/admin/vehicles`)
3. Adds a new bus: "Toyota Coaster 2020, White, 30 seats, DHA-12345"
4. Goes to Driver Management (`/admin/drivers`)
5. Adds driver: "John Doe, john@example.com, +8801234567890"
6. Goes to Route Assignment (`/admin/routes`)
7. Creates a preset route: "Dhaka University to Uttara"
8. Assigns driver "John Doe" with vehicle "DHA-12345" to the route
9. Sets schedule: Tomorrow at 8:00 AM

### User Subscription
1. User logs in at `/login`
2. Goes to Subscription page (`/subscription`)
3. Views available routes
4. Sees "Dhaka University to Uttara" route with:
   - Driver: John Doe
   - Vehicle: Toyota Coaster (30 seats)
   - Available: 30 seats
   - Time: 8:00 AM
5. Clicks "Subscribe"
6. Selects monthly plan
7. Sets pickup: Dhaka University
8. Sets drop: Farmgate
9. System checks capacity (29 seats available after subscription)
10. Subscription created successfully
11. 29 other users can still subscribe until vehicle is full

### Capacity Handling
- When 30th user tries to subscribe:
  - System checks capacity
  - Finds 0 available seats
  - Rejects subscription with error message
  - User must choose different route or time

## Frontend Pages

### Admin Pages
- `/admin/dashboard` - Overview with statistics
- `/admin/users` - User management
- `/admin/drivers` - Driver management
- `/admin/vehicles` - **NEW** Vehicle management with CRUD
- `/admin/routes` - Route assignment and preset route management
- `/admin/finance` - Financial overview

### User Pages
- `/dashboard` - User dashboard
- `/subscription` - Browse and subscribe to routes
- `/rides` - View upcoming and past rides
- `/profile` - User profile management

## Features Implemented

✅ Complete vehicle CRUD operations
✅ Vehicle capacity tracking
✅ Preset route management
✅ Driver assignment to routes with vehicles
✅ Real-time capacity checking
✅ Automatic capacity validation during subscription
✅ Available routes listing with capacity info
✅ Subscription linked to specific driver assignments
✅ Prevention of over-subscription
✅ Admin dashboard with vehicle statistics

## Security Features

- Authentication required for all operations
- Role-based access control (admin, driver, user)
- Vehicle deletion prevented if assigned to driver or active route
- Capacity validation to prevent overbooking
- Input validation on all forms

## Next Steps for Development

1. Implement real-time notifications when routes become available
2. Add waiting list feature for fully-booked routes
3. Implement route optimization algorithms
4. Add GPS tracking for active rides
5. Implement payment gateway integration
6. Add rating and review system for drivers
7. Create mobile app for users and drivers
8. Implement analytics dashboard for route performance
