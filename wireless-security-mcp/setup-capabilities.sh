#!/bin/bash
# setup-capabilities.sh - Grant specific capabilities to wireless tools
# This is MORE SECURE than sudo and provides only necessary permissions

echo "🔐 Setting up Linux Capabilities for Wireless Security MCP"
echo "========================================================"

# Create dedicated group
echo "Creating wireless-security group..."
sudo groupadd -f wireless-security

# Add current user to group
echo "Adding $USER to wireless-security group..."
sudo usermod -a -G wireless-security $USER

# Grant capabilities to wireless tools
echo "Setting capabilities on wireless tools..."
TOOLS=(airmon-ng airodump-ng aireplay-ng aircrack-ng kismet wifite)

for tool in "${TOOLS[@]}"; do
    TOOL_PATH=$(which $tool 2>/dev/null)
    if [[ -n "$TOOL_PATH" ]]; then
        # cap_net_admin: Configure network interfaces
        # cap_net_raw: Use raw sockets and packet capture
        sudo setcap cap_net_admin,cap_net_raw+eip "$TOOL_PATH"
        sudo chgrp wireless-security "$TOOL_PATH"
        sudo chmod 750 "$TOOL_PATH"
        echo "✅ Configured $tool with network capabilities"
    else
        echo "⚠️  $tool not found"
    fi
done

# Verify capabilities
echo -e "\n📋 Verifying capabilities..."
for tool in "${TOOLS[@]}"; do
    TOOL_PATH=$(which $tool 2>/dev/null)
    if [[ -n "$TOOL_PATH" ]]; then
        CAPS=$(getcap "$TOOL_PATH" 2>/dev/null)
        if [[ -n "$CAPS" ]]; then
            echo "✅ $tool: $CAPS"
        else
            echo "❌ $tool: No capabilities set"
        fi
    fi
done

echo -e "\n🔄 IMPORTANT: You must log out and back in for group changes to take effect!"
echo "After logging back in, the MCP tools should work without sudo!"