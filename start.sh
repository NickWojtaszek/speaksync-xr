#!/bin/sh
set -e

echo "=== Starting SpeakSync XR Preview Server ==="
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "PORT: ${PORT:-3000}"
echo "Working directory: $(pwd)"
echo ""
echo "=== Checking required files ==="
ls -la dist/ 2>&1 | head -5 || echo "dist folder not found!"
ls -la vite.config.ts || echo "vite.config.ts not found!"
echo ""
echo "=== Starting Vite preview server ==="
exec npm run preview
