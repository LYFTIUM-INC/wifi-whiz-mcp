#!/bin/bash
# Launch Claude with only the wireless-security-mcp server

cd "$(dirname "$0")"
claude --strict-mcp-config --mcp-config .claude.local.json "$@"