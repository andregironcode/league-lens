import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const HIGHLIGHTLY_API_URL = 'https://soccer.highlightly.net';
const HIGHLIGHTLY_API_KEY = process.env.HIGHLIGHTLY_API_KEY || 'f1f4e3c0a7msh07b3b9d6e8c2f5a8b3c';

async function callAPI(endpoint) {
  try {
    console.log(`🔗 Testing: ${HIGHLIGHTLY_API_URL}/${endpoint}`);
    
    const response = await axios.get(`${HIGHLIGHTLY_API_URL}/${endpoint}`, {
      headers: {
        'x-api-key': HIGHLIGHTLY_API_KEY,
        'x-rapidapi-key': HIGHLIGHTLY_API_KEY,
      },
      timeout: 10000,
    });

    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Data structure:`, JSON.stringify(response.data, null, 2).substring(0, 500) + '...');
    return response.data;
  } catch (error) {
    console.log(`❌ Error: ${error.response?.status || error.message}`);
    return null;
  }
}

async function investigateAPIData() {
  console.log('🔍 INVESTIGATING HIGHLIGHTLY API DATA AVAILABILITY');
  console.log('='.repeat(60));
  
  // Test match ID from our recent finished matches
  const testMatchId = '1126857540'; // Yokohama FC vs Sanfrecce Hiroshima
  
  console.log(`\n🏆 Testing with Match ID: ${testMatchId}`);
  console.log('-'.repeat(40));
  
  // Test different possible endpoints
  const endpoints = [
    `matches/${testMatchId}`,
    `match/${testMatchId}`,
    `matches?id=${testMatchId}`,
    `highlights?matchId=${testMatchId}`,
    `highlights/${testMatchId}`,
    `lineups?matchId=${testMatchId}`,
    `lineups/${testMatchId}`,
    `events?matchId=${testMatchId}`,
    `events/${testMatchId}`,
    `statistics?matchId=${testMatchId}`,
    `statistics/${testMatchId}`,
    `stats?matchId=${testMatchId}`,
    `stats/${testMatchId}`,
    `match-details/${testMatchId}`,
    `match-data/${testMatchId}`
  ];
  
  const results = {};
  
  for (const endpoint of endpoints) {
    console.log(`\n📡 Testing endpoint: ${endpoint}`);
    const data = await callAPI(endpoint);
    
    if (data) {
      results[endpoint] = 'SUCCESS';
      
      // Check what fields are available
      if (data.data) {
        console.log(`🔍 Available fields:`, Object.keys(data.data));
      } else if (Array.isArray(data)) {
        console.log(`🔍 Array with ${data.length} items`);
      } else {
        console.log(`🔍 Available fields:`, Object.keys(data));
      }
    } else {
      results[endpoint] = 'FAILED';
    }
    
    // Small delay to be API-friendly
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📊 SUMMARY OF AVAILABLE ENDPOINTS:');
  console.log('='.repeat(40));
  
  Object.entries(results).forEach(([endpoint, status]) => {
    const icon = status === 'SUCCESS' ? '✅' : '❌';
    console.log(`${icon} ${endpoint}`);
  });
  
  console.log('\n🎯 CONCLUSIONS:');
  console.log('-'.repeat(15));
  
  const successfulEndpoints = Object.entries(results).filter(([_, status]) => status === 'SUCCESS');
  
  if (successfulEndpoints.length === 0) {
    console.log('❌ No detailed match data endpoints found');
    console.log('💡 The Highlightly API might only provide:');
    console.log('   • Video highlights');
    console.log('   • Basic match information');
    console.log('   • League/team data');
    console.log('   • But NOT detailed match statistics, lineups, or events');
  } else {
    console.log('✅ Found working endpoints:');
    successfulEndpoints.forEach(([endpoint, _]) => {
      console.log(`   • ${endpoint}`);
    });
  }
  
  console.log('\n💭 RECOMMENDATION:');
  console.log('If detailed match data (lineups, events, stats) is not available,');
  console.log('consider using a different API like:');
  console.log('• Football-Data.org API');
  console.log('• API-Sports (RapidAPI)');
  console.log('• SportMonks API');
  console.log('• Or focus only on highlights from Highlightly');
}

// Run the investigation
investigateAPIData().then(() => {
  console.log('\n🏁 API investigation completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Investigation error:', error);
  process.exit(1);
}); 