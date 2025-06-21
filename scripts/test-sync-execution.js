/**
 * TEST SYNC EXECUTION
 * 
 * Simple test to verify script execution
 */

console.log('🚀 TESTING SYNC EXECUTION');
console.log('Script is running...');

// Test API call
const API_BASE = 'http://localhost:3001/api/highlightly';

async function testExecution() {
  try {
    console.log('📡 Testing API connection...');
    
    const response = await fetch(`${API_BASE}/leagues?limit=5`);
    console.log(`📊 API Response: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ API working! Found ${data.data?.length || 0} leagues`);
    } else {
      console.log('❌ API not responding properly');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('💡 Make sure the server is running: cd server && npm start');
  }
}

testExecution(); 