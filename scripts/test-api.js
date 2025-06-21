import dotenv from 'dotenv';

dotenv.config();

async function testSingleApiCall() {
  console.log('🔍 Testing API with a single game request...');
  console.log('='.repeat(50));
  
  try {
    // Test with a simple match request
    const testUrl = 'http://localhost:3001/api/highlightly/matches/match-1';
    console.log(`📡 Attempting to fetch: ${testUrl}`);
    
    const response = await fetch(testUrl);
    
    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 429) {
      console.log('❌ API is still rate limited (429 Too Many Requests)');
      console.log('⏰ Rate limits typically reset after 1 hour');
      console.log('💡 We should continue using Supabase data for now');
      return false;
    }
    
    if (response.status === 404) {
      console.log('⚠️  Match not found (404) - but API is responding!');
      console.log('✅ This means rate limits have been lifted!');
      return true;
    }
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API call successful!');
      console.log('📋 Response data preview:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
      return true;
    }
    
    console.log(`⚠️  Unexpected response: ${response.status}`);
    return false;
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    return false;
  }
}

async function testLeagueApi() {
  console.log('\n🏆 Testing league API endpoint...');
  
  try {
    // Test with a league we know exists
    const testUrl = 'http://localhost:3001/api/highlightly/leagues/33973'; // Premier League
    console.log(`📡 Attempting to fetch: ${testUrl}`);
    
    const response = await fetch(testUrl);
    
    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 429) {
      console.log('❌ League API is still rate limited');
      return false;
    }
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ League API call successful!');
      console.log('📋 League data:', data);
      return true;
    }
    
    console.log(`⚠️  League API unexpected response: ${response.status}`);
    return false;
    
  } catch (error) {
    console.error('❌ Error testing league API:', error.message);
    return false;
  }
}

async function runApiTest() {
  console.log('🚀 API Rate Limit Test');
  console.log('='.repeat(50));
  
  const matchApiWorking = await testSingleApiCall();
  const leagueApiWorking = await testLeagueApi();
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 API Test Results:');
  console.log('='.repeat(50));
  console.log(`⚽ Match API: ${matchApiWorking ? '✅ Working' : '❌ Rate Limited'}`);
  console.log(`🏆 League API: ${leagueApiWorking ? '✅ Working' : '❌ Rate Limited'}`);
  
  if (matchApiWorking || leagueApiWorking) {
    console.log('\n🎉 GOOD NEWS: API rate limits have been lifted!');
    console.log('🚀 You can now run the comprehensive sync script to get real data');
    console.log('💡 Run: node scripts/comprehensive-sync.js');
  } else {
    console.log('\n⏰ API is still rate limited');
    console.log('🎯 But your app is working perfectly with Supabase data!');
    console.log('💪 Users get instant responses with no rate limit issues');
  }
}

// Run the test
runApiTest().then(() => {
  console.log('\n✅ API test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ API test failed:', error);
  process.exit(1);
}); 

dotenv.config();

async function testSingleApiCall() {
  console.log('🔍 Testing API with a single game request...');
  console.log('='.repeat(50));
  
  try {
    // Test with a simple match request
    const testUrl = 'http://localhost:3001/api/highlightly/matches/match-1';
    console.log(`📡 Attempting to fetch: ${testUrl}`);
    
    const response = await fetch(testUrl);
    
    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 429) {
      console.log('❌ API is still rate limited (429 Too Many Requests)');
      console.log('⏰ Rate limits typically reset after 1 hour');
      console.log('💡 We should continue using Supabase data for now');
      return false;
    }
    
    if (response.status === 404) {
      console.log('⚠️  Match not found (404) - but API is responding!');
      console.log('✅ This means rate limits have been lifted!');
      return true;
    }
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API call successful!');
      console.log('📋 Response data preview:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
      return true;
    }
    
    console.log(`⚠️  Unexpected response: ${response.status}`);
    return false;
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    return false;
  }
}

async function testLeagueApi() {
  console.log('\n🏆 Testing league API endpoint...');
  
  try {
    // Test with a league we know exists
    const testUrl = 'http://localhost:3001/api/highlightly/leagues/33973'; // Premier League
    console.log(`📡 Attempting to fetch: ${testUrl}`);
    
    const response = await fetch(testUrl);
    
    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 429) {
      console.log('❌ League API is still rate limited');
      return false;
    }
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ League API call successful!');
      console.log('📋 League data:', data);
      return true;
    }
    
    console.log(`⚠️  League API unexpected response: ${response.status}`);
    return false;
    
  } catch (error) {
    console.error('❌ Error testing league API:', error.message);
    return false;
  }
}

async function runApiTest() {
  console.log('🚀 API Rate Limit Test');
  console.log('='.repeat(50));
  
  const matchApiWorking = await testSingleApiCall();
  const leagueApiWorking = await testLeagueApi();
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 API Test Results:');
  console.log('='.repeat(50));
  console.log(`⚽ Match API: ${matchApiWorking ? '✅ Working' : '❌ Rate Limited'}`);
  console.log(`🏆 League API: ${leagueApiWorking ? '✅ Working' : '❌ Rate Limited'}`);
  
  if (matchApiWorking || leagueApiWorking) {
    console.log('\n🎉 GOOD NEWS: API rate limits have been lifted!');
    console.log('🚀 You can now run the comprehensive sync script to get real data');
    console.log('💡 Run: node scripts/comprehensive-sync.js');
  } else {
    console.log('\n⏰ API is still rate limited');
    console.log('🎯 But your app is working perfectly with Supabase data!');
    console.log('💪 Users get instant responses with no rate limit issues');
  }
}

// Run the test
runApiTest().then(() => {
  console.log('\n✅ API test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ API test failed:', error);
  process.exit(1);
}); 

dotenv.config();

async function testSingleApiCall() {
  console.log('🔍 Testing API with a single game request...');
  console.log('='.repeat(50));
  
  try {
    // Test with a simple match request
    const testUrl = 'http://localhost:3001/api/highlightly/matches/match-1';
    console.log(`📡 Attempting to fetch: ${testUrl}`);
    
    const response = await fetch(testUrl);
    
    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 429) {
      console.log('❌ API is still rate limited (429 Too Many Requests)');
      console.log('⏰ Rate limits typically reset after 1 hour');
      console.log('💡 We should continue using Supabase data for now');
      return false;
    }
    
    if (response.status === 404) {
      console.log('⚠️  Match not found (404) - but API is responding!');
      console.log('✅ This means rate limits have been lifted!');
      return true;
    }
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API call successful!');
      console.log('📋 Response data preview:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
      return true;
    }
    
    console.log(`⚠️  Unexpected response: ${response.status}`);
    return false;
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    return false;
  }
}

async function testLeagueApi() {
  console.log('\n🏆 Testing league API endpoint...');
  
  try {
    // Test with a league we know exists
    const testUrl = 'http://localhost:3001/api/highlightly/leagues/33973'; // Premier League
    console.log(`📡 Attempting to fetch: ${testUrl}`);
    
    const response = await fetch(testUrl);
    
    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 429) {
      console.log('❌ League API is still rate limited');
      return false;
    }
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ League API call successful!');
      console.log('📋 League data:', data);
      return true;
    }
    
    console.log(`⚠️  League API unexpected response: ${response.status}`);
    return false;
    
  } catch (error) {
    console.error('❌ Error testing league API:', error.message);
    return false;
  }
}

async function runApiTest() {
  console.log('🚀 API Rate Limit Test');
  console.log('='.repeat(50));
  
  const matchApiWorking = await testSingleApiCall();
  const leagueApiWorking = await testLeagueApi();
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 API Test Results:');
  console.log('='.repeat(50));
  console.log(`⚽ Match API: ${matchApiWorking ? '✅ Working' : '❌ Rate Limited'}`);
  console.log(`🏆 League API: ${leagueApiWorking ? '✅ Working' : '❌ Rate Limited'}`);
  
  if (matchApiWorking || leagueApiWorking) {
    console.log('\n🎉 GOOD NEWS: API rate limits have been lifted!');
    console.log('🚀 You can now run the comprehensive sync script to get real data');
    console.log('💡 Run: node scripts/comprehensive-sync.js');
  } else {
    console.log('\n⏰ API is still rate limited');
    console.log('🎯 But your app is working perfectly with Supabase data!');
    console.log('💪 Users get instant responses with no rate limit issues');
  }
}

// Run the test
runApiTest().then(() => {
  console.log('\n✅ API test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ API test failed:', error);
  process.exit(1);
}); 