import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugLeagueMatches() {
  console.log('🔍 DEBUGGING LEAGUE MATCHES ISSUE');
  console.log('='.repeat(50));
  
  // First, let's see what leagues we have
  console.log('\n🏆 Available Leagues:');
  const { data: leagues, error: leaguesError } = await supabase
    .from('leagues')
    .select('id, name, country_name');
  
  if (leaguesError) {
    console.log('❌ Error fetching leagues:', leaguesError);
    return;
  }
  
  leagues?.forEach(league => {
    console.log(`  • ${league.name} (ID: ${league.id}) - ${league.country_name}`);
  });
  
  // Pick the first league to test with
  const testLeague = leagues?.[0];
  if (!testLeague) {
    console.log('❌ No leagues found!');
    return;
  }
  
  console.log(`\n🎯 Testing with league: ${testLeague.name} (ID: ${testLeague.id})`);
  
  // Check if recent_matches_view exists
  console.log('\n📋 Checking recent_matches_view...');
  const { data: viewData, error: viewError } = await supabase
    .from('recent_matches_view')
    .select('*')
    .eq('league_id', testLeague.id)
    .limit(5);
  
  if (viewError) {
    console.log('❌ recent_matches_view error:', viewError);
    console.log('   This view might not exist. Let\'s check raw matches table instead...');
    
    // Check raw matches table
    console.log('\n📋 Checking raw matches table...');
    const { data: matchesData, error: matchesError } = await supabase
      .from('matches')
      .select(`
        id,
        match_date,
        match_time,
        status,
        home_score,
        away_score,
        season,
        league_id,
        home_team:teams!matches_home_team_id_fkey(id, name),
        away_team:teams!matches_away_team_id_fkey(id, name)
      `)
      .eq('league_id', testLeague.id)
      .limit(10);
    
    if (matchesError) {
      console.log('❌ Raw matches table error:', matchesError);
      return;
    }
    
    console.log(`✅ Found ${matchesData?.length || 0} matches in raw table:`);
    matchesData?.forEach(match => {
      console.log(`  • ${match.home_team?.name} ${match.home_score}-${match.away_score} ${match.away_team?.name}`);
      console.log(`    Date: ${match.match_date}, Season: ${match.season}, Status: ${match.status}`);
    });
    
  } else {
    console.log(`✅ Found ${viewData?.length || 0} matches in recent_matches_view:`);
    viewData?.forEach(match => {
      console.log(`  • ${match.home_team_name} ${match.home_score}-${match.away_score} ${match.away_team_name}`);
      console.log(`    Date: ${match.match_date}, Season: ${match.season}`);
    });
  }
  
  // Test the actual service function
  console.log('\n🧪 Testing supabaseDataService.getMatchesForLeague...');
  
  // Import the service
  try {
    const { supabaseDataService } = await import('../src/services/supabaseDataService.ts');
    
    const matches = await supabaseDataService.getMatchesForLeague(testLeague.id.toString(), '2024');
    console.log(`✅ Service returned ${matches?.length || 0} matches for season 2024`);
    
    if (matches && matches.length > 0) {
      console.log('Sample matches:');
      matches.slice(0, 5).forEach(match => {
        console.log(`  • ${match.homeTeam?.name} ${match.score?.home}-${match.score?.away} ${match.awayTeam?.name}`);
        console.log(`    Date: ${match.date}, Status: ${match.status}`);
      });
    }
    
    // Also test without season filter
    const allMatches = await supabaseDataService.getMatchesForLeague(testLeague.id.toString());
    console.log(`✅ Service returned ${allMatches?.length || 0} matches without season filter`);
    
  } catch (serviceError) {
    console.log('❌ Error testing service:', serviceError);
  }
  
  // Check what seasons we have in the data
  console.log('\n📅 Available seasons in matches:');
  const { data: seasonData, error: seasonError } = await supabase
    .from('matches')
    .select('season')
    .eq('league_id', testLeague.id);
  
  if (!seasonError && seasonData) {
    const uniqueSeasons = [...new Set(seasonData.map(m => m.season))].sort();
    console.log(`  Available seasons: ${uniqueSeasons.join(', ')}`);
  }
  
  console.log('\n🎯 DIAGNOSIS:');
  console.log('='.repeat(30));
  
  if (viewError) {
    console.log('❌ ISSUE: recent_matches_view does not exist or is not accessible');
    console.log('💡 SOLUTION: Either create the view or modify the service to use raw tables');
  } else if (!viewData || viewData.length === 0) {
    console.log('❌ ISSUE: recent_matches_view exists but returns no data for this league');
    console.log('💡 SOLUTION: Check the view definition and data population');
  } else {
    console.log('✅ Data seems to be available. Issue might be in the frontend.');
  }
}

debugLeagueMatches(); 
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugLeagueMatches() {
  console.log('🔍 DEBUGGING LEAGUE MATCHES ISSUE');
  console.log('='.repeat(50));
  
  // First, let's see what leagues we have
  console.log('\n🏆 Available Leagues:');
  const { data: leagues, error: leaguesError } = await supabase
    .from('leagues')
    .select('id, name, country_name');
  
  if (leaguesError) {
    console.log('❌ Error fetching leagues:', leaguesError);
    return;
  }
  
  leagues?.forEach(league => {
    console.log(`  • ${league.name} (ID: ${league.id}) - ${league.country_name}`);
  });
  
  // Pick the first league to test with
  const testLeague = leagues?.[0];
  if (!testLeague) {
    console.log('❌ No leagues found!');
    return;
  }
  
  console.log(`\n🎯 Testing with league: ${testLeague.name} (ID: ${testLeague.id})`);
  
  // Check if recent_matches_view exists
  console.log('\n📋 Checking recent_matches_view...');
  const { data: viewData, error: viewError } = await supabase
    .from('recent_matches_view')
    .select('*')
    .eq('league_id', testLeague.id)
    .limit(5);
  
  if (viewError) {
    console.log('❌ recent_matches_view error:', viewError);
    console.log('   This view might not exist. Let\'s check raw matches table instead...');
    
    // Check raw matches table
    console.log('\n📋 Checking raw matches table...');
    const { data: matchesData, error: matchesError } = await supabase
      .from('matches')
      .select(`
        id,
        match_date,
        match_time,
        status,
        home_score,
        away_score,
        season,
        league_id,
        home_team:teams!matches_home_team_id_fkey(id, name),
        away_team:teams!matches_away_team_id_fkey(id, name)
      `)
      .eq('league_id', testLeague.id)
      .limit(10);
    
    if (matchesError) {
      console.log('❌ Raw matches table error:', matchesError);
      return;
    }
    
    console.log(`✅ Found ${matchesData?.length || 0} matches in raw table:`);
    matchesData?.forEach(match => {
      console.log(`  • ${match.home_team?.name} ${match.home_score}-${match.away_score} ${match.away_team?.name}`);
      console.log(`    Date: ${match.match_date}, Season: ${match.season}, Status: ${match.status}`);
    });
    
  } else {
    console.log(`✅ Found ${viewData?.length || 0} matches in recent_matches_view:`);
    viewData?.forEach(match => {
      console.log(`  • ${match.home_team_name} ${match.home_score}-${match.away_score} ${match.away_team_name}`);
      console.log(`    Date: ${match.match_date}, Season: ${match.season}`);
    });
  }
  
  // Test the actual service function
  console.log('\n🧪 Testing supabaseDataService.getMatchesForLeague...');
  
  // Import the service
  try {
    const { supabaseDataService } = await import('../src/services/supabaseDataService.ts');
    
    const matches = await supabaseDataService.getMatchesForLeague(testLeague.id.toString(), '2024');
    console.log(`✅ Service returned ${matches?.length || 0} matches for season 2024`);
    
    if (matches && matches.length > 0) {
      console.log('Sample matches:');
      matches.slice(0, 5).forEach(match => {
        console.log(`  • ${match.homeTeam?.name} ${match.score?.home}-${match.score?.away} ${match.awayTeam?.name}`);
        console.log(`    Date: ${match.date}, Status: ${match.status}`);
      });
    }
    
    // Also test without season filter
    const allMatches = await supabaseDataService.getMatchesForLeague(testLeague.id.toString());
    console.log(`✅ Service returned ${allMatches?.length || 0} matches without season filter`);
    
  } catch (serviceError) {
    console.log('❌ Error testing service:', serviceError);
  }
  
  // Check what seasons we have in the data
  console.log('\n📅 Available seasons in matches:');
  const { data: seasonData, error: seasonError } = await supabase
    .from('matches')
    .select('season')
    .eq('league_id', testLeague.id);
  
  if (!seasonError && seasonData) {
    const uniqueSeasons = [...new Set(seasonData.map(m => m.season))].sort();
    console.log(`  Available seasons: ${uniqueSeasons.join(', ')}`);
  }
  
  console.log('\n🎯 DIAGNOSIS:');
  console.log('='.repeat(30));
  
  if (viewError) {
    console.log('❌ ISSUE: recent_matches_view does not exist or is not accessible');
    console.log('💡 SOLUTION: Either create the view or modify the service to use raw tables');
  } else if (!viewData || viewData.length === 0) {
    console.log('❌ ISSUE: recent_matches_view exists but returns no data for this league');
    console.log('💡 SOLUTION: Check the view definition and data population');
  } else {
    console.log('✅ Data seems to be available. Issue might be in the frontend.');
  }
}

debugLeagueMatches(); 
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugLeagueMatches() {
  console.log('🔍 DEBUGGING LEAGUE MATCHES ISSUE');
  console.log('='.repeat(50));
  
  // First, let's see what leagues we have
  console.log('\n🏆 Available Leagues:');
  const { data: leagues, error: leaguesError } = await supabase
    .from('leagues')
    .select('id, name, country_name');
  
  if (leaguesError) {
    console.log('❌ Error fetching leagues:', leaguesError);
    return;
  }
  
  leagues?.forEach(league => {
    console.log(`  • ${league.name} (ID: ${league.id}) - ${league.country_name}`);
  });
  
  // Pick the first league to test with
  const testLeague = leagues?.[0];
  if (!testLeague) {
    console.log('❌ No leagues found!');
    return;
  }
  
  console.log(`\n🎯 Testing with league: ${testLeague.name} (ID: ${testLeague.id})`);
  
  // Check if recent_matches_view exists
  console.log('\n📋 Checking recent_matches_view...');
  const { data: viewData, error: viewError } = await supabase
    .from('recent_matches_view')
    .select('*')
    .eq('league_id', testLeague.id)
    .limit(5);
  
  if (viewError) {
    console.log('❌ recent_matches_view error:', viewError);
    console.log('   This view might not exist. Let\'s check raw matches table instead...');
    
    // Check raw matches table
    console.log('\n📋 Checking raw matches table...');
    const { data: matchesData, error: matchesError } = await supabase
      .from('matches')
      .select(`
        id,
        match_date,
        match_time,
        status,
        home_score,
        away_score,
        season,
        league_id,
        home_team:teams!matches_home_team_id_fkey(id, name),
        away_team:teams!matches_away_team_id_fkey(id, name)
      `)
      .eq('league_id', testLeague.id)
      .limit(10);
    
    if (matchesError) {
      console.log('❌ Raw matches table error:', matchesError);
      return;
    }
    
    console.log(`✅ Found ${matchesData?.length || 0} matches in raw table:`);
    matchesData?.forEach(match => {
      console.log(`  • ${match.home_team?.name} ${match.home_score}-${match.away_score} ${match.away_team?.name}`);
      console.log(`    Date: ${match.match_date}, Season: ${match.season}, Status: ${match.status}`);
    });
    
  } else {
    console.log(`✅ Found ${viewData?.length || 0} matches in recent_matches_view:`);
    viewData?.forEach(match => {
      console.log(`  • ${match.home_team_name} ${match.home_score}-${match.away_score} ${match.away_team_name}`);
      console.log(`    Date: ${match.match_date}, Season: ${match.season}`);
    });
  }
  
  // Test the actual service function
  console.log('\n🧪 Testing supabaseDataService.getMatchesForLeague...');
  
  // Import the service
  try {
    const { supabaseDataService } = await import('../src/services/supabaseDataService.ts');
    
    const matches = await supabaseDataService.getMatchesForLeague(testLeague.id.toString(), '2024');
    console.log(`✅ Service returned ${matches?.length || 0} matches for season 2024`);
    
    if (matches && matches.length > 0) {
      console.log('Sample matches:');
      matches.slice(0, 5).forEach(match => {
        console.log(`  • ${match.homeTeam?.name} ${match.score?.home}-${match.score?.away} ${match.awayTeam?.name}`);
        console.log(`    Date: ${match.date}, Status: ${match.status}`);
      });
    }
    
    // Also test without season filter
    const allMatches = await supabaseDataService.getMatchesForLeague(testLeague.id.toString());
    console.log(`✅ Service returned ${allMatches?.length || 0} matches without season filter`);
    
  } catch (serviceError) {
    console.log('❌ Error testing service:', serviceError);
  }
  
  // Check what seasons we have in the data
  console.log('\n📅 Available seasons in matches:');
  const { data: seasonData, error: seasonError } = await supabase
    .from('matches')
    .select('season')
    .eq('league_id', testLeague.id);
  
  if (!seasonError && seasonData) {
    const uniqueSeasons = [...new Set(seasonData.map(m => m.season))].sort();
    console.log(`  Available seasons: ${uniqueSeasons.join(', ')}`);
  }
  
  console.log('\n🎯 DIAGNOSIS:');
  console.log('='.repeat(30));
  
  if (viewError) {
    console.log('❌ ISSUE: recent_matches_view does not exist or is not accessible');
    console.log('💡 SOLUTION: Either create the view or modify the service to use raw tables');
  } else if (!viewData || viewData.length === 0) {
    console.log('❌ ISSUE: recent_matches_view exists but returns no data for this league');
    console.log('💡 SOLUTION: Check the view definition and data population');
  } else {
    console.log('✅ Data seems to be available. Issue might be in the frontend.');
  }
}

debugLeagueMatches(); 