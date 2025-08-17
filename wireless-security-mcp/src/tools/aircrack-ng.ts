import { z } from 'zod';
import { NetworkInfo, ProcessResult, ScanResult } from '../types.js';
import { executeCommand, executeShellCommand } from '../utils/process.js';
import { validateInterface, validateBSSID, validateChannel } from '../utils/validation.js';
import { requireSudo, isValidInterface, checkToolAvailability, addSecurityWarning, createInstallationGuide, createPrivilegeGuide } from '../utils/security.js';

// Tool schemas
const ScanNetworksSchema = z.object({
  interface: z.string(),
  timeout: z.number().optional().default(30)
});

const CaptureHandshakeSchema = z.object({
  interface: z.string(),
  bssid: z.string(),
  channel: z.number(),
  timeout: z.number().optional().default(300)
});

const CrackPasswordSchema = z.object({
  handshakeFile: z.string(),
  wordlist: z.string(),
  bssid: z.string().optional()
});

const TestInjectionSchema = z.object({
  interface: z.string()
});

const DeauthClientSchema = z.object({
  interface: z.string(),
  bssid: z.string(),
  clientMac: z.string().optional(),
  count: z.number().optional().default(5)
});

const MonitorModeSchema = z.object({
  interface: z.string(),
  enable: z.boolean()
});

export class AircrackNGTools {
  async checkDependencies(): Promise<void> {
    const tools = ['aircrack-ng', 'airodump-ng', 'aireplay-ng', 'airmon-ng'];
    const missingTools: string[] = [];
    
    // Check all tools in parallel
    const promises = tools.map(async (tool) => {
      const available = await checkToolAvailability(tool);
      return { tool, available };
    });
    
    const results = await Promise.all(promises);
    
    for (const { tool, available } of results) {
      if (!available) {
        missingTools.push(tool);
      }
    }
    
    if (missingTools.length > 0) {
      const installGuide = createInstallationGuide(missingTools);
      throw new Error(`Aircrack-ng suite is not installed.${installGuide}`);
    }
  }

  async scanNetworks(args: unknown): Promise<ScanResult> {
    const params = ScanNetworksSchema.parse(args);
    
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

    console.warn(addSecurityWarning('airodump-ng'));

    // Create temporary file for output
    const tempFile = `/tmp/airodump-${Date.now()}`;
    
    // Run airodump-ng with CSV output
    const scanArgs = [
      '-w', tempFile,
      '--output-format', 'csv',
      '--write-interval', '1',
      params.interface
    ];

    await executeCommand('airodump-ng', scanArgs, params.timeout * 1000);
    
    // Parse the CSV output
    const networks: NetworkInfo[] = [];
    try {
      const csvData = await executeShellCommand(`cat ${tempFile}-01.csv`);
      if (csvData.success && csvData.output) {
        const lines = csvData.output.split('\n');
        let inStations = false;
        
        for (const line of lines) {
          if (line.includes('Station MAC')) {
            inStations = true;
            continue;
          }
          
          if (!inStations && line.includes(',')) {
            const fields = line.split(',').map(f => f.trim());
            if (fields.length >= 14 && fields[0].match(/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/)) {
              networks.push({
                bssid: fields[0],
                ssid: fields[13] || '<hidden>',
                channel: parseInt(fields[3]) || 0,
                power: parseInt(fields[8]) || 0,
                encryption: fields[5] || 'Unknown'
              });
            }
          }
        }
      }
    } finally {
      // Clean up temporary files
      await executeShellCommand(`rm -f ${tempFile}*`);
    }

    return {
      networks,
      timestamp: new Date(),
      interface: params.interface
    };
  }

  async captureHandshake(args: unknown): Promise<ProcessResult> {
    const params = CaptureHandshakeSchema.parse(args);
    
    try {
      await requireSudo();
    } catch (error) {
      const privilegeGuide = createPrivilegeGuide();
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`${errorMessage}${privilegeGuide}`);
    }
    validateInterface(params.interface);
    validateBSSID(params.bssid);
    validateChannel(params.channel);
    
    console.warn(addSecurityWarning('airodump-ng handshake capture'));

    const outputFile = `/tmp/handshake-${params.bssid.replace(/:/g, '')}-${Date.now()}`;
    
    const captureArgs = [
      '-c', params.channel.toString(),
      '-w', outputFile,
      '--bssid', params.bssid,
      params.interface
    ];

    const result = await executeCommand('airodump-ng', captureArgs, params.timeout * 1000);
    
    return {
      ...result,
      output: result.output + `\n\nHandshake file saved to: ${outputFile}-01.cap`
    };
  }

  async crackPassword(args: unknown): Promise<ProcessResult> {
    const params = CrackPasswordSchema.parse(args);
    
    console.warn(addSecurityWarning('aircrack-ng password cracking'));

    const crackArgs = [
      '-w', params.wordlist,
      params.handshakeFile
    ];

    if (params.bssid) {
      validateBSSID(params.bssid);
      crackArgs.push('-b', params.bssid);
    }

    return await executeCommand('aircrack-ng', crackArgs, 0); // No timeout for cracking
  }

  async testInjection(args: unknown): Promise<ProcessResult> {
    const params = TestInjectionSchema.parse(args);
    
    try {
      await requireSudo();
    } catch (error) {
      const privilegeGuide = createPrivilegeGuide();
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`${errorMessage}${privilegeGuide}`);
    }
    validateInterface(params.interface);
    
    console.warn(addSecurityWarning('aireplay-ng injection test'));

    const testArgs = [
      '-9', // injection test
      params.interface
    ];

    return await executeCommand('aireplay-ng', testArgs, 30000);
  }

  async deauthClient(args: unknown): Promise<ProcessResult> {
    const params = DeauthClientSchema.parse(args);
    
    try {
      await requireSudo();
    } catch (error) {
      const privilegeGuide = createPrivilegeGuide();
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`${errorMessage}${privilegeGuide}`);
    }
    validateInterface(params.interface);
    validateBSSID(params.bssid);
    
    console.warn(addSecurityWarning('aireplay-ng deauthentication attack'));

    const deauthArgs = [
      '-0', params.count.toString(), // deauth attack
      '-a', params.bssid
    ];

    if (params.clientMac) {
      validateBSSID(params.clientMac); // Same format as BSSID
      deauthArgs.push('-c', params.clientMac);
    }

    deauthArgs.push(params.interface);

    return await executeCommand('aireplay-ng', deauthArgs, 30000);
  }

  async monitorMode(args: unknown): Promise<ProcessResult> {
    const params = MonitorModeSchema.parse(args);
    
    try {
      await requireSudo();
    } catch (error) {
      const privilegeGuide = createPrivilegeGuide();
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`${errorMessage}${privilegeGuide}`);
    }
    validateInterface(params.interface);
    
    const command = params.enable ? 'start' : 'stop';
    const monArgs = [command, params.interface];

    const result = await executeCommand('airmon-ng', monArgs, 10000);
    
    // Check for monitor interface creation
    if (params.enable && result.success) {
      const monInterface = `${params.interface}mon`;
      return {
        ...result,
        output: result.output + `\n\nMonitor interface created: ${monInterface}`
      };
    }

    return result;
  }
}