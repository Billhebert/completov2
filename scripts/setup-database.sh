#!/bin/bash

# Setup PostgreSQL Database for Completov2
echo "🚀 Setting up PostgreSQL database..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL not found!"
    echo ""
    echo "Please install PostgreSQL first:"
    echo "  - Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    echo "  - MacOS: brew install postgresql"
    echo "  - Windows: Download from https://www.postgresql.org/download/windows/"
    exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "⚠️  PostgreSQL is not running. Starting it..."

    # Try to start PostgreSQL (works on most systems)
    if command -v systemctl &> /dev/null; then
        sudo systemctl start postgresql
    elif command -v brew &> /dev/null; then
        brew services start postgresql
    else
        echo "❌ Could not start PostgreSQL automatically."
        echo "Please start it manually:"
        echo "  - Ubuntu/Debian: sudo service postgresql start"
        echo "  - MacOS: brew services start postgresql"
        exit 1
    fi

    sleep 2
fi

# Create database if it doesn't exist
echo "📦 Creating database 'omni_platform'..."
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'omni_platform'" | grep -q 1 || \
    psql -U postgres -c "CREATE DATABASE omni_platform"

echo "✅ Database ready!"
echo ""
echo "Now run:"
echo "  npx prisma db push --force-reset"
echo "  npm run dev"
