# Task Management UI - Deployment Guide

This guide covers the deployment process for the Task Management UI application across different environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Build Process](#build-process)
4. [Docker Deployment](#docker-deployment)
5. [Production Deployment](#production-deployment)
6. [Monitoring and Logging](#monitoring-and-logging)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- Node.js 18+ 
- npm 8+
- Docker 20+ (for containerized deployment)
- Docker Compose 2+ (for multi-container deployment)

### Development Tools

- Git
- Modern web browser
- Text editor/IDE

## Environment Configuration

### Environment Variables

The application uses different environment files for different stages:

#### Development (`.env.development`)
```bash
VITE_API_BASE_URL=http://localhost:8080
VITE_ENVIRONMENT=development
VITE_ENABLE_DEVTOOLS=true
```

#### Staging (`.env.staging`)
```bash
VITE_API_BASE_URL=https://staging-api.taskmanagement.com
VITE_ENVIRONMENT=staging
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_TRACKING=true
```

#### Production (`.env.production`)
```bash
VITE_API_BASE_URL=https://api.taskmanagement.com
VITE_ENVIRONMENT=production
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true
VITE_ENABLE_PERFORMANCE_MONITORING=true
```

### Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_BASE_URL` | Backend API base URL | Yes |
| `VITE_ENVIRONMENT` | Environment name | Yes |
| `VITE_APP_NAME` | Application name | No |
| `VITE_APP_VERSION` | Application version | No |

## Build Process

### Local Development Build

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for development
npm run build
```

### Production Build

```bash
# Run comprehensive production build
./scripts/build-production.sh

# Or run individual steps
npm run lint
npm run type-check
npm run test
npm run build:prod
```

### Build Options

```bash
# Skip tests during build
./scripts/build-production.sh --skip-tests

# Skip security audit
./scripts/build-production.sh --skip-audit

# Create deployment package
./scripts/build-production.sh --create-package
```

## Docker Deployment

### Single Container Deployment

```bash
# Build Docker image
docker build -t task-management-ui .

# Run container
docker run -p 3000:8080 \
  -e VITE_API_BASE_URL=http://localhost:8080 \
  task-management-ui
```

### Docker Compose Deployment

#### Development/Testing
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f frontend

# Stop services
docker-compose down
```

#### Production
```bash
# Start production stack
docker-compose -f docker-compose.prod.yml up -d

# Scale frontend instances
docker-compose -f docker-compose.prod.yml up -d --scale frontend=3

# Update services
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### Docker Environment Variables

```bash
# Set environment variables for Docker
export VITE_API_BASE_URL=https://api.taskmanagement.com
export VITE_ENVIRONMENT=production
export VITE_APP_VERSION=1.0.0

# Run with environment variables
docker-compose -f docker-compose.prod.yml up -d
```

## Production Deployment

### Pre-deployment Checklist

- [ ] All tests passing
- [ ] Security audit clean
- [ ] Environment variables configured
- [ ] SSL certificates ready
- [ ] Database migrations completed
- [ ] Backup procedures in place
- [ ] Monitoring configured
- [ ] Rollback plan prepared

### Deployment Steps

1. **Prepare Environment**
   ```bash
   # Set production environment variables
   export NODE_ENV=production
   export VITE_API_BASE_URL=https://api.taskmanagement.com
   ```

2. **Build Application**
   ```bash
   # Run production build
   ./scripts/build-production.sh --create-package
   ```

3. **Deploy to Server**
   ```bash
   # Extract deployment package
   tar -xzf deployment/task-management-ui-*.tar.gz
   
   # Deploy using Docker
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Verify Deployment**
   ```bash
   # Check application health
   curl -f http://localhost:3000/health
   
   # Check logs
   docker-compose logs frontend
   ```

### Blue-Green Deployment

```bash
# Deploy to green environment
docker-compose -f docker-compose.green.yml up -d

# Test green environment
curl -f http://green.taskmanagement.com/health

# Switch traffic to green
# Update load balancer configuration

# Stop blue environment
docker-compose -f docker-compose.blue.yml down
```

### Rolling Updates

```bash
# Update image
docker-compose pull frontend

# Rolling update with zero downtime
docker-compose up -d --no-deps --scale frontend=2 frontend
docker-compose up -d --no-deps --scale frontend=1 frontend
```

## Monitoring and Logging

### Health Checks

The application provides several health check endpoints:

- `/health` - Basic health check
- `/api/health` - API health check
- `/metrics` - Prometheus metrics

### Monitoring Stack

The production deployment includes:

- **Prometheus** - Metrics collection
- **Grafana** - Visualization and dashboards
- **ELK Stack** - Log aggregation and analysis

```bash
# Access monitoring services
open http://localhost:9090  # Prometheus
open http://localhost:3001  # Grafana
open http://localhost:5601  # Kibana
```

### Log Management

```bash
# View application logs
docker-compose logs -f frontend

# View nginx logs
docker-compose logs -f nginx

# Export logs
docker-compose logs frontend > frontend.log
```

### Performance Monitoring

```bash
# Run Lighthouse audit
npm install -g @lhci/cli
lhci autorun

# Monitor bundle size
npm run build:analyze
```

## SSL/TLS Configuration

### Certificate Setup

```bash
# Create SSL directory
mkdir -p ssl

# Copy certificates
cp your-domain.crt ssl/
cp your-domain.key ssl/
cp ca-bundle.crt ssl/
```

### Nginx SSL Configuration

The production nginx configuration includes:

- SSL/TLS termination
- HTTP to HTTPS redirect
- Security headers
- HSTS configuration

## Scaling and Load Balancing

### Horizontal Scaling

```bash
# Scale frontend instances
docker-compose -f docker-compose.prod.yml up -d --scale frontend=5

# Check running instances
docker-compose ps
```

### Load Balancer Configuration

The nginx load balancer is configured with:

- Round-robin load balancing
- Health checks
- Session affinity (if needed)
- SSL termination

## Backup and Recovery

### Database Backup

```bash
# Backup database
docker-compose exec db pg_dump -U taskmanagement taskmanagement > backup.sql

# Restore database
docker-compose exec -T db psql -U taskmanagement taskmanagement < backup.sql
```

### Application Backup

```bash
# Backup application files
tar -czf app-backup-$(date +%Y%m%d).tar.gz dist/

# Backup configuration
tar -czf config-backup-$(date +%Y%m%d).tar.gz *.yml *.conf .env.*
```

## Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear cache and rebuild
npm run clean
npm install
npm run build
```

#### Container Issues

```bash
# Check container logs
docker-compose logs frontend

# Restart services
docker-compose restart frontend

# Rebuild containers
docker-compose build --no-cache frontend
```

#### Performance Issues

```bash
# Check resource usage
docker stats

# Monitor application metrics
curl http://localhost:9090/metrics
```

### Debug Mode

```bash
# Enable debug logging
export DEBUG=task-management:*

# Run with debug output
docker-compose -f docker-compose.yml up
```

### Health Check Failures

```bash
# Manual health check
curl -v http://localhost:3000/health

# Check nginx configuration
docker-compose exec nginx nginx -t

# Reload nginx configuration
docker-compose exec nginx nginx -s reload
```

## Security Considerations

### Security Headers

The application includes security headers:

- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Strict-Transport-Security (HSTS)

### Environment Security

- Use secrets management for sensitive data
- Rotate SSL certificates regularly
- Keep dependencies updated
- Monitor security advisories

### Access Control

- Implement proper authentication
- Use HTTPS in production
- Restrict access to admin endpoints
- Monitor access logs

## Performance Optimization

### Build Optimizations

- Code splitting
- Tree shaking
- Asset optimization
- Compression (gzip/brotli)

### Runtime Optimizations

- CDN usage
- Caching strategies
- Service worker
- Lazy loading

### Monitoring Performance

```bash
# Lighthouse CI
lhci autorun

# Bundle analysis
npm run build:analyze

# Performance metrics
curl http://localhost:9090/metrics | grep performance
```

## Maintenance

### Regular Tasks

- Update dependencies
- Security patches
- Certificate renewal
- Log rotation
- Database maintenance

### Automated Tasks

```bash
# Setup cron jobs for maintenance
0 2 * * * /path/to/backup-script.sh
0 3 * * 0 /path/to/update-script.sh
```

## Support

For deployment issues:

1. Check the logs first
2. Verify environment configuration
3. Test health endpoints
4. Review monitoring dashboards
5. Contact the development team

---

**Note**: This deployment guide should be customized based on your specific infrastructure and requirements.