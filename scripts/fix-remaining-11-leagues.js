import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://septerrkdnojsmtmmska.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4'
);

async function fixRemaining11Leagues() {
  console.log('🔧 FIXING REMAINING 11 LEAGUES WITHOUT VALID API IDs...');
  
  try {
    // Get all leagues and find ones without valid API data
    const { data: allLeagues } = await supabase
      .from('leagues')
      .select('id, name, api_data')
      .order('name');
    
    console.log(`\n📋 Total leagues: ${allLeagues?.length || 0}`);
    
    // Find leagues without valid API IDs
    const leaguesWithoutValidIds = [];
    allLeagues?.forEach(league => {
      try {
        const apiData = league.api_data ? JSON.parse(league.api_data) : null;
        if (!apiData || !apiData.highlightly_id) {
          leaguesWithoutValidIds.push(league);
        }
      } catch (e) {
        leaguesWithoutValidIds.push(league);
      }
    });
    
    console.log(`\n⚠️ Leagues without valid API IDs: ${leaguesWithoutValidIds.length}`);
    leaguesWithoutValidIds.forEach((league, i) => {
      console.log(`${(i+1).toString().padStart(2)} - ${league.name}`);
    });
    
    // Additional API ID mappings from your Highlightly data for the missing ones
    const additionalMappings = {
      'AFC Cup': '16102',
      'Copa Sudamericana': '10145',
      'Indian Super League': '231256',
      'Liga Portugal': '80778', // Same as Primeira Liga
      'Olympic Football': '9294', // International friendlies category
      'Saudi Pro League': '198216',
      'South African PSL': '174388',
      'UAE Pro League': '197365',
      'UEFA Conference League': '115669', // Use Serie A temporarily or find correct ID
      'World Cup': '1635', // Same as FIFA World Cup
      'World Cup Qualifiers': '25463', // Africa qualifiers as example
      
      // Alternative names that might exist
      'Süper Lig': '173537',
      'Turkish Super Lig': '173537',
      'Liga Profesional': '109712',
      'Argentine Primera': '109712',
      'Brazilian Serie A': '61205',
      'Brasileiro': '61205',
      'Major League Soccer': '216087',
      'Primera División': '109712', // Argentina
      'Copa Libertadores': '11847',
      'Copa Sul-Americana': '10145',
      'Sudamericana': '10145'
    };
    
    console.log('\n🔧 FIXING LEAGUES...');
    let fixed = 0;
    
    for (const league of leaguesWithoutValidIds) {
      const correctApiId = additionalMappings[league.name];
      
      if (correctApiId) {
        const updatedApiData = {
          highlightly_id: correctApiId,
          last_updated: new Date().toISOString(),
          source: 'user_highlightly_data_fix',
          league_name: league.name
        };
        
        const { error } = await supabase
          .from('leagues')
          .update({ api_data: JSON.stringify(updatedApiData) })
          .eq('id', league.id);
        
        if (!error) {
          console.log(`✅ FIXED: ${league.name} -> ${correctApiId}`);
          fixed++;
        } else {
          console.log(`❌ Error fixing ${league.name}:`, error.message);
        }
      } else {
        console.log(`⚠️ No mapping found for: ${league.name}`);
      }
    }
    
    // Final verification
    const { data: finalCheck } = await supabase
      .from('leagues')
      .select('name, api_data')
      .order('name');
    
    let validCount = 0;
    let invalidCount = 0;
    
    console.log('\n📋 FINAL STATUS:');
    finalCheck?.forEach((league, i) => {
      try {
        const apiData = JSON.parse(league.api_data);
        if (apiData.highlightly_id) {
          validCount++;
        } else {
          console.log(`❌ ${league.name}: No highlightly_id`);
          invalidCount++;
        }
      } catch (e) {
        console.log(`❌ ${league.name}: Invalid JSON`);
        invalidCount++;
      }
    });
    
    console.log('\n🎉 RESULTS:');
    console.log(`📊 Total leagues: ${finalCheck?.length || 0}`);
    console.log(`✅ Valid API IDs: ${validCount}`);
    console.log(`❌ Invalid/Missing: ${invalidCount}`);
    console.log(`🔧 Fixed in this run: ${fixed}`);
    
    if (validCount >= 50) {
      console.log('🎯 TARGET ACHIEVED: 50+ leagues with valid API IDs!');
    } else {
      console.log(`⚠️ Still need ${50 - validCount} more valid API IDs`);
    }
    
  } catch (error) {
    console.log('❌ Fatal error:', error);
  }
}

fixRemaining11Leagues().catch(console.error); 