#!/bin/bash
# Deployment script for OMNI Platform

set -e

echo "🚀 Starting deployment..."

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build TypeScript
echo "🔨 Building application..."
npm run build

# Run migrations
echo "🗄️  Running database migrations..."
npm run db:migrate:deploy

# Restart services
echo "♻️  Restarting services..."
docker-compose down
docker-compose up -d

# Wait for services
echo "⏳ Waiting for services to be ready..."
sleep 10

# Health check
echo "🏥 Running health check..."
curl -f http://localhost:3000/healthz || exit 1
curl -f http://localhost:3000/readyz || exit 1

echo "✅ Deployment completed successfully!"
