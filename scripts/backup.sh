#!/bin/bash
# Backup script for OMNI Platform

set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="omni_backup_${TIMESTAMP}"

echo "🔄 Starting backup..."

# Create backup directory
mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}"

# Backup PostgreSQL
echo "📦 Backing up PostgreSQL..."
docker-compose exec -T postgres pg_dump -U postgres omni > "${BACKUP_DIR}/${BACKUP_NAME}/database.sql"

# Backup uploads (if using MinIO/S3)
echo "📁 Backing up file storage..."
# Add your file backup logic here

# Backup Redis (optional)
echo "💾 Backing up Redis..."
docker-compose exec -T redis redis-cli BGSAVE

# Compress backup
echo "🗜️  Compressing backup..."
cd "${BACKUP_DIR}"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"
rm -rf "${BACKUP_NAME}"

echo "✅ Backup completed: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
