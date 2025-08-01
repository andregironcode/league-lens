async function testDatabaseAPI() {
  try {
    // Test 1: Get matches for a specific date
    console.log('[Test] Testing database API for date 2024-12-15...');
    const response1 = await fetch('http://localhost:3000/api/database-matches?date=2024-12-15&limit=3');
    const data1 = await response1.json();
    
    console.log('[Test] Response status:', response1.status);
    console.log('[Test] Number of matches:', data1.data?.length || 0);
    
    if (data1.data && data1.data.length > 0) {
      console.log('[Test] First match:');
      const match = data1.data[0];
      console.log(`  - ${match.homeTeam?.name || 'Unknown'} vs ${match.awayTeam?.name || 'Unknown'}`);
      console.log(`  - League: ${match.league?.name || 'Unknown'}`);
      console.log(`  - Date: ${match.date}`);
    }
    
    // Test 2: Get matches for date range
    console.log('\n[Test] Testing database API for date range...');
    const response2 = await fetch('http://localhost:3000/api/database-matches?startDate=2024-12-14&endDate=2024-12-16&limit=5');
    const data2 = await response2.json();
    
    console.log('[Test] Number of matches in range:', data2.data?.length || 0);
    
  } catch (error) {
    console.error('[Test] Error:', error.message);
    console.log('[Test] Make sure the dev server is running on port 3000');
  }
}

testDatabaseAPI();