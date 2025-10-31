# Development Setup Guide

This guide explains how to run the RideShare application in both local development and production environments.

## Architecture

- **Frontend**: React + Vite (runs on `http://localhost:5173`)
- **Backend**: Express.js (runs on `http://localhost:5000`)
- **Database**: MongoDB

## Local Development Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file with your configuration
# Copy from .env.example and update values
MONGODB_URI=mongodb://localhost:27017/ridesharing
JWT_SECRET=your_jwt_secret_key_here
PORT=5000

# Start the backend server
npm start
# Or for development with hot reload:
npm run dev
```

The backend will start on `http://localhost:5000`

### 2. Frontend Setup

```bash
# From project root directory
npm install

# Create .env file (optional for local dev)
# The frontend automatically proxies /api to localhost:5000 in development
VITE_API_URL=https://rideshareproject-vyu1.onrender.com/api

# Start the frontend development server
npm run dev
```

The frontend will start on `http://localhost:5173`

### 3. How It Works Locally

When running locally:
1. Frontend runs on `http://localhost:5173`
2. Backend runs on `http://localhost:5000`
3. Vite's proxy configuration automatically forwards all `/api/*` requests from the frontend to `http://localhost:5000/api/*`
4. No CORS issues because the proxy makes it appear as same-origin

**Example:**
- Frontend makes request to: `/api/users/stars/buy`
- Vite proxy forwards to: `http://localhost:5000/api/users/stars/buy`

## Production Deployment

### Netlify (Frontend)
The frontend is deployed to Netlify and uses the environment variable `VITE_API_URL` to connect to the backend on Render.

**Environment Variables in Netlify:**
```
VITE_API_URL=https://rideshareproject-vyu1.onrender.com/api
```

### Render (Backend)
The backend is deployed to Render.

**Environment Variables in Render:**
```
MONGODB_URI=<your-mongodb-atlas-uri>
JWT_SECRET=<your-production-secret>
PORT=5000
```

## API Configuration

The `src/utils/api.js` file automatically detects the environment:

```javascript
// In DEVELOPMENT (localhost):
// Uses baseURL: "/api" → Vite proxy → http://localhost:5000/api

// In PRODUCTION (Netlify):
// Uses baseURL: "https://rideshareproject-vyu1.onrender.com/api"
```

## Testing Locally Before Deploying

### Test the Full Stack Locally

1. **Start Backend:**
   ```bash
   cd backend
   npm start
   ```

2. **Start Frontend (in another terminal):**
   ```bash
   npm run dev
   ```

3. **Test all features:**
   - Login as user
   - Buy stars
   - Create subscriptions
   - Book rides
   - Etc.

### Test Against Production Backend

If you want to test the frontend locally against the production backend on Render:

1. Temporarily modify `src/utils/api.js`:
   ```javascript
   const getBaseURL = () => {
     // Force production URL for testing
     return "https://rideshareproject-vyu1.onrender.com/api";
   };
   ```

2. Or set environment variable:
   ```bash
   # In PowerShell
   $env:NODE_ENV="production"
   npm run dev
   ```

## Common Issues and Solutions

### Issue: 404 errors on API calls

**Cause:** Backend route not registered or API URL misconfigured

**Solution:**
1. Check backend is running: Visit `http://localhost:5000/api/health`
2. Check route exists in `backend/routes/users.js`
3. Check route is registered in `backend/server.js`
4. Check browser console for the exact URL being called

### Issue: CORS errors

**Cause:** Backend CORS configuration doesn't allow the frontend origin

**Solution:**
Check `backend/server.js` CORS configuration includes your frontend URL:
```javascript
cors({
  origin: ["https://pickmeupdhaka.netlify.app", "http://localhost:5173"],
  // ...
})
```

### Issue: Authentication errors

**Cause:** Token not being sent or JWT_SECRET mismatch

**Solution:**
1. Check token is stored: `localStorage.getItem("token")` in browser console
2. Check `src/utils/api.js` interceptor is adding Authorization header
3. Check backend JWT_SECRET matches what was used to sign tokens

## Available Routes

### User Routes (`/api/users`)
- `GET /profile` - Get user profile
- `PUT /profile` - Update profile
- `GET /stats` - Get user statistics
- `POST /stars/buy` - Buy stars ✅
- `GET /stars/balance` - Get stars balance
- `GET /stars/transactions` - Get transaction history
- `GET /routes` - Get preset routes

### Auth Routes (`/api/auth`)
- `POST /register` - Register user
- `POST /login` - Login user

### Subscription Routes (`/api/subscriptions`)
- `POST /` - Create subscription
- `GET /active` - Get active subscriptions
- `GET /history` - Get subscription history

### Ride Routes (`/api/rides`)
- `POST /` - Book a ride
- `GET /` - Get user rides
- `PUT /:id/cancel` - Cancel ride

## Debugging Tips

1. **Check backend logs:**
   ```bash
   cd backend
   npm start
   # Watch console output for errors
   ```

2. **Check frontend network tab:**
   - Open browser DevTools → Network tab
   - Filter by "Fetch/XHR"
   - Check request URL, headers, and response

3. **Check MongoDB:**
   - Verify database connection
   - Check collections exist
   - Verify data is being saved

4. **Test API directly:**
   Use Postman or curl to test endpoints:
   ```bash
   # Test health check
   curl http://localhost:5000/api/health
   
   # Test buy stars (with auth)
   curl -X POST http://localhost:5000/api/users/stars/buy \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"amount": 100}'
   ```

## Deployment Checklist

Before deploying to production:

- [ ] All features work locally
- [ ] Environment variables configured in Netlify
- [ ] Environment variables configured in Render
- [ ] CORS origins include production URLs
- [ ] Database is production-ready (MongoDB Atlas)
- [ ] JWT_SECRET is secure and set in production
- [ ] Test authentication flow
- [ ] Test all API endpoints
- [ ] Check error handling
- [ ] Review console for errors

## Support

If you encounter issues:
1. Check this guide
2. Review error messages in browser console and terminal
3. Check the API endpoint exists in backend routes
4. Verify environment variables are set correctly
