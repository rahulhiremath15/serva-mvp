# 🚀 Serva Deployment Guide

## Frontend Deployment (Vercel) - FREE

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Connect your GitHub repository
4. Select the `Serva` repository
5. Vercel will auto-detect React app
6. Click "Deploy"

### 3. Set Environment Variables in Vercel
In Vercel dashboard → Settings → Environment Variables:
```
REACT_APP_API_URL=https://your-backend-url.onrender.com
```

## Backend Deployment (Render) - FREE

### 1. Prepare Backend for Render
Create `render.yaml` file in server directory:
```yaml
services:
  - type: web
    name: serva-api
    env: node
    plan: free
    startCommand: "npm start"
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
    healthCheckPath: /api/v1/bookings
```

### 2. Push to GitHub
```bash
git add .
git commit -m "Add render config"
git push origin main
```

### 3. Deploy to Render
1. Go to [render.com](https://render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Select the `Serva` repository
5. Root Directory: `server`
6. Runtime: Node
7. Start Command: `npm start`
8. Click "Create Web Service"

### 4. Update CORS in Production
In `server/index.js`, update CORS:
```javascript
const cors = require('cors');
app.use(cors({
  origin: ['https://your-vercel-app.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
```

## 🔄 Post-Deployment Steps

### 1. Update Frontend Environment
In Vercel dashboard, set:
```
REACT_APP_API_URL=https://your-backend-name.onrender.com
```

### 2. Test Production URLs
- Frontend: https://your-app.vercel.app
- Backend: https://your-backend.onrender.com/api/v1/bookings

### 3. Verify Endpoints
```bash
# Test backend
curl https://your-backend.onrender.com/api/v1/bookings

# Test frontend booking creation
# Open your Vercel app and submit a booking
```

## 🌐 Free Tier Limits

### Vercel (Frontend)
- ✅ Unlimited static sites
- ✅ 100GB bandwidth/month
- ✅ Custom domains
- ✅ SSL certificates

### Render (Backend)
- ✅ 750 hours/month free
- ✅ 512MB RAM
- ✅ Persistent storage
- ❌ Sleeps after 15min inactivity (wakes on request)

## 🚨 Important Notes

1. **Data Persistence**: Render's free tier includes persistent storage, so your `bookings.json` will be preserved.

2. **Cold Starts**: Backend may take 30-60 seconds to wake up after inactivity.

3. **CORS**: Make sure to update CORS origins to include your Vercel domain.

4. **Environment Variables**: Never commit sensitive data to GitHub.

## 🎯 Quick Deploy Commands

### Frontend (Vercel CLI)
```bash
npm i -g vercel
vercel --prod
```

### Backend (Render CLI)
```bash
# Render uses GitHub deployment - just push changes
git add .
git commit -m "Deploy to production"
git push origin main
```

## 🔍 Troubleshooting

### Common Issues:
1. **CORS Errors**: Update backend CORS origins
2. **API 404s**: Check environment variables
3. **Build Failures**: Verify `package.json` scripts
4. **Sleep Issues**: Consider upgrading to paid tier for production

### Specific Render Issues:

#### ❌ "Missing script: build" Error
**Problem:** Render tries to run `npm run build` but your backend doesn't need it.

**Solution:** 
- Use the updated `render.yaml` configuration (no build command)
- Or in Render dashboard: Settings → Build & Deploy → Build Command → Leave empty
- Only set Start Command to `npm start`

#### ❌ Port Issues
**Problem:** Server tries to use port 5000 but Render uses port 10000

**Solution:** 
- Your server already uses `process.env.PORT || 5000`
- Render automatically sets PORT environment variable

### Debug Commands:
```bash
# Check Vercel logs
vercel logs

# Check Render logs
# Go to Render dashboard → Logs tab

# Test backend locally
cd server
npm start
curl http://localhost:5000/api/v1/bookings
```
