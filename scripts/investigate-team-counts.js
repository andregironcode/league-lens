/**
 * INVESTIGATE TEAM COUNTS
 * 
 * Check why Bundesliga and Ligue 1 show 18 teams instead of 20
 */

async function investigateTeamCounts() {
  console.log('🔍 INVESTIGATING TEAM COUNTS');
  console.log('='.repeat(50));

  const leagues = [
    { id: '33973', name: 'Premier League', expected: 20 },
    { id: '67162', name: 'Bundesliga', expected: 20 },
    { id: '52695', name: 'Ligue 1', expected: 20 },
    { id: '119924', name: 'La Liga', expected: 20 },
    { id: '115669', name: 'Serie A', expected: 20 },
  ];

  for (const league of leagues) {
    console.log(`\n📊 ${league.name} (ID: ${league.id})`);
    console.log('-'.repeat(30));
    
    try {
      const response = await fetch(`http://localhost:3001/api/highlightly/standings?leagueId=${league.id}&season=2024`);
      
      if (response.ok) {
        const data = await response.json();
        const standings = data.groups?.[0]?.standings || [];
        
        console.log(`✅ Found: ${standings.length} teams (Expected: ${league.expected})`);
        
        if (standings.length !== league.expected) {
          console.log(`⚠️  MISMATCH! Missing ${league.expected - standings.length} teams`);
          
          // Show all teams found
          console.log('Teams found:');
          standings.forEach((standing, index) => {
            console.log(`   ${index + 1}. ${standing.team?.name || 'Unknown'} - ${standing.points || 0} pts`);
          });
          
          // Check if there are multiple groups
          if (data.groups && data.groups.length > 1) {
            console.log(`ℹ️  Found ${data.groups.length} groups in this league`);
            data.groups.forEach((group, index) => {
              console.log(`   Group ${index + 1}: ${group.standings?.length || 0} teams`);
            });
          }
        } else {
          console.log('✅ Correct number of teams');
        }
      } else {
        console.log(`❌ API Error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  // Also check if there are different seasons available
  console.log('\n🔍 CHECKING DIFFERENT SEASONS:');
  console.log('-'.repeat(30));
  
  const seasons = ['2023', '2024', '2025'];
  const testLeague = '67162'; // Bundesliga
  
  for (const season of seasons) {
    try {
      const response = await fetch(`http://localhost:3001/api/highlightly/standings?leagueId=${testLeague}&season=${season}`);
      if (response.ok) {
        const data = await response.json();
        const teamCount = data.groups?.[0]?.standings?.length || 0;
        console.log(`Bundesliga ${season}: ${teamCount} teams`);
      } else {
        console.log(`Bundesliga ${season}: ${response.status} error`);
      }
    } catch (error) {
      console.log(`Bundesliga ${season}: Error - ${error.message}`);
    }
  }
}

investigateTeamCounts(); 