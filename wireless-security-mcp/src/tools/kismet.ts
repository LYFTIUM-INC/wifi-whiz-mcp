import { z } from 'zod';
import { NetworkInfo, ProcessResult } from '../types.js';
import { executeCommand, executeShellCommand, killProcess, isProcessRunning } from '../utils/process.js';
import { validateInterface, validateExportFormat } from '../utils/validation.js';
import { requireSudo, isValidInterface, checkToolAvailability, addSecurityWarning, createInstallationGuide, createPrivilegeGuide } from '../utils/security.js';

// Tool schemas
const StartServerSchema = z.object({
  interface: z.string(),
  port: z.number().optional().default(2501),
  logDir: z.string().optional().default('/tmp')
});

const ScanNetworksSchema = z.object({
  timeout: z.number().optional().default(60),
  interface: z.string().optional()
});

const MonitorChannelSchema = z.object({
  interface: z.string(),
  channel: z.number()
});

const DetectClientsSchema = z.object({
  bssid: z.string().optional(),
  timeout: z.number().optional().default(30)
});

const ExportDataSchema = z.object({
  outputFile: z.string(),
  format: z.enum(['json', 'pcap', 'csv']).default('json')
});

const GPSTrackingSchema = z.object({
  enable: z.boolean(),
  device: z.string().optional().default('/dev/ttyUSB0')
});

export class KismetTools {

  async checkDependencies(): Promise<void> {
    const available = await checkToolAvailability('kismet');
    if (!available) {
      const installGuide = createInstallationGuide(['kismet']);
      throw new Error(`Kismet is not installed.${installGuide}`);
    }
  }

  async startServer(args: unknown): Promise<ProcessResult> {
    const params = StartServerSchema.parse(args);
    
    try {
      await requireSudo();
    } catch (error) {
      const privilegeGuide = createPrivilegeGuide();
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`${errorMessage}${privilegeGuide}`);
    }
    validateInterface(params.interface);
    if (!isValidInterface(params.interface)) {
      throw new Error(`Invalid interface: ${params.interface}`);
    }

    console.warn(addSecurityWarning('kismet server'));

    // Check if server is already running
    if (await isProcessRunning('kismet')) {
      return {
        success: false,
        output: 'Kismet server is already running',
        exitCode: 1
      };
    }

    // Create Kismet config
    const configFile = `/tmp/kismet-${Date.now()}.conf`;
    const config = `
source=${params.interface}:type=linuxwifi
httpd_port=${params.port}
log_prefix=${params.logDir}/kismet
log_types=kismet,pcapng
`;

    await executeShellCommand(`echo '${config}' > ${configFile}`);

    // Start Kismet server
    const kismetArgs = [
      '-c', params.interface,
      '--override', `httpd_port=${params.port}`,
      '--override', `log_prefix=${params.logDir}/kismet`,
      '-t', // Disable timestamps in console
      '--no-ncurses' // Run in non-interactive mode
    ];

    // Start in background
    const result = await executeShellCommand(
      `kismet ${kismetArgs.join(' ')} > ${params.logDir}/kismet.log 2>&1 &`
    );

    if (result.success) {
      return {
        success: true,
        output: `Kismet server started on port ${params.port}\nWeb UI available at http://localhost:${params.port}`,
        exitCode: 0
      };
    }

    return result;
  }

  async scanNetworks(args: unknown): Promise<NetworkInfo[]> {
    ScanNetworksSchema.parse(args);
    
    // Use Kismet REST API to get networks
    const networks: NetworkInfo[] = [];
    
    try {
      // Wait for server to be ready
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Query Kismet API for devices
      const apiResult = await executeShellCommand(
        `curl -s http://localhost:2501/devices/views/all/devices.json`
      );

      if (apiResult.success && apiResult.output) {
        try {
          const devices = JSON.parse(apiResult.output);
          
          for (const device of devices) {
            if (device['kismet.device.base.type'] === 'Wi-Fi AP') {
              networks.push({
                bssid: device['kismet.device.base.macaddr'] || '',
                ssid: device['kismet.device.base.name'] || '<hidden>',
                channel: device['kismet.device.base.channel'] || 0,
                power: device['kismet.device.base.signal']?.['kismet.common.signal.last_signal'] || 0,
                encryption: device['kismet.device.base.crypt'] || 'Unknown'
              });
            }
          }
        } catch (e) {
          console.error('Failed to parse Kismet API response');
        }
      }
    } catch (error) {
      console.error('Failed to query Kismet API:', error);
    }

    return networks;
  }

  async monitorChannel(args: unknown): Promise<ProcessResult> {
    const params = MonitorChannelSchema.parse(args);
    
    validateInterface(params.interface);
    
    // Use Kismet API to set channel
    const apiCommand = `curl -s -X POST http://localhost:2501/datasource/by-uuid/${params.interface}/set_channel.json -d "json={'channel':'${params.channel}'}"`;
    
    return await executeShellCommand(apiCommand);
  }

  async detectClients(args: unknown): Promise<any[]> {
    const params = DetectClientsSchema.parse(args);
    
    const clients: any[] = [];
    
    try {
      // Query Kismet API for client devices
      const apiResult = await executeShellCommand(
        `curl -s http://localhost:2501/devices/views/all/devices.json`
      );

      if (apiResult.success && apiResult.output) {
        try {
          const devices = JSON.parse(apiResult.output);
          
          for (const device of devices) {
            if (device['kismet.device.base.type'] === 'Wi-Fi Client') {
              const client = {
                mac: device['kismet.device.base.macaddr'] || '',
                power: device['kismet.device.base.signal']?.['kismet.common.signal.last_signal'] || 0,
                packets: device['kismet.device.base.packets.total'] || 0,
                associated_bssid: device['kismet.device.base.related_devices']?.[0] || ''
              };
              
              if (!params.bssid || client.associated_bssid === params.bssid) {
                clients.push(client);
              }
            }
          }
        } catch (e) {
          console.error('Failed to parse Kismet API response');
        }
      }
    } catch (error) {
      console.error('Failed to query Kismet API:', error);
    }

    return clients;
  }

  async exportData(args: unknown): Promise<ProcessResult> {
    const params = ExportDataSchema.parse(args);
    
    validateExportFormat(params.format);

    // Find the latest Kismet log file
    const findLogResult = await executeShellCommand('ls -t /tmp/kismet*.kismet | head -1');
    
    if (!findLogResult.success || !findLogResult.output) {
      return {
        success: false,
        output: 'No Kismet log files found',
        exitCode: 1
      };
    }

    const logFile = findLogResult.output.trim();
    
    switch (params.format) {
      case 'pcap':
        // Convert to PCAP
        return await executeCommand('kismetdb_to_pcap', [
          '--in', logFile,
          '--out', params.outputFile
        ]);
        
      case 'json':
        // Export as JSON
        return await executeCommand('kismetdb_dump_devices', [
          '--in', logFile,
          '--out', params.outputFile
        ]);
        
      case 'csv':
        // Export as CSV
        const jsonResult = await executeCommand('kismetdb_dump_devices', [
          '--in', logFile,
          '--out', '/tmp/temp.json'
        ]);
        
        if (jsonResult.success) {
          // Convert JSON to CSV (simplified)
          return await executeShellCommand(
            `cat /tmp/temp.json | jq -r '.[] | [.mac, .type, .manuf, .channel, .frequency, .signal] | @csv' > ${params.outputFile}`
          );
        }
        return jsonResult;
        
      default:
        return {
          success: false,
          output: `Unsupported format: ${params.format}`,
          exitCode: 1
        };
    }
  }

  async gpsTracking(args: unknown): Promise<ProcessResult> {
    const params = GPSTrackingSchema.parse(args);
    
    if (params.enable) {
      // Configure GPS source
      const gpsCommand = `curl -s -X POST http://localhost:2501/gps/add_gps.json -d "json={'type':'serial','device':'${params.device}'}"`;
      return await executeShellCommand(gpsCommand);
    } else {
      // Disable GPS
      const gpsCommand = `curl -s -X POST http://localhost:2501/gps/remove_all_gps.json`;
      return await executeShellCommand(gpsCommand);
    }
  }

  async stopServer(): Promise<ProcessResult> {
    await killProcess('kismet');
    
    return {
      success: true,
      output: 'Kismet server stopped',
      exitCode: 0
    };
  }
}