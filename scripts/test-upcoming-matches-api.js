/**
 * Test upcoming matches API to debug why no matches are showing
 */

const API_BASE_URL = 'http://localhost:3001/api/highlightly';

async function testUpcomingMatchesAPI() {
  console.log('🔍 Testing Upcoming Matches API...\n');

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
  const currentYear = currentDate.getFullYear();
  
  console.log(`📅 Current Date: ${currentDate.toDateString()}`);
  console.log(`📅 Current Month: ${currentMonth}`);
  console.log(`📅 Current Year: ${currentYear}`);
  console.log(`\n🏆 Testing API endpoints for different scenarios:\n`);

  // Test leagues with different seasons
  const testScenarios = [
    { leagueId: 2486, name: 'Premier League', season: '2024' },
    { leagueId: 2486, name: 'Premier League', season: '2025' },
    { leagueId: 119924, name: 'La Liga', season: '2024' },
    { leagueId: 119924, name: 'La Liga', season: '2025' },
    { leagueId: 115669, name: 'Serie A', season: '2024' },
    { leagueId: 115669, name: 'Serie A', season: '2025' },
  ];

  // Test different date ranges
  const testDates = [];
  for (let i = -3; i <= 10; i++) {
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + i);
    testDates.push(testDate.toISOString().split('T')[0]);
  }

  console.log(`📅 Testing dates: ${testDates[0]} to ${testDates[testDates.length - 1]}\n`);

  let totalMatches = 0;
  let workingEndpoints = 0;

  for (const scenario of testScenarios) {
    console.log(`\n🏟️  Testing ${scenario.name} (ID: ${scenario.leagueId}, Season: ${scenario.season})`);
    
    let scenarioMatches = 0;
    let scenarioWorkingDates = 0;

    for (const date of testDates.slice(0, 5)) { // Test first 5 dates to avoid overwhelming
      try {
        const url = `${API_BASE_URL}/matches?leagueId=${scenario.leagueId}&date=${date}&season=${scenario.season}`;
        console.log(`   📡 Testing: ${url}`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          console.log(`   ❌ HTTP ${response.status}: ${response.statusText}`);
          continue;
        }

        const data = await response.json();
        
        if (!data.data || !Array.isArray(data.data)) {
          console.log(`   ⚠️  Invalid response format for ${date}`);
          continue;
        }

        const matches = data.data;
        if (matches.length > 0) {
          console.log(`   ✅ ${matches.length} matches found for ${date}`);
          scenarioMatches += matches.length;
          scenarioWorkingDates++;
          totalMatches += matches.length;
          
          // Show first match details
          const firstMatch = matches[0];
          console.log(`      🥅 Sample: ${firstMatch.teams?.home?.name || 'TBD'} vs ${firstMatch.teams?.away?.name || 'TBD'}`);
          console.log(`      📅 Date: ${firstMatch.date}, Status: ${firstMatch.status?.long || 'Unknown'}`);
        } else {
          console.log(`   ⚪ No matches for ${date}`);
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    if (scenarioMatches > 0) {
      workingEndpoints++;
      console.log(`   🎯 Total for ${scenario.name}: ${scenarioMatches} matches across ${scenarioWorkingDates} dates`);
    } else {
      console.log(`   💔 No matches found for ${scenario.name} in tested date range`);
    }
  }

  console.log(`\n📊 SUMMARY:`);
  console.log(`🏆 Working endpoints: ${workingEndpoints}/${testScenarios.length}`);
  console.log(`⚽ Total matches found: ${totalMatches}`);
  
  if (totalMatches === 0) {
    console.log(`\n🚨 NO MATCHES FOUND - POSSIBLE REASONS:`);
    console.log(`1. Off-season: Major European leagues are currently in off-season (June-July)`);
    console.log(`2. Wrong season: Try different season years (2024/2025)`);
    console.log(`3. Summer tournaments: Look for Euro 2024, Copa America, etc.`);
    console.log(`4. International breaks: Check for international friendlies or qualifiers`);
    console.log(`5. Pre-season: Some leagues might have pre-season friendlies`);
  }

  console.log(`\n🔄 Recommendations:`);
  console.log(`1. Check database for existing matches to see what's available`);
  console.log(`2. Test summer tournament leagues (Euro, Copa America)`);
  console.log(`3. Look for international friendlies or pre-season matches`);
  console.log(`4. Consider using different date ranges or seasons`);
}

testUpcomingMatchesAPI().catch(console.error); 