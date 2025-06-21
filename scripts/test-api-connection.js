/**
 * TEST API CONNECTION
 * 
 * Simple script to test if the Highlightly API is working
 * Run with: node scripts/test-api-connection.js
 */

// Test basic API connectivity
async function testApiConnection() {
  console.log('🔍 TESTING API CONNECTION');
  console.log('='.repeat(50));

  const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY || 'your_api_key_here';
  
  console.log(`🔑 API Key: ${HIGHLIGHTLY_API_KEY === 'your_api_key_here' ? 'NOT SET' : 'SET'}`);
  
  if (HIGHLIGHTLY_API_KEY === 'your_api_key_here') {
    console.log('❌ HIGHLIGHTLY_API_KEY is not set!');
    console.log('💡 You need to set your Highlightly API key in environment variables');
    console.log('💡 Add this to your .env file: VITE_HIGHLIGHTLY_API_KEY=your_actual_api_key');
    console.log('💡 Or set it in your environment: export VITE_HIGHLIGHTLY_API_KEY=your_actual_api_key');
    return;
  }

  // Test simple API call
  try {
    console.log('📡 Testing basic API call...');
    
    const response = await fetch('https://api.highlightly.app/v1/leagues', {
      headers: {
        'Accept': 'application/json',
        'X-API-Key': HIGHLIGHTLY_API_KEY
      }
    });

    console.log(`📊 Response status: ${response.status}`);
    console.log(`📊 Response headers:`, Object.fromEntries(response.headers));

    if (!response.ok) {
      console.log(`❌ API call failed: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log(`❌ Error response: ${errorText}`);
      return;
    }

    const data = await response.json();
    console.log('✅ API call successful!');
    console.log(`📊 Data received:`, data);

  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.log('💡 This could be:');
    console.log('   • Network connectivity issues');
    console.log('   • Firewall blocking the request');
    console.log('   • API service is down');
    console.log('   • Wrong API endpoint URL');
  }
}

// Always run the test
testApiConnection(); 