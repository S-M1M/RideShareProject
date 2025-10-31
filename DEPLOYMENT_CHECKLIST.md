# Deployment Checklist for Render & Netlify

## Backend (Render) - https://rideshareproject-vyu1.onrender.com

### Environment Variables to Set on Render:
1. **MONGODB_URI** (Required)
   ```
   mongodb+srv://akib:XaiwjGrB3XtBEDMg@cluster0.r193uhx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```

2. **JWT_SECRET** (Required)
   ```
   supersecret
   ```
   ⚠️ **IMPORTANT**: Change this to a secure random string in production!

3. **PORT** (Optional, Render sets this automatically)
   ```
   5000
   ```

4. **NODE_ENV** (Optional but recommended)
   ```
   production
   ```

### Render Configuration:
- **Build Command**: `npm install`
- **Start Command**: `npm start` or `node backend/server.js`
- **Auto-Deploy**: Enabled for main branch
- **Health Check Path**: `/api/health`

### Verify Backend is Running:
1. Open: https://rideshareproject-vyu1.onrender.com/api/health
2. Should return:
   ```json
   {
     "status": "Server is running",
     "timestamp": "...",
     "mongodb": "connected"
   }
   ```

3. Test routes endpoint:
   - https://rideshareproject-vyu1.onrender.com/api/users/routes
   - Should return array of routes (or empty array if none created)

---

## Frontend (Netlify) - https://pickmeupdhaka.netlify.app

### Environment Variables to Set on Netlify:
1. **VITE_API_URL** (Required)
   ```
   https://rideshareproject-vyu1.onrender.com/api
   ```

### Netlify Configuration:
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Node Version**: 20
- **Auto-Deploy**: Enabled for main branch

---

## Local Development Setup

### 1. Environment Variables (.env file in root):
```env
# Frontend Environment Variables
VITE_API_URL=http://localhost:5000/api

# Backend Environment Variables
MONGODB_URI=mongodb+srv://akib:XaiwjGrB3XtBEDMg@cluster0.r193uhx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=supersecret
PORT=5000
```

### 2. Start Development Servers:
```bash
# Option 1: Run both frontend and backend together
npm run dev:full

# Option 2: Run separately
# Terminal 1 - Backend
cd backend
node server.js

# Terminal 2 - Frontend
npm run dev
```

### 3. Test Locally:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api/health
- Routes: http://localhost:5000/api/users/routes

---

## Troubleshooting

### Issue: "500 Internal Server Error" on Render
**Solutions:**
1. Check Render logs for specific error
2. Verify all environment variables are set correctly
3. Ensure MongoDB URI is accessible from Render
4. Check MongoDB Atlas IP whitelist (should allow 0.0.0.0/0 for cloud hosting)

### Issue: CORS errors in browser console
**Solutions:**
1. Verify backend CORS configuration includes frontend URL
2. Check that frontend is using correct API URL
3. Ensure Netlify URL matches the one in backend CORS config

### Issue: Routes not loading on subscription page
**Solutions:**
1. Open browser console (F12) and check for errors
2. Verify API calls are going to correct URL
3. Test backend routes endpoint directly in browser
4. Ensure admin has created routes in the admin panel
5. Check that routes are marked as "active"

### Issue: Authentication not working
**Solutions:**
1. Verify JWT_SECRET is same on backend
2. Check that token is being stored in localStorage
3. Clear browser localStorage and login again
4. Check Authorization header is being sent with requests

### Issue: Stars balance not showing
**Solutions:**
1. Check user model has `stars` field (defaults to 0)
2. Verify `/api/users/stars/balance` endpoint is accessible
3. Check authentication token is valid

---

## Testing Production Deployment

### Test Checklist:
- [ ] Backend health check works
- [ ] Frontend loads without errors
- [ ] User registration works
- [ ] User login works
- [ ] Dashboard loads
- [ ] Subscription page loads
- [ ] Routes are visible on subscription page
- [ ] Stars balance shows correctly
- [ ] Can complete subscription flow (if routes exist)
- [ ] Admin login works
- [ ] Admin can create routes
- [ ] Driver registration works

---

## MongoDB Atlas Configuration

### IP Whitelist:
For cloud hosting (Render), you need to whitelist all IPs:
1. Go to MongoDB Atlas
2. Network Access → Add IP Address
3. Add: `0.0.0.0/0` (Allow access from anywhere)
4. Or add Render's specific IP ranges

### Database User:
- Username: `akib`
- Password: `XaiwjGrB3XtBEDMg`
- Ensure user has read/write permissions

---

## Quick Deploy Commands

### Deploy to Render (Backend):
```bash
# Render auto-deploys from GitHub when you push to main
git add .
git commit -m "Update backend"
git push origin main
```

### Deploy to Netlify (Frontend):
```bash
# Netlify auto-deploys from GitHub when you push to main
git add .
git commit -m "Update frontend"
git push origin main
```

---

## Important URLs

- **Frontend (Netlify)**: https://pickmeupdhaka.netlify.app
- **Backend (Render)**: https://rideshareproject-vyu1.onrender.com
- **Health Check**: https://rideshareproject-vyu1.onrender.com/api/health
- **GitHub Repo**: https://github.com/S-M1M/RideShareProject

---

## Notes

1. **Render Free Tier**: Server spins down after 15 minutes of inactivity. First request after spin-down may take 30-60 seconds.

2. **Environment Variables**: Never commit `.env` file to GitHub. Use `.env.example` as template.

3. **CORS**: Frontend URL must be in backend CORS whitelist for API calls to work.

4. **MongoDB**: Using MongoDB Atlas (cloud). Ensure IP whitelist allows Render's IPs.

5. **Security**: Change JWT_SECRET to a strong random string in production!
