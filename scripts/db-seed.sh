#!/bin/bash

#
# Database Seed Script
#
# Seeds the database with sample data for development.
#

set -e

echo "🌱 Seeding database with sample data..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

# Run seed script
npx prisma db seed

echo "✅ Database seeded successfully!"
