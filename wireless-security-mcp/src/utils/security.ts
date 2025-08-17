
export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

export async function checkSudoPrivileges(): Promise<boolean> {
  try {
    const { execSync } = await import('child_process');
    execSync('sudo -n true', { stdio: 'ignore', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

export async function requireSudo(): Promise<void> {
  // Check if running as root
  if (process.getuid && process.getuid() === 0) {
    return;
  }
  
  // Check if sudo privileges are available
  const hasSudo = await checkSudoPrivileges();
  if (!hasSudo) {
    throw new SecurityError('This operation requires root privileges. Please run with sudo or ensure you have sudo access.');
  }
}

export function sanitizeCommand(command: string): string {
  // Remove potentially dangerous characters and command chaining
  return command
    .replace(/[;&|`$(){}]/g, '')
    .replace(/\.\./g, '')
    .trim();
}

export function isValidInterface(iface: string): boolean {
  // Only allow standard interface names
  const validPattern = /^(wlan|wlp|wlx|eth|en|mon)[0-9a-zA-Z]+$/;
  return validPattern.test(iface);
}

export function checkToolAvailability(toolName: string): Promise<boolean> {
  return new Promise((resolve) => {
    import('child_process').then(({ exec }) => {
      // Use command -v which is more reliable than which
      exec(`command -v ${toolName}`, { timeout: 5000, shell: '/bin/bash' }, (error) => {
        resolve(!error);
      });
    }).catch(() => resolve(false));
  });
}

export async function verifyToolsInstalled(): Promise<{ [key: string]: boolean }> {
  const tools = ['aircrack-ng', 'airodump-ng', 'aireplay-ng', 'airmon-ng', 'kismet', 'wifite'];
  const results: { [key: string]: boolean } = {};
  
  // Check tools in parallel for better performance
  const promises = tools.map(async (tool) => {
    const available = await checkToolAvailability(tool);
    return { tool, available };
  });
  
  const toolResults = await Promise.all(promises);
  
  for (const { tool, available } of toolResults) {
    results[tool] = available;
  }
  
  return results;
}

export function addSecurityWarning(toolName: string): string {
  return `
⚠️  SECURITY WARNING ⚠️
This tool (${toolName}) is for authorized security testing only.
Using this tool on networks you don't own or have explicit permission to test is illegal.
Always ensure you have proper authorization before conducting any security tests.
`;
}

export function createInstallationGuide(missingTools: string[]): string {
  const installCommands = {
    'aircrack-ng': 'sudo apt-get install aircrack-ng',
    'airodump-ng': 'sudo apt-get install aircrack-ng',
    'aireplay-ng': 'sudo apt-get install aircrack-ng', 
    'airmon-ng': 'sudo apt-get install aircrack-ng',
    'kismet': 'sudo apt-get install kismet',
    'wifite': 'sudo apt-get install wifite || pip3 install wifite2'
  };
  
  const uniquePackages = new Set<string>();
  missingTools.forEach(tool => {
    const cmd = installCommands[tool as keyof typeof installCommands];
    if (cmd) uniquePackages.add(cmd);
  });
  
  return `
📦 INSTALLATION REQUIRED:
Missing tools: ${missingTools.join(', ')}

To install missing dependencies, run:
${Array.from(uniquePackages).join('\n')}

After installation, restart the MCP server.
`;
}

export function createPrivilegeGuide(): string {
  return `
🔐 PRIVILEGE ESCALATION REQUIRED:

This tool requires root privileges to access wireless interfaces.

Options:
1. Run Claude with sudo: sudo claude-code
2. Configure passwordless sudo for your user
3. Add your user to appropriate groups (e.g., netdev)

For security reasons, only use elevated privileges in controlled environments.
`;
}

export function validateTargetAuthorization(bssid?: string): void {
  if (bssid) {
    // In a production environment, this would check against a whitelist
    // For now, we'll add a warning
    console.warn(addSecurityWarning('wireless security testing'));
  }
}

export async function checkSystemRequirements(): Promise<{
  hasTools: boolean;
  hasSudo: boolean;
  missingTools: string[];
  recommendations: string[];
}> {
  const toolStatus = await verifyToolsInstalled();
  const missingTools = Object.entries(toolStatus)
    .filter(([, available]) => !available)
    .map(([tool]) => tool);
  
  const hasSudo = await checkSudoPrivileges();
  const hasTools = missingTools.length === 0;
  
  const recommendations: string[] = [];
  
  if (!hasTools) {
    recommendations.push('Install missing wireless security tools');
  }
  
  if (!hasSudo) {
    recommendations.push('Configure sudo access for wireless operations');
  }
  
  if (hasTools && hasSudo) {
    recommendations.push('System ready for wireless security testing');
  }
  
  return {
    hasTools,
    hasSudo,
    missingTools,
    recommendations
  };
}