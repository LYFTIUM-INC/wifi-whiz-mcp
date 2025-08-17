#!/usr/bin/env node

// Quick patch to allow Aircrack-ng and Wifite to work without Kismet
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Patching wireless-security-mcp to allow partial tool availability...');

// Read the current security.ts file
const securityPath = path.join(__dirname, 'src/utils/security.ts');
const securityContent = fs.readFileSync(securityPath, 'utf8');

// Remove 'kismet' from the required tools list
const patchedContent = securityContent.replace(
  "const tools = ['aircrack-ng', 'airodump-ng', 'aireplay-ng', 'airmon-ng', 'kismet', 'wifite'];",
  "const tools = ['aircrack-ng', 'airodump-ng', 'aireplay-ng', 'airmon-ng', 'wifite']; // Kismet temporarily removed"
);

// Write the patched file
fs.writeFileSync(securityPath, patchedContent);

console.log('✅ Patched security.ts - removed Kismet from required tools');
console.log('🔨 Rebuilding project...');

// Rebuild the project
import { execSync } from 'child_process';
try {
  execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Build successful!');
  console.log('');
  console.log('🚀 The MCP server should now work with:');
  console.log('   - ✅ Aircrack-ng tools');
  console.log('   - ✅ Wifite tools');
  console.log('   - ❌ Kismet tools (will show as not installed)');
  console.log('');
  console.log('📌 Restart Claude to use the patched version.');
} catch (error) {
  console.error('❌ Build failed:', error.message);
}