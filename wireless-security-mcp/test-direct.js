#!/usr/bin/env node
import { checkSystemRequirements } from './dist/utils/security.js';

console.log('🧪 Direct Test of Wireless Security MCP');
console.log('=====================================');

const systemCheck = await checkSystemRequirements();
console.log('System Check Results:', systemCheck);

if (systemCheck.hasTools) {
  console.log('✅ All required tools are available!');
  console.log('✅ The MCP should work for Aircrack-ng and Wifite operations');
} else {
  console.log('❌ Missing tools:', systemCheck.missingTools);
}

if (systemCheck.hasSudo) {
  console.log('✅ Sudo access available');
} else {
  console.log('ℹ️ Sudo access not available (expected in this environment)');
}

console.log('\nRecommendations:');
systemCheck.recommendations.forEach(rec => console.log(`- ${rec}`));