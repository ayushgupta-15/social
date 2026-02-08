#!/bin/bash

#
# Database Reset Script
#
# ⚠️  WARNING: This will delete all data and reset the database!
#

set -e

echo "⚠️  WARNING: This will delete ALL data in your database!"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Database reset cancelled"
  exit 0
fi

echo "🗑️  Resetting database..."

# Reset database
npx prisma migrate reset --force

echo "✅ Database reset completed!"
