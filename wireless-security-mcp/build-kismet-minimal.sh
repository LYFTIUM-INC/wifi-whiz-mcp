#!/bin/bash

echo "🔧 Building Kismet with minimal dependencies"
echo "=========================================="

cd /tmp/kismet || exit 1

echo "📦 Configuring without optional features..."
./configure \
    --disable-librtlsdr \
    --disable-libbtbb \
    --disable-ubertooth \
    --disable-libusb \
    --disable-libmosquitto

if [ $? -eq 0 ]; then
    echo "✅ Configure successful!"
    
    echo "🔨 Building Kismet..."
    make -j$(nproc)
    
    if [ $? -eq 0 ]; then
        echo "✅ Build successful!"
        echo "📦 Installing Kismet..."
        sudo make suidinstall
        
        echo "👥 Setting up kismet group..."
        sudo groupadd -f kismet
        sudo usermod -aG kismet $USER
        
        echo "✅ Installation complete!"
        echo "📌 IMPORTANT: Log out and back in for group changes to take effect"
    else
        echo "❌ Build failed"
    fi
else
    echo "❌ Configure failed. Install the optional packages or try:"
    echo "sudo apt-get install -y librtlsdr-dev"
fi