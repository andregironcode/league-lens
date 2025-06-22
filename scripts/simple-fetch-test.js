/**
 * Simple test to trigger manual fetch
 */

import fetch from 'node-fetch';

async function testFetch() {
  console.log('🔄 Testing manual fetch...');
  
  try {
    // Test health first
    console.log('Checking server health...');
    const healthRes = await fetch('http://localhost:3001/api/health');
    const health = await healthRes.json();
    console.log('✅ Server health:', health.status);
    
    // Trigger manual fetch
    console.log('Triggering manual fetch...');
    const fetchRes = await fetch('http://localhost:3001/api/admin/fetch-matches', {
      method: 'POST'
    });
    
    const result = await fetchRes.json();
    console.log('✅ Fetch result:', result);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFetch(); 