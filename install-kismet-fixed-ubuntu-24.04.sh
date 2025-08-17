#!/bin/bash

echo "🔧 Installing Kismet on Ubuntu 24.04 Noble - FIXED VERSION"
echo "=========================================================="

# Install the CORRECT development packages for Ubuntu 24.04
echo "📦 Installing ALL required development packages for Ubuntu 24.04..."

sudo apt update

# Install the specific packages that Ubuntu 24.04 uses
sudo apt install -y \
    build-essential \
    git \
    pkg-config \
    libpcap0.8-dev \
    libwebsockets-dev \
    zlib1g-dev \
    libnl-3-dev \
    libnl-genl-3-dev \
    libcap-dev \
    libnm-dev \
    libdw-dev \
    libsqlite3-dev \
    libprotobuf-dev \
    libprotobuf-c-dev \
    protobuf-compiler \
    protobuf-c-compiler \
    libsensors4-dev \
    libusb-1.0-0-dev \
    python3 \
    python3-setuptools \
    python3-protobuf \
    python3-requests \
    python3-numpy \
    python3-serial \
    python3-usb \
    python3-dev

echo "✅ Core dependencies installed!"

# Verify critical packages
echo ""
echo "🔍 Verifying critical packages..."
pkg-config --exists libpcap && echo "✅ libpcap: $(pkg-config --modversion libpcap)" || echo "❌ libpcap not found"
pkg-config --exists libwebsockets && echo "✅ libwebsockets: $(pkg-config --modversion libwebsockets)" || echo "❌ libwebsockets not found"

# Clean and rebuild
echo ""
echo "🧹 Cleaning previous build attempts..."
cd /tmp
rm -rf kismet

echo "📥 Cloning fresh Kismet repository..."
git clone https://www.kismetwireless.net/git/kismet.git
cd kismet

echo "🔨 Configuring Kismet with verbose output..."
./configure --enable-debug-configure 2>&1 | tee configure.log

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo "✅ Configure successful!"
    
    echo "🔨 Building Kismet (this may take 5-15 minutes)..."
    make -j2  # Use j2 for stability
    
    if [ $? -eq 0 ]; then
        echo "✅ Build successful!"
        
        echo "📋 Installing Kismet..."
        sudo make suidinstall
        
        echo "👤 Setting up kismet group and permissions..."
        sudo groupadd -f kismet
        sudo usermod -aG kismet $USER
        
        echo "✅ Kismet installation complete!"
        which kismet && echo "Kismet location: $(which kismet)"
        
        echo ""
        echo "📌 CRITICAL: You MUST log out and back in for group permissions to work!"
        echo "📌 After re-login, run: groups | grep kismet"
        echo ""
        
    else
        echo "❌ Build failed. Check the error messages above."
        echo "📄 Configure log saved to: /tmp/kismet/configure.log"
    fi
else
    echo "❌ Configure failed!"
    echo "📄 Configure log:"
    tail -20 configure.log
    echo ""
    echo "🔧 Trying alternative: Install via Snap..."
    
    if command -v snap >/dev/null 2>&1; then
        sudo snap install kismet
        if [ $? -eq 0 ]; then
            echo "✅ Kismet installed via Snap!"
            sudo ln -sf /snap/bin/kismet /usr/local/bin/kismet
            echo "✅ Symlink created: /usr/local/bin/kismet -> /snap/bin/kismet"
        else
            echo "❌ Snap installation also failed"
        fi
    else
        echo "❌ Snap not available"
    fi
fi

echo ""
echo "🎯 Summary of Installation Options:"
echo "================================="
echo "1. ✅ Source build (attempted above)"
echo "2. 📦 Snap: sudo snap install kismet"
echo "3. 🐳 Docker: docker run -it --rm --privileged --net=host kismetwireless/kismet"
echo "4. 📱 AppImage: wget https://www.kismetwireless.net/code/kismet-appimage && chmod +x kismet-appimage"
echo ""
echo "🔍 For debugging, check: /tmp/kismet/configure.log"