#!/bin/bash

# 🚀 NovaGuard Deployment Script
# Deploys the application to Vercel with production configuration

set -e

echo "🚀 Starting NovaGuard deployment..."
echo "=================================="

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo "❌ Error: vercel.json not found. Please run this script from the project root."
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "🔧 Preparing for deployment..."

# Clean up any existing builds
echo "🧹 Cleaning up previous builds..."
rm -rf frontend/dist
rm -rf frontend/.next
rm -rf api/dist

# Install dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install --force

echo "📦 Installing API dependencies..."
cd ../api
npm install

cd ..

echo "🚀 Deploying to Vercel..."

# Deploy to production
vercel --prod --token UjsGKycIQ3p8oHGyAEkHuHVv

echo "✅ Deployment completed!"
echo ""
echo "🎉 NovaGuard is now live!"
echo "📊 Check your Vercel dashboard for deployment details"
echo "🔍 Monitor errors at: https://sentry.io/"
echo "📈 View analytics at: https://app.datadoghq.com/"
echo ""
echo "🔗 Your application should be available at your Vercel domain"
