/**
 * TEST STANDINGS WITH SEASON
 * 
 * Test standings endpoint with proper season parameter
 */

// Proxy server configuration
const API_BASE = 'http://localhost:3001/api/highlightly';

async function testStandingsWithSeason() {
  console.log('🔍 TESTING STANDINGS WITH SEASON PARAMETER');
  console.log('='.repeat(50));

  // Test different season formats for Premier League
  const seasonsToTest = [2024, 2025, 2023];
  const leagueId = 33973; // Premier League

  for (const season of seasonsToTest) {
    console.log(`\n📊 Testing season: ${season}`);
    try {
      const endpoint = `/standings?leagueId=${leagueId}&season=${season}`;
      console.log(`📡 Testing: ${API_BASE}${endpoint}`);
      
      const response = await fetch(`${API_BASE}${endpoint}`);
      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const responseData = await response.json();
        
        // Handle data wrapper
        const standings = responseData.data || responseData;
        const teamCount = Array.isArray(standings) ? standings.length : 0;
        
        console.log(`📊 Teams found: ${teamCount}`);
        
        if (teamCount > 0) {
          console.log(`✅ FOUND STANDINGS FOR SEASON ${season}!`);
          console.log(`📊 First team: ${standings[0].team_name} (${standings[0].points} pts)`);
          console.log(`📊 Position: ${standings[0].position}`);
          console.log(`📊 Team logo: ${standings[0].team_logo ? 'YES' : 'NO'}`);
          
          // Test a few more teams
          if (teamCount > 3) {
            console.log(`📊 Top 3 teams:`);
            standings.slice(0, 3).forEach((team, i) => {
              console.log(`   ${i+1}. ${team.team_name} - ${team.points} pts`);
            });
          }
          
          return season; // Return working season
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ Error: ${errorText.substring(0, 200)}`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ Error testing season ${season}:`, error.message);
    }
  }

  console.log('\n❌ No working season found for standings');
  return null;
}

async function testHighlightsWithParams() {
  console.log('\n🎬 TESTING HIGHLIGHTS WITH DIFFERENT PARAMETERS');
  console.log('='.repeat(50));

  // Test highlights with different parameter combinations
  const testCases = [
    '/highlights?limit=5',
    '/highlights?leagueId=33973&limit=5',
    '/highlights?season=2024&limit=5',
    '/highlights?leagueId=33973&season=2024&limit=5'
  ];

  for (const endpoint of testCases) {
    console.log(`\n📡 Testing: ${API_BASE}${endpoint}`);
    
    try {
      const response = await fetch(`${API_BASE}${endpoint}`);
      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const responseData = await response.json();
        
        // Handle data wrapper
        const highlights = responseData.data || responseData;
        const highlightCount = Array.isArray(highlights) ? highlights.length : 0;
        
        console.log(`📊 Highlights found: ${highlightCount}`);
        
        if (highlightCount > 0) {
          console.log(`✅ FOUND HIGHLIGHTS!`);
          highlights.slice(0, 2).forEach((highlight, i) => {
            console.log(`📊 Highlight ${i+1}: ${highlight.title}`);
            console.log(`   URL: ${highlight.url}`);
          });
          break; // Found working endpoint
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ Error: ${errorText.substring(0, 100)}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ Error:`, error.message);
    }
  }
}

async function runTests() {
  const workingSeason = await testStandingsWithSeason();
  await testHighlightsWithParams();
  
  if (workingSeason) {
    console.log(`\n🎉 SUCCESS! Working season found: ${workingSeason}`);
    console.log('📊 Ready to update sync scripts with correct parameters!');
  }
}

runTests(); 