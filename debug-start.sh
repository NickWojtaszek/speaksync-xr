#!/bin/sh
set -e

echo "==============================================="
echo "DEBUGGING RAILWAY DEPLOYMENT STARTUP"
echo "==============================================="
echo ""
echo "Time: $(date)"
echo "Hostname: $(hostname)"
echo "Working Directory: $(pwd)"
echo ""

echo "--- Environment Variables ---"
echo "PORT=${PORT}"
echo "NODE_ENV=${NODE_ENV}"
echo "HOME=${HOME}"
echo "PATH=${PATH}"
echo ""

echo "--- Node/NPM Versions ---"
node --version
npm --version
echo ""

echo "--- Checking Files ---"
echo "Contents of current directory:"
ls -lah
echo ""

echo "Checking if dist folder exists:"
if [ -d "./dist" ]; then
    echo "✓ dist folder found"
    echo "Contents of dist:"
    ls -lah ./dist | head -20
else
    echo "✗ ERROR: dist folder NOT found!"
fi
echo ""

echo "Checking if server.js exists:"
if [ -f "./server.js" ]; then
    echo "✓ server.js found"
    echo "First 10 lines of server.js:"
    head -10 ./server.js
else
    echo "✗ ERROR: server.js NOT found!"
fi
echo ""

echo "Checking if dist/index.html exists:"
if [ -f "./dist/index.html" ]; then
    echo "✓ dist/index.html found"
else
    echo "✗ ERROR: dist/index.html NOT found!"
fi
echo ""

echo "--- Network Information ---"
echo "Listening interfaces:"
ifconfig 2>/dev/null || ip addr 2>/dev/null || echo "Cannot get network info"
echo ""

echo "--- Memory/CPU ---"
free -h 2>/dev/null || echo "Cannot get memory info"
echo ""

echo "==============================================="
echo "STARTING SERVER on port ${PORT:-3000}"
echo "==============================================="
echo ""

# Start the server and capture output
exec node server.js 2>&1
