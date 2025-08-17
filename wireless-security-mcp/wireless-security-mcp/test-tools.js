#!/usr/bin/env node

// Simple test script to verify tool availability
import { verifyToolsInstalled } from './dist/utils/security.js';

async function main() {
  console.log('🔍 Testing Wireless Security MCP Tools...\n');
  
  try {
    const toolStatus = await verifyToolsInstalled();
    
    console.log('Tool Availability Status:');
    console.log('========================');
    
    Object.entries(toolStatus).forEach(([tool, available]) => {
      const status = available ? '✅ Available' : '❌ Not installed';
      console.log(`${tool.padEnd(20)} : ${status}`);
    });
    
    console.log('\n📋 Summary:');
    const available = Object.values(toolStatus).filter(Boolean).length;
    const total = Object.keys(toolStatus).length;
    console.log(`${available}/${total} tools available`);
    
    if (available === total) {
      console.log('\n🎉 All tools are available! MCP server is fully functional.');
    } else {
      console.log('\n⚠️  Some tools are missing. Install missing tools for full functionality.');
      console.log('\nInstallation commands:');
      Object.entries(toolStatus).forEach(([tool, available]) => {
        if (!available) {
          console.log(`  sudo apt install ${tool}`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing tools:', error.message);
  }
}

main().catch(console.error);