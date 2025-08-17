#!/bin/bash

echo "🔧 Installing Kismet on Ubuntu 24.04 Noble (Fixed Version)..."
echo "============================================"

# Method 1: Install missing dependency first
echo "📦 Installing missing libwebsockets dependency..."
sudo apt update

# Install libwebsockets from Ubuntu repository
sudo apt install -y libwebsockets-dev

# Also install other potentially missing dependencies
sudo apt install -y \
    librtlsdr-dev \
    libubertooth-dev \
    libbtbb-dev \
    libmosquitto-dev

# Method 2: Try snap installation (easier)
echo "🔄 Attempting Snap installation first..."
if command -v snap &> /dev/null; then
    sudo snap install kismet
    if [ $? -eq 0 ]; then
        echo "✅ Kismet installed via Snap!"
        echo "🔗 Creating symlink for system-wide access..."
        sudo ln -sf /snap/bin/kismet /usr/local/bin/kismet
        exit 0
    fi
fi

# Method 3: Build from source with all dependencies
echo "📦 Installing ALL build dependencies..."
sudo apt install -y \
    build-essential git libmicrohttpd-dev pkg-config zlib1g-dev \
    libnl-3-dev libnl-genl-3-dev libcap-dev libpcap-dev libnm-dev libdw-dev \
    libsqlite3-dev libprotobuf-dev libprotobuf-c-dev protobuf-compiler \
    protobuf-c-compiler libsensors4-dev python3 python3-setuptools \
    python3-protobuf python3-requests python3-usb python3-paho-mqtt \
    libusb-1.0-0-dev libwebsockets-dev librtlsdr-dev

# Check if libwebsockets is sufficient version
echo "🔍 Checking libwebsockets version..."
pkg-config --modversion libwebsockets

# Clone Kismet
echo "📥 Cloning Kismet repository..."
cd /tmp
rm -rf kismet  # Clean any previous attempts
git clone https://www.kismetwireless.net/git/kismet.git
cd kismet

# Configure with explicit paths if needed
echo "🔨 Configuring Kismet..."
./configure --disable-libwebsockets || {
    echo "⚠️ Configure failed, trying without websockets support..."
    ./configure --disable-libwebsockets --disable-python-tools
}

# Build with limited parallelism
echo "🔨 Building Kismet (this will take some time)..."
make -j2

# Install
echo "📋 Installing Kismet..."
sudo make suidinstall || sudo make install

# Create kismet group manually if needed
echo "👤 Setting up kismet group..."
sudo groupadd -f kismet
sudo usermod -aG kismet $USER

echo "✅ Installation attempt complete!"
echo "🔍 Checking installation..."
which kismet && echo "✅ Kismet binary found at: $(which kismet)" || echo "❌ Kismet binary not found"

echo ""
echo "📌 IMPORTANT: You must log out and back in for group changes to take effect!"
echo ""
echo "Alternative: Use 'newgrp kismet' to activate group in current session"