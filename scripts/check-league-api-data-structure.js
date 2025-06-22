import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://septerrkdnojsmtmmska.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4'
);

async function checkLeagueApiDataStructure() {
  console.log('🔍 CHECKING LEAGUE API DATA STRUCTURE...');
  
  try {
    // Get sample leagues with API data
    const { data: leagues } = await supabase
      .from('leagues')
      .select('id, name, api_data')
      .not('api_data', 'is', null)
      .limit(10);
    
    if (!leagues || leagues.length === 0) {
      console.log('❌ No leagues with API data found');
      return;
    }
    
    console.log(`📊 Found ${leagues.length} leagues with API data`);
    
    leagues.forEach((league, index) => {
      console.log(`\n🏆 League ${index + 1}: ${league.name} (${league.id})`);
      console.log('📊 API Data structure:');
      console.log(JSON.stringify(league.api_data, null, 2));
      
      // Check for various possible ID fields
      const apiData = league.api_data;
      console.log('\n🔍 Possible ID fields:');
      
      if (apiData.highlightly_id) {
        console.log(`  ✅ highlightly_id: ${apiData.highlightly_id}`);
      }
      if (apiData.id) {
        console.log(`  ✅ id: ${apiData.id}`);
      }
      if (apiData.league_id) {
        console.log(`  ✅ league_id: ${apiData.league_id}`);
      }
      if (apiData.external_id) {
        console.log(`  ✅ external_id: ${apiData.external_id}`);
      }
      
      // Check all keys for anything that might be an ID
      Object.keys(apiData).forEach(key => {
        const value = apiData[key];
        if (key.toLowerCase().includes('id') && (typeof value === 'string' || typeof value === 'number')) {
          console.log(`  🎯 ${key}: ${value}`);
        }
      });
      
      console.log('---');
    });
    
    // Also check what the league primary IDs look like
    console.log('\n📊 League primary IDs vs API data:');
    leagues.forEach(league => {
      const apiData = league.api_data;
      const possibleApiId = apiData.highlightly_id || apiData.id || league.id;
      console.log(`  ${league.name}: DB_ID=${league.id}, API_ID=${possibleApiId}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkLeagueApiDataStructure().catch(console.error); 