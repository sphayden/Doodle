# Railway Deployment Guide for Doodle Game

## Cost Estimate Summary

### Railway.app Pricing (2024)
- **Memory**: $10/GB per month
- **CPU**: $20/vCPU per month  
- **Egress**: $0.05/GB per month
- **Plans**: Hobby ($5 minimum) or Pro ($20 minimum)

### Expected Costs for Your Game

| Scale | Users | Resources | Monthly Cost |
|-------|-------|-----------|--------------|
| **Development** | 1-10 | 0.5GB RAM, 0.25 vCPU | $5-15 |
| **Small Scale** | 10-50 | 1-2GB RAM, 0.5 vCPU | $20-40 |
| **Medium Scale** | 50-200 | 2-4GB RAM, 1 vCPU | $50-75 |
| **High Scale** | 200+ | 4-8GB RAM, 2 vCPU | $95-145 |

*Plus Redis add-on: $5-25/month depending on usage*

---

## Pre-Deployment Checklist

### ✅ Files Already Created
- [x] `package.json` - Updated for production deployment
- [x] `railway.toml` - Railway configuration
- [x] `.env.production` - Environment variables template
- [x] Server updated with static file serving

### 🔑 Required Before Deployment
- [ ] OpenAI API key
- [ ] Custom domain (optional)
- [ ] Railway account
- [ ] GitHub repository pushed

---

## Step-by-Step Deployment

### Step 1: Set Up Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub account
3. Get $5 free trial credits

### Step 2: Prepare Repository
```bash
# Ensure all changes are committed
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### Step 3: Deploy to Railway

#### Option A: Railway Dashboard (Recommended)
1. **Create New Project**:
   - Go to Railway dashboard
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your Doodle repository

2. **Configure Build Settings**:
   - Railway auto-detects Node.js
   - Build command: `npm run build` (auto-detected)
   - Start command: `npm start` (auto-detected)

3. **Add Redis Service**:
   - In project dashboard, click "Add Service"
   - Select "Database" → "Add Redis"
   - Railway automatically sets `REDIS_URL` environment variable

#### Option B: Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

### Step 4: Configure Environment Variables

In Railway dashboard, go to your project → Variables, and add:

```
NODE_ENV=production
PORT=3002
CORS_ORIGINS=https://*.railway.app
OPENAI_API_KEY=your_openai_api_key_here
SESSION_SECRET=your_secure_32_char_session_secret
MAX_ROOMS=100
MAX_PLAYERS_PER_ROOM=8
ENABLE_AI_JUDGING=true
ENABLE_METRICS=true
```

### Step 5: Monitor Deployment

1. **Check Build Logs**:
   - Go to project → Deployments
   - Click on latest deployment
   - Monitor build progress

2. **Verify Health Check**:
   - Visit: `https://your-app.railway.app/health`
   - Should return JSON with status: "healthy"

3. **Test Game Functionality**:
   - Visit: `https://your-app.railway.app`
   - Create a test room
   - Join with multiple browser tabs

### Step 6: Custom Domain (Optional)

1. **Add Domain in Railway**:
   - Go to project → Settings → Domains
   - Click "Add Domain"
   - Enter your domain name

2. **Configure DNS**:
   ```
   Type: CNAME
   Name: @ (or subdomain)
   Value: your-app.railway.app
   ```

---

## Monitoring and Scaling

### Built-in Monitoring
- **Metrics**: Visit Railway dashboard for CPU/Memory usage
- **Logs**: Real-time logs in Railway dashboard
- **Health Checks**: Automatic health monitoring

### Custom Monitoring Endpoints
- **Health Check**: `https://your-app.railway.app/health`
- **Detailed Metrics**: `https://your-app.railway.app/metrics`
- **System Status**: `https://your-app.railway.app/status`

### Auto-Scaling
Railway automatically scales based on:
- CPU usage (scales up at 80% for 5 minutes)
- Memory usage (scales up at 90% for 3 minutes)
- Request queue depth

### Manual Scaling
1. Go to Railway dashboard
2. Project → Settings → Resources
3. Adjust CPU/Memory limits
4. Railway bills only for usage

---

## Performance Optimization

### Redis Optimization
```bash
# Monitor Redis usage in Railway dashboard
# Upgrade Redis plan if memory usage > 80%
```

### CDN Setup (Optional)
```bash
# Add Cloudflare for static asset caching
# Configure in Railway → Settings → Networking
```

### Database Optimization
```bash
# Monitor game state cleanup
# Implement automatic room cleanup after 24 hours
```

---

## Troubleshooting

### Common Issues

#### Build Fails
```bash
# Check package.json engines match Railway Node.js version
"engines": {
  "node": "18.x"
}
```

#### WebSocket Connection Issues
```bash
# Ensure CORS_ORIGINS includes Railway domain
CORS_ORIGINS=https://*.railway.app,https://your-domain.com
```

#### High Memory Usage
```bash
# Monitor /metrics endpoint
# Check for memory leaks in game room cleanup
# Upgrade Railway plan if needed
```

#### OpenAI Rate Limits
```bash
# Monitor OpenAI usage in dashboard
# Implement request batching for drawing evaluations
# Consider caching similar drawings
```

### Getting Help
- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: Join Railway community
- **Logs**: Check Railway deployment logs for errors

---

## Cost Optimization Tips

### Reduce Costs
1. **Efficient Memory Usage**:
   - Clean up disconnected players immediately
   - Implement room timeout (delete empty rooms)
   - Use Redis efficiently for game state

2. **CPU Optimization**:
   - Batch OpenAI API calls
   - Implement drawing data compression
   - Use Redis for session storage

3. **Egress Optimization**:
   - Compress WebSocket messages
   - Use CDN for static assets
   - Implement efficient drawing data transfer

### Monitor Costs
```bash
# Check Railway dashboard daily
# Set up billing alerts in Railway account
# Monitor metrics endpoint for resource usage
```

---

## Production Checklist

### Before Going Live
- [ ] Environment variables configured
- [ ] OpenAI API key working
- [ ] Redis connected
- [ ] Health checks passing
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (automatic with Railway)

### After Deployment
- [ ] Load test with multiple players
- [ ] Monitor error rates
- [ ] Check game functionality end-to-end
- [ ] Set up billing alerts
- [ ] Document any production URLs
- [ ] Share with team for testing

### Scaling Preparation
- [ ] Monitor concurrent user metrics
- [ ] Plan Redis scaling strategy
- [ ] Consider CDN for global users
- [ ] Prepare multi-region deployment if needed

---

## Next Steps After Railway Deployment

1. **Load Testing**: Test with 20+ concurrent users
2. **Performance Monitoring**: Set up alerts for high CPU/memory
3. **User Feedback**: Gather feedback on game performance
4. **Scaling Plan**: Prepare for growth beyond Railway single-instance limits
5. **Backup Strategy**: Implement Redis data backup for critical game state

**Estimated Total Setup Time**: 1-2 hours for first deployment
**Monthly Cost Estimate**: $20-75 for initial scale (10-200 users)