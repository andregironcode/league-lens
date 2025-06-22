/**
 * Add missing leagues to reach Top 50 Football Competitions (Fixed)
 * Using actual Highlightly API IDs from the provided data
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Missing leagues from Top 50 ranking with actual Highlightly API IDs
const MISSING_LEAGUES = [
  // Major Leagues with API IDs
  { name: 'Argentine Primera División', api_id: 109712, country_name: 'Argentina', country_code: 'AR' },
  { name: 'Brazilian Série A', api_id: 61205, country_name: 'Brazil', country_code: 'BR' },
  { name: 'FA Cup', api_id: 39079, country_name: 'England', country_code: 'GB-ENG' },
  { name: 'DFB-Pokal', api_id: 69715, country_name: 'Germany', country_code: 'DE' },
  { name: 'J1 League', api_id: 84182, country_name: 'Japan', country_code: 'JP' },
  { name: 'Primeira Liga', api_id: 80778, country_name: 'Portugal', country_code: 'PT' },
  { name: 'AFCON', api_id: 5890, country_name: 'World', country_code: 'World' },
  { name: 'CONCACAF Gold Cup', api_id: 19506, country_name: 'World', country_code: 'World' },
  { name: 'CONCACAF Champions Cup', api_id: 14400, country_name: 'World', country_code: 'World' },
  { name: 'UEFA U21', api_id: 33122, country_name: 'World', country_code: 'World' },
  
  // Leagues without API IDs (will need manual research later)
  { name: 'MLS', api_id: null, country_name: 'United States', country_code: 'US' },
  { name: 'Liga MX', api_id: null, country_name: 'Mexico', country_code: 'MX' },
  { name: 'Copa del Rey', api_id: null, country_name: 'Spain', country_code: 'ES' },
  { name: 'Saudi Pro League', api_id: null, country_name: 'Saudi Arabia', country_code: 'SA' },
  { name: 'Turkish Süper Lig', api_id: null, country_name: 'Turkey', country_code: 'TR' },
  { name: 'Scottish Premiership', api_id: null, country_name: 'Scotland', country_code: 'GB-SCT' },
  { name: 'Olympic Football', api_id: null, country_name: 'World', country_code: 'World' },
  { name: 'FIFA U-20 World Cup', api_id: null, country_name: 'World', country_code: 'World' },
  { name: 'FIFA U-17 World Cup', api_id: null, country_name: 'World', country_code: 'World' },
  { name: 'Indian Super League', api_id: null, country_name: 'India', country_code: 'IN' },
  { name: 'Egyptian Premier League', api_id: null, country_name: 'Egypt', country_code: 'EG' },
  { name: 'South African PSL', api_id: null, country_name: 'South Africa', country_code: 'ZA' },
  { name: 'Russian Premier League', api_id: null, country_name: 'Russia', country_code: 'RU' },
  { name: 'UAE Pro League', api_id: null, country_name: 'UAE', country_code: 'AE' },
  { name: 'Greek Super League', api_id: null, country_name: 'Greece', country_code: 'GR' }
];

async function addMissingLeagues() {
  console.log('🔧 Adding missing leagues to reach Top 50 competitions...\n');

  try {
    // Check current league count
    const { count: currentCount } = await supabase
      .from('leagues')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Current leagues in database: ${currentCount}`);
    console.log(`🎯 Target: 50+ leagues`);
    console.log(`➕ Adding: ${MISSING_LEAGUES.length} new leagues\n`);

    let added = 0;
    let skipped = 0;

    for (const league of MISSING_LEAGUES) {
      // Check if league already exists
      const { data: existing } = await supabase
        .from('leagues')
        .select('id, name')
        .eq('name', league.name)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(`⏭️  Skipping "${league.name}" - already exists`);
        skipped++;
        continue;
      }

      // Add new league (without priority field)
      const leagueData = {
        name: league.name,
        country_name: league.country_name,
        country_code: league.country_code,
        logo: null,
        country_logo: league.country_code === 'World' 
          ? 'https://highlightly.net/soccer/images/countries/World.png'
          : `https://highlightly.net/soccer/images/countries/${league.country_code}.svg`,
        current_season: new Date().getFullYear().toString(),
        api_data: {
          highlightly_id: league.api_id,
          has_api: league.api_id !== null
        }
      };

      const { error } = await supabase
        .from('leagues')
        .insert(leagueData);

      if (error) {
        console.log(`❌ Failed to add "${league.name}": ${error.message}`);
      } else {
        console.log(`✅ Added "${league.name}" (API ID: ${league.api_id || 'TBD'})`);
        added++;
      }
    }

    // Final count
    const { count: finalCount } = await supabase
      .from('leagues')
      .select('*', { count: 'exact', head: true });

    console.log(`\n📈 Results:`);
    console.log(`   ✅ Added: ${added} leagues`);
    console.log(`   ⏭️  Skipped: ${skipped} leagues (already existed)`);
    console.log(`   📊 Total leagues: ${finalCount}`);

    if (finalCount >= 50) {
      console.log(`\n🎉 SUCCESS! We now have ${finalCount} leagues (50+ target achieved!)`);
    } else {
      console.log(`\n⚠️  Still need ${50 - finalCount} more leagues to reach 50`);
    }

    // Show leagues with API IDs ready for fetching
    const { data: allLeagues } = await supabase
      .from('leagues')
      .select('name, api_data');

    const withApiIds = allLeagues?.filter(l => 
      l.api_data?.highlightly_id !== null && 
      l.api_data?.highlightly_id !== undefined
    ) || [];

    console.log(`\n🚀 Leagues ready for fetching: ${withApiIds.length}`);
    
    if (withApiIds.length > 0) {
      console.log('\n📋 Leagues with API IDs:');
      withApiIds.forEach((league, i) => {
        console.log(`${i+1}. ${league.name} (API ID: ${league.api_data?.highlightly_id})`);
      });
    }
    
    return { added, skipped, total: finalCount };

  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

addMissingLeagues()
  .then(result => {
    if (result && result.total >= 50) {
      console.log('\n🎯 Ready to create comprehensive API mapping for all leagues!');
    }
  })
  .catch(console.error); 