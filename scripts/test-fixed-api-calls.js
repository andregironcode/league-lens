/**
 * TEST FIXED API CALLS
 * 
 * Test the corrected API calls with proper league IDs and date format
 */

async function testFixedApiCalls() {
  console.log('🔍 TESTING FIXED API CALLS');
  console.log('='.repeat(50));

  const testLeagues = [
    { id: '33973', name: 'Premier League' },  // ✅ Working
    { id: '67162', name: 'Bundesliga' },      // ✅ Working
    { id: '52695', name: 'Ligue 1' },         // ✅ Working
    { id: '119924', name: 'La Liga (new ID)' }, // 🔄 Testing new ID
    { id: '115669', name: 'Serie A (new ID)' }, // 🔄 Testing new ID
  ];

  // Test 1: Standings with season 2024
  console.log('\n📊 TESTING STANDINGS (season=2024):');
  for (const league of testLeagues) {
    try {
      const response = await fetch(`http://localhost:3001/api/highlightly/standings?leagueId=${league.id}&season=2024`);
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${league.name}: Found ${data.groups?.[0]?.standings?.length || 0} teams`);
      } else {
        console.log(`❌ ${league.name}: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ ${league.name}: ${error.message}`);
    }
  }

  // Test 2: Matches with single date format
  console.log('\n⚽ TESTING MATCHES (single date format):');
  const testDate = '2024-08-17'; // Sample date when Premier League starts
  
  for (const league of testLeagues.slice(0, 2)) { // Test only first 2 to save API calls
    try {
      const response = await fetch(`http://localhost:3001/api/highlightly/matches?leagueId=${league.id}&date=${testDate}&season=2024&limit=10`);
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${league.name}: Found ${data.data?.length || 0} matches on ${testDate}`);
      } else {
        console.log(`❌ ${league.name}: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ ${league.name}: ${error.message}`);
    }
  }

  // Test 3: Try to find the correct Spanish/Italian league IDs
  console.log('\n🔍 SEARCHING FOR SPANISH/ITALIAN LEAGUES:');
  try {
    const response = await fetch('http://localhost:3001/api/highlightly/leagues?limit=200&countryName=Spain');
    if (response.ok) {
      const data = await response.json();
      console.log('🇪🇸 Spanish leagues found:');
      data.data?.slice(0, 5).forEach(league => {
        console.log(`   • ID: ${league.id} - ${league.name}`);
      });
    }
  } catch (error) {
    console.log(`❌ Spanish leagues search failed: ${error.message}`);
  }

  try {
    const response = await fetch('http://localhost:3001/api/highlightly/leagues?limit=200&countryName=Italy');
    if (response.ok) {
      const data = await response.json();
      console.log('🇮🇹 Italian leagues found:');
      data.data?.slice(0, 5).forEach(league => {
        console.log(`   • ID: ${league.id} - ${league.name}`);
      });
    }
  } catch (error) {
    console.log(`❌ Italian leagues search failed: ${error.message}`);
  }
}

testFixedApiCalls(); 