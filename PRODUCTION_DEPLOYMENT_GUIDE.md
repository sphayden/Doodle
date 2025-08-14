# Production Deployment Guide for Doodle Multiplayer Game

## Table of Contents
- [Project Overview](#project-overview)
- [Platform Comparison](#platform-comparison)
- [Deployment Strategies](#deployment-strategies)
- [Step-by-Step Deployment Guides](#step-by-step-deployment-guides)
- [Scaling Considerations](#scaling-considerations)
- [Monitoring and Maintenance](#monitoring-and-maintenance)

## Project Overview

### Current Architecture
- **Frontend**: React + TypeScript (builds to static files)
- **Backend**: Node.js + Express + Socket.io
- **Real-time**: WebSocket connections for multiplayer gameplay
- **AI Integration**: OpenAI API for drawing evaluation
- **State Management**: In-memory (needs Redis for scaling)

### Traffic Expectations
- **100+ concurrent lobbies** (4-8 players each)
- **400-800+ concurrent users**
- **High WebSocket traffic** for real-time drawing
- **Burst traffic** during drawing submissions to AI
- **Sticky sessions** required for WebSocket connections

---

## Platform Comparison

### 1. Platform-as-a-Service (PaaS) Solutions

#### 🚀 Railway.app
**Best for: Rapid deployment and early scaling**

**Pros:**
- ✅ Excellent Socket.io support out-of-the-box
- ✅ Built-in Redis add-on
- ✅ Zero-downtime deployments
- ✅ Automatic HTTPS/SSL
- ✅ Simple Git-based deployments
- ✅ Good pricing for small to medium scale
- ✅ Minimal configuration required

**Cons:**
- ❌ Limited to Railway's infrastructure
- ❌ Less control over underlying resources
- ❌ Pricing can become expensive at high scale
- ❌ Limited geographic distribution

**Cost Estimate:**
- $5-20/month for development
- $50-200/month for 500+ concurrent users
- $200-500/month for 1000+ concurrent users

---

#### 🌊 Render.com
**Best for: Simple deployments with good performance**

**Pros:**
- ✅ Free tier available
- ✅ Automatic SSL and CDN
- ✅ Good Socket.io support
- ✅ PostgreSQL and Redis add-ons
- ✅ Simple scaling controls
- ✅ Git-based deployments

**Cons:**
- ❌ Cold starts on free tier
- ❌ Limited customization options
- ❌ Can be slow during traffic spikes
- ❌ Less mature than other platforms

**Cost Estimate:**
- $0/month for development (with limitations)
- $25-100/month for 500+ concurrent users
- $100-300/month for 1000+ concurrent users

---

#### ☁️ Heroku
**Best for: Traditional web apps, less ideal for real-time**

**Pros:**
- ✅ Mature platform
- ✅ Extensive add-on ecosystem
- ✅ Well-documented
- ✅ Redis and PostgreSQL add-ons

**Cons:**
- ❌ **NOT RECOMMENDED** for Socket.io apps (dyno cycling issues)
- ❌ Expensive scaling
- ❌ WebSocket connection limits
- ❌ 30-second request timeout

---

### 2. Cloud Provider Managed Services

#### ☁️ AWS App Runner + ElastiCache
**Best for: AWS ecosystem integration**

**Pros:**
- ✅ Fully managed container service
- ✅ Auto-scaling built-in
- ✅ Integrates with AWS services
- ✅ Good for larger applications
- ✅ Custom domains and SSL

**Cons:**
- ❌ More complex setup
- ❌ Requires AWS knowledge
- ❌ Higher minimum costs
- ❌ Need separate Redis setup (ElastiCache)

**Cost Estimate:**
- $50-100/month minimum
- $150-400/month for 500+ concurrent users
- $300-800/month for 1000+ concurrent users

---

#### 🌊 DigitalOcean App Platform
**Best for: Balance of simplicity and control**

**Pros:**
- ✅ Simple deployment process
- ✅ Good pricing
- ✅ Managed Redis available
- ✅ Built-in load balancing
- ✅ Good Socket.io support
- ✅ Global CDN included

**Cons:**
- ❌ Less mature than AWS/GCP
- ❌ Limited geographic regions
- ❌ Fewer advanced features

**Cost Estimate:**
- $12-25/month for development
- $50-150/month for 500+ concurrent users
- $150-400/month for 1000+ concurrent users

---

### 3. Container Orchestration Platforms

#### 🚢 Amazon ECS (Elastic Container Service)
**Best for: AWS-native container deployments**

**Pros:**
- ✅ Fully managed container orchestration
- ✅ Excellent auto-scaling
- ✅ Integrates with AWS load balancers
- ✅ Good for microservices architecture
- ✅ Cost-effective at scale
- ✅ Supports sticky sessions

**Cons:**
- ❌ Complex initial setup
- ❌ Requires AWS expertise
- ❌ Need separate Redis (ElastiCache)
- ❌ More operational overhead

**Cost Estimate:**
- $30-80/month minimum (including ALB, ElastiCache)
- $100-300/month for 500+ concurrent users
- $200-600/month for 1000+ concurrent users

---

#### ⚙️ Kubernetes (EKS, GKE, AKS)
**Best for: Maximum scalability and control**

**Pros:**
- ✅ Ultimate scalability
- ✅ Cloud-agnostic
- ✅ Excellent for microservices
- ✅ Advanced networking options
- ✅ Rich ecosystem
- ✅ Perfect for high-traffic scenarios

**Cons:**
- ❌ **High complexity** - requires K8s expertise
- ❌ Significant operational overhead
- ❌ Longer setup time
- ❌ Higher minimum costs
- ❌ Overkill for current scale

**Cost Estimate:**
- $100-200/month minimum
- $300-600/month for 500+ concurrent users
- $500-1200/month for 1000+ concurrent users

---

### 4. Self-Hosted Solutions

#### 🖥️ VPS Providers (DigitalOcean, Linode, Vultr)
**Best for: Maximum control and cost efficiency**

**Pros:**
- ✅ **Lowest cost** at scale
- ✅ Complete control over environment
- ✅ Can optimize for specific workload
- ✅ No platform limitations
- ✅ Predictable pricing

**Cons:**
- ❌ **Requires DevOps expertise**
- ❌ Need to manage updates, security, monitoring
- ❌ No automatic scaling
- ❌ Higher operational burden
- ❌ Need backup and disaster recovery planning

**Cost Estimate:**
- $20-50/month for development
- $100-250/month for 500+ concurrent users
- $200-500/month for 1000+ concurrent users

---

#### 🏠 Dedicated Servers
**Best for: Maximum performance and control**

**Pros:**
- ✅ Highest performance
- ✅ Complete isolation
- ✅ Predictable costs
- ✅ No noisy neighbors

**Cons:**
- ❌ **Highest operational complexity**
- ❌ Fixed capacity (no auto-scaling)
- ❌ Higher upfront costs
- ❌ Requires advanced infrastructure knowledge

---

## Deployment Strategies

### 1. Recommended: Staged Approach

#### Phase 1: MVP Deployment (0-100 concurrent users)
**Platform: Railway.app or Render.com**
- Single instance deployment
- Built-in Redis
- Automatic deployments from Git
- Built-in monitoring

#### Phase 2: Growth Scaling (100-500 concurrent users)
**Platform: DigitalOcean App Platform or AWS App Runner**
- Multi-instance deployment
- Dedicated Redis cluster
- Load balancing
- Enhanced monitoring

#### Phase 3: High-Scale Operations (500+ concurrent users)
**Platform: AWS ECS or Kubernetes**
- Container orchestration
- Auto-scaling groups
- Multi-region deployment
- Advanced monitoring and alerting

### 2. Architecture Requirements by Scale

#### Small Scale (0-100 concurrent users)
```
┌─────────────────┐
│   Single App    │
│  Instance +     │
│  Built-in Redis │
└─────────────────┘
```

#### Medium Scale (100-500 concurrent users)
```
┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Redis Cluster │
└─────────────────┘    └─────────────────┘
          │                        ▲
          ▼                        │
┌─────────────────┬─────────────────┴───┐
│   App Instance  │   App Instance      │
│        1        │        2            │
└─────────────────┴─────────────────────┘
```

#### Large Scale (500+ concurrent users)
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │       CDN       │    │   Monitoring    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
          │                        │
          ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                Application Tier (Auto-Scaling)                  │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   App Instance  │   App Instance  │     App Instance N          │
│        1        │        2        │                             │
└─────────────────┴─────────────────┴─────────────────────────────┘
          │                        │
          ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Data Tier                                 │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  Redis Cluster  │  Message Queue  │     Session Store           │
│  (Game State)   │   (Optional)    │   (Sticky Sessions)         │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

---

## Step-by-Step Deployment Guides

### 🚀 Option 1: Railway.app (Recommended for MVP)

#### Prerequisites
- GitHub account with project repository
- Railway.app account

#### Step 1: Prepare Repository
```bash
# 1. Create production package.json in root
cat > package.json << 'EOF'
{
  "name": "doodle-production",
  "version": "1.0.0",
  "scripts": {
    "build": "cd doodle-revamp/client && npm ci && npm run build",
    "start": "cd server && npm ci && node index.js"
  },
  "engines": {
    "node": "18.x"
  }
}
EOF

# 2. Create Procfile for Railway
echo "web: npm run build && npm start" > Procfile

# 3. Update server to serve static files
```

#### Step 2: Configure Environment Variables
Create production environment variables:
```bash
# Server Configuration
NODE_ENV=production
PORT=3002
CORS_ORIGINS=https://your-app.railway.app

# OpenAI Configuration
OPENAI_API_KEY=your_openai_key

# Redis Configuration (Railway provides automatically)
REDIS_URL=${REDIS_URL}

# Security
SESSION_SECRET=your_secure_session_secret
```

#### Step 3: Deploy to Railway
1. **Connect Repository**:
   - Go to Railway.app dashboard
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your Doodle repository

2. **Add Redis**:
   - In project dashboard, click "Add Service"
   - Select "Database" → "Add Redis"

3. **Configure Build & Deploy**:
   - Railway auto-detects Node.js
   - Build command: `npm run build`
   - Start command: `npm start`

4. **Set Environment Variables**:
   - Go to project settings
   - Add all environment variables listed above

5. **Deploy**:
   - Railway automatically deploys on Git push
   - Monitor logs for successful deployment

#### Step 4: Configure Custom Domain (Optional)
- Go to Settings → Domains
- Add custom domain
- Configure DNS CNAME record

---

### 🌊 Option 2: DigitalOcean App Platform

#### Prerequisites
- DigitalOcean account
- GitHub repository

#### Step 1: Prepare Application
```bash
# Create app specification file
cat > .do/app.yaml << 'EOF'
name: doodle-multiplayer
services:
- name: web
  source_dir: /
  github:
    repo: your-username/doodle
    branch: main
  run_command: npm start
  build_command: npm run build
  environment_slug: node-js
  instance_count: 2
  instance_size_slug: basic-xxs
  http_port: 3002
  env:
  - key: NODE_ENV
    value: production
  - key: CORS_ORIGINS
    value: ${APP_URL}

databases:
- name: redis-cache
  engine: REDIS
  version: "6"
  size: basic-xs
EOF
```

#### Step 2: Deploy Application
1. **Create App**:
   ```bash
   # Using DigitalOcean CLI
   doctl apps create .do/app.yaml
   
   # Or use web interface:
   # 1. Go to DigitalOcean Apps dashboard
   # 2. Create App → GitHub → Select repository
   # 3. Configure build settings
   ```

2. **Configure Environment Variables**:
   - Add OpenAI API key
   - Configure Redis connection string
   - Set session secrets

3. **Monitor Deployment**:
   ```bash
   doctl apps list
   doctl apps logs <app-id>
   ```

---

### ☁️ Option 3: AWS ECS (For Higher Scale)

#### Prerequisites
- AWS account with programmatic access
- Docker installed
- AWS CLI configured

#### Step 1: Create Container Image
```bash
# Create Dockerfile (see architecture section)
docker build -t doodle-app .

# Tag for ECR
docker tag doodle-app:latest <account-id>.dkr.ecr.<region>.amazonaws.com/doodle-app:latest

# Push to ECR
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/doodle-app:latest
```

#### Step 2: Set Up Infrastructure
```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name doodle-cluster

# Create task definition
cat > task-definition.json << 'EOF'
{
  "family": "doodle-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::<account>:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "doodle-app",
      "image": "<account>.dkr.ecr.<region>.amazonaws.com/doodle-app:latest",
      "portMappings": [
        {
          "containerPort": 3002,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "REDIS_URL", "value": "redis://your-elasticache-endpoint:6379"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/doodle-app",
          "awslogs-region": "<region>",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF

aws ecs register-task-definition --cli-input-json file://task-definition.json
```

#### Step 3: Create Load Balancer & Service
```bash
# Create Application Load Balancer
aws elbv2 create-load-balancer \
  --name doodle-alb \
  --subnets subnet-12345 subnet-67890 \
  --security-groups sg-12345

# Create ECS service
aws ecs create-service \
  --cluster doodle-cluster \
  --service-name doodle-service \
  --task-definition doodle-app:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345,subnet-67890],securityGroups=[sg-12345],assignPublicIp=ENABLED}" \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:region:account:targetgroup/doodle-tg/1234567890123456,containerName=doodle-app,containerPort=3002
```

---

### 🖥️ Option 4: Self-Hosted VPS

#### Prerequisites
- VPS with Ubuntu 20.04+ (DigitalOcean, Linode, etc.)
- Domain name configured
- SSH access to server

#### Step 1: Server Setup
```bash
# Connect to server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install Redis
apt install redis-server -y
systemctl enable redis-server

# Install Nginx
apt install nginx -y
systemctl enable nginx

# Install PM2 for process management
npm install -g pm2

# Install Docker (optional, for containerized deployment)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

#### Step 2: Deploy Application
```bash
# Clone repository
git clone https://github.com/your-username/doodle.git /var/www/doodle
cd /var/www/doodle

# Build React app
cd doodle-revamp/client
npm ci
npm run build

# Install server dependencies
cd /var/www/doodle/server
npm ci --production

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'doodle-server',
    script: './index.js',
    cwd: '/var/www/doodle/server',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3002,
      REDIS_URL: 'redis://localhost:6379'
    }
  }]
}
EOF

# Start application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Step 3: Configure Nginx
```bash
# Create Nginx configuration
cat > /etc/nginx/sites-available/doodle << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    # Serve React build files
    location / {
        root /var/www/doodle/doodle-revamp/client/build;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Node.js
    location /socket.io/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/doodle /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

#### Step 4: SSL Setup with Let's Encrypt
```bash
# Install certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d your-domain.com

# Auto-renewal
crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## Scaling Considerations

### WebSocket Scaling Challenges

#### Sticky Sessions Required
WebSocket connections must remain with the same server instance:

**Solution Options:**
1. **Load Balancer Sticky Sessions**:
   ```
   # Nginx upstream configuration
   upstream doodle_backend {
       ip_hash;  # Routes based on client IP
       server app1.internal:3002;
       server app2.internal:3002;
   }
   ```

2. **Redis Session Store**:
   ```javascript
   // Socket.io Redis adapter
   const redis = require('redis');
   const redisAdapter = require('socket.io-redis');
   
   io.adapter(redisAdapter({
     host: 'redis-cluster-endpoint',
     port: 6379
   }));
   ```

### Horizontal Scaling Strategy

#### 1. Stateless Application Design
- Move game state to Redis
- Use Redis pub/sub for cross-instance communication
- Store sessions in Redis

#### 2. Auto-Scaling Configuration
```yaml
# Kubernetes HPA example
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: doodle-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: doodle-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

#### 3. Database Scaling
```yaml
# Redis Cluster for high availability
apiVersion: v1
kind: ConfigMap
metadata:
  name: redis-cluster-config
data:
  redis.conf: |
    cluster-enabled yes
    cluster-config-file nodes.conf
    cluster-node-timeout 5000
    appendonly yes
```

---

## Monitoring and Maintenance

### Essential Monitoring Metrics

#### Application Metrics
- **Active WebSocket Connections**
- **Active Game Rooms**
- **Players per Room**
- **Message Rate** (messages/second)
- **Response Time** (API endpoints)
- **Error Rate** (4xx, 5xx responses)

#### Infrastructure Metrics
- **CPU Usage** (per instance)
- **Memory Usage** (per instance)
- **Network I/O** (bandwidth usage)
- **Redis Memory Usage**
- **Redis Connection Count**

#### Business Metrics
- **Games Started per Hour**
- **Average Game Duration**
- **Player Retention Rate**
- **AI API Usage & Costs**

### Monitoring Stack Options

#### Option 1: Built-in Platform Monitoring
- **Railway**: Built-in metrics dashboard
- **DigitalOcean**: App Platform monitoring
- **AWS**: CloudWatch (automatic for ECS)

#### Option 2: Custom Monitoring Stack
```yaml
# Prometheus + Grafana stack
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
  
  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
  
  node-exporter:
    image: prom/node-exporter
    ports:
      - "9100:9100"
```

### Alerting Configuration

#### Critical Alerts
- **Server Down** (any instance unreachable)
- **High Error Rate** (>5% 5xx errors)
- **Memory Usage** (>90% for 5+ minutes)
- **Redis Connection Failure**
- **High Response Time** (>2s average)

#### Warning Alerts
- **High CPU Usage** (>80% for 10+ minutes)
- **High Memory Usage** (>80% for 10+ minutes)
- **Active Connections High** (approaching limits)
- **OpenAI API Rate Limits** (approaching quota)

### Backup and Disaster Recovery

#### Data Backup Strategy
```bash
# Redis backup automation
#!/bin/bash
# Daily Redis backup script
DATE=$(date +%Y%m%d_%H%M%S)
redis-cli --rdb /backups/redis_backup_$DATE.rdb
aws s3 cp /backups/redis_backup_$DATE.rdb s3://doodle-backups/
find /backups -name "redis_backup_*.rdb" -mtime +7 -delete
```

#### Disaster Recovery Plan
1. **RTO (Recovery Time Objective)**: 15 minutes
2. **RPO (Recovery Point Objective)**: 1 hour
3. **Backup Frequency**: Every 6 hours
4. **Multi-Region Deployment** (for high availability)

---

## Cost Analysis Summary

### Monthly Cost Estimates (500 concurrent users)

| Platform | Setup Complexity | Monthly Cost | Scalability | Maintenance |
|----------|------------------|--------------|-------------|-------------|
| **Railway** | ⭐⭐⭐⭐⭐ | $100-200 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **DigitalOcean** | ⭐⭐⭐⭐ | $75-150 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **AWS ECS** | ⭐⭐ | $150-300 | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Kubernetes** | ⭐ | $200-400 | ⭐⭐⭐⭐⭐ | ⭐ |
| **Self-Hosted** | ⭐ | $100-200 | ⭐⭐⭐ | ⭐ |

### Recommendation by Scale

- **0-100 users**: Railway.app or Render.com
- **100-500 users**: DigitalOcean App Platform
- **500-2000 users**: AWS ECS or DigitalOcean + CDN
- **2000+ users**: Kubernetes with multi-region deployment

---

## Final Recommendations

### For Immediate MVP Launch
**Choose Railway.app** for these reasons:
1. Fastest time to deployment (< 1 hour)
2. Excellent Socket.io support
3. Built-in Redis and monitoring
4. Automatic SSL and deployments
5. Can handle initial traffic easily

### Migration Path
1. **Start** with Railway.app for rapid deployment
2. **Migrate** to DigitalOcean App Platform when reaching 100+ concurrent users
3. **Scale** to AWS ECS/Kubernetes when reaching 500+ concurrent users
4. **Optimize** with CDN, caching, and multi-region deployment

### Critical Success Factors
1. **Monitor from Day 1** - Set up alerts and dashboards immediately
2. **Load Test Early** - Test WebSocket connections under load
3. **Plan for Redis** - Game state must be externalized for scaling
4. **Optimize AI Costs** - Monitor OpenAI usage and implement caching
5. **Prepare for Viral Growth** - Have scaling plan ready before you need it

This deployment strategy provides a clear path from MVP to high-scale production deployment, with specific guidance for each phase of growth.