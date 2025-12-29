#!/bin/bash
# Development setup script

set -e

echo "🔧 Setting up OMNI Platform for development..."

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed."; exit 1; }

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup environment
if [ ! -f .env ]; then
  echo "📝 Creating .env file..."
  cp .env.example .env
  echo "⚠️  Please edit .env with your configuration"
fi

# Start infrastructure
echo "🐳 Starting Docker services..."
docker-compose up -d

# Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL..."
sleep 5

# Generate Prisma Client
echo "🔨 Generating Prisma Client..."
npx prisma generate

# Run migrations
echo "🗄️  Running migrations..."
npx prisma migrate dev --name init

# Seed database
echo "🌱 Seeding database..."
npm run db:seed

echo "✅ Development setup completed!"
echo ""
echo "🚀 You can now run: npm run dev"
echo "📊 Admin credentials: admin@demo.omni.com / admin123"
