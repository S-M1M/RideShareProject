# Deployment Checklist for Web-Only Setup

## ✅ Code Changes Complete

- [x] `src/utils/api.js` - Now always uses Render URL
- [x] `vite.config.ts` - Removed Vite proxy configuration
- [x] `backend/server.js` - Commented out localhost CORS origins
- [x] `.env` - Updated with production URL
- [x] `.env.example` - Updated documentation
- [x] `src/utils/apiTest.js` - Updated to use Render URL

## 🚀 Deployment Steps

### 1. Backend (Render) - Already Deployed ✅
Your backend is already running on: `https://rideshareproject-vyu1.onrender.com`

**Verify Backend:**
```bash
# Test the health endpoint
curl https://rideshareproject-vyu1.onrender.com/api/health
```

Expected response:
```json
{"status": "ok", "message": "RideShare API is running"}
```

### 2. Frontend (Netlify) - Needs Rebuild

#### Option A: Push to GitHub (Automatic Deployment)
```bash
git add .
git commit -m "Configure app for web-only deployment (no localhost)"
git push origin main
```

Netlify will automatically:
1. Detect the push to main branch
2. Build the frontend with `npm run build`
3. Deploy to `https://pickmeupdhaka.netlify.app`

#### Option B: Manual Deployment
1. Go to Netlify dashboard
2. Click "Trigger deploy" → "Deploy site"

### 3. Environment Variables Check

**Netlify Dashboard:**
1. Go to Site settings → Environment variables
2. Ensure `VITE_API_URL` is set to:
   ```
   https://rideshareproject-vyu1.onrender.com/api
   ```

**Render Dashboard:**
1. Go to your backend service
2. Ensure these environment variables are set:
   - `MONGODB_URI` - Your MongoDB Atlas connection string
   - `JWT_SECRET` - Your JWT secret
   - `PORT` - 5000

## 🧪 Testing After Deployment

### 1. Quick Smoke Test
1. Open: `https://pickmeupdhaka.netlify.app`
2. Open browser DevTools (F12) → Console tab
3. Look for: `Using API URL: https://rideshareproject-vyu1.onrender.com/api`
4. Try to register/login
5. Check console for API requests (should see 200 status codes)

### 2. Full API Test
Run the production test script:
```bash
node test-production-api.cjs
```

### 3. Feature Testing
- [ ] User Registration
- [ ] User Login
- [ ] View Available Routes
- [ ] Subscribe to Route
- [ ] Buy Stars
- [ ] Request Ride
- [ ] View Ride History

### 4. Admin Testing
- [ ] Admin Login
- [ ] Create Vehicles
- [ ] Create Preset Routes
- [ ] Assign Drivers
- [ ] View All Users
- [ ] View All Rides

### 5. Driver Testing
- [ ] Driver Login
- [ ] View Assigned Routes
- [ ] View Ride Requests
- [ ] Update Ride Status

## 🔍 Common Issues & Solutions

### Issue: CORS Errors
**Symptoms:** Console shows "CORS policy" error

**Solution:**
1. Check `backend/server.js` has Netlify URL in allowed origins
2. Redeploy backend to Render
3. Clear browser cache

### Issue: API Timeout
**Symptoms:** Requests take very long or timeout

**Solution:**
1. Render free tier has cold starts (~30s for first request)
2. Wake up the backend by visiting health endpoint
3. Consider upgrading Render plan for always-on service

### Issue: Authentication Fails
**Symptoms:** Login works but subsequent requests fail with 401

**Solution:**
1. Check JWT_SECRET is set in Render environment variables
2. Clear browser localStorage
3. Register a new test account

### Issue: Build Fails on Netlify
**Symptoms:** Netlify build fails

**Solution:**
1. Check build logs in Netlify dashboard
2. Ensure `package.json` has all dependencies
3. Verify Node version matches (should be 20)

## 📊 Monitoring

### Backend Health
Check regularly: `https://rideshareproject-vyu1.onrender.com/api/health`

### Frontend Availability
Check regularly: `https://pickmeupdhaka.netlify.app`

### Render Dashboard
- Monitor response times
- Check for errors in logs
- Monitor uptime

### Netlify Dashboard
- Check build times
- Monitor deploy history
- Review deploy logs

## 🎯 Success Criteria

✅ **Deployment Successful When:**
- [ ] Netlify site loads without errors
- [ ] API health check returns 200 OK
- [ ] Can register new user from web
- [ ] Can login from web
- [ ] Can view and subscribe to routes
- [ ] No CORS errors in console
- [ ] All API requests go to Render (not localhost)

## 📝 Post-Deployment Tasks

1. **Update README.md** - Document the new web-only setup
2. **Notify Team** - Inform team that localhost is no longer needed
3. **Update Documentation** - Remove localhost references from guides
4. **Create User Guide** - Document how to use the live app
5. **Monitor First Week** - Watch for any issues after deployment

## 🔗 Important Links

- **Live App**: https://pickmeupdhaka.netlify.app
- **API Base**: https://rideshareproject-vyu1.onrender.com/api
- **API Health**: https://rideshareproject-vyu1.onrender.com/api/health
- **Netlify Dashboard**: https://app.netlify.com/
- **Render Dashboard**: https://dashboard.render.com/

---

**Ready to Deploy?** Follow the steps above in order!

**Last Updated:** November 2, 2025
