/**
 * TEST SINGLE LEAGUE API
 * 
 * Test the API with a known working league (Premier League)
 */

// Test direct API call first
async function testDirectAPI() {
  console.log('🧪 TESTING DIRECT API CALL');
  console.log('='.repeat(50));

  try {
    const response = await fetch('http://localhost:3001/api/highlightly/standings?leagueId=33973&season=2024');
    
    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Response Headers:`, Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Response Data:`, JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log(`❌ Error Response:`, errorText);
    }
  } catch (error) {
    console.log(`❌ Fetch Error:`, error.message);
  }
}

// Test if server is running
async function testServerHealth() {
  console.log('\n🏥 TESTING SERVER HEALTH');
  console.log('='.repeat(50));

  try {
    const response = await fetch('http://localhost:3001/api/health');
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Server is running:`, data);
    } else {
      console.log(`❌ Server health check failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Server not responding:`, error.message);
  }
}

// Run tests
async function runTests() {
  await testServerHealth();
  await testDirectAPI();
}

runTests(); 