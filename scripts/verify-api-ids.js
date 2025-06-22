import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://septerrkdnojsmtmmska.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4'
);

async function verifyAPIStatus() {
  console.log('🔍 VERIFYING DATABASE API IDs STATUS...');
  
  try {
    // Check leagues with API data
    const { data: leagues, error } = await supabase
      .from('leagues')
      .select('name, api_data')
      .not('api_data', 'is', null)
      .order('name');
    
    if (error) {
      console.log('❌ Error:', error);
      return;
    }
    
    console.log(`\n✅ Found ${leagues?.length || 0} leagues with API data:`);
    
    let validApiIds = 0;
    leagues?.forEach((league, i) => {
      try {
        const apiData = JSON.parse(league.api_data);
        if (apiData.highlightly_id) {
          console.log(`${(i+1).toString().padStart(2)} - ${league.name}: ${apiData.highlightly_id}`);
          validApiIds++;
        } else {
          console.log(`${(i+1).toString().padStart(2)} - ${league.name}: No highlightly_id`);
        }
      } catch (e) {
        console.log(`${(i+1).toString().padStart(2)} - ${league.name}: Invalid JSON`);
      }
    });
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`- Total leagues with API data: ${leagues?.length || 0}`);
    console.log(`- Valid Highlightly IDs: ${validApiIds}`);
    console.log(`- Ready for API fetching: ${validApiIds >= 10 ? '✅ YES' : '⚠️ NEEDS MORE'}`);
    
    // Show some key leagues
    const keyLeagues = ['Premier League', 'La Liga', 'Serie A', 'UEFA Champions League', 'Bundesliga'];
    console.log(`\n🏆 KEY LEAGUES STATUS:`);
    
    for (const keyLeague of keyLeagues) {
      const league = leagues?.find(l => l.name === keyLeague);
      if (league) {
        try {
          const apiData = JSON.parse(league.api_data);
          console.log(`✅ ${keyLeague}: ${apiData.highlightly_id || 'NO ID'}`);
        } catch (e) {
          console.log(`❌ ${keyLeague}: Invalid data`);
        }
      } else {
        console.log(`⚠️ ${keyLeague}: Not found`);
      }
    }
    
  } catch (error) {
    console.log('❌ Fatal error:', error);
  }
}

verifyAPIStatus().catch(console.error); 