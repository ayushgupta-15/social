#!/bin/bash

#
# Database Migration Script
#
# Runs Prisma migrations and handles database schema updates.
#

set -e  # Exit on error

echo "🔄 Running database migrations..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  echo "Please set DATABASE_URL in your .env file"
  exit 1
fi

# Run migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

echo "✅ Migrations completed successfully!"
