# 🎯 Quick Commands Reference

## Starting the Application

### All-in-One (Recommended)
```bash
npm run dev:full
```
Starts both backend and frontend in one terminal with colored output.

### Separate Terminals
```bash
# Terminal 1 - Backend
cd backend
node server.js

# Terminal 2 - Frontend  
npm run dev
```

### Windows Scripts
```bash
# Double-click one of these files:
start-dev.bat      # Command Prompt
start-dev.ps1      # PowerShell
```

## Stopping the Application

```bash
# Press Ctrl+C in the terminal(s) running the servers
```

## Testing Commands

### Backend Health Check
```bash
# PowerShell
Invoke-WebRequest -Uri http://localhost:5000/api/health

# Command Prompt / curl
curl http://localhost:5000/api/health
```

### Check What's Running
```bash
# Check port 5000 (Backend)
netstat -ano | findstr :5000

# Check port 5173 (Frontend)
netstat -ano | findstr :5173
```

### Kill Ports if Needed
```bash
# Find process ID (PID) first
netstat -ano | findstr :5000

# Then kill it (replace PID with actual number)
taskkill /PID <PID> /F

# Example:
taskkill /PID 12345 /F
```

## Database Commands

### Start MongoDB (if running locally)
```bash
# If MongoDB is installed as a service
net start MongoDB

# Or run manually
mongod --dbpath C:\data\db
```

### Connect to MongoDB
```bash
mongosh mongodb://localhost:27017/ridesharing
```

## Git Commands

### Commit Changes
```bash
git add .
git commit -m "Fix: API configuration for local development"
git push origin main
```

### Check Status
```bash
git status
git log --oneline -5
```

## NPM Commands

### Install Dependencies
```bash
npm install                    # Root (frontend)
cd backend && npm install      # Backend
```

### Update Dependencies
```bash
npm update
```

### Clear Cache
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## Build Commands

### Development Build
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview      # Preview production build
```

## Debugging

### View Backend Logs
```bash
cd backend
node server.js
# Watch console output
```

### View Frontend Logs
```bash
# Open browser DevTools (F12)
# → Console tab for logs
# → Network tab for API calls
```

### Test API Endpoint Directly
```bash
# Using PowerShell
$headers = @{
    "Authorization" = "Bearer YOUR_TOKEN_HERE"
    "Content-Type" = "application/json"
}
$body = @{
    amount = 100
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:5000/api/users/stars/buy -Method POST -Headers $headers -Body $body
```

### Clear Browser Storage
```javascript
// Paste in browser console (F12)
localStorage.clear()
sessionStorage.clear()
location.reload()
```

## Environment

### Check Node Version
```bash
node --version    # Should be v20.x
npm --version
```

### View Environment Variables
```bash
# PowerShell
Get-Content .env

# Command Prompt
type .env
```

### Set Environment Variable (Temporary)
```bash
# PowerShell
$env:NODE_ENV = "production"

# Command Prompt
set NODE_ENV=production
```

## Useful File Paths

```
Project Root: C:\Users\Akib\Desktop\personal\RideShareProject

Frontend:
  - Entry:     src/main.jsx
  - API:       src/utils/api.js
  - Pages:     src/pages/
  - Config:    vite.config.ts

Backend:
  - Entry:     backend/server.js
  - Routes:    backend/routes/
  - Models:    backend/models/
  - Config:    backend/.env

Docs:
  - Quick:     QUICK_START.md
  - Full:      DEVELOPMENT_GUIDE.md
  - This:      COMMANDS.md
```

## Common Issues & Fixes

### Issue: Port already in use
```bash
# Find and kill the process
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Issue: Changes not reflecting
```bash
# Restart dev server
# Press Ctrl+C then:
npm run dev

# Or clear cache and restart
rm -rf node_modules/.vite
npm run dev
```

### Issue: Module not found
```bash
npm install
# Or reinstall specific package
npm install package-name
```

### Issue: MongoDB connection error
```bash
# Check MongoDB is running
net start MongoDB

# Or check connection string in backend/.env
```

## Pro Tips

1. **Keep terminals open** to see real-time logs
2. **Use browser DevTools** (F12) to debug frontend
3. **Check Network tab** to see API requests/responses
4. **Use console.log()** liberally for debugging
5. **Commit often** with clear messages
6. **Test locally** before deploying

## Quick Test Flow

```bash
# 1. Start everything
npm run dev:full

# 2. Open browser
http://localhost:5173

# 3. Open DevTools
F12 → Console + Network tabs

# 4. Test feature
Login → Buy Stars → Check logs

# 5. If error:
- Check backend terminal for errors
- Check browser console for errors
- Check Network tab for failed requests
```

---

💡 **Need help?** See `DEVELOPMENT_GUIDE.md` for detailed explanations.
