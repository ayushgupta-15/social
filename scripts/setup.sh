#!/bin/bash

#
# Project Setup Script
#
# Sets up the project for first-time use.
#

set -e

echo "🚀 Setting up Social Media Application..."
echo ""

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ ERROR: Node.js 18 or higher is required"
  echo "Current version: $(node --version)"
  exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if .env exists
if [ ! -f .env ]; then
  echo "📝 Creating .env file from .env.example..."
  cp .env.example .env
  echo "⚠️  Please edit .env with your configuration before proceeding"
  echo ""
  exit 0
fi

echo "✅ .env file found"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Generate Prisma Client
echo ""
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Run migrations
echo ""
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Seed database (optional)
echo ""
read -p "Do you want to seed the database with sample data? (yes/no): " seed

if [ "$seed" = "yes" ]; then
  echo "🌱 Seeding database..."
  npx prisma db seed
fi

# Build project
echo ""
echo "🏗️  Building project..."
npm run build

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "📚 Next steps:"
echo "  1. Edit .env with your configuration"
echo "  2. Run 'npm run dev' to start development server"
echo "  3. Open http://localhost:3000 in your browser"
echo ""
echo "📖 Documentation:"
echo "  • Architecture: ./docs/ARCHITECTURE.md"
echo "  • API: ./docs/API.md"
echo "  • Contributing: ./CONTRIBUTING.md"
echo ""
