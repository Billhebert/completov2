#!/bin/bash
# Restore script for OMNI Platform

set -e

if [ -z "$1" ]; then
  echo "Usage: ./scripts/restore.sh <backup_file.tar.gz>"
  exit 1
fi

BACKUP_FILE="$1"
TEMP_DIR="./temp_restore"

echo "🔄 Starting restore from ${BACKUP_FILE}..."

# Extract backup
echo "📦 Extracting backup..."
mkdir -p "${TEMP_DIR}"
tar -xzf "${BACKUP_FILE}" -C "${TEMP_DIR}"

# Get backup directory name
BACKUP_DIR=$(ls "${TEMP_DIR}")

# Restore PostgreSQL
echo "💾 Restoring PostgreSQL..."
docker-compose exec -T postgres psql -U postgres -d omni < "${TEMP_DIR}/${BACKUP_DIR}/database.sql"

# Clean up
rm -rf "${TEMP_DIR}"

echo "✅ Restore completed!"
