#!/bin/bash

echo "🔧 Installing Kismet on Ubuntu 24.04 Noble - Complete Solution"
echo "============================================================"

# Detect current state
echo "📊 Checking current system state..."
echo "Ubuntu Version: $(lsb_release -d | cut -f2)"
echo "Architecture: $(uname -m)"
echo "libwebsockets installed: $(dpkg -l | grep libwebsockets19t64 | awk '{print $3}')"

# Option 1: Install missing development package
echo ""
echo "📦 Option 1: Installing missing libwebsockets-dev package..."
sudo apt update
sudo apt install -y libwebsockets-dev

# Check if it worked
if pkg-config --modversion libwebsockets 2>/dev/null; then
    echo "✅ libwebsockets-dev installed successfully!"
    echo "Version: $(pkg-config --modversion libwebsockets)"
else
    echo "❌ pkg-config still can't find libwebsockets"
fi

# Option 2: Try official Kismet packages for Ubuntu 24.04
echo ""
echo "📦 Option 2: Trying official Kismet repository..."
# Remove any existing kismet repo config
sudo rm -f /etc/apt/sources.list.d/kismet.list
sudo rm -f /usr/share/keyrings/kismet-archive-keyring.gpg

# Add Kismet official repo with proper method
wget -q -O - https://www.kismetwireless.net/repos/kismet-release.gpg.key | \
    sudo gpg --dearmor -o /usr/share/keyrings/kismet-archive-keyring.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/kismet-archive-keyring.gpg] https://www.kismetwireless.net/repos/apt/release/noble noble main" | \
    sudo tee /etc/apt/sources.list.d/kismet.list > /dev/null

sudo apt update

# Check if Kismet is available
if apt-cache search kismet | grep -q "^kismet "; then
    echo "✅ Kismet found in repository!"
    sudo apt install -y kismet
    if [ $? -eq 0 ]; then
        echo "✅ Kismet installed successfully from repository!"
        which kismet && echo "Location: $(which kismet)"
        exit 0
    fi
else
    echo "❌ Kismet not found in repository"
fi

# Option 3: Build from source with proper configuration
echo ""
echo "📦 Option 3: Building from source with all dependencies..."

# Install ALL dependencies including optional ones
sudo apt install -y \
    build-essential git libwebsockets-dev pkg-config zlib1g-dev \
    libnl-3-dev libnl-genl-3-dev libcap-dev libpcap-dev libnm-dev libdw-dev \
    libsqlite3-dev libprotobuf-dev libprotobuf-c-dev protobuf-compiler \
    protobuf-c-compiler libsensors4-dev python3 python3-setuptools \
    python3-protobuf python3-requests python3-numpy python3-serial \
    python3-usb python3-dev libusb-1.0-0-dev librtlsdr-dev \
    libubertooth-dev libbtbb-dev libmosquitto-dev

# Clean previous attempts
echo "🧹 Cleaning previous build attempts..."
cd /tmp
rm -rf kismet

# Clone latest Kismet
echo "📥 Cloning Kismet repository..."
git clone https://www.kismetwireless.net/git/kismet.git
cd kismet

# Configure with explicit options
echo "🔨 Configuring Kismet..."
# First try with full features
if ./configure; then
    echo "✅ Configure successful with all features!"
else
    echo "⚠️ Configure failed, trying without optional features..."
    # Try without websockets if needed
    if ./configure --disable-libwebsockets; then
        echo "✅ Configure successful without websockets!"
        echo "ℹ️ Note: Remote capture will use legacy TCP mode"
    else
        echo "❌ Configure failed completely"
        exit 1
    fi
fi

# Build with reasonable parallelism
echo "🔨 Building Kismet (this will take 5-10 minutes)..."
make -j$(nproc)

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Install
    echo "📋 Installing Kismet..."
    sudo make suidinstall
    
    # Create group and add user
    echo "👤 Setting up kismet group..."
    sudo groupadd -f kismet
    sudo usermod -aG kismet $USER
    
    echo "✅ Installation complete!"
    which kismet && echo "Kismet installed at: $(which kismet)"
    echo ""
    echo "📌 IMPORTANT: Log out and back in for group changes to take effect!"
else
    echo "❌ Build failed"
fi

# Option 4: Alternative installation methods
echo ""
echo "📦 Alternative Options if above methods fail:"
echo ""
echo "4a. Install via Snap:"
echo "    sudo snap install kismet"
echo ""
echo "4b. Use Docker container:"
echo "    docker pull kismetwireless/kismet"
echo "    docker run -it --rm --privileged --net=host kismetwireless/kismet"
echo ""
echo "4c. Download pre-built AppImage:"
echo "    wget https://www.kismetwireless.net/kismet-appimage-latest"
echo "    chmod +x kismet-appimage-latest"
echo "    sudo mv kismet-appimage-latest /usr/local/bin/kismet"