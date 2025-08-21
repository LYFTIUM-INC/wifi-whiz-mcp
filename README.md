# WiFi Whiz MCP

Professional Model Context Protocol (MCP) server for wireless security testing and penetration testing workflows.

## Overview

WiFi Whiz MCP provides 18 production-ready wireless security tools through Claude's MCP interface, enabling seamless integration of wireless testing capabilities into AI-powered security workflows. Built for security professionals, penetration testers, and researchers.

## Features

- **18 Wireless Security Tools** across 3 major suites
- **Production-Ready Implementation** with comprehensive error handling
- **Automated Installation** for Ubuntu 24.04
- **Professional Documentation** with security best practices
- **MCP Integration** for Claude Code and Claude Desktop

## Quick Start

1. **Install Dependencies**
   ```bash
   chmod +x install-*.sh
   ./install-wireless-tools.sh
   ```

2. **Configure MCP Server**
   ```bash
   cd wireless-security-mcp
   npm install
   npm run build
   ```

3. **Add to Claude Configuration**
   ```json
   {
     "mcpServers": {
       "wireless-security-mcp": {
         "command": "node",
         "args": ["./wireless-security-mcp/dist/index.js"],
         "cwd": "/path/to/wifi-whiz-mcp"
       }
     }
   }
   ```

## Available Tools

### Aircrack-ng Suite (6 Tools)

| Tool Name | Description | Key Parameters |
|-----------|-------------|----------------|
| `aircrack_scan_networks` | Scan for wireless networks using airodump-ng | `interface`, `timeout` |
| `aircrack_capture_handshake` | Capture WPA/WPA2 handshakes for specific network | `interface`, `bssid`, `channel`, `timeout` |
| `aircrack_crack_password` | Crack captured handshakes using dictionary attack | `handshakeFile`, `wordlist`, `bssid` |
| `aircrack_test_injection` | Test packet injection capabilities | `interface` |
| `aircrack_deauth_client` | Deauthenticate clients from access point | `interface`, `bssid`, `clientMac`, `count` |
| `aircrack_monitor_mode` | Enable/disable monitor mode on interface | `interface`, `enable` |

### Kismet Suite (6 Tools)

| Tool Name | Description | Key Parameters |
|-----------|-------------|----------------|
| `kismet_start_server` | Start Kismet server for wireless monitoring | `interface`, `port`, `logDir` |
| `kismet_scan_networks` | Scan and enumerate wireless networks | `timeout`, `interface` |
| `kismet_monitor_channel` | Monitor specific wireless channel | `interface`, `channel` |
| `kismet_detect_clients` | Detect and list connected clients | `bssid`, `timeout` |
| `kismet_export_data` | Export captured data in various formats | `outputFile`, `format` |
| `kismet_gps_tracking` | Enable GPS-based network mapping | `enable`, `device` |

### Wifite Suite (6 Tools)

| Tool Name | Description | Key Parameters |
|-----------|-------------|----------------|
| `wifite_auto_audit` | Automated wireless network auditing | `interface`, `timeout`, `minimumPower` |
| `wifite_target_network` | Target specific network for testing | `interface`, `bssid`, `attackMode`, `timeout` |
| `wifite_wps_attack` | Perform WPS PIN attack | `interface`, `bssid`, `timeout`, `pixieDust` |
| `wifite_capture_pmkid` | Capture PMKID for clientless attack | `interface`, `bssid`, `timeout` |
| `wifite_crack_handshake` | Automated handshake cracking | `handshakeFile`, `wordlist`, `bssid` |
| `wifite_session_management` | Save, resume, or list Wifite sessions | `action`, `sessionName` |

## Tool Categories

- **🔍 Network Discovery**: `aircrack_scan_networks`, `kismet_scan_networks`, `kismet_monitor_channel`
- **📡 Traffic Capture**: `aircrack_capture_handshake`, `wifite_capture_pmkid`, `kismet_export_data`
- **🔓 Password Attacks**: `aircrack_crack_password`, `wifite_crack_handshake`, `wifite_wps_attack`
- **⚡ Active Attacks**: `aircrack_deauth_client`, `wifite_target_network`, `wifite_auto_audit`
- **⚙️ System Management**: `aircrack_monitor_mode`, `kismet_start_server`, `wifite_session_management`
- **👥 Client Analysis**: `kismet_detect_clients`, GPS tracking with `kismet_gps_tracking`

## System Requirements

- **Operating System**: Ubuntu 24.04 LTS (recommended)
- **Wireless Interface**: Monitor mode capable wireless adapter
- **Dependencies**: Node.js 18+, wireless-tools, aircrack-ng, kismet, wifite
- **Permissions**: Sudo access for wireless operations

## Security & Legal Notice

⚠️ **IMPORTANT**: These tools are designed for:
- **Authorized penetration testing**
- **Security research on owned networks**
- **Educational purposes**

**Legal compliance is the user's responsibility**. Ensure proper authorization before testing any wireless networks.

## Installation

### Automated Installation (Ubuntu 24.04)

```bash
# Install all wireless security tools
./install-wireless-tools.sh

# Install Kismet (if needed separately)
./install-kismet-ubuntu-24.04.sh

# Setup capabilities (alternative to sudo)
cd wireless-security-mcp
./setup-capabilities.sh
```

### Manual Installation

See detailed installation guides in `wireless-security-mcp/INSTALL.md`.

## Configuration

### Basic MCP Configuration

```json
{
  "mcpServers": {
    "wireless-security-mcp": {
      "command": "node",
      "args": ["./wireless-security-mcp/dist/index.js"],
      "cwd": "/path/to/wifi-whiz-mcp"
    }
  }
}
```

### Advanced Configuration

See `wireless-security-mcp/README.md` for detailed configuration options.

## Usage Examples

### Basic Network Scan
```
Use aircrack_scan_networks with interface "wlan0mon" for 60 seconds
```

### Capture Handshake
```
Use aircrack_capture_handshake on interface "wlan0mon" targeting BSSID "AA:BB:CC:DD:EE:FF" on channel 6
```

### Automated Security Audit
```
Use wifite_auto_audit on interface "wlan0" with 300 second timeout and minimum power -60
```

## Project Structure

```
wifi-whiz-mcp/
├── README.md                          # This file
├── WIRELESS_SECURITY_CAPABILITY_REPORT.md
├── CLAUDE.md                          # Project configuration
├── .mcp.json                          # MCP server configuration
├── install-*.sh                      # Installation scripts
└── wireless-security-mcp/            # MCP server implementation
    ├── src/                          # TypeScript source code
    ├── package.json                  # Node.js dependencies
    ├── README.md                     # Detailed technical docs
    └── setup-capabilities.sh         # Permission setup
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow existing code style and conventions
4. Add comprehensive tests for new tools
5. Update documentation
6. Submit a pull request

## License

This project is licensed under the MIT License - see the `wireless-security-mcp/LICENSE` file for details.

## Support

- **Documentation**: Check `wireless-security-mcp/README.md` for detailed technical information
- **Installation Issues**: See installation scripts and `INSTALL.md`
- **Security Questions**: Review capability report and security documentation

---

**Professional wireless security testing through MCP integration.**