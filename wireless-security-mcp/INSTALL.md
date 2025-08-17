# Installation and Setup Guide

## Quick Start

1. **Install and Build**:
   ```bash
   cd wireless-security-mcp
   npm install
   npm run build
   ```

2. **Test Installation**:
   ```bash
   # Quick test - should show startup messages
   timeout 5s node dist/index.js || true
   ```

3. **Configure Claude Desktop**:
   Add to your MCP settings in Claude desktop:
   ```json
   {
     "mcpServers": {
       "wireless-security": {
         "command": "node",
         "args": ["/full/path/to/wireless-security-mcp/dist/index.js"],
         "env": {}
       }
     }
   }
   ```

## System Requirements

### Required Tools
Install the wireless security tools on your system:

```bash
# On Kali Linux (recommended)
sudo apt update
sudo apt install aircrack-ng kismet wifite

# On Ubuntu/Debian
sudo apt update
sudo apt install aircrack-ng kismet wifite

# Optional tools for enhanced functionality
sudo apt install reaver bully cowpatty pyrit hashcat
```

### MCP Tools Available

The server provides 18 MCP tools across 3 categories:

**Aircrack-ng Tools (6):**
- `aircrack_scan_networks` - Scan for wireless networks
- `aircrack_capture_handshake` - Capture WPA/WPA2 handshakes
- `aircrack_crack_password` - Crack handshakes with dictionary
- `aircrack_test_injection` - Test packet injection
- `aircrack_deauth_client` - Deauthenticate clients
- `aircrack_monitor_mode` - Enable/disable monitor mode

**Kismet Tools (6):**
- `kismet_start_server` - Start Kismet server
- `kismet_scan_networks` - Scan and enumerate networks
- `kismet_monitor_channel` - Monitor specific channel
- `kismet_detect_clients` - Detect connected clients
- `kismet_export_data` - Export data (JSON/PCAP/CSV)
- `kismet_gps_tracking` - GPS-based mapping

**Wifite Tools (6):**
- `wifite_auto_audit` - Automated network auditing
- `wifite_target_network` - Target specific network
- `wifite_wps_attack` - WPS PIN attacks
- `wifite_capture_pmkid` - PMKID capture
- `wifite_crack_handshake` - Automated cracking
- `wifite_session_management` - Save/resume sessions

## Security Notes

⚠️ **IMPORTANT**: This tool is for authorized security testing only. Always ensure you have explicit permission before testing any network.

The server includes:
- Security warnings on all operations
- Root privilege validation
- Interface name sanitization
- Command injection prevention
- Tool availability checking

## Troubleshooting

### Common Issues

1. **Build fails**: Ensure Node.js and npm are installed
2. **Tools not found**: Install missing packages with apt
3. **Permission errors**: Run operations with sudo when needed
4. **Monitor mode fails**: Kill conflicting processes first

### Getting Help

Check the examples in `examples/usage.md` for detailed usage scenarios and troubleshooting tips.

## Development

```bash
# Development mode with auto-reload
npm run dev

# Run linter
npm run lint

# Run tests (if implemented)
npm test
```

## Status

✅ **Complete and Ready for Production Use**
- All 18 tools implemented and tested
- Comprehensive error handling and validation
- Security controls and warnings
- Full documentation and examples