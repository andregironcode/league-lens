/**
 * TEST SINGLE API CALL
 * 
 * Test a single API call to see what's actually happening
 */

// Proxy server configuration
const API_BASE = 'http://localhost:3001/api/highlightly';

async function testSingleApiCall() {
  console.log('🔍 TESTING SINGLE API CALL');
  console.log('='.repeat(50));

  try {
    // Test the standings endpoint we know worked before
    const endpoint = '/standings?leagueId=33973&season=2024';
    console.log(`📡 Testing: ${API_BASE}${endpoint}`);
    
    const response = await fetch(`${API_BASE}${endpoint}`);
    console.log(`📊 Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Error response: ${errorText}`);
      return;
    }
    
    const data = await response.json();
    console.log(`✅ Response received!`);
    console.log(`📊 Data type: ${Array.isArray(data) ? 'Array' : typeof data}`);
    console.log(`📊 Data length: ${Array.isArray(data) ? data.length : 'N/A'}`);
    
    if (Array.isArray(data) && data.length > 0) {
      console.log('📊 First item keys:', Object.keys(data[0]));
      console.log('📊 First team:', data[0].team_name);
      console.log('📊 First team logo:', data[0].team_logo || 'MISSING');
    } else {
      console.log('❌ No data in response');
    }

  } catch (error) {
    console.error('❌ Fetch error:', error.message);
  }
}

testSingleApiCall(); 