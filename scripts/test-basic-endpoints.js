/**
 * TEST BASIC ENDPOINTS
 * 
 * Test the most basic endpoints to see if any data exists
 */

// Proxy server configuration
const API_BASE = 'http://localhost:3001/api/highlightly';

async function testBasicEndpoints() {
  console.log('🔍 TESTING BASIC ENDPOINTS');
  console.log('='.repeat(50));

  // Test basic leagues endpoint
  console.log('\n🏆 TESTING LEAGUES');
  try {
    const endpoint = '/leagues?limit=10';
    console.log(`📡 Testing: ${endpoint}`);
    
    const response = await fetch(`${API_BASE}${endpoint}`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      const dataLength = Array.isArray(data) ? data.length : 0;
      console.log(`📊 Leagues found: ${dataLength}`);
      
      if (dataLength > 0) {
        console.log(`✅ FOUND LEAGUES!`);
        console.log(`📊 First league: ${data[0].name} (ID: ${data[0].id})`);
        console.log(`📊 Country: ${data[0].country_name}`);
        
        // Test if this league has any standings
        const leagueId = data[0].id;
        console.log(`\n📊 Testing standings for league ${leagueId}...`);
        
        const standingsResponse = await fetch(`${API_BASE}/standings?leagueId=${leagueId}`);
        if (standingsResponse.ok) {
          const standingsData = await standingsResponse.json();
          console.log(`📊 Standings found: ${Array.isArray(standingsData) ? standingsData.length : 0}`);
          
          if (Array.isArray(standingsData) && standingsData.length > 0) {
            console.log(`✅ FOUND STANDINGS! First team: ${standingsData[0].team_name}`);
          }
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error testing leagues:`, error.message);
  }

  // Test basic matches without filters
  console.log('\n⚽ TESTING MATCHES (no filters)');
  try {
    const endpoint = '/matches?limit=10';
    console.log(`📡 Testing: ${endpoint}`);
    
    const response = await fetch(`${API_BASE}${endpoint}`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      const dataLength = Array.isArray(data) ? data.length : 0;
      console.log(`📊 Matches found: ${dataLength}`);
      
      if (dataLength > 0) {
        console.log(`✅ FOUND MATCHES!`);
        console.log(`📊 First match: ${data[0].home_team_name} vs ${data[0].away_team_name}`);
        console.log(`📊 Date: ${data[0].match_date}`);
        console.log(`📊 League: ${data[0].league_id}`);
      }
    }
  } catch (error) {
    console.error(`❌ Error testing matches:`, error.message);
  }

  // Test basic highlights
  console.log('\n🎬 TESTING HIGHLIGHTS (no filters)');
  try {
    const endpoint = '/highlights?limit=10';
    console.log(`📡 Testing: ${endpoint}`);
    
    const response = await fetch(`${API_BASE}${endpoint}`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      const dataLength = Array.isArray(data) ? data.length : 0;
      console.log(`📊 Highlights found: ${dataLength}`);
      
      if (dataLength > 0) {
        console.log(`✅ FOUND HIGHLIGHTS!`);
        console.log(`📊 First highlight: ${data[0].title}`);
        console.log(`📊 URL: ${data[0].url}`);
      }
    }
  } catch (error) {
    console.error(`❌ Error testing highlights:`, error.message);
  }

  // Test current date matches
  console.log('\n📅 TESTING CURRENT DATE MATCHES');
  try {
    const today = new Date().toISOString().split('T')[0];
    const endpoint = `/matches?date=${today}&limit=10`;
    console.log(`📡 Testing: ${endpoint}`);
    
    const response = await fetch(`${API_BASE}${endpoint}`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      const dataLength = Array.isArray(data) ? data.length : 0;
      console.log(`📊 Today's matches found: ${dataLength}`);
      
      if (dataLength > 0) {
        console.log(`✅ FOUND TODAY'S MATCHES!`);
        data.forEach((match, i) => {
          console.log(`📊 Match ${i+1}: ${match.home_team_name} vs ${match.away_team_name}`);
        });
      }
    }
  } catch (error) {
    console.error(`❌ Error testing current date matches:`, error.message);
  }
}

testBasicEndpoints(); 