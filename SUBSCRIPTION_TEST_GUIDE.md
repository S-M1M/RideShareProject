# Subscription Endpoint Test Guide

## Backend Server Status ✅
- Server running on port 5000
- MongoDB connected successfully
- All routes including `/api/subscriptions/create-with-stars` are available

## Quick Test Steps

### 1. Verify Backend is Running
Open in browser: http://localhost:5000/api/health

Should return:
```json
{
  "status": "Server is running",
  "timestamp": "...",
  "mongodb": "connected"
}
```

### 2. Test Subscription Page
1. Open frontend: http://localhost:5173
2. Login with your user account
3. Navigate to Subscription page
4. Follow the subscription flow:
   - Step 1: Select a route
   - Step 2: Choose time slot
   - Step 3: Select pickup & drop stops
   - Step 4: Confirm and subscribe

### 3. Check Browser Console
Open Developer Tools (F12) and check console logs for:
- "Development mode: Using Vite proxy /api"
- "API Request: POST /api/subscriptions/create-with-stars"
- "API Response: 200 /subscriptions/create-with-stars"

### 4. Verify Subscription Created
After successful subscription:
- Alert should show: "Successfully subscribed! X stars deducted"
- Stars balance should be updated
- Subscription should appear in "Your Active Subscriptions" section

## Troubleshooting

### Issue: Still getting 404 error
**Solution**: Make sure both servers are running:
```powershell
# Terminal 1 - Backend (already running)
cd backend
node server.js

# Terminal 2 - Frontend
npm run dev
```

### Issue: "Insufficient stars"
**Solution**: Buy stars first:
1. Navigate to Buy Stars page
2. Purchase stars
3. Return to Subscription page

### Issue: "No routes available"
**Solution**: Create routes via Admin Panel:
1. Login as admin: http://localhost:5173/admin/login
2. Navigate to Route Management
3. Create and activate routes

## API Endpoint Details

### POST /api/subscriptions/create-with-stars

**Request Body:**
```json
{
  "preset_route_id": "route_id",
  "pickup_stop_id": "stop_id",
  "pickup_stop_name": "Stop Name",
  "drop_stop_id": "stop_id",
  "drop_stop_name": "Stop Name",
  "plan_type": "daily|weekly|monthly",
  "time_slot": "07:00 AM",
  "pickup_location": {
    "latitude": 23.xxx,
    "longitude": 90.xxx,
    "address": "Stop Name"
  },
  "drop_location": {
    "latitude": 23.xxx,
    "longitude": 90.xxx,
    "address": "Stop Name"
  },
  "distance": 5
}
```

**Response (Success - 200):**
```json
{
  "message": "Subscription created successfully",
  "subscription": { ... },
  "starsRemaining": 190
}
```

**Response (Error - 400):**
```json
{
  "error": "Insufficient stars balance",
  "required": 200,
  "current": 0
}
```

## Stars Pricing

- **Daily**: 10 stars
- **Weekly**: 60 stars (10% discount)
- **Monthly**: 200 stars (~33% discount)

## Next Steps

1. ✅ Backend is running with updated code
2. ✅ MongoDB is connected
3. ✅ `/api/subscriptions/create-with-stars` endpoint is available
4. 🔄 Test the subscription flow in the frontend
5. 🔄 Verify subscription is saved to database
6. 🔄 Deploy updated backend to Render

## Deployment to Production

Once tested locally, deploy to Render:

```bash
git add .
git commit -m "Fix subscription endpoint and improve error handling"
git push origin main
```

Render will automatically deploy the updated backend.

Make sure these environment variables are set on Render:
- MONGODB_URI
- JWT_SECRET
- NODE_ENV=production
- PORT=5000

---

**Status**: Ready for testing! ✅
**Last Updated**: November 1, 2025
