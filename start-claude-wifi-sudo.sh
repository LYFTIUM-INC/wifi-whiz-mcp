#!/bin/bash
# Launch Claude Code with sudo privileges for wireless security operations

echo "🔐 Starting Claude Code with sudo privileges for wireless security MCP..."
echo "⚠️  WARNING: This grants root access to Claude Code and MCP servers!"
echo ""

# Check if we're already running as root
if [ "$EUID" -eq 0 ]; then 
    echo "✅ Already running as root"
    SUDO_CMD=""
else
    echo "🔄 Will request sudo privileges..."
    SUDO_CMD="sudo -E"
fi

# Change to script directory
cd "$(dirname "$0")"

# Preserve important environment variables for Claude
export CLAUDE_CONFIG_PATH="$HOME/coding/mcp/wifi-whiz-mcp/.claude-wifi-only.json"
export HOME="${SUDO_USER_HOME:-$HOME}"
export USER="${SUDO_USER:-$USER}"

# Set secure PATH for sudo execution
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

echo "📋 Configuration:"
echo "   Config: $CLAUDE_CONFIG_PATH"
echo "   User: $USER"
echo "   Home: $HOME"
echo ""

# Start Claude Code with sudo if needed
echo "🚀 Starting Claude Code..."
if [ -n "$SUDO_CMD" ]; then
    echo "   Running: $SUDO_CMD claude"
    exec $SUDO_CMD claude
else
    echo "   Running: claude"
    exec claude
fi