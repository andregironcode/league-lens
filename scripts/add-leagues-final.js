/**
 * Add missing leagues to reach Top 50 Football Competitions (Final)
 * Using correct schema with string IDs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Missing leagues from Top 50 ranking with actual Highlightly API IDs
const MISSING_LEAGUES = [
  // Major Leagues with API IDs from Highlightly data
  { id: '109712', name: 'Liga Profesional Argentina', api_id: 109712, country_name: 'Argentina', country_code: 'AR' },
  { id: '61205', name: 'Serie A', api_id: 61205, country_name: 'Brazil', country_code: 'BR' },
  { id: '39079', name: 'FA Cup', api_id: 39079, country_name: 'England', country_code: 'GB-ENG' },
  { id: '69715', name: 'DFB Pokal', api_id: 69715, country_name: 'Germany', country_code: 'DE' },
  { id: '84182', name: 'J1 League', api_id: 84182, country_name: 'Japan', country_code: 'JP' },
  { id: '80778', name: 'Primeira Liga', api_id: 80778, country_name: 'Portugal', country_code: 'PT' },
  { id: '5890', name: 'Africa Cup of Nations', api_id: 5890, country_name: 'World', country_code: 'World' },
  { id: '19506', name: 'CONCACAF Gold Cup', api_id: 19506, country_name: 'World', country_code: 'World' },
  { id: '14400', name: 'CONCACAF Champions League', api_id: 14400, country_name: 'World', country_code: 'World' },
  { id: '33122', name: 'UEFA U21 Championship', api_id: 33122, country_name: 'World', country_code: 'World' },
  { id: '15251', name: 'AFC Champions League', api_id: 15251, country_name: 'World', country_code: 'World' },
  { id: '1635', name: 'World Cup', api_id: 1635, country_name: 'World', country_code: 'World' },
  
  // Additional leagues for comprehensive coverage
  { id: '500001', name: 'MLS', api_id: null, country_name: 'United States', country_code: 'US' },
  { id: '500002', name: 'Liga MX', api_id: null, country_name: 'Mexico', country_code: 'MX' },
  { id: '500003', name: 'Copa del Rey', api_id: null, country_name: 'Spain', country_code: 'ES' },
  { id: '500004', name: 'Saudi Pro League', api_id: null, country_name: 'Saudi Arabia', country_code: 'SA' },
  { id: '500005', name: 'Turkish Süper Lig', api_id: null, country_name: 'Turkey', country_code: 'TR' },
  { id: '500006', name: 'Scottish Premiership', api_id: null, country_name: 'Scotland', country_code: 'GB-SCT' },
  { id: '500007', name: 'Indian Super League', api_id: null, country_name: 'India', country_code: 'IN' },
  { id: '500008', name: 'Egyptian Premier League', api_id: null, country_name: 'Egypt', country_code: 'EG' },
  { id: '500009', name: 'South African PSL', api_id: null, country_name: 'South Africa', country_code: 'ZA' },
  { id: '500010', name: 'Russian Premier League', api_id: null, country_name: 'Russia', country_code: 'RU' },
  { id: '500011', name: 'UAE Pro League', api_id: null, country_name: 'UAE', country_code: 'AE' },
  { id: '500012', name: 'Greek Super League', api_id: null, country_name: 'Greece', country_code: 'GR' },
  { id: '500013', name: 'Olympic Football', api_id: null, country_name: 'World', country_code: 'World' },
  { id: '500014', name: 'FIFA U-20 World Cup', api_id: null, country_name: 'World', country_code: 'World' },
  { id: '500015', name: 'FIFA U-17 World Cup', api_id: null, country_name: 'World', country_code: 'World' }
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
      // Check if league already exists by name
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

      // Check if ID already exists
      const { data: existingId } = await supabase
        .from('leagues')
        .select('id')
        .eq('id', league.id)
        .limit(1);

      if (existingId && existingId.length > 0) {
        console.log(`⏭️  Skipping "${league.name}" - ID already exists`);
        skipped++;
        continue;
      }

      // Add new league with correct schema
      const leagueData = {
        id: league.id,
        name: league.name,
        country_name: league.country_name,
        country_code: league.country_code,
        priority: false, // boolean field
        logo: league.api_id 
          ? `https://highlightly.net/soccer/images/leagues/${league.api_id}.png`
          : null,
        country_logo: league.country_code === 'World' 
          ? 'https://highlightly.net/soccer/images/countries/World.png'
          : `https://highlightly.net/soccer/images/countries/${league.country_code}.svg`,
        current_season: new Date().getFullYear().toString(),
        api_data: {
          id: league.api_id,
          name: league.name,
          highlightly_id: league.api_id,
          has_api: league.api_id !== null,
          country: {
            name: league.country_name
          }
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
    
    return { added, skipped, total: finalCount, withApiIds: withApiIds.length };

  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

addMissingLeagues()
  .then(result => {
    if (result && result.total >= 50) {
      console.log('\n🎯 Ready to create comprehensive API mapping and test fetch!');
      console.log(`💡 ${result.withApiIds} leagues have API IDs and can fetch matches`);
    }
  })
  .catch(console.error); 