import { spawn, exec } from 'child_process';
import { ProcessResult } from '../types.js';

export function executeCommand(
  command: string,
  args: string[],
  timeout: number = 30000
): Promise<ProcessResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let output = '';
    let error = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, timeout);

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      error += data.toString();
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      
      if (timedOut) {
        resolve({
          success: false,
          output,
          error: `Command timed out after ${timeout}ms`,
          exitCode: -1
        });
      } else {
        resolve({
          success: code === 0,
          output,
          error: error || undefined,
          exitCode: code || 0
        });
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        success: false,
        output,
        error: err.message,
        exitCode: -1
      });
    });
  });
}

export function executeShellCommand(command: string, timeout: number = 30000): Promise<ProcessResult> {
  return new Promise((resolve) => {
    exec(command, { timeout }, (error, stdout, stderr) => {
      if (error) {
        resolve({
          success: false,
          output: stdout || '',
          error: stderr || error.message,
          exitCode: error.code || -1
        });
      } else {
        resolve({
          success: true,
          output: stdout,
          error: stderr || undefined,
          exitCode: 0
        });
      }
    });
  });
}

export function parseCSVOutput(output: string): string[][] {
  return output
    .trim()
    .split('\n')
    .filter(line => line.length > 0)
    .map(line => line.split(',').map(field => field.trim()));
}

export function parseTableOutput(output: string): Record<string, string>[] {
  const lines = output.trim().split('\n').filter(line => line.length > 0);
  if (lines.length < 2) return [];

  // Assume first line is headers
  const headers = lines[0].split(/\s+/).map(h => h.trim());
  const results: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(/\s+/).map(v => v.trim());
    const row: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    results.push(row);
  }

  return results;
}

export async function killProcess(processName: string): Promise<void> {
  try {
    await executeShellCommand(`pkill -f ${processName}`);
  } catch {
    // Process might not be running
  }
}

export async function isProcessRunning(processName: string): Promise<boolean> {
  const result = await executeShellCommand(`pgrep -f ${processName}`);
  return result.success && result.output.trim().length > 0;
}