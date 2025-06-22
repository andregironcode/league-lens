import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://septerrkdnojsmtmmska.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4'
);

async function addMissingLeaguesTo50() {
  console.log('🎯 ADDING MISSING LEAGUES TO REACH 50 TOTAL...');
  
  try {
    // Check current status
    const { count: totalLeagues } = await supabase.from('leagues').select('*', { count: 'exact', head: true });
    const { count: validApiIds } = await supabase.from('leagues').select('*', { count: 'exact', head: true }).not('api_data', 'is', null);
    
    console.log('\n📊 CURRENT STATUS:');
    console.log(`- Total leagues in database: ${totalLeagues}`);
    console.log(`- Leagues with valid API IDs: ${validApiIds}`);
    console.log(`- Missing to reach 50 total: ${Math.max(0, 50 - totalLeagues)}`);
    
    if (totalLeagues >= 50) {
      console.log('✅ Already have 50+ leagues!');
      return;
    }
    
    // Additional leagues from your Highlightly data to reach 50
    const additionalLeagues = [
      // From your data - more leagues to reach 50
      {
        id: 'serie-b-italy',
        name: 'Serie B',
        logo: 'https://highlightly.net/soccer/images/leagues/116520.png',
        country_code: 'IT',
        country_name: 'Italy',
        country_logo: 'https://highlightly.net/soccer/images/countries/IT.svg',
        priority: 3,
        current_season: '2024',
        api_data: JSON.stringify({
          highlightly_id: '116520',
          last_updated: new Date().toISOString(),
          source: 'user_highlightly_data'
        })
      },
      {
        id: 'segunda-division-spain',
        name: 'Segunda División',
        logo: 'https://highlightly.net/soccer/images/leagues/120775.png',
        country_code: 'ES',
        country_name: 'Spain',
        country_logo: 'https://highlightly.net/soccer/images/countries/ES.svg',
        priority: 3,
        current_season: '2024',
        api_data: JSON.stringify({
          highlightly_id: '120775',
          last_updated: new Date().toISOString(),
          source: 'user_highlightly_data'
        })
      },
      {
        id: 'ligue-2-france',
        name: 'Ligue 2',
        logo: 'https://highlightly.net/soccer/images/leagues/53546.png',
        country_code: 'FR',
        country_name: 'France',
        country_logo: 'https://highlightly.net/soccer/images/countries/FR.svg',
        priority: 3,
        current_season: '2024',
        api_data: JSON.stringify({
          highlightly_id: '53546',
          last_updated: new Date().toISOString(),
          source: 'user_highlightly_data'
        })
      },
      {
        id: '2-bundesliga-germany',
        name: '2. Bundesliga',
        logo: 'https://highlightly.net/soccer/images/leagues/68013.png',
        country_code: 'DE',
        country_name: 'Germany',
        country_logo: 'https://highlightly.net/soccer/images/countries/DE.svg',
        priority: 3,
        current_season: '2024',
        api_data: JSON.stringify({
          highlightly_id: '68013',
          last_updated: new Date().toISOString(),
          source: 'user_highlightly_data'
        })
      },
      {
        id: 'eerste-divisie-netherlands',
        name: 'Eerste Divisie',
        logo: 'https://highlightly.net/soccer/images/leagues/76523.png',
        country_code: 'NL',
        country_name: 'Netherlands',
        country_logo: 'https://highlightly.net/soccer/images/countries/NL.svg',
        priority: 3,
        current_season: '2024',
        api_data: JSON.stringify({
          highlightly_id: '76523',
          last_updated: new Date().toISOString(),
          source: 'user_highlightly_data'
        })
      },
      {
        id: 'segunda-liga-portugal',
        name: 'Segunda Liga',
        logo: 'https://highlightly.net/soccer/images/leagues/81629.png',
        country_code: 'PT',
        country_name: 'Portugal',
        country_logo: 'https://highlightly.net/soccer/images/countries/PT.svg',
        priority: 3,
        current_season: '2024',
        api_data: JSON.stringify({
          highlightly_id: '81629',
          last_updated: new Date().toISOString(),
          source: 'user_highlightly_data'
        })
      },
      {
        id: 'j2-league-japan',
        name: 'J2 League',
        logo: 'https://highlightly.net/soccer/images/leagues/85033.png',
        country_code: 'JP',
        country_name: 'Japan',
        country_logo: 'https://highlightly.net/soccer/images/countries/JP.svg',
        priority: 3,
        current_season: '2024',
        api_data: JSON.stringify({
          highlightly_id: '85033',
          last_updated: new Date().toISOString(),
          source: 'user_highlightly_data'
        })
      },
      {
        id: 'eliteserien-norway',
        name: 'Eliteserien',
        logo: 'https://highlightly.net/soccer/images/leagues/88437.png',
        country_code: 'NO',
        country_name: 'Norway',
        country_logo: 'https://highlightly.net/soccer/images/countries/NO.svg',
        priority: 3,
        current_season: '2024',
        api_data: JSON.stringify({
          highlightly_id: '88437',
          last_updated: new Date().toISOString(),
          source: 'user_highlightly_data'
        })
      },
      {
        id: 'ekstraklasa-poland',
        name: 'Ekstraklasa',
        logo: 'https://highlightly.net/soccer/images/leagues/90990.png',
        country_code: 'PL',
        country_name: 'Poland',
        country_logo: 'https://highlightly.net/soccer/images/countries/PL.svg',
        priority: 3,
        current_season: '2024',
        api_data: JSON.stringify({
          highlightly_id: '90990',
          last_updated: new Date().toISOString(),
          source: 'user_highlightly_data'
        })
      },
      {
        id: 'allsvenskan-sweden',
        name: 'Allsvenskan',
        logo: 'https://highlightly.net/soccer/images/leagues/96947.png',
        country_code: 'SE',
        country_name: 'Sweden',
        country_logo: 'https://highlightly.net/soccer/images/countries/SE.svg',
        priority: 3,
        current_season: '2024',
        api_data: JSON.stringify({
          highlightly_id: '96947',
          last_updated: new Date().toISOString(),
          source: 'user_highlightly_data'
        })
      },
      {
        id: 'superliga-denmark',
        name: 'Superliga',
        logo: 'https://highlightly.net/soccer/images/leagues/102053.png',
        country_code: 'DK',
        country_name: 'Denmark',
        country_logo: 'https://highlightly.net/soccer/images/countries/DK.svg',
        priority: 3,
        current_season: '2024',
        api_data: JSON.stringify({
          highlightly_id: '102053',
          last_updated: new Date().toISOString(),
          source: 'user_highlightly_data'
        })
      }
    ];
    
    console.log(`\n🔄 Adding ${Math.min(additionalLeagues.length, 50 - totalLeagues)} leagues...`);
    
    let added = 0;
    const neededLeagues = 50 - totalLeagues;
    
    for (let i = 0; i < Math.min(additionalLeagues.length, neededLeagues); i++) {
      const league = additionalLeagues[i];
      
      // Check if league already exists
      const { data: existing } = await supabase
        .from('leagues')
        .select('id')
        .eq('name', league.name)
        .limit(1);
      
      if (!existing || existing.length === 0) {
        const { error } = await supabase
          .from('leagues')
          .insert(league);
        
        if (!error) {
          console.log(`✅ Added: ${league.name} (${league.country_name}) - API ID: ${JSON.parse(league.api_data).highlightly_id}`);
          added++;
        } else {
          console.log(`❌ Error adding ${league.name}:`, error.message);
        }
      } else {
        console.log(`⚠️ Already exists: ${league.name}`);
      }
    }
    
    // Final check
    const { count: finalTotal } = await supabase.from('leagues').select('*', { count: 'exact', head: true });
    const { count: finalValidApiIds } = await supabase.from('leagues').select('*', { count: 'exact', head: true }).not('api_data', 'is', null);
    
    console.log('\n🎉 FINAL RESULTS:');
    console.log(`📊 Total leagues: ${finalTotal}`);
    console.log(`✅ Valid API IDs: ${finalValidApiIds}`);
    console.log(`🆕 Added: ${added} new leagues`);
    console.log(finalTotal >= 50 ? '🎯 TARGET ACHIEVED!' : `⚠️ Still need ${50 - finalTotal} more leagues`);
    
  } catch (error) {
    console.log('❌ Fatal error:', error);
  }
}

addMissingLeaguesTo50().catch(console.error); 