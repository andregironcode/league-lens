/**
 * TEST DIFFERENT SEASONS
 * 
 * Test different season formats to see what data is available
 */

// Proxy server configuration
const API_BASE = 'http://localhost:3001/api/highlightly';

async function testDifferentSeasons() {
  console.log('🔍 TESTING DIFFERENT SEASONS');
  console.log('='.repeat(50));

  // Test different season formats
  const seasonsToTest = [
    '2024',
    '2025', 
    '2024-25',
    '2023-24',
    '2023',
    '24-25',
    '23-24'
  ];

  for (const season of seasonsToTest) {
    try {
      const endpoint = `/standings?leagueId=33973&season=${season}`;
      console.log(`\n📡 Testing season: ${season}`);
      console.log(`📡 URL: ${API_BASE}${endpoint}`);
      
      const response = await fetch(`${API_BASE}${endpoint}`);
      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        const dataLength = Array.isArray(data) ? data.length : 0;
        console.log(`📊 Data length: ${dataLength}`);
        
        if (dataLength > 0) {
          console.log(`✅ FOUND DATA! Season ${season} has ${dataLength} teams`);
          console.log(`📊 First team: ${data[0].team_name} (${data[0].points} pts)`);
          console.log(`📊 Sample data keys:`, Object.keys(data[0]));
          break; // Found working season, stop testing
        }
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ Error testing season ${season}:`, error.message);
    }
  }

  // Also test matches endpoint with different seasons
  console.log('\n⚽ TESTING MATCHES WITH DIFFERENT SEASONS');
  for (const season of ['2025', '2024', '2023']) {
    try {
      const endpoint = `/matches?leagueId=33973&date=2024-08-17&season=${season}&limit=5`;
      console.log(`\n📡 Testing matches for season: ${season}`);
      
      const response = await fetch(`${API_BASE}${endpoint}`);
      if (response.ok) {
        const data = await response.json();
        const dataLength = Array.isArray(data) ? data.length : 0;
        console.log(`📊 Matches found: ${dataLength}`);
        
        if (dataLength > 0) {
          console.log(`✅ FOUND MATCHES! Season ${season} has matches`);
          console.log(`📊 First match: ${data[0].home_team_name} vs ${data[0].away_team_name}`);
          break;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ Error testing matches for season ${season}:`, error.message);
    }
  }

  // Test highlights without season parameter
  console.log('\n🎬 TESTING HIGHLIGHTS');
  try {
    const endpoint = `/highlights?leagueId=33973&limit=5`;
    console.log(`📡 Testing highlights: ${endpoint}`);
    
    const response = await fetch(`${API_BASE}${endpoint}`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      const dataLength = Array.isArray(data) ? data.length : 0;
      console.log(`📊 Highlights found: ${dataLength}`);
      
      if (dataLength > 0) {
        console.log(`✅ FOUND HIGHLIGHTS!`);
        console.log(`📊 First highlight: ${data[0].title}`);
      }
    }
  } catch (error) {
    console.error(`❌ Error testing highlights:`, error.message);
  }
}

testDifferentSeasons(); 