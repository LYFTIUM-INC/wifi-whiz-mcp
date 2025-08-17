#!/bin/bash
# Enhanced Claude startup script with permission options

usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --sudo                Run Claude with sudo privileges (for wireless operations)"
    echo "  --normal              Run Claude with normal user privileges (default)"
    echo "  --capabilities        Check if Linux capabilities are configured"
    echo "  --check-permissions   Verify current permission status"
    echo "  --help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Normal startup"
    echo "  $0 --sudo             # Sudo startup for full wireless functionality"
    echo "  $0 --check-permissions # Check what permissions are available"
}

check_permissions() {
    echo "🔍 Checking wireless security permissions..."
    echo ""
    
    # Check sudo access
    if sudo -n true 2>/dev/null; then
        echo "✅ Sudo access: Available"
    else
        echo "❌ Sudo access: Not available (password required)"
    fi
    
    # Check group membership
    if groups | grep -q "wireless-security\|kismet"; then
        echo "✅ Wireless groups: Member of wireless security groups"
    else
        echo "❌ Wireless groups: Not in wireless security groups"
    fi
    
    # Check capabilities on tools
    echo ""
    echo "📋 Tool capabilities:"
    for tool in airmon-ng airodump-ng kismet; do
        TOOL_PATH=$(command -v $tool 2>/dev/null)
        if [[ -n "$TOOL_PATH" ]]; then
            CAPS=$(getcap "$TOOL_PATH" 2>/dev/null)
            if [[ -n "$CAPS" ]]; then
                echo "✅ $tool: $CAPS"
            else
                echo "❌ $tool: No capabilities set"
            fi
        else
            echo "❌ $tool: Not found"
        fi
    done
    
    echo ""
    echo "💡 Recommendations:"
    if sudo -n true 2>/dev/null; then
        echo "   Ready for full wireless operations with sudo"
    else
        echo "   Run with --sudo for full functionality"
        echo "   Or configure passwordless sudo"
        echo "   Or setup Linux capabilities with ./wireless-security-mcp/setup-capabilities.sh"
    fi
}

# Parse arguments
SUDO_MODE=false
CHECK_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --sudo)
            SUDO_MODE=true
            shift
            ;;
        --normal)
            SUDO_MODE=false
            shift
            ;;
        --capabilities)
            ./wireless-security-mcp/setup-capabilities.sh
            exit $?
            ;;
        --check-permissions)
            check_permissions
            exit 0
            ;;
        --help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Change to script directory
cd "$(dirname "$0")"

# Set configuration
export CLAUDE_CONFIG_PATH="$HOME/coding/mcp/wifi-whiz-mcp/.claude-wifi-only.json"

if [ "$SUDO_MODE" = true ]; then
    echo "🔐 Starting Claude Code with sudo privileges..."
    echo "⚠️  WARNING: This grants root access to Claude Code!"
    echo ""
    
    # Check if already root
    if [ "$EUID" -eq 0 ]; then 
        echo "✅ Already running as root"
        exec claude
    else
        echo "🔄 Requesting sudo privileges..."
        exec sudo -E claude
    fi
else
    echo "👤 Starting Claude Code with normal privileges..."
    echo "ℹ️  Some wireless operations may require additional permissions"
    echo ""
    exec claude
fi