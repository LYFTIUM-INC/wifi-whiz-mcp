#!/usr/bin/env node

import { AircrackNGTools } from './dist/tools/aircrack-ng.js';
import { KismetTools } from './dist/tools/kismet.js';  
import { WifiteTools } from './dist/tools/wifite.js';

async function testMCPTools() {
  console.log('🧪 Testing Wireless Security MCP Tools\n');
  
  const aircrackTools = new AircrackNGTools();
  const kismetTools = new KismetTools();
  const wifiteTools = new WifiteTools();

  const tests = [
    // Aircrack-ng tests (these should work)
    { 
      name: '🔍 Aircrack-ng: Check monitor mode capability', 
      test: () => aircrackTools.monitorMode({ interface: 'wlan0', enable: true, dry_run: true })
    },
    { 
      name: '📡 Aircrack-ng: Test network scanning', 
      test: () => aircrackTools.scanNetworks({ interface: 'wlan0', timeout: 1, dry_run: true })
    },
    
    // Kismet tests (may fail if not installed)
    { 
      name: '🚀 Kismet: Test server start', 
      test: () => kismetTools.startServer({ interface: 'wlan0', dry_run: true })
    },
    
    // Wifite tests (may fail if not installed)
    { 
      name: '⚡ Wifite: Test auto audit', 
      test: () => wifiteTools.autoAudit({ interface: 'wlan0', attack_mode: 'wpa', dry_run: true })
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const { name, test } of tests) {
    try {
      console.log(`Testing: ${name}`);
      const result = await test();
      console.log(`✅ PASSED: ${JSON.stringify(result, null, 2)}\n`);
      passed++;
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}\n`);
      failed++;
    }
  }

  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (passed > 0) {
    console.log('\n🎉 MCP server has working tools and is ready for use!');
  } else {
    console.log('\n⚠️ All tests failed. Check tool installation.');
  }
}

testMCPTools().catch(console.error);