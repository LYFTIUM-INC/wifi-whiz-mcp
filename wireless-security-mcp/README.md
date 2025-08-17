# Wireless Security MCP Server

A Model Context Protocol (MCP) server for wireless security testing that integrates aircrack-ng, kismet, and wifite tools.

## ⚠️ IMPORTANT SECURITY WARNING ⚠️

This tool is for **authorized security testing only**. Using these tools on networks you don't own or have explicit permission to test is **illegal**. Always ensure you have proper authorization before conducting any security tests.

## Features

### 🔧 Aircrack-ng Integration
- **Network Scanning**: Discover wireless networks with detailed information
- **Handshake Capture**: Capture WPA/WPA2 handshakes for analysis
- **Password Cracking**: Dictionary attacks against captured handshakes
- **Injection Testing**: Test packet injection capabilities
- **Deauthentication**: Client deauthentication (use responsibly)
- **Monitor Mode**: Enable/disable monitor mode on interfaces

### 📡 Kismet Integration
- **Server Management**: Start/stop Kismet server with REST API
- **Network Enumeration**: Comprehensive network scanning and detection
- **Channel Monitoring**: Monitor specific wireless channels
- **Client Detection**: Detect and track connected clients
- **Data Export**: Export captured data in JSON, PCAP, or CSV formats
- **GPS Tracking**: GPS-based network mapping capabilities

### 🎯 Wifite Integration
- **Automated Auditing**: Fully automated wireless network testing
- **Targeted Attacks**: Test specific networks with various attack modes
- **WPS Attacks**: WPS PIN and Pixie-Dust attacks
- **PMKID Capture**: Clientless PMKID capture for modern routers
- **Handshake Cracking**: Automated dictionary attacks
- **Session Management**: Save and resume testing sessions

## Prerequisites

### Required Tools
- aircrack-ng suite (aircrack-ng, airodump-ng, aireplay-ng, airmon-ng)
- kismet
- wifite (v2)

### Optional Tools (for enhanced functionality)
- reaver (WPS attacks)
- bully (alternative WPS tool)
- cowpatty (WPA-PSK cracking)
- pyrit (GPU-accelerated cracking)
- hashcat (advanced password cracking)

### System Requirements
- Linux operating system (Kali Linux recommended)
- Wireless adapter with monitor mode and injection support
- Root/sudo privileges

## Installation

1. Install the MCP server:
```bash
cd wireless-security-mcp
npm install
npm run build
```

2. Install required tools:
```bash
# On Kali Linux (recommended)
sudo apt update
sudo apt install aircrack-ng kismet wifite

# Optional tools
sudo apt install reaver bully cowpatty pyrit hashcat
```

3. **Configure Sudo Access** (Required for wireless operations):

**Option A: Passwordless Sudo (Recommended for testing environments)**
```bash
sudo visudo
# Add this line (replace 'username' with your actual username):
username ALL=(ALL) NOPASSWD: ALL
```

**Option B: Linux Capabilities (More Secure)**
```bash
cd wireless-security-mcp
chmod +x setup-capabilities.sh
sudo ./setup-capabilities.sh
# Log out and back in for group changes to take effect
```

**Option C: Restricted Sudoers (Specific Commands Only)**
```bash
sudo cp wireless-mcp-sudoers /etc/sudoers.d/
sudo chmod 440 /etc/sudoers.d/wireless-mcp-sudoers
```

4. Configure your Claude desktop app to use this server by adding to your MCP settings:
```json
{
  "mcpServers": {
    "wireless-security-mcp": {
      "command": "node",
      "args": ["/path/to/wireless-security-mcp/dist/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

5. **Start Claude Code**:
```bash
# If you configured passwordless sudo:
claude

# Or use the enhanced startup scripts:
./start-claude-enhanced.sh --check-permissions  # Check setup
./start-claude-enhanced.sh --normal            # Normal mode
./start-claude-enhanced.sh --sudo              # Sudo mode (if needed)
```

## Usage Examples

### Basic Network Scanning
```javascript
// Enable monitor mode
await aircrack_monitor_mode({
  interface: "wlan0",
  enable: true
});

// Scan for networks
const networks = await aircrack_scan_networks({
  interface: "wlan0mon",
  timeout: 30
});
```

### Capture WPA Handshake
```javascript
// Target specific network
await aircrack_capture_handshake({
  interface: "wlan0mon",
  bssid: "AA:BB:CC:DD:EE:FF",
  channel: 6,
  timeout: 300
});
```

### Automated Testing with Wifite
```javascript
// Automated audit of all networks
await wifite_auto_audit({
  interface: "wlan0",
  timeout: 600,
  minimumPower: -70
});

// Target specific network
await wifite_target_network({
  interface: "wlan0",
  bssid: "AA:BB:CC:DD:EE:FF",
  attackMode: "wpa"
});
```

### Kismet Server Operations
```javascript
// Start Kismet server
await kismet_start_server({
  interface: "wlan0",
  port: 2501
});

// Scan and export data
const networks = await kismet_scan_networks({
  timeout: 60
});

await kismet_export_data({
  outputFile: "/tmp/capture.json",
  format: "json"
});
```

## Security Considerations

1. **Legal Compliance**: Only test networks you own or have written permission to test
2. **Ethical Use**: Use these tools responsibly and ethically
3. **Target Validation**: The server includes warnings but cannot prevent misuse
4. **Sudo Requirements**: Most operations require root privileges
5. **Interface Validation**: Only standard wireless interfaces are allowed

## Troubleshooting

### Common Issues

1. **"Tool not installed" errors**
   - Ensure all required tools are installed
   - Check PATH environment variable
   - Run with sudo if needed

2. **"Invalid interface" errors**
   - Verify interface name with `iwconfig`
   - Ensure wireless adapter supports monitor mode
   - Check if interface is already in use

3. **"Operation requires root privileges"**
   - Run the MCP server with sudo
   - Configure sudoers for specific commands

4. **Monitor mode issues**
   - Kill conflicting processes: `sudo airmon-ng check kill`
   - Try manual mode: `sudo ip link set wlan0 down && sudo iw wlan0 set monitor control`

## Development

### Building from Source
```bash
npm install
npm run build
```

### Running in Development
```bash
npm run dev
```

### Testing
```bash
npm test
```

## License

MIT License - See LICENSE file for details

## Disclaimer

This software is provided for educational and authorized security testing purposes only. The authors and contributors are not responsible for any misuse or damage caused by this software. Always ensure you have explicit permission before testing any network.