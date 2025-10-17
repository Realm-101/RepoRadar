#!/bin/bash
# Render build script
set -e

echo "Cleaning previous builds and caches..."
rm -rf dist node_modules/.vite client/.vite

echo "Installing dependencies with legacy peer deps..."
npm ci --legacy-peer-deps

echo "Building application with force flag..."
npm run build -- --force

echo "Build completed successfully!"
echo "Verifying build output..."
ls -lh dist/public/assets/css/
echo "Checking index.html..."
grep "index-" dist/public/index.html || echo "No CSS reference found in index.html"
