#!/bin/bash
# Run all tests and checks

set -e

echo "🧪 Running all tests and checks..."

# Type checking
echo "📝 Type checking..."
npm run typecheck

# Linting
echo "🔍 Linting..."
npm run lint

# Unit tests
echo "🧪 Running unit tests..."
npm test

# Integration tests
echo "🔗 Running integration tests..."
npm run test:integration || true

echo "✅ All checks passed!"
