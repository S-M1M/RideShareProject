# Quick Start Guide

## 🚀 Running the Project Locally

You have **3 options** to start the development environment:

### Option 1: Single Command (Recommended)
Run both frontend and backend together:
```bash
npm run dev:full
```

This will start:
- Backend on `http://localhost:5000`
- Frontend on `http://localhost:5173`

### Option 2: Separate Windows (Windows Script)
Double-click one of these files:
- `start-dev.bat` (for Command Prompt)
- `start-dev.ps1` (for PowerShell)

This opens two separate terminal windows for easier debugging.

### Option 3: Manual (Two Terminals)

**Terminal 1 - Backend:**
```bash
cd backend
node server.js
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## ✅ Verify It's Working

1. **Backend health check:**
   - Open: `http://localhost:5000/api/health`
   - Should see: `{"status":"Server is running"}`

2. **Frontend:**
   - Open: `http://localhost:5173`
   - Should see the login page

3. **Test an API call:**
   - Login as a user
   - Go to "Buy Stars" page
   - Try purchasing stars
   - Check browser console (F12) → Network tab
   - Should see request to `/api/users/stars/buy` (proxied to localhost:5000)

## 🔧 Environment Configuration

### Development (Automatic)
When running `npm run dev`, the frontend automatically uses:
- Base URL: `/api` 
- Vite proxy forwards to: `http://localhost:5000/api`

### Production (Netlify)
When deployed to Netlify, the frontend uses:
- Base URL: `https://rideshareproject-vyu1.onrender.com/api`
- Set via environment variable: `VITE_API_URL`

## 📝 Important Files

- `src/utils/api.js` - API client with environment detection
- `vite.config.ts` - Vite configuration with proxy setup
- `.env` - Environment variables (not committed to git)
- `backend/server.js` - Backend server entry point

## 🐛 Troubleshooting

### "Cannot connect to backend"
1. Make sure backend is running: `cd backend && node server.js`
2. Check `http://localhost:5000/api/health`
3. Look for errors in backend terminal

### "404 Not Found" on API calls
1. Check the route exists in `backend/routes/`
2. Check the route is registered in `backend/server.js`
3. Check browser DevTools → Network tab for the exact URL

### "CORS error"
1. Check `backend/server.js` CORS configuration
2. Make sure `http://localhost:5173` is in the allowed origins

### Frontend not proxying correctly
1. Restart Vite dev server (`Ctrl+C` then `npm run dev`)
2. Check `vite.config.ts` has correct proxy configuration
3. Clear browser cache (Ctrl+Shift+R)

## 🌐 Testing Production Configuration Locally

To test the production API configuration locally:

```bash
# Build the frontend
npm run build

# Preview the production build
npm run preview
```

This will use the production API URL from the `.env` file.

## 📚 More Information

See `DEVELOPMENT_GUIDE.md` for comprehensive documentation.
