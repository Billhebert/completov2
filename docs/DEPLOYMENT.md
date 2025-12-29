# Deployment Guide

## Production Checklist

- [ ] Set strong `JWT_SECRET`
- [ ] Configure production database
- [ ] Setup Redis cluster
- [ ] Configure SMTP for emails
- [ ] Setup Sentry for error tracking
- [ ] Configure backups
- [ ] Setup SSL certificates
- [ ] Configure firewall rules
- [ ] Setup monitoring (Prometheus + Grafana)
- [ ] Configure log aggregation
- [ ] Test disaster recovery

## Environment Variables

Copy `.env.example` to `.env` and configure all values.

## Database Migrations

```bash
# Generate migration
npm run db:migrate

# Apply migration
npx prisma migrate deploy

# Rollback (if needed)
npx prisma migrate rollback
```

## Docker Production

```bash
# Build image
docker build -t omni-platform:latest .

# Run with compose
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose logs -f app
```

## Health Checks

- **Liveness**: `GET /healthz`
- **Readiness**: `GET /readyz`

## Monitoring

Prometheus metrics available at `/metrics`

Key metrics:
- `http_requests_total`
- `http_request_duration_seconds`
- `database_connections`
- `event_bus_messages_total`

## Backup Strategy

1. **Database**: Daily automated backups via pg_dump
2. **Redis**: RDB snapshots
3. **Files**: MinIO replication
4. **Secrets**: Encrypted vault

## Scaling

Horizontal scaling:
1. Use load balancer (nginx/ALB)
2. Run multiple app instances
3. Use Redis for session/cache
4. Use database read replicas
