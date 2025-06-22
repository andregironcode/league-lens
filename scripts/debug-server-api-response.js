async function debugServerApiResponse() {
  console.log('🔍 DEBUGGING SERVER API RESPONSE...');
  
  try {
    // Test with FIFA Club World Cup through server proxy
    const testUrl = 'http://localhost:3001/api/highlightly/matches?leagueId=13549&date=2025-06-21&season=2025';
    console.log(`🌐 Fetching: ${testUrl}`);
    
    const response = await fetch(testUrl);
    
    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      return;
    }
    
    const data = await response.json();
    
    if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
      console.log(`✅ Found ${data.data.length} matches`);
      
      const match = data.data[0];
      console.log('\n📊 FIRST MATCH STRUCTURE:');
      console.log(JSON.stringify(match, null, 2));
      
      console.log('\n🎯 TEAM DATA ANALYSIS:');
      console.log('Match ID:', match.id);
      
      if (match.teams) {
        console.log('\n🏠 HOME TEAM:');
        console.log('  - ID:', match.teams.home?.id);
        console.log('  - Name:', match.teams.home?.name);
        console.log('  - Full home object:', JSON.stringify(match.teams.home, null, 2));
        
        console.log('\n🚗 AWAY TEAM:');
        console.log('  - ID:', match.teams.away?.id);
        console.log('  - Name:', match.teams.away?.name);
        console.log('  - Full away object:', JSON.stringify(match.teams.away, null, 2));
      } else {
        console.log('❌ No teams object found');
      }
      
      // Check all top-level keys for team-related data
      console.log('\n🔍 ALL MATCH FIELDS:');
      Object.keys(match).forEach(key => {
        const value = match[key];
        console.log(`  ${key}: ${typeof value} = ${JSON.stringify(value).substring(0, 100)}...`);
      });
      
      // Look for any field that might contain team IDs or names
      console.log('\n🔍 POSSIBLE TEAM FIELDS:');
      Object.keys(match).forEach(key => {
        const value = match[key];
        const valueStr = JSON.stringify(value).toLowerCase();
        if (key.toLowerCase().includes('team') || 
            key.toLowerCase().includes('home') || 
            key.toLowerCase().includes('away') ||
            valueStr.includes('team') ||
            valueStr.includes('home') ||
            valueStr.includes('away')) {
          console.log(`  🎯 ${key}:`, JSON.stringify(value, null, 2));
        }
      });
      
    } else {
      console.log('❌ No matches found or invalid response');
      console.log('Response:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugServerApiResponse().catch(console.error); 