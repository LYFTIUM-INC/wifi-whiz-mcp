import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface CapabilityCheck {
  hasCapabilities: boolean;
  missingCapabilities: string[];
  method: 'sudo' | 'capabilities' | 'none';
}

/**
 * Check if a tool has the required Linux capabilities
 */
export async function checkToolCapabilities(toolPath: string): Promise<string[]> {
  try {
    const { stdout } = await execAsync(`getcap "${toolPath}"`);
    const caps = stdout.trim();
    
    if (caps.includes('cap_net_admin') && caps.includes('cap_net_raw')) {
      return [];
    }
    
    const missing = [];
    if (!caps.includes('cap_net_admin')) missing.push('cap_net_admin');
    if (!caps.includes('cap_net_raw')) missing.push('cap_net_raw');
    
    return missing;
  } catch {
    return ['cap_net_admin', 'cap_net_raw'];
  }
}

/**
 * Enhanced privilege check supporting both sudo and capabilities
 */
export async function checkPrivileges(): Promise<CapabilityCheck> {
  // First check if running as root
  if (process.getuid && process.getuid() === 0) {
    return {
      hasCapabilities: true,
      missingCapabilities: [],
      method: 'sudo'
    };
  }
  
  // Check for sudo access
  try {
    await execAsync('sudo -n true');
    return {
      hasCapabilities: true,
      missingCapabilities: [],
      method: 'sudo'
    };
  } catch {
    // No sudo, check capabilities
  }
  
  // Check if tools have capabilities
  const tools = ['airmon-ng', 'airodump-ng', 'kismet'];
  const missingCaps = new Set<string>();
  
  for (const tool of tools) {
    try {
      const { stdout } = await execAsync(`which ${tool}`);
      const toolPath = stdout.trim();
      const missing = await checkToolCapabilities(toolPath);
      missing.forEach(cap => missingCaps.add(cap));
    } catch {
      // Tool not found
    }
  }
  
  if (missingCaps.size === 0) {
    return {
      hasCapabilities: true,
      missingCapabilities: [],
      method: 'capabilities'
    };
  }
  
  return {
    hasCapabilities: false,
    missingCapabilities: Array.from(missingCaps),
    method: 'none'
  };
}

/**
 * Get setup instructions based on system configuration
 */
export function getSetupInstructions(): string {
  return `
🔐 GRANTING PERMISSIONS FOR WIRELESS SECURITY MCP

Choose one of these methods:

1️⃣ Linux Capabilities (Recommended - Most Secure)
   Run: ./setup-capabilities.sh
   This grants only necessary permissions to tools

2️⃣ Restricted Sudo Configuration
   Run: sudo cp wireless-mcp-sudoers /etc/sudoers.d/
   This allows passwordless sudo for specific commands

3️⃣ Run Claude with Sudo
   Start Claude Code with: sudo claude-code
   This grants full root access (least secure)

After setup, restart Claude Code to use the MCP tools.
`;
}