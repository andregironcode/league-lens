/**
 * Add missing leagues to reach Top 50 Football Competitions
 * Using actual Highlightly API IDs from the provided data
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Missing leagues from Top 50 ranking with actual Highlightly API IDs
const MISSING_LEAGUES = [
  // Tier 2 - Major Leagues
  { name: 'MLS', api_id: null, country_name: 'United States', country_code: 'US', priority: 16 },
  { name: 'Argentine Primera División', api_id: 109712, country_name: 'Argentina', country_code: 'AR', priority: 17 },
  { name: 'Brazilian Série A', api_id: 61205, country_name: 'Brazil', country_code: 'BR', priority: 18 },
  { name: 'Liga MX', api_id: null, country_name: 'Mexico', country_code: 'MX', priority: 19 },
  
  // Tier 2 - Cup Competitions  
  { name: 'FA Cup', api_id: 39079, country_name: 'England', country_code: 'GB-ENG', priority: 13 },
  { name: 'DFB-Pokal', api_id: 69715, country_name: 'Germany', country_code: 'DE', priority: 28 },
  { name: 'Copa del Rey', api_id: null, country_name: 'Spain', country_code: 'ES', priority: 29 },
  
  // Tier 3 - European Leagues
  { name: 'Saudi Pro League', api_id: null, country_name: 'Saudi Arabia', country_code: 'SA', priority: 30 },
  { name: 'Turkish Süper Lig', api_id: null, country_name: 'Turkey', country_code: 'TR', priority: 36 },
  { name: 'Scottish Premiership', api_id: null, country_name: 'Scotland', country_code: 'GB-SCT', priority: 37 },
  
  // Tier 4 - Continental Tournaments
  { name: 'AFCON', api_id: 5890, country_name: 'World', country_code: 'World', priority: 39 },
  { name: 'CONCACAF Gold Cup', api_id: 19506, country_name: 'World', country_code: 'World', priority: 40 },
  { name: 'CONCACAF Champions Cup', api_id: 14400, country_name: 'World', country_code: 'World', priority: 43 },
  
  // Tier 5 - Youth & Other Competitions
  { name: 'UEFA U21', api_id: 33122, country_name: 'World', country_code: 'World', priority: 46 },
  { name: 'Olympic Football', api_id: null, country_name: 'World', country_code: 'World', priority: 47 },
  { name: 'FIFA U-20 World Cup', api_id: null, country_name: 'World', country_code: 'World', priority: 48 },
  { name: 'FIFA U-17 World Cup', api_id: null, country_name: 'World', country_code: 'World', priority: 49 },
  { name: 'Indian Super League', api_id: null, country_name: 'India', country_code: 'IN', priority: 50 },
  { name: 'Egyptian Premier League', api_id: null, country_name: 'Egypt', country_code: 'EG', priority: 51 },
  { name: 'South African PSL', api_id: null, country_name: 'South Africa', country_code: 'ZA', priority: 52 },
  { name: 'Russian Premier League', api_id: null, country_name: 'Russia', country_code: 'RU', priority: 53 },
  { name: 'UAE Pro League', api_id: null, country_name: 'UAE', country_code: 'AE', priority: 54 },
  { name: 'Greek Super League', api_id: null, country_name: 'Greece', country_code: 'GR', priority: 55 },
  
  // Additional from Highlightly data
  { name: 'J1 League', api_id: 84182, country_name: 'Japan', country_code: 'JP', priority: 56 },
  { name: 'Primeira Liga', api_id: 80778, country_name: 'Portugal', country_code: 'PT', priority: 32 }
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

      // Add new league
      const leagueData = {
        name: league.name,
        country_name: league.country_name,
        country_code: league.country_code,
        priority: league.priority,
        logo: null,
        country_logo: league.country_code === 'World' 
          ? 'https://highlightly.net/soccer/images/countries/World.png'
          : `https://highlightly.net/soccer/images/countries/${league.country_code}.svg`,
        current_season: new Date().getFullYear().toString(),
        api_data: {
          highlightly_id: league.api_id,
          tier: league.priority <= 10 ? 1 : league.priority <= 20 ? 2 : league.priority <= 30 ? 3 : league.priority <= 40 ? 4 : 5
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
    const { data: leaguesWithApiIds } = await supabase
      .from('leagues')
      .select('name, api_data')
      .not('api_data->highlightly_id', 'is', null);

    console.log(`\n🚀 Leagues ready for fetching: ${leaguesWithApiIds?.length || 0}`);
    
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