import axios from 'axios';

const HIGHLIGHTLY_API_URL = 'https://soccer.highlightly.net';
const HIGHLIGHTLY_API_KEY = 'f1f4e3c0a7msh07b3b9d6e8c2f5a8b3c';

async function debugApiResponse() {
  console.log('🔍 DEBUGGING API RESPONSE STRUCTURE...');
  
  try {
    // Test with FIFA Club World Cup (we know it has matches)
    const testCases = [
      { name: 'FIFA Club World Cup', leagueId: 13549, date: '2025-06-21' },
      { name: 'J1 League', leagueId: 84182, date: '2025-06-21' }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n🏆 Testing ${testCase.name}...`);
      
      const url = `${HIGHLIGHTLY_API_URL}/matches?leagueId=${testCase.leagueId}&date=${testCase.date}&season=2025`;
      console.log(`🌐 URL: ${url}`);
      
      try {
        const response = await axios.get(url, {
          headers: {
            'x-api-key': HIGHLIGHTLY_API_KEY,
            'x-rapidapi-key': HIGHLIGHTLY_API_KEY,
          },
          timeout: 15000,
        });
        
        if (response.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
          const match = response.data.data[0];
          console.log(`✅ Found ${response.data.data.length} matches`);
          
          console.log('\n📊 FULL MATCH STRUCTURE:');
          console.log(JSON.stringify(match, null, 2));
          
          console.log('\n🎯 TEAM DATA ANALYSIS:');
          console.log('Match ID:', match.id);
          console.log('Teams object:', JSON.stringify(match.teams, null, 2));
          
          if (match.teams) {
            console.log('\n🏠 HOME TEAM:');
            console.log('  - ID:', match.teams.home?.id);
            console.log('  - Name:', match.teams.home?.name);
            console.log('  - Full object:', JSON.stringify(match.teams.home, null, 2));
            
            console.log('\n🚗 AWAY TEAM:');
            console.log('  - ID:', match.teams.away?.id);
            console.log('  - Name:', match.teams.away?.name);
            console.log('  - Full object:', JSON.stringify(match.teams.away, null, 2));
          }
          
          // Check if there are other fields that might contain team info
          console.log('\n🔍 OTHER POSSIBLE TEAM FIELDS:');
          Object.keys(match).forEach(key => {
            const value = match[key];
            if (key.toLowerCase().includes('team') || 
                key.toLowerCase().includes('home') || 
                key.toLowerCase().includes('away') ||
                (typeof value === 'object' && value !== null && 
                 (JSON.stringify(value).includes('team') || JSON.stringify(value).includes('home') || JSON.stringify(value).includes('away')))) {
              console.log(`  ${key}:`, JSON.stringify(value, null, 2));
            }
          });
          
        } else {
          console.log('❌ No matches found or invalid response structure');
          console.log('Response:', JSON.stringify(response.data, null, 2));
        }
        
      } catch (error) {
        console.error(`❌ API Error: ${error.message}`);
        if (error.response) {
          console.error('Status:', error.response.status);
          console.error('Data:', error.response.data);
        }
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

debugApiResponse().catch(console.error); 