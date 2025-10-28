# Deployment Guide

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [Production Deployment](#production-deployment)
4. [Cloud Platforms](#cloud-platforms)
5. [Scaling](#scaling)
6. [Monitoring](#monitoring)

---

## Local Development

### Prerequisites

- Node.js >= 18
- npm or yarn
- Playwright

### Setup

```bash
# Clone repository
git clone <repository-url>
cd corystack-bundle

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Copy environment config
cp .env.example .env

# Edit .env with your settings

# Build
npm run build

# Run tests
npm test

# Start scraper
npm run start -- test https://your-website.com
```

---

## Docker Deployment

### Single Container

```bash
# Build image
docker build -t corystack-scraper .

# Run container
docker run --rm \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/reports:/app/reports \
  --env-file .env \
  corystack-scraper \
  node dist/cli.js test https://your-website.com
```

### Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f scraper

# Scale workers
docker-compose up -d --scale worker=3

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Docker Compose Services

- **scraper**: Main scraper instance
- **worker**: Worker instances for distributed scraping
- **redis**: Redis for task queue
- **redis-commander**: Redis monitoring UI (optional)

---

## Production Deployment

### Environment Variables

```bash
# Required
NODE_ENV=production
REDIS_HOST=redis.example.com
REDIS_PORT=6379

# Optional
REDIS_PASSWORD=your-password
PROXY_LIST_FILE=/app/proxies.txt
MAX_CONCURRENT_BROWSERS=5
LOG_LEVEL=info
```

### Security Hardening

1. **Non-root User**
   ```dockerfile
   USER scraper
   ```

2. **Read-only Filesystem** (where possible)
   ```bash
   docker run --read-only \
     -v $(pwd)/logs:/app/logs \
     -v $(pwd)/tmp:/tmp \
     corystack-scraper
   ```

3. **Resource Limits**
   ```yaml
   # docker-compose.yml
   services:
     scraper:
       deploy:
         resources:
           limits:
             cpus: '2'
             memory: 4G
           reservations:
             cpus: '1'
             memory: 2G
   ```

4. **Network Isolation**
   ```yaml
   networks:
     scraper-network:
       driver: bridge
       internal: true  # No external access
   ```

### Secrets Management

Use Docker secrets or environment files:

```bash
# Create secret file
echo "redis-password" > redis_password.txt

# Use in docker-compose
services:
  redis:
    secrets:
      - redis_password
    environment:
      - REDIS_PASSWORD_FILE=/run/secrets/redis_password

secrets:
  redis_password:
    file: ./redis_password.txt
```

---

## Cloud Platforms

### AWS ECS

#### Task Definition

```json
{
  "family": "corystack-scraper",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/scraper-task-role",
  "networkMode": "awsvpc",
  "containerDefinitions": [
    {
      "name": "scraper",
      "image": "your-ecr-repo/corystack-scraper:latest",
      "memory": 4096,
      "cpu": 2048,
      "essential": true,
      "environment": [
        {
          "name": "REDIS_HOST",
          "value": "your-redis.cache.amazonaws.com"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/corystack-scraper",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### Deploy

```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

docker build -t corystack-scraper .
docker tag corystack-scraper:latest <account>.dkr.ecr.us-east-1.amazonaws.com/corystack-scraper:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/corystack-scraper:latest

# Update service
aws ecs update-service --cluster scraper-cluster --service scraper-service --force-new-deployment
```

### Google Cloud Run

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT_ID/corystack-scraper

# Deploy
gcloud run deploy corystack-scraper \
  --image gcr.io/PROJECT_ID/corystack-scraper \
  --platform managed \
  --region us-central1 \
  --memory 4Gi \
  --cpu 2 \
  --max-instances 10 \
  --set-env-vars REDIS_HOST=redis.example.com
```

### Azure Container Instances

```bash
# Create resource group
az group create --name scraper-rg --location eastus

# Deploy container
az container create \
  --resource-group scraper-rg \
  --name corystack-scraper \
  --image your-registry.azurecr.io/corystack-scraper:latest \
  --cpu 2 \
  --memory 4 \
  --environment-variables \
    REDIS_HOST=redis.example.com \
    NODE_ENV=production
```

### Kubernetes

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: corystack-scraper
spec:
  replicas: 3
  selector:
    matchLabels:
      app: scraper
  template:
    metadata:
      labels:
        app: scraper
    spec:
      containers:
      - name: scraper
        image: corystack-scraper:latest
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        env:
        - name: REDIS_HOST
          value: "redis-service"
        - name: NODE_ENV
          value: "production"
        volumeMounts:
        - name: logs
          mountPath: /app/logs
      volumes:
      - name: logs
        emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: redis-service
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
```

Deploy:
```bash
kubectl apply -f deployment.yaml
kubectl get pods
kubectl logs -f <pod-name>
```

---

## Scaling

### Vertical Scaling

Increase resources for single instance:

```yaml
# docker-compose.yml
services:
  scraper:
    deploy:
      resources:
        limits:
          cpus: '4'        # More CPU
          memory: 8G       # More RAM
    environment:
      MAX_CONCURRENT_BROWSERS: 10  # More browsers
```

**Limits:**
- ~2-3 browsers per CPU core
- ~500MB RAM per browser
- Diminishing returns above 8 cores

### Horizontal Scaling

Add more worker instances:

```bash
# Docker Compose
docker-compose up -d --scale worker=5

# Kubernetes
kubectl scale deployment corystack-scraper --replicas=10

# AWS ECS
aws ecs update-service --cluster scraper-cluster --service scraper-service --desired-count 10
```

### Auto-scaling

#### Kubernetes HPA

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: scraper-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: corystack-scraper
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

#### AWS ECS Auto Scaling

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/scraper-cluster/scraper-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 20

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/scraper-cluster/scraper-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

---

## Monitoring

### Logging

#### Centralized Logging

**ELK Stack:**
```yaml
# docker-compose.yml
services:
  scraper:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  elasticsearch:
    image: elasticsearch:8.11.0
    environment:
      - discovery.type=single-node

  logstash:
    image: logstash:8.11.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf

  kibana:
    image: kibana:8.11.0
    ports:
      - "5601:5601"
```

**CloudWatch:**
```json
{
  "logConfiguration": {
    "logDriver": "awslogs",
    "options": {
      "awslogs-group": "/ecs/scraper",
      "awslogs-region": "us-east-1",
      "awslogs-stream-prefix": "scraper"
    }
  }
}
```

### Metrics

#### Prometheus + Grafana

```yaml
# docker-compose.yml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

#### Custom Metrics Export

```typescript
// In your application
import { MonitoringSystem } from 'corystack-stealth-scraper';

const monitoring = new MonitoringSystem();

// Export metrics endpoint
app.get('/metrics', (req, res) => {
  const metrics = monitoring.getMetrics();
  res.json(metrics);
});
```

### Health Checks

```bash
# Docker health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('healthy')" || exit 1

# Kubernetes liveness probe
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

# ECS health check
"healthCheck": {
  "command": ["CMD-SHELL", "node -e \"console.log('healthy')\" || exit 1"],
  "interval": 30,
  "timeout": 5,
  "retries": 3,
  "startPeriod": 60
}
```

### Alerts

#### Alertmanager (Prometheus)

```yaml
# alertmanager.yml
route:
  receiver: 'email'

receivers:
  - name: 'email'
    email_configs:
      - to: 'ops@example.com'
        from: 'alerts@example.com'
        smarthost: 'smtp.example.com:587'

# Alert rules
groups:
  - name: scraper
    rules:
      - alert: HighDetectionRate
        expr: detection_rate > 0.5
        for: 5m
        annotations:
          summary: "High bot detection rate"
      - alert: LowSuccessRate
        expr: success_rate < 0.7
        for: 5m
        annotations:
          summary: "Low scraping success rate"
```

---

## Backup & Recovery

### Data Backup

```bash
# Backup Redis data
docker exec corystack-redis redis-cli BGSAVE
docker cp corystack-redis:/data/dump.rdb ./backups/

# Backup reports
tar -czf reports-backup-$(date +%Y%m%d).tar.gz ./reports/

# Backup logs
tar -czf logs-backup-$(date +%Y%m%d).tar.gz ./logs/
```

### Disaster Recovery

```bash
# Restore Redis data
docker cp ./backups/dump.rdb corystack-redis:/data/
docker restart corystack-redis

# Restore reports
tar -xzf reports-backup-20240101.tar.gz -C ./reports/
```

---

## Performance Tuning

### Browser Performance

```typescript
const scraper = new StealthScraper({
  // Disable images for faster loading
  behavior: {
    // ... config
  },
});
```

### Redis Performance

```bash
# Increase max memory
redis-cli CONFIG SET maxmemory 2gb
redis-cli CONFIG SET maxmemory-policy allkeys-lru

# Enable persistence
redis-cli CONFIG SET save "900 1 300 10 60 10000"
```

### Resource Limits

```yaml
# Per container limits
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 4G
      pids: 200  # Limit processes
```

---

## Troubleshooting

### Common Issues

**Out of Memory:**
```bash
# Check memory usage
docker stats corystack-scraper

# Increase memory limit
docker run -m 8g corystack-scraper
```

**Slow Performance:**
```bash
# Check CPU usage
docker stats

# Reduce concurrent browsers
export MAX_CONCURRENT_BROWSERS=3
```

**Redis Connection Failed:**
```bash
# Check Redis status
docker-compose ps redis

# Test connection
redis-cli -h redis ping
```

---

## Security Checklist

- [ ] Use non-root user in containers
- [ ] Set resource limits
- [ ] Use secrets for sensitive data
- [ ] Enable network isolation
- [ ] Regular security updates
- [ ] Monitor for vulnerabilities
- [ ] Encrypt data at rest
- [ ] Use TLS for Redis connection
- [ ] Implement rate limiting
- [ ] Enable audit logging

---

**Questions?** See [API.md](API.md) or open an issue.
