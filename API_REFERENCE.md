# API Reference - Vehicle Management & Capacity System

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints require authentication token in header:
```
Authorization: Bearer <token>
```

---

## Vehicle Management APIs

### 1. Get All Vehicles
```http
GET /admin/vehicles
```

**Response:**
```json
[
  {
    "_id": "64abc123...",
    "type": "bus",
    "model": "Toyota Coaster",
    "year": 2020,
    "color": "White",
    "capacity": 30,
    "license_plate": "DHA-12345",
    "status": "active",
    "available": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### 2. Get Single Vehicle
```http
GET /admin/vehicles/:id
```

**Response:** Single vehicle object

### 3. Add New Vehicle
```http
POST /admin/vehicles
Content-Type: application/json
```

**Request Body:**
```json
{
  "type": "bus",
  "model": "Toyota Coaster",
  "year": 2020,
  "color": "White",
  "capacity": 30,
  "license_plate": "DHA-12345",
  "status": "active"
}
```

**Response:**
```json
{
  "message": "Vehicle added successfully",
  "vehicle": { /* vehicle object */ }
}
```

### 4. Update Vehicle
```http
PUT /admin/vehicles/:id
Content-Type: application/json
```

**Request Body:** Same as Add Vehicle (all fields optional)

**Response:**
```json
{
  "message": "Vehicle updated successfully",
  "vehicle": { /* updated vehicle object */ }
}
```

### 5. Delete Vehicle
```http
DELETE /admin/vehicles/:id
```

**Response:**
```json
{
  "message": "Vehicle deleted successfully"
}
```

**Error Cases:**
- 400: Vehicle assigned to driver
- 400: Vehicle has active assignments
- 404: Vehicle not found

---

## Preset Route APIs

### 1. Get All Preset Routes
```http
GET /admin/preset-routes
```

**Response:**
```json
[
  {
    "_id": "64abc456...",
    "name": "Dhaka University - Uttara",
    "description": "Main city route",
    "startPoint": {
      "name": "Dhaka University",
      "lat": 23.7361,
      "lng": 90.3922
    },
    "endPoint": {
      "name": "Uttara Sector 7",
      "lat": 23.8759,
      "lng": 90.3795
    },
    "stops": [
      {
        "name": "New Market",
        "lat": 23.7264,
        "lng": 90.3854,
        "order": 1
      }
    ],
    "estimatedTime": "45 min",
    "fare": "৳50",
    "active": true
  }
]
```

### 2. Create Preset Route
```http
POST /admin/preset-routes
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Route Name",
  "description": "Route description",
  "startPoint": {
    "name": "Start Location",
    "lat": 23.7361,
    "lng": 90.3922
  },
  "endPoint": {
    "name": "End Location",
    "lat": 23.8759,
    "lng": 90.3795
  },
  "stops": [
    {
      "name": "Stop Name",
      "lat": 23.7264,
      "lng": 90.3854,
      "order": 1
    }
  ],
  "estimatedTime": "45 min",
  "fare": "৳50"
}
```

### 3. Update Preset Route
```http
PUT /admin/preset-routes/:id
```

**Request Body:** Same as Create (all fields optional)

### 4. Delete Preset Route
```http
DELETE /admin/preset-routes/:id
```

---

## Driver Assignment APIs

### 1. Get All Driver Assignments
```http
GET /admin/driver-assignments?date=2024-01-15
```

**Query Parameters:**
- `date` (optional): Filter by specific date (YYYY-MM-DD)

**Response:**
```json
[
  {
    "_id": "64abc789...",
    "driver_id": {
      "_id": "64abc111...",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "presetRoute_id": { /* full route object */ },
    "vehicle_id": { /* full vehicle object */ },
    "scheduledStartTime": "08:00 AM",
    "scheduledDate": "2024-01-15T00:00:00.000Z",
    "status": "scheduled",
    "currentStopIndex": 0
  }
]
```

### 2. Assign Route to Driver
```http
POST /admin/driver-assignments
Content-Type: application/json
```

**Request Body:**
```json
{
  "driver_id": "64abc111...",
  "presetRoute_id": "64abc456...",
  "vehicle_id": "64abc123...",
  "scheduledStartTime": "08:00 AM",
  "scheduledDate": "2024-01-15"
}
```

**Response:**
```json
{
  "message": "Route assigned to driver successfully",
  "assignment": { /* populated assignment object */ }
}
```

### 3. Update Driver Assignment
```http
PUT /admin/driver-assignments/:id
Content-Type: application/json
```

**Request Body:**
```json
{
  "scheduledStartTime": "09:00 AM",
  "scheduledDate": "2024-01-16",
  "status": "scheduled"
}
```

### 4. Delete Driver Assignment
```http
DELETE /admin/driver-assignments/:id
```

---

## Subscription & Capacity APIs

### 1. Get Available Routes with Capacity
```http
GET /subscriptions/available-routes?date=2024-01-15
```

**Query Parameters:**
- `date` (optional): Filter by specific date

**Response:**
```json
[
  {
    "_id": "64abc789...",
    "driver_id": { /* driver info */ },
    "presetRoute_id": { /* route info */ },
    "vehicle_id": { /* vehicle info */ },
    "scheduledStartTime": "08:00 AM",
    "scheduledDate": "2024-01-15T00:00:00.000Z",
    "status": "scheduled",
    "vehicleCapacity": 30,
    "subscribedCount": 15,
    "availableSeats": 15,
    "isFull": false
  }
]
```

### 2. Check Capacity for Specific Assignment
```http
GET /subscriptions/check-capacity/:assignmentId
```

**Response:**
```json
{
  "vehicleCapacity": 30,
  "subscribedCount": 15,
  "availableSeats": 15,
  "isFull": false,
  "assignment": {
    "id": "64abc789...",
    "route": { /* route details */ },
    "scheduledTime": "08:00 AM",
    "scheduledDate": "2024-01-15T00:00:00.000Z"
  }
}
```

### 3. Create Subscription (with Capacity Validation)
```http
POST /subscriptions
Content-Type: application/json
```

**Request Body:**
```json
{
  "driver_assignment_id": "64abc789...",
  "preset_route_id": "64abc456...",
  "plan_type": "monthly",
  "pickup_location": {
    "latitude": 23.7361,
    "longitude": 90.3922,
    "address": "Dhaka University"
  },
  "drop_location": {
    "latitude": 23.7574,
    "longitude": 90.3888,
    "address": "Farmgate"
  },
  "schedule": {
    "days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "time": "08:00"
  },
  "distance": 5.2
}
```

**Success Response:**
```json
{
  "_id": "64abcdef...",
  "user_id": "64abc222...",
  "driver_assignment_id": "64abc789...",
  "preset_route_id": "64abc456...",
  "plan_type": "monthly",
  "start_date": "2024-01-01T00:00:00.000Z",
  "end_date": "2024-02-01T00:00:00.000Z",
  "price": 6500,
  "active": true,
  /* ... other fields ... */
}
```

**Error Response (Full Capacity):**
```json
{
  "error": "Vehicle is at full capacity. Please choose another route or time.",
  "capacity": 30,
  "currentSubscriptions": 30
}
```

### 4. Get User Subscriptions
```http
GET /subscriptions
```

**Response:** Array of user's subscriptions

### 5. Cancel Subscription
```http
PUT /subscriptions/:id/cancel
```

**Response:**
```json
{
  "message": "Subscription cancelled successfully"
}
```

---

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "error": "Detailed error message"
}
```

### 401 Unauthorized
```json
{
  "error": "Not authorized"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Error message"
}
```

---

## Vehicle Types Enum
- `bus`
- `van`
- `microbus`
- `sedan`
- `suv`

## Vehicle Status Enum
- `active`
- `maintenance`
- `inactive`

## Assignment Status Enum
- `scheduled`
- `in-progress`
- `completed`

## Subscription Plan Types
- `daily` (1 day)
- `weekly` (7 days)
- `monthly` (30 days)

---

## Testing the Flow

### 1. Create a Vehicle
```bash
curl -X POST http://localhost:5000/api/admin/vehicles \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "bus",
    "model": "Toyota Coaster",
    "year": 2020,
    "color": "White",
    "capacity": 30,
    "license_plate": "DHA-12345",
    "status": "active"
  }'
```

### 2. Create a Preset Route
```bash
curl -X POST http://localhost:5000/api/admin/preset-routes \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dhaka University - Uttara",
    "description": "Main city route",
    "startPoint": {
      "name": "Dhaka University",
      "lat": 23.7361,
      "lng": 90.3922
    },
    "endPoint": {
      "name": "Uttara",
      "lat": 23.8759,
      "lng": 90.3795
    },
    "stops": [],
    "estimatedTime": "45 min",
    "fare": "৳50"
  }'
```

### 3. Assign Driver to Route
```bash
curl -X POST http://localhost:5000/api/admin/driver-assignments \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "driver_id": "<driver_id>",
    "presetRoute_id": "<route_id>",
    "vehicle_id": "<vehicle_id>",
    "scheduledStartTime": "08:00 AM",
    "scheduledDate": "2024-01-15"
  }'
```

### 4. Check Available Routes
```bash
curl http://localhost:5000/api/subscriptions/available-routes \
  -H "Authorization: Bearer <token>"
```

### 5. Subscribe to Route
```bash
curl -X POST http://localhost:5000/api/subscriptions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "driver_assignment_id": "<assignment_id>",
    "preset_route_id": "<route_id>",
    "plan_type": "monthly",
    "pickup_location": {
      "latitude": 23.7361,
      "longitude": 90.3922,
      "address": "Dhaka University"
    },
    "drop_location": {
      "latitude": 23.7574,
      "longitude": 90.3888,
      "address": "Farmgate"
    },
    "schedule": {
      "days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
      "time": "08:00"
    },
    "distance": 5.2
  }'
```
