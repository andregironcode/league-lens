import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://septerrkdnojsmtmmska.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4'
);

async function fixDatabaseAPIIds() {
  console.log('🔧 FIXING DATABASE API IDs WITH CORRECT HIGHLIGHTLY IDs...');
  
  try {
    // First, let's see what leagues we actually have
    const { data: allLeagues, error: fetchError } = await supabase
      .from('leagues')
      .select('id, name, api_id')
      .order('name');
    
    if (fetchError) {
      console.log('❌ Error fetching leagues:', fetchError);
      return;
    }
    
    console.log('\n📋 CURRENT LEAGUES IN DATABASE:');
    console.log(`Total leagues found: ${allLeagues?.length || 0}`);
    
    if (allLeagues && allLeagues.length > 0) {
      allLeagues.forEach((league, i) => {
        console.log(`${(i+1).toString().padStart(2)} - ${league.name} | API ID: ${league.api_id || 'NULL'}`);
      });
    } else {
      console.log('No leagues found in database!');
      return;
    }
    
    // Create mappings based on the actual league names we found
    const leagueNameMappings = {
      'Premier League': '33973',
      'La Liga': '119924', 
      'Serie A': '115669',
      'Ligue 1': '52695',
      'Bundesliga': '67162',
      'UEFA Champions League': '2486',
      'UEFA Europa League': '3337',
      'Liga Profesional Argentina': '109712',
      'FA Cup': '39079',
      'DFB Pokal': '69715',
      'Copa del Rey': '122477',
      'Championship': '34824',
      'Liga MX': '223746',
      'MLS': '216087',
      'Eredivisie': '75672',
      'Primeira Liga': '80778',
      'Turkish Super Lig': '173537',
      'Scottish Premiership': '153113',
      'League Cup': '41632',
      'Belgian Pro League': '123328',
      'Swiss Super League': '176941',
      'J1 League': '84182',
      'Serie B': '116520',
      'Segunda Division': '120775',
      'Coppa Italia': '117371',
      'AFC Champions League': '15251',
      'CAF Champions League': '10996',
      'CONCACAF Champions League': '14400',
      'CONCACAF Gold Cup': '19506',
      'AFC Asian Cup': '6741',
      'Africa Cup of Nations': '5890',
      'UEFA Nations League': '5039',
      'CONMEBOL Libertadores': '11847',
      'CONMEBOL Sudamericana': '10145',
      'FIFA World Cup': '1635',
      'Euro Championship': '4188',
      'Copa America': '8443',
      'FIFA Club World Cup': '13549'
    };
    
    console.log('\n🔧 UPDATING API IDs...');
    let updated = 0;
    let alreadyCorrect = 0;
    
    // Go through each league in database and try to map it
    for (const league of allLeagues) {
      const correctApiId = leagueNameMappings[league.name];
      
      if (correctApiId) {
        if (league.api_id !== correctApiId) {
          const { error } = await supabase
            .from('leagues')
            .update({ api_id: correctApiId })
            .eq('id', league.id);
          
          if (!error) {
            console.log(`✅ Updated: ${league.name} from ${league.api_id || 'NULL'} to ${correctApiId}`);
            updated++;
          } else {
            console.log(`❌ Error updating ${league.name}:`, error.message);
          }
        } else {
          console.log(`✓ Already correct: ${league.name} = ${correctApiId}`);
          alreadyCorrect++;
        }
      } else {
        console.log(`⚠️ No mapping found for: ${league.name}`);
      }
    }
    
    console.log('\n🎉 DATABASE API ID FIX COMPLETE!');
    console.log(`📊 Updated: ${updated} leagues`);
    console.log(`✓ Already correct: ${alreadyCorrect} leagues`);
    
    // Show final result
    const { data: finalSample } = await supabase
      .from('leagues')
      .select('name, api_id')
      .not('api_id', 'is', null)
      .order('name')
      .limit(15);
    
    console.log('\n📋 LEAGUES WITH API IDs (sample):');
    finalSample?.forEach(l => console.log(`- ${l.name}: ${l.api_id}`));
    
    const { count: totalWithApiIds } = await supabase
      .from('leagues')
      .select('*', { count: 'exact', head: true })
      .not('api_id', 'is', null);
    
    console.log(`\n📈 Total leagues with API IDs: ${totalWithApiIds}`);
    
  } catch (error) {
    console.log('❌ Fatal error:', error);
  }
}

fixDatabaseAPIIds().catch(console.error); 