#!/bin/bash

echo "🔧 Installing Kismet on Ubuntu 24.04 Noble..."
echo "============================================"

# Method 1: Try building from source (most reliable for Noble)
echo "📦 Installing build dependencies..."
sudo apt update
sudo apt install -y build-essential git libmicrohttpd-dev pkg-config zlib1g-dev \
    libnl-3-dev libnl-genl-3-dev libcap-dev libpcap-dev libnm-dev libdw-dev \
    libsqlite3-dev libprotobuf-dev libprotobuf-c-dev protobuf-compiler \
    protobuf-c-compiler libsensors4-dev python3 python3-setuptools \
    python3-protobuf python3-requests python3-usb python3-paho-mqtt \
    libusb-1.0-0-dev libwebsockets-dev

# Clone Kismet
echo "📥 Cloning Kismet repository..."
cd /tmp
git clone https://www.kismetwireless.net/git/kismet.git
cd kismet

# Configure and build
echo "🔨 Building Kismet (this will take some time)..."
./configure
make -j2  # Using -j2 for safety on systems with limited RAM

# Install
echo "📋 Installing Kismet..."
sudo make suidinstall

# Add user to kismet group
echo "👤 Adding user to kismet group..."
sudo usermod -aG kismet $USER

echo "✅ Kismet installation complete!"
echo "🔄 Please log out and back in for group changes to take effect."
which kismet && echo "✅ Kismet binary found at: $(which kismet)"