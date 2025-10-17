#!/bin/bash
# Render build script
set -e

echo "Installing dependencies with legacy peer deps..."
npm ci --legacy-peer-deps

echo "Building application..."
npm run build

echo "Build completed successfully!"
