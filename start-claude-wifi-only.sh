#!/bin/bash

# Start Claude Code with only wifi-whiz-mcp server
echo "Starting Claude Code with wifi-whiz-mcp only..."

# Export the custom config path
export CLAUDE_CONFIG_PATH="$HOME/coding/mcp/wifi-whiz-mcp/.claude-wifi-only.json"

# Start Claude Code
claude

# Note: If the above doesn't work, you can also try:
# claude --config "$HOME/coding/mcp/wifi-whiz-mcp/.claude-wifi-only.json"