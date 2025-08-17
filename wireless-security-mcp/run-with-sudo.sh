#!/bin/bash
# run-with-sudo.sh - Run MCP server with sudo privileges

echo "🔐 Starting Wireless Security MCP with sudo privileges..."
echo "⚠️  WARNING: This grants full root access to the MCP server!"
echo ""

# Check if already running as root
if [ "$EUID" -eq 0 ]; then 
   echo "✅ Already running as root"
else
   echo "🔄 Requesting sudo privileges..."
   exec sudo "$0" "$@"
fi

# Set secure environment
export NODE_ENV=production
export PATH="/usr/local/bin:/usr/bin:/bin"

# Change to MCP directory
cd "$(dirname "$0")"

# Start the MCP server with root privileges
echo "🚀 Starting MCP server..."
exec node dist/index.js