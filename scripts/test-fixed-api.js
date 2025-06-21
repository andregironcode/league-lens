/**
 * TEST FIXED API CONFIGURATION
 * 
 * Test the API with proper headers and response parsing
 */

// Proxy server configuration
const API_BASE = 'http://localhost:3001/api/highlightly';

async function testFixedApi() {
  console.log('🔍 TESTING FIXED API CONFIGURATION');
  console.log('='.repeat(50));

  // Test leagues endpoint (should return data wrapped in {"data": [...]})
  console.log('\n🏆 TESTING LEAGUES ENDPOINT');
  try {
    const endpoint = '/leagues?limit=10';
    console.log(`📡 Testing: ${API_BASE}${endpoint}`);
    
    const response = await fetch(`${API_BASE}${endpoint}`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const responseData = await response.json();
      console.log(`📊 Response type: ${typeof responseData}`);
      console.log(`📊 Response keys:`, Object.keys(responseData));
      
      // Check if response has data property (as per documentation)
      if (responseData.data && Array.isArray(responseData.data)) {
        const leagues = responseData.data;
        console.log(`✅ FOUND LEAGUES! Count: ${leagues.length}`);
        
        if (leagues.length > 0) {
          console.log(`📊 First league: ${leagues[0].name} (ID: ${leagues[0].id})`);
          console.log(`📊 Country: ${leagues[0].country?.name}`);
          console.log(`📊 Logo: ${leagues[0].logo}`);
          
          // Test standings for this league
          const leagueId = leagues[0].id;
          await testStandings(leagueId);
        }
      } else {
        console.log('❌ Response does not have expected data structure');
        console.log('📊 Raw response:', JSON.stringify(responseData, null, 2));
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ Error: ${errorText}`);
    }
  } catch (error) {
    console.error(`❌ Error testing leagues:`, error.message);
  }

  // Test direct standings with known league ID
  console.log('\n📊 TESTING PREMIER LEAGUE STANDINGS');
  await testStandings(33973);

  // Test matches
  console.log('\n⚽ TESTING MATCHES');
  try {
    const endpoint = '/matches?leagueId=33973&date=2024-08-17&limit=5';
    console.log(`📡 Testing: ${API_BASE}${endpoint}`);
    
    const response = await fetch(`${API_BASE}${endpoint}`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const responseData = await response.json();
      
      // Handle both direct array and data wrapper
      const matches = responseData.data || responseData;
      const matchCount = Array.isArray(matches) ? matches.length : 0;
      
      console.log(`📊 Matches found: ${matchCount}`);
      
      if (matchCount > 0) {
        console.log(`✅ FOUND MATCHES!`);
        matches.slice(0, 3).forEach((match, i) => {
          console.log(`📊 Match ${i+1}: ${match.home_team_name || match.homeTeam?.name} vs ${match.away_team_name || match.awayTeam?.name}`);
        });
      }
    }
  } catch (error) {
    console.error(`❌ Error testing matches:`, error.message);
  }

  // Test highlights
  console.log('\n🎬 TESTING HIGHLIGHTS');
  try {
    const endpoint = '/highlights?limit=5';
    console.log(`📡 Testing: ${API_BASE}${endpoint}`);
    
    const response = await fetch(`${API_BASE}${endpoint}`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const responseData = await response.json();
      
      // Handle both direct array and data wrapper
      const highlights = responseData.data || responseData;
      const highlightCount = Array.isArray(highlights) ? highlights.length : 0;
      
      console.log(`📊 Highlights found: ${highlightCount}`);
      
      if (highlightCount > 0) {
        console.log(`✅ FOUND HIGHLIGHTS!`);
        highlights.slice(0, 3).forEach((highlight, i) => {
          console.log(`📊 Highlight ${i+1}: ${highlight.title}`);
        });
      }
    }
  } catch (error) {
    console.error(`❌ Error testing highlights:`, error.message);
  }
}

async function testStandings(leagueId) {
  try {
    const endpoint = `/standings?leagueId=${leagueId}`;
    console.log(`📡 Testing standings: ${API_BASE}${endpoint}`);
    
    const response = await fetch(`${API_BASE}${endpoint}`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const responseData = await response.json();
      
      // Handle both direct array and data wrapper
      const standings = responseData.data || responseData;
      const teamCount = Array.isArray(standings) ? standings.length : 0;
      
      console.log(`📊 Teams found: ${teamCount}`);
      
      if (teamCount > 0) {
        console.log(`✅ FOUND STANDINGS!`);
        console.log(`📊 First team: ${standings[0].team_name} (${standings[0].points} pts)`);
        console.log(`📊 Team logo: ${standings[0].team_logo}`);
      }
    }
  } catch (error) {
    console.error(`❌ Error testing standings for league ${leagueId}:`, error.message);
  }
}

testFixedApi(); 