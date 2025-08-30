# PickMeUp - Subscription-based Ride Sharing Platform

A full-stack MERN application for subscription-based office ride sharing with route optimization and real-time tracking.

## Features

### For Passengers
- 🔐 User registration and authentication
- 📅 Subscribe to daily/weekly/monthly ride plans
- 📍 Set pickup and drop locations using interactive maps
- ⏰ Schedule recurring rides with custom timing
- ❌ Cancel rides with 50% automatic refunds
- 🗺️ Track assigned vehicles in real-time
- 👤 Manage profile and subscription history

### For Drivers
- 🚗 Driver authentication and dashboard
- 📋 View assigned passengers and routes
- 🗺️ Optimized route planning with stops
- 📞 Access passenger contact information
- ✅ Update route status (planned/active/completed)

### For Admins
- 👨‍💼 Complete system oversight dashboard
- 👥 User and driver management
- 🚐 Vehicle fleet management
- 🗺️ Route assignment and optimization
- 💰 Financial tracking and refund management
- 📊 System analytics and reporting

## Tech Stack

- **Frontend**: React.js with Tailwind CSS
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose
- **Maps**: Leaflet.js and React-Leaflet
- **Authentication**: JWT-based security
- **Styling**: Tailwind CSS with responsive design

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up Environment Variables**
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your MongoDB connection string and JWT secret.

3. **Start the Application**
   ```bash
   npm run dev:full
   ```
   This starts both the backend server (port 5000) and frontend (port 5173).

## Database Schema

### Collections
- **users**: User accounts with authentication
- **subscriptions**: Ride subscription plans and pricing
- **rides**: Individual ride instances and status
- **drivers**: Driver accounts and vehicle assignments
- **vehicles**: Fleet management and capacity tracking
- **routes**: Daily route assignments and optimization

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/driver/login` - Driver login

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/stats` - User statistics

### Subscriptions
- `POST /api/subscriptions` - Create subscription
- `GET /api/subscriptions` - Get user subscriptions
- `PUT /api/subscriptions/:id/cancel` - Cancel subscription

### Rides
- `GET /api/rides` - Get user rides
- `GET /api/rides/today` - Get today's rides
- `PUT /api/rides/:id/cancel` - Cancel ride (50% refund)

### Admin Operations
- `GET /api/admin/dashboard` - System overview
- `GET /api/admin/users` - User management
- `POST /api/admin/drivers` - Add drivers
- `POST /api/admin/vehicles` - Add vehicles
- `POST /api/admin/routes` - Assign routes

## Key Features

### Subscription System
- Distance-based pricing: $2/km base rate
- Plan multipliers: Daily (1x), Weekly (6x), Monthly (25x)
- Automatic ride generation for subscription periods
- Flexible scheduling with custom days and times

### Refund System
- Automatic 50% refunds for cancelled rides
- Real-time refund calculation and processing
- Financial tracking for admin oversight

### Route Optimization
- Intelligent passenger grouping
- Optimized pickup and drop sequences
- Vehicle capacity management
- Driver assignment algorithms

### Map Integration
- Interactive location selection
- Real-time vehicle tracking simulation
- Route visualization with Leaflet.js
- Custom markers for different location types

## Default Accounts

Create these accounts for testing:

**Admin Account:**
- Email: admin@pickmeup.com
- Password: admin123
- Role: admin

**Test Driver:**
- Name: John Driver
- Email: driver@pickmeup.com
- Password: driver123

## Production Deployment

1. Set up MongoDB Atlas or production MongoDB instance
2. Configure environment variables for production
3. Build the frontend: `npm run build`
4. Deploy backend to your preferred hosting service
5. Serve frontend build files

## Architecture Notes

- **Security**: JWT authentication with role-based access control
- **Scalability**: Modular backend with separated route handlers
- **Maintainability**: Component-based React architecture
- **Performance**: Optimized MongoDB queries and lean data structures
- **User Experience**: Responsive design with loading states and error handling