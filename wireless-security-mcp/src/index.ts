#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { AircrackNGTools } from './tools/aircrack-ng.js';
import { KismetTools } from './tools/kismet.js';
import { WifiteTools } from './tools/wifite.js';
import { addSecurityWarning, checkSystemRequirements, createInstallationGuide, createPrivilegeGuide } from './utils/security.js';

// Tool instances
const aircrackNG = new AircrackNGTools();
const kismet = new KismetTools();
const wifite = new WifiteTools();

// Create MCP server
const server = new Server(
  {
    name: 'wireless-security-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
const TOOLS = [
  // Aircrack-ng tools
  {
    name: 'aircrack_scan_networks',
    description: 'Scan for wireless networks using airodump-ng',
    inputSchema: {
      type: 'object',
      properties: {
        interface: { type: 'string', description: 'Wireless interface (e.g., wlan0mon)' },
        timeout: { type: 'number', description: 'Scan timeout in seconds', default: 30 }
      },
      required: ['interface']
    }
  },
  {
    name: 'aircrack_capture_handshake',
    description: 'Capture WPA/WPA2 handshakes for a specific network',
    inputSchema: {
      type: 'object',
      properties: {
        interface: { type: 'string', description: 'Wireless interface in monitor mode' },
        bssid: { type: 'string', description: 'Target BSSID (MAC address)' },
        channel: { type: 'number', description: 'Wireless channel' },
        timeout: { type: 'number', description: 'Capture timeout in seconds', default: 300 }
      },
      required: ['interface', 'bssid', 'channel']
    }
  },
  {
    name: 'aircrack_crack_password',
    description: 'Crack captured handshakes using dictionary attack',
    inputSchema: {
      type: 'object',
      properties: {
        handshakeFile: { type: 'string', description: 'Path to handshake capture file' },
        wordlist: { type: 'string', description: 'Path to wordlist file' },
        bssid: { type: 'string', description: 'Target BSSID (optional)' }
      },
      required: ['handshakeFile', 'wordlist']
    }
  },
  {
    name: 'aircrack_test_injection',
    description: 'Test packet injection capabilities',
    inputSchema: {
      type: 'object',
      properties: {
        interface: { type: 'string', description: 'Wireless interface in monitor mode' }
      },
      required: ['interface']
    }
  },
  {
    name: 'aircrack_deauth_client',
    description: 'Deauthenticate clients from access point (use with caution)',
    inputSchema: {
      type: 'object',
      properties: {
        interface: { type: 'string', description: 'Wireless interface in monitor mode' },
        bssid: { type: 'string', description: 'Access point BSSID' },
        clientMac: { type: 'string', description: 'Client MAC address (optional, all if not specified)' },
        count: { type: 'number', description: 'Number of deauth packets', default: 5 }
      },
      required: ['interface', 'bssid']
    }
  },
  {
    name: 'aircrack_monitor_mode',
    description: 'Enable or disable monitor mode on interface',
    inputSchema: {
      type: 'object',
      properties: {
        interface: { type: 'string', description: 'Wireless interface' },
        enable: { type: 'boolean', description: 'Enable (true) or disable (false) monitor mode' }
      },
      required: ['interface', 'enable']
    }
  },

  // Kismet tools
  {
    name: 'kismet_start_server',
    description: 'Start Kismet server for wireless monitoring',
    inputSchema: {
      type: 'object',
      properties: {
        interface: { type: 'string', description: 'Wireless interface' },
        port: { type: 'number', description: 'Web UI port', default: 2501 },
        logDir: { type: 'string', description: 'Log directory', default: '/tmp' }
      },
      required: ['interface']
    }
  },
  {
    name: 'kismet_scan_networks',
    description: 'Scan and enumerate wireless networks',
    inputSchema: {
      type: 'object',
      properties: {
        timeout: { type: 'number', description: 'Scan timeout in seconds', default: 60 },
        interface: { type: 'string', description: 'Interface to scan (optional)' }
      }
    }
  },
  {
    name: 'kismet_monitor_channel',
    description: 'Monitor specific wireless channel',
    inputSchema: {
      type: 'object',
      properties: {
        interface: { type: 'string', description: 'Wireless interface' },
        channel: { type: 'number', description: 'Channel number to monitor' }
      },
      required: ['interface', 'channel']
    }
  },
  {
    name: 'kismet_detect_clients',
    description: 'Detect and list connected clients',
    inputSchema: {
      type: 'object',
      properties: {
        bssid: { type: 'string', description: 'Filter by access point BSSID (optional)' },
        timeout: { type: 'number', description: 'Detection timeout', default: 30 }
      }
    }
  },
  {
    name: 'kismet_export_data',
    description: 'Export captured data in various formats',
    inputSchema: {
      type: 'object',
      properties: {
        outputFile: { type: 'string', description: 'Output file path' },
        format: { type: 'string', enum: ['json', 'pcap', 'csv'], description: 'Export format', default: 'json' }
      },
      required: ['outputFile']
    }
  },
  {
    name: 'kismet_gps_tracking',
    description: 'Enable GPS-based network mapping',
    inputSchema: {
      type: 'object',
      properties: {
        enable: { type: 'boolean', description: 'Enable or disable GPS tracking' },
        device: { type: 'string', description: 'GPS device path', default: '/dev/ttyUSB0' }
      },
      required: ['enable']
    }
  },

  // Wifite tools
  {
    name: 'wifite_auto_audit',
    description: 'Automated wireless network auditing',
    inputSchema: {
      type: 'object',
      properties: {
        interface: { type: 'string', description: 'Wireless interface' },
        timeout: { type: 'number', description: 'Audit timeout in seconds', default: 600 },
        minimumPower: { type: 'number', description: 'Minimum signal power', default: -70 }
      },
      required: ['interface']
    }
  },
  {
    name: 'wifite_target_network',
    description: 'Target specific network for testing',
    inputSchema: {
      type: 'object',
      properties: {
        interface: { type: 'string', description: 'Wireless interface' },
        bssid: { type: 'string', description: 'Target BSSID' },
        attackMode: { type: 'string', enum: ['wpa', 'wps', 'wep', 'all'], description: 'Attack mode', default: 'all' },
        timeout: { type: 'number', description: 'Attack timeout', default: 300 }
      },
      required: ['interface', 'bssid']
    }
  },
  {
    name: 'wifite_wps_attack',
    description: 'Perform WPS PIN attack',
    inputSchema: {
      type: 'object',
      properties: {
        interface: { type: 'string', description: 'Wireless interface' },
        bssid: { type: 'string', description: 'Target BSSID' },
        timeout: { type: 'number', description: 'WPS timeout', default: 600 },
        pixieDust: { type: 'boolean', description: 'Use pixie-dust attack', default: true }
      },
      required: ['interface', 'bssid']
    }
  },
  {
    name: 'wifite_capture_pmkid',
    description: 'Capture PMKID for clientless attack',
    inputSchema: {
      type: 'object',
      properties: {
        interface: { type: 'string', description: 'Wireless interface' },
        bssid: { type: 'string', description: 'Target BSSID' },
        timeout: { type: 'number', description: 'Capture timeout', default: 120 }
      },
      required: ['interface', 'bssid']
    }
  },
  {
    name: 'wifite_crack_handshake',
    description: 'Automated handshake cracking',
    inputSchema: {
      type: 'object',
      properties: {
        handshakeFile: { type: 'string', description: 'Handshake file path' },
        wordlist: { type: 'string', description: 'Wordlist path' },
        bssid: { type: 'string', description: 'Target BSSID (optional)' }
      },
      required: ['handshakeFile', 'wordlist']
    }
  },
  {
    name: 'wifite_session_management',
    description: 'Save, resume, or list Wifite sessions',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['save', 'resume', 'list'], description: 'Session action' },
        sessionName: { type: 'string', description: 'Session name (for save/resume)' }
      },
      required: ['action']
    }
  }
];

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // Add comprehensive error handling
  try {
    // Check system requirements for all operations
    const systemCheck = await checkSystemRequirements();
    
    if (!systemCheck.hasTools) {
      const installGuide = createInstallationGuide(systemCheck.missingTools);
      return {
        content: [{
          type: 'text',
          text: `System dependencies missing.${installGuide}${addSecurityWarning('wireless security tools')}`
        }]
      };
    }
    
    // For operations requiring sudo, check privileges
    const sudoRequiredOps = [
      'aircrack_scan_networks', 'aircrack_capture_handshake', 'aircrack_test_injection',
      'aircrack_deauth_client', 'aircrack_monitor_mode', 'kismet_start_server',
      'wifite_auto_audit', 'wifite_target_network', 'wifite_wps_attack', 'wifite_capture_pmkid'
    ];
    
    if (sudoRequiredOps.includes(name) && !systemCheck.hasSudo) {
      const privilegeGuide = createPrivilegeGuide();
      return {
        content: [{
          type: 'text',
          text: `Insufficient privileges for operation.${privilegeGuide}${addSecurityWarning('wireless security tools')}`
        }]
      };
    }

    switch (name) {
      // Aircrack-ng tools
      case 'aircrack_scan_networks':
        await aircrackNG.checkDependencies();
        const scanResult = await aircrackNG.scanNetworks(args);
        return { content: [{ type: 'text', text: JSON.stringify(scanResult, null, 2) }] };

      case 'aircrack_capture_handshake':
        await aircrackNG.checkDependencies();
        const captureResult = await aircrackNG.captureHandshake(args);
        return { content: [{ type: 'text', text: captureResult.output }] };

      case 'aircrack_crack_password':
        await aircrackNG.checkDependencies();
        const crackResult = await aircrackNG.crackPassword(args);
        return { content: [{ type: 'text', text: crackResult.output }] };

      case 'aircrack_test_injection':
        await aircrackNG.checkDependencies();
        const injectionResult = await aircrackNG.testInjection(args);
        return { content: [{ type: 'text', text: injectionResult.output }] };

      case 'aircrack_deauth_client':
        await aircrackNG.checkDependencies();
        const deauthResult = await aircrackNG.deauthClient(args);
        return { content: [{ type: 'text', text: deauthResult.output }] };

      case 'aircrack_monitor_mode':
        await aircrackNG.checkDependencies();
        const monitorResult = await aircrackNG.monitorMode(args);
        return { content: [{ type: 'text', text: monitorResult.output }] };

      // Kismet tools
      case 'kismet_start_server':
        await kismet.checkDependencies();
        const serverResult = await kismet.startServer(args);
        return { content: [{ type: 'text', text: serverResult.output }] };

      case 'kismet_scan_networks':
        await kismet.checkDependencies();
        const kismetScanResult = await kismet.scanNetworks(args);
        return { content: [{ type: 'text', text: JSON.stringify(kismetScanResult, null, 2) }] };

      case 'kismet_monitor_channel':
        await kismet.checkDependencies();
        const channelResult = await kismet.monitorChannel(args);
        return { content: [{ type: 'text', text: channelResult.output }] };

      case 'kismet_detect_clients':
        await kismet.checkDependencies();
        const clientsResult = await kismet.detectClients(args);
        return { content: [{ type: 'text', text: JSON.stringify(clientsResult, null, 2) }] };

      case 'kismet_export_data':
        await kismet.checkDependencies();
        const exportResult = await kismet.exportData(args);
        return { content: [{ type: 'text', text: exportResult.output }] };

      case 'kismet_gps_tracking':
        await kismet.checkDependencies();
        const gpsResult = await kismet.gpsTracking(args);
        return { content: [{ type: 'text', text: gpsResult.output }] };

      // Wifite tools
      case 'wifite_auto_audit':
        await wifite.checkDependencies();
        const auditResult = await wifite.autoAudit(args);
        return { content: [{ type: 'text', text: auditResult.output }] };

      case 'wifite_target_network':
        await wifite.checkDependencies();
        const targetResult = await wifite.targetNetwork(args);
        return { content: [{ type: 'text', text: targetResult.output }] };

      case 'wifite_wps_attack':
        await wifite.checkDependencies();
        const wpsResult = await wifite.wpsAttack(args);
        return { content: [{ type: 'text', text: wpsResult.output }] };

      case 'wifite_capture_pmkid':
        await wifite.checkDependencies();
        const pmkidResult = await wifite.capturePMKID(args);
        return { content: [{ type: 'text', text: pmkidResult.output }] };

      case 'wifite_crack_handshake':
        await wifite.checkDependencies();
        const wifiteCrackResult = await wifite.crackHandshake(args);
        return { content: [{ type: 'text', text: wifiteCrackResult.output }] };

      case 'wifite_session_management':
        await wifite.checkDependencies();
        const sessionResult = await wifite.sessionManagement(args);
        return { content: [{ type: 'text', text: sessionResult.output }] };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Enhanced error categorization and responses
    let enhancedMessage = `Error: ${errorMessage}`;
    
    if (errorMessage.includes('not installed') || errorMessage.includes('command not found')) {
      const systemCheck = await checkSystemRequirements();
      const installGuide = createInstallationGuide(systemCheck.missingTools);
      enhancedMessage += installGuide;
    } else if (errorMessage.includes('privileges') || errorMessage.includes('sudo') || errorMessage.includes('permission')) {
      const privilegeGuide = createPrivilegeGuide();
      enhancedMessage += privilegeGuide;
    } else if (errorMessage.includes('interface') || errorMessage.includes('wlan') || errorMessage.includes('mon')) {
      enhancedMessage += `\n\n🔧 INTERFACE TROUBLESHOOTING:\n\n1. Check available interfaces: ip link show\n2. Ensure wireless adapter supports monitor mode\n3. Try: sudo airmon-ng start wlan0\n4. Check for conflicting processes: sudo airmon-ng check kill`;
    }
    
    return {
      content: [{
        type: 'text',
        text: `${enhancedMessage}\n\n${addSecurityWarning('wireless security tools')}`
      }]
    };
  }
});

// Main function
async function main() {
  // Display startup message
  console.error('🛡️  Wireless Security MCP Server v1.1.0');
  console.error('==========================================');
  console.error('Enhanced with improved error handling and dependency management');
  console.error('Tools: aircrack-ng, kismet, wifite');
  console.error('');
  console.error(addSecurityWarning('all wireless security tools'));
  console.error('');
  
  // Comprehensive system check
  console.error('🔍 Performing system requirements check...');
  const systemCheck = await checkSystemRequirements();
  
  console.error('📊 System Status:');
  console.error(`   Tools Available: ${systemCheck.hasTools ? '✅' : '❌'}`);
  console.error(`   Sudo Access: ${systemCheck.hasSudo ? '✅' : '❌'}`);
  
  if (systemCheck.missingTools.length > 0) {
    console.error(`   Missing Tools: ${systemCheck.missingTools.join(', ')}`);
    console.error(createInstallationGuide(systemCheck.missingTools));
  }
  
  if (!systemCheck.hasSudo) {
    console.error(createPrivilegeGuide());
  }
  
  console.error('💡 Recommendations:');
  systemCheck.recommendations.forEach(rec => {
    console.error(`   • ${rec}`);
  });
  console.error('');

  // Start server regardless of system status (graceful degradation)
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 Server started successfully');
  
  if (!systemCheck.hasTools || !systemCheck.hasSudo) {
    console.error('⚠️  Server running in degraded mode - some tools may not function');
  } else {
    console.error('✅ Server ready for wireless security operations');
  }
}

// Run the server
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});