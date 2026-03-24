#!/bin/sh

echo "========================================="
echo "Application Boot Sequence"
echo "Timestamp: $(date)"
echo "User: $(whoami)"
echo "Environment: NODE_ENV=$NODE_ENV"
echo "Port: $PORT"
echo "Hostname: $HOSTNAME"
echo "========================================="

# Fix permissions for the database directory (mounted volume)
if [ -d "/app/data" ]; then
    echo "[Entrypoint] Fixing permissions for /app/data..."
    chown -R nextjs:nodejs /app/data || true
fi

echo "[Entrypoint] Fixing permissions for /app/prisma..."
chown -R nextjs:nodejs /app/prisma || true

# Fix permissions for the videos directory
if [ -d "/app/public/videos" ]; then
    echo "[Entrypoint] Fixing permissions for /app/public/videos..."
    chown -R nextjs:nodejs /app/public/videos || true
fi

# Check if server.js exists (standalone output)
if [ ! -f "/app/server.js" ]; then
    echo "[Error] server.js not found in /app! Deployment might have failed to copy standalone files correctly."
    ls -la /app
    exit 1
fi

echo "[Entrypoint] server.js found. Starting application..."
echo "========================================="

# Execute the passed command (usually node server.js)
exec "$@"
