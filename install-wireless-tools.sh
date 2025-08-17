#!/bin/bash

echo "🛡️ Wireless Security Tools Installation Script"
echo "============================================="
echo ""
echo "This script will install Kismet and Wifite on Ubuntu 24.04"
echo ""
echo "⚠️  IMPORTANT: This script requires sudo privileges"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Update package lists
echo -e "${YELLOW}Updating package lists...${NC}"
sudo apt update

# Install Kismet
echo -e "\n${YELLOW}Installing Kismet...${NC}"
if command_exists kismet; then
    echo -e "${GREEN}Kismet is already installed${NC}"
else
    sudo apt install kismet -y
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Kismet installed successfully${NC}"
        # Add user to kismet group
        echo -e "${YELLOW}Adding $USER to kismet group...${NC}"
        sudo usermod -aG kismet $USER
        echo -e "${YELLOW}Note: You may need to log out and back in for group changes to take effect${NC}"
    else
        echo -e "${RED}✗ Failed to install Kismet${NC}"
    fi
fi

# Install Wifite
echo -e "\n${YELLOW}Installing Wifite...${NC}"
if command_exists wifite; then
    echo -e "${GREEN}Wifite is already installed${NC}"
else
    sudo apt install wifite -y
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Wifite installed successfully${NC}"
    else
        echo -e "${RED}✗ Failed to install Wifite${NC}"
    fi
fi

# Install additional tools for Wifite
echo -e "\n${YELLOW}Installing additional tools for enhanced Wifite functionality...${NC}"
TOOLS="reaver pixiewps bully hashcat macchanger"
for tool in $TOOLS; do
    if command_exists $tool; then
        echo -e "${GREEN}✓ $tool is already installed${NC}"
    else
        echo -e "Installing $tool..."
        sudo apt install $tool -y >/dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ $tool installed${NC}"
        else
            echo -e "${YELLOW}⚠ $tool installation failed (optional)${NC}"
        fi
    fi
done

# Verify installations
echo -e "\n${YELLOW}Verifying installations...${NC}"
echo "=============================="

if command_exists kismet; then
    KISMET_VERSION=$(kismet --version 2>&1 | head -1)
    echo -e "${GREEN}✓ Kismet: $KISMET_VERSION${NC}"
else
    echo -e "${RED}✗ Kismet: Not installed${NC}"
fi

if command_exists wifite; then
    WIFITE_VERSION=$(wifite --version 2>&1 | head -1)
    echo -e "${GREEN}✓ Wifite: Installed${NC}"
else
    echo -e "${RED}✗ Wifite: Not installed${NC}"
fi

echo -e "\n${GREEN}Installation complete!${NC}"
echo ""
echo "⚠️  Important Notes:"
echo "1. You may need to log out and back in for group changes to take effect"
echo "2. Always ensure you have proper authorization before using these tools"
echo "3. Run 'sudo kismet' to start Kismet (or just 'kismet' if in kismet group)"
echo "4. Run 'sudo wifite' to start Wifite"
echo ""
echo "To test the wireless-security-mcp server again, run:"
echo "cd /home/dell/coding/mcp/wifi-whiz-mcp/wireless-security-mcp && node dist/index.js"