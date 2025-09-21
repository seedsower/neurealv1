# Neureal dApp Deployment Guide

## 🚀 Netlify Deployment (Frontend Only)

### Quick Deploy
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/seedsower/neurealv1)

### Manual Deployment Steps

1. **Connect Repository to Netlify**
   - Go to [Netlify Dashboard](https://app.netlify.com/)
   - Click "New site from Git"
   - Choose GitHub and select `seedsower/neurealv1`

2. **Build Settings**
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/build`

3. **Environment Variables** (Optional for full functionality)
   ```
   REACT_APP_API_URL=https://your-backend-url.com
   REACT_APP_WEBSOCKET_URL=wss://your-backend-url.com
   ```

### 🎯 Demo Mode
The app automatically runs in **Demo Mode** on Netlify when no backend is connected:
- ✅ Mock price data with real-time updates
- ✅ Full UI functionality
- ✅ Wallet connection simulation
- ✅ Interactive prediction interface

## 🖥️ Backend Deployment Options

### 1. Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy backend
cd backend
railway login
railway init
railway up
```

### 2. Heroku
```bash
# Install Heroku CLI
cd backend
heroku create neurealv1-backend
git subtree push --prefix backend heroku main
```

### 3. DigitalOcean App Platform
- Create new App from GitHub
- Select `backend` folder
- Set build command: `npm run build`
- Set run command: `npm start`

## 🔧 Full Stack Setup

1. **Deploy Backend** (choose one option above)
2. **Update Netlify Environment Variables**
   ```
   REACT_APP_API_URL=https://your-backend-url.com
   REACT_APP_WEBSOCKET_URL=wss://your-backend-url.com
   ```
3. **Redeploy Frontend** on Netlify

## 📁 Project Structure
```
neurealv1/
├── frontend/          # React app (deploys to Netlify)
├── backend/           # Node.js API (deploy separately)
├── netlify.toml       # Netlify configuration
└── DEPLOY.md          # This file
```

## 🌐 Live Demo
The frontend automatically works in demo mode without a backend, perfect for showcasing the dApp interface and functionality.

## 🔒 Environment Variables

### Frontend (.env.local)
```env
REACT_APP_API_URL=http://localhost:5001
REACT_APP_WEBSOCKET_URL=http://localhost:5001
```

### Backend (.env)
```env
PORT=5001
NODE_ENV=development
```

## 🚨 Important Notes
- The app gracefully handles backend unavailability
- Demo mode provides full UI functionality
- All Web3 features work with MetaMask
- Real-time updates work in both connected and demo modes