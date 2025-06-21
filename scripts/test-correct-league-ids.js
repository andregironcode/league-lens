/**
 * TEST CORRECT LEAGUE IDS
 * 
 * Script to find the correct league IDs for major European leagues
 * Run with: node scripts/test-correct-league-ids.js
 */

async function findCorrectLeagueIds() {
  console.log('🔍 FINDING CORRECT LEAGUE IDS');
  console.log('='.repeat(50));

  const leaguesToFind = [
    'Premier League',
    'La Liga', 
    'Serie A',
    'Bundesliga',
    'Ligue 1',
    'Champions League'
  ];

  try {
    // Get all leagues to find correct IDs
    console.log('📡 Fetching all leagues...');
    const response = await fetch('http://localhost:3001/api/highlightly/leagues?limit=100');
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Found ${data.data?.length || 0} leagues`);

    // Search for our target leagues
    const foundLeagues = {};
    
    for (const targetLeague of leaguesToFind) {
      console.log(`\n🔍 Searching for: ${targetLeague}`);
      
      const matches = data.data?.filter(league => 
        league.name.toLowerCase().includes(targetLeague.toLowerCase()) ||
        league.name.toLowerCase().includes(targetLeague.replace(' ', '').toLowerCase())
      ) || [];

      if (matches.length > 0) {
        console.log(`✅ Found ${matches.length} matches:`);
        matches.forEach(league => {
          console.log(`   • ID: ${league.id} - ${league.name} (${league.country?.name || 'Unknown'})`);
          foundLeagues[targetLeague] = foundLeagues[targetLeague] || [];
          foundLeagues[targetLeague].push({
            id: league.id,
            name: league.name,
            country: league.country?.name
          });
        });
      } else {
        console.log(`❌ No matches found for ${targetLeague}`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📋 SUMMARY - CORRECT LEAGUE IDS:');
    console.log('='.repeat(50));
    
    Object.entries(foundLeagues).forEach(([targetName, matches]) => {
      console.log(`\n${targetName}:`);
      matches.forEach(league => {
        console.log(`   ID: ${league.id} - ${league.name} (${league.country})`);
      });
    });

  } catch (error) {
    console.error('❌ Error finding league IDs:', error.message);
  }
}

// Run the test
findCorrectLeagueIds(); 