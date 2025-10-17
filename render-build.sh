#!/bin/bash
# Render build script
set -e

echo "Cleaning previous builds..."
rm -rf dist node_modules/.vite

echo "Installing dependencies with legacy peer deps..."
npm ci --legacy-peer-deps

echo "Building application..."
npm run build

echo "Build completed successfully!"
echo "Verifying build output..."
ls -lh dist/public/assets/css/
