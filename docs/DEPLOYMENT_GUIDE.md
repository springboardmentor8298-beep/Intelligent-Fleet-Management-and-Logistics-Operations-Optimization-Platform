# FleetFlow — Production Deployment & Operations Guide

This guide describes how to configure, deploy, and operate FleetFlow in production environments using Docker, Linux servers, and cloud providers.

---

## 1. Prerequisites

- **Docker**: Engine version 24.0+ and Docker Compose v2.20+
- **Hardware Minimums**:
  - CPU: 2 vCPU cores
  - RAM: 4 GB
  - Disk: 20 GB SSD
- **Network Ports**:
  - Port 80 (HTTP)
  - Port 443 (HTTPS / SSL)
  - Port 8000 (Backend API - internal or external)
  - Port 5432 (PostgreSQL - internal)
  - Port 6379 (Redis - internal)

---

## 2. Docker Compose Production Deployment (1-Command)

### Step 1: Clone and Configure Environment
```bash
git clone <repository_url>
cd fleetflow

# Copy production environment variables
cp .env.production .env
```

### Step 2: Launch Stack
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Step 3: Verify Container Health
```bash
docker compose ps
curl http://localhost:8000/health
```

Expected output:
```json
{
  "status": "healthy",
  "version": "4.0.0",
  "database": "healthy",
  "services": {
    "auth": "operational",
    "fleet": "operational",
    "shipments": "operational",
    "routing": "operational",
    "maintenance": "operational",
    "drivers": "operational",
    "analytics": "operational",
    "tasks": "operational",
    "notifications": "operational",
    "reports": "operational"
  }
}
```

---

## 3. Cloud Provider Deployments

### A. AWS (Amazon Web Services)
1. **Compute**: Deploy on AWS ECS (Elastic Container Service) with Fargate or an EC2 instance running Ubuntu 22.04 LTS.
2. **Database**: Amazon RDS for PostgreSQL 16.
3. **Cache & Queues**: Amazon ElastiCache for Redis.
4. **Static / CDN**: CloudFront distribution pointing to Application Load Balancer (ALB).

### B. Google Cloud Platform (GCP)
1. **Compute**: Cloud Run (multi-container) or Google Kubernetes Engine (GKE).
2. **Database**: Cloud SQL for PostgreSQL.
3. **Broker**: Memorystore for Redis.

### C. PaaS Providers (Render / Railway)
1. Link GitHub repository to Render/Railway.
2. Provision a managed PostgreSQL instance and a Redis service.
3. Deploy Backend service as a Web Service running Dockerfile.
4. Deploy Frontend service as a Static Web Service or Nginx container.

---

## 4. Backup & Maintenance Procedures

### Database Backup (Daily Cron)
```bash
docker exec -t fleetflow-postgres pg_dump -U postgres fleetflow_db > backup_$(date +%Y%m%d).sql
```

### Database Restore
```bash
cat backup_20261007.sql | docker exec -i fleetflow-postgres psql -U postgres -d fleetflow_db
```

### Celery Background Worker Monitoring
```bash
docker compose logs -f celery_worker
docker compose logs -f celery_beat
```
