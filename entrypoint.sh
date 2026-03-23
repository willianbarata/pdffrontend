#!/bin/sh

# Fix permissions for the database directory (mounted volume)
# We now use /app/data for persistence
if [ -d "/app/data" ]; then
    echo "Fixing permissions for /app/data..."
    chown -R nextjs:nodejs /app/data
fi

# Still keeping prisma perms just in case, though it shouldn't be the volume mount location anymore
echo "Fixing permissions for /app/prisma..."
chown -R nextjs:nodejs /app/prisma

# Fix permissions for the videos directory (if it exists)
if [ -d "/app/public/videos" ]; then
    echo "Fixing permissions for /app/public/videos..."
    chown -R nextjs:nodejs /app/public/videos
fi

# Execute the passed command (CMD from Dockerfile)
echo "Starting application..."
exec "$@"
