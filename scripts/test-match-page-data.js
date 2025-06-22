import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://septerrkdnojsmtmmska.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4'
);

async function testMatchPageData() {
  console.log('🔍 TESTING MATCH PAGE DATA AVAILABILITY');
  console.log('='.repeat(50));

  const testMatchId = '1126857540'; // Our test match with known data
  
  try {
    console.log(`📋 Testing match ID: ${testMatchId}`);
    console.log('');

    // Test what's actually in the database
    console.log('1. 🗄️ RAW DATABASE DATA:');
    
    // Check match
    const { data: match } = await supabase
      .from('matches')
      .select('*')
      .eq('id', testMatchId)
      .single();
    
    console.log(`   Match: ${match ? '✅ Found' : '❌ Not found'}`);
    if (match) {
      console.log(`   Status: ${match.status}, Home: ${match.home_team_id}, Away: ${match.away_team_id}`);
    }

    // Check lineups
    const { data: lineups } = await supabase
      .from('match_lineups')
      .select('*')
      .eq('match_id', testMatchId);
    
    console.log(`   Lineups: ${lineups?.length || 0} records`);

    // Check events
    const { data: events } = await supabase
      .from('match_events')
      .select('*')
      .eq('match_id', testMatchId);
    
    console.log(`   Events: ${events?.length || 0} records`);

    // Check statistics
    const { data: statistics } = await supabase
      .from('match_statistics')
      .select('*')
      .eq('match_id', testMatchId);
    
    console.log(`   Statistics: ${statistics?.length || 0} records`);
    if (statistics && statistics.length > 0) {
      console.log(`   Stats structure:`, Object.keys(statistics[0]));
      if (statistics[0].statistics) {
        console.log(`   Stats data:`, {
          hasHome: !!statistics[0].statistics.home,
          hasAway: !!statistics[0].statistics.away,
          hasRawData: !!statistics[0].statistics.raw_data
        });
      }
    }

    // Check highlights
    const { data: highlights } = await supabase
      .from('highlights')
      .select('*')
      .eq('match_id', testMatchId);
    
    console.log(`   Highlights: ${highlights?.length || 0} records`);

    console.log('\n2. 🔧 SIMULATED getMatchById CALL:');
    
    // Simulate what getMatchById does
    const { data: fullMatch, error } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(id, name, logo),
        away_team:teams!matches_away_team_id_fkey(id, name, logo),
        league:leagues!matches_league_id_fkey(id, name, logo, country_name)
      `)
      .eq('id', testMatchId)
      .single();

    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
      return;
    }

    console.log(`   ✅ Match data retrieved`);
    console.log(`   Teams: ${fullMatch.home_team?.name} vs ${fullMatch.away_team?.name}`);
    console.log(`   League: ${fullMatch.league?.name}`);
    console.log(`   Flags: highlights=${fullMatch.has_highlights}, lineups=${fullMatch.has_lineups}, events=${fullMatch.has_events}`);

    console.log('\n3. 🎯 EXPECTED FRONTEND DATA:');
    console.log('   The match page expects:');
    console.log('   • match.lineups.homeTeam (for lineups tab)');
    console.log('   • match.statistics (array, for stats tab)');
    console.log('   • match.events (array, for timeline)');
    console.log('');

    console.log('4. 🔧 ISSUE DIAGNOSIS:');
    if (!lineups || lineups.length === 0) {
      console.log('   ❌ No lineups in database - automation may not have run');
    } else {
      console.log('   ✅ Lineups available in database');
    }

    if (!events || events.length === 0) {
      console.log('   ❌ No events in database - automation may not have run');
    } else {
      console.log('   ✅ Events available in database');
    }

    if (!statistics || statistics.length === 0) {
      console.log('   ❌ No statistics in database - automation may not have run');
    } else {
      console.log('   ✅ Statistics available in database');
    }

    console.log('\n5. 🚀 SOLUTION:');
    if ((lineups?.length || 0) + (events?.length || 0) + (statistics?.length || 0) === 0) {
      console.log('   🔧 Run the post-match automation to populate data:');
      console.log('   cd server && npm start');
      console.log('   The automation will detect finished matches and fetch the data');
    } else {
      console.log('   ✅ Data is available - the match page should display it');
      console.log('   🔍 Check browser console for any frontend errors');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMatchPageData().then(() => {
  console.log('\n🏁 Match page data test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test error:', error);
  process.exit(1);
}); 