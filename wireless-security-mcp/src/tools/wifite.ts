import { z } from 'zod';
import { ProcessResult } from '../types.js';
import { executeCommand, executeShellCommand, killProcess, isProcessRunning } from '../utils/process.js';
import { validateInterface, validateBSSID, validateAttackMode } from '../utils/validation.js';
import { requireSudo, isValidInterface, checkToolAvailability, addSecurityWarning, createInstallationGuide, createPrivilegeGuide } from '../utils/security.js';

// Tool schemas
const AutoAuditSchema = z.object({
  interface: z.string(),
  timeout: z.number().optional().default(600),
  minimumPower: z.number().optional().default(-70)
});

const TargetNetworkSchema = z.object({
  interface: z.string(),
  bssid: z.string(),
  attackMode: z.enum(['wpa', 'wps', 'wep', 'all']).optional().default('all'),
  timeout: z.number().optional().default(300)
});

const WPSAttackSchema = z.object({
  interface: z.string(),
  bssid: z.string(),
  timeout: z.number().optional().default(600),
  pixieDust: z.boolean().optional().default(true)
});

const CapturePMKIDSchema = z.object({
  interface: z.string(),
  bssid: z.string(),
  timeout: z.number().optional().default(120)
});

const CrackHandshakeSchema = z.object({
  handshakeFile: z.string(),
  wordlist: z.string(),
  bssid: z.string().optional()
});

const SessionManagementSchema = z.object({
  action: z.enum(['save', 'resume', 'list']),
  sessionName: z.string().optional()
});

export class WifiteTools {
  private sessionDir = '/tmp/wifite-sessions';

  async checkDependencies(): Promise<void> {
    const available = await checkToolAvailability('wifite');
    if (!available) {
      const installGuide = createInstallationGuide(['wifite']);
      throw new Error(`Wifite is not installed.${installGuide}`);
    }

    // Check for optional dependencies
    const optionalTools = ['reaver', 'bully', 'cowpatty', 'pyrit'];
    const missing: string[] = [];
    
    for (const tool of optionalTools) {
      const toolAvailable = await checkToolAvailability(tool);
      if (!toolAvailable) {
        missing.push(tool);
      }
    }

    if (missing.length > 0) {
      console.warn(`Optional tools not installed: ${missing.join(', ')}. Some features may be limited.`);
    }
  }

  async autoAudit(args: unknown): Promise<ProcessResult> {
    const params = AutoAuditSchema.parse(args);
    
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

    console.warn(addSecurityWarning('wifite automated auditing'));

    // Check if wifite is already running
    if (await isProcessRunning('wifite')) {
      return {
        success: false,
        output: 'Wifite is already running',
        exitCode: 1
      };
    }

    const wifiteArgs = [
      '-i', params.interface,
      '--power', params.minimumPower.toString(),
      '--nodeauths', // Don't deauth clients
      '-v', // Verbose mode
      '--kill' // Kill conflicting processes
    ];

    // Set timeout if specified
    if (params.timeout > 0) {
      wifiteArgs.push('--timeout', params.timeout.toString());
    }

    const result = await executeCommand('wifite', wifiteArgs, params.timeout * 1000);

    return result;
  }

  async targetNetwork(args: unknown): Promise<ProcessResult> {
    const params = TargetNetworkSchema.parse(args);
    
    try {
      await requireSudo();
    } catch (error) {
      const privilegeGuide = createPrivilegeGuide();
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`${errorMessage}${privilegeGuide}`);
    }
    validateInterface(params.interface);
    validateBSSID(params.bssid);
    validateAttackMode(params.attackMode);

    console.warn(addSecurityWarning('wifite targeted attack'));

    const wifiteArgs = [
      '-i', params.interface,
      '-b', params.bssid,
      '-v', // Verbose
      '--kill' // Kill conflicting processes
    ];

    // Add attack mode specific options
    switch (params.attackMode) {
      case 'wpa':
        wifiteArgs.push('--wpa');
        break;
      case 'wps':
        wifiteArgs.push('--wps');
        break;
      case 'wep':
        wifiteArgs.push('--wep');
        break;
      // 'all' is default, no specific flag needed
    }

    if (params.timeout > 0) {
      wifiteArgs.push('--timeout', params.timeout.toString());
    }

    const result = await executeCommand('wifite', wifiteArgs, params.timeout * 1000);

    return result;
  }

  async wpsAttack(args: unknown): Promise<ProcessResult> {
    const params = WPSAttackSchema.parse(args);
    
    try {
      await requireSudo();
    } catch (error) {
      const privilegeGuide = createPrivilegeGuide();
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`${errorMessage}${privilegeGuide}`);
    }
    validateInterface(params.interface);
    validateBSSID(params.bssid);

    console.warn(addSecurityWarning('wifite WPS attack'));

    const wifiteArgs = [
      '-i', params.interface,
      '-b', params.bssid,
      '--wps-only', // Only use WPS attacks
      '-v'
    ];

    if (params.pixieDust) {
      wifiteArgs.push('--pixie'); // Use pixie-dust attack
    }

    if (params.timeout > 0) {
      wifiteArgs.push('--wps-timeout', params.timeout.toString());
    }

    const result = await executeCommand('wifite', wifiteArgs, params.timeout * 1000);

    return result;
  }

  async capturePMKID(args: unknown): Promise<ProcessResult> {
    const params = CapturePMKIDSchema.parse(args);
    
    try {
      await requireSudo();
    } catch (error) {
      const privilegeGuide = createPrivilegeGuide();
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`${errorMessage}${privilegeGuide}`);
    }
    validateInterface(params.interface);
    validateBSSID(params.bssid);

    console.warn(addSecurityWarning('wifite PMKID capture'));

    const wifiteArgs = [
      '-i', params.interface,
      '-b', params.bssid,
      '--pmkid', // Force PMKID capture
      '--pmkid-timeout', params.timeout.toString(),
      '-v'
    ];

    const result = await executeCommand('wifite', wifiteArgs, params.timeout * 1000);

    return result;
  }

  async crackHandshake(args: unknown): Promise<ProcessResult> {
    const params = CrackHandshakeSchema.parse(args);
    
    console.warn(addSecurityWarning('wifite handshake cracking'));

    // Wifite can crack captured handshakes
    const wifiteArgs = [
      '--crack',
      '--dict', params.wordlist
    ];

    if (params.bssid) {
      validateBSSID(params.bssid);
      // For specific BSSID, we need to find the handshake file
      // Wifite stores handshakes in hs/ directory
      const findResult = await executeShellCommand(
        `find hs/ -name "*${params.bssid.replace(/:/g, '-')}*" -type f | head -1`
      );
      
      if (findResult.success && findResult.output) {
        wifiteArgs.push(findResult.output.trim());
      } else {
        return {
          success: false,
          output: `No handshake found for BSSID ${params.bssid}`,
          exitCode: 1
        };
      }
    }

    return await executeCommand('wifite', wifiteArgs, 0); // No timeout for cracking
  }

  async sessionManagement(args: unknown): Promise<ProcessResult> {
    const params = SessionManagementSchema.parse(args);
    
    // Create session directory if it doesn't exist
    await executeShellCommand(`mkdir -p ${this.sessionDir}`);

    switch (params.action) {
      case 'save':
        if (!params.sessionName) {
          return {
            success: false,
            output: 'Session name required for save action',
            exitCode: 1
          };
        }
        
        // Save current wifite session
        return await executeShellCommand(
          `cp -r hs/ cracked.txt ${this.sessionDir}/${params.sessionName}/ 2>/dev/null || echo "No session data to save"`
        );

      case 'resume':
        if (!params.sessionName) {
          return {
            success: false,
            output: 'Session name required for resume action',
            exitCode: 1
          };
        }

        // Restore session
        const restoreResult = await executeShellCommand(
          `cp -r ${this.sessionDir}/${params.sessionName}/* . 2>/dev/null`
        );
        
        if (restoreResult.success) {
          return {
            success: true,
            output: `Session ${params.sessionName} restored`,
            exitCode: 0
          };
        }
        return restoreResult;

      case 'list':
        // List saved sessions
        return await executeShellCommand(`ls -la ${this.sessionDir}/ 2>/dev/null || echo "No saved sessions"`);

      default:
        return {
          success: false,
          output: `Unknown action: ${params.action}`,
          exitCode: 1
        };
    }
  }

  async stopWifite(): Promise<ProcessResult> {
    await killProcess('wifite');
    
    return {
      success: true,
      output: 'Wifite stopped',
      exitCode: 0
    };
  }
}