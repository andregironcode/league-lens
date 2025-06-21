import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Simplified version of the fixed service function
async function getMatchesForLeague(leagueId, season) {
  console.log(`[Test] Fetching matches for league: ${leagueId}, season: ${season}`);
  
  try {
    let query = supabase
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
        home_team:teams!matches_home_team_id_fkey(id, name, logo),
        away_team:teams!matches_away_team_id_fkey(id, name, logo),
        league:leagues!matches_league_id_fkey(id, name, logo)
      `)
      .eq('league_id', leagueId)
      .order('match_date', { ascending: false });

    if (season) {
      query = query.eq('season', season);
    }

    const { data: matchesData, error } = await query;

    if (error) {
      console.error('[Test] Error fetching league matches:', error);
      return [];
    }

    const transformedMatches = matchesData?.map((match) => ({
      id: match.id,
      date: match.match_date,
      time: match.match_time,
      status: match.status,
      homeTeam: {
        id: match.home_team?.id || match.home_team_id,
        name: match.home_team?.name || 'Unknown Team',
        logo: match.home_team?.logo || ''
      },
      awayTeam: {
        id: match.away_team?.id || match.away_team_id,
        name: match.away_team?.name || 'Unknown Team',
        logo: match.away_team?.logo || ''
      },
      score: {
        home: match.home_score || 0,
        away: match.away_score || 0
      },
      competition: {
        id: match.league?.id || match.league_id,
        name: match.league?.name || 'League'
      }
    })) || [];

    console.log(`[Test] Found ${transformedMatches.length} matches for league ${leagueId}`);
    return transformedMatches;

  } catch (error) {
    console.error('[Test] Error in getMatchesForLeague:', error);
    return [];
  }
}

async function testFixedService() {
  console.log('🧪 TESTING FIXED SERVICE');
  console.log('='.repeat(40));
  
  // Get a league ID to test with
  const { data: leagues } = await supabase
    .from('leagues')
    .select('id, name')
    .limit(1);
  
  if (!leagues || leagues.length === 0) {
    console.log('❌ No leagues found');
    return;
  }
  
  const testLeague = leagues[0];
  console.log(`\n🎯 Testing with: ${testLeague.name} (ID: ${testLeague.id})`);
  
  // Test with season filter
  console.log('\n📅 Testing with season 2024...');
  const matches2024 = await getMatchesForLeague(testLeague.id, '2024');
  
  if (matches2024.length > 0) {
    console.log(`✅ Found ${matches2024.length} matches for 2024 season:`);
    matches2024.slice(0, 5).forEach(match => {
      console.log(`  • ${match.homeTeam.name} ${match.score.home}-${match.score.away} ${match.awayTeam.name}`);
      console.log(`    Date: ${match.date}, Status: ${match.status}`);
    });
  } else {
    console.log('❌ No matches found for 2024 season');
  }
  
  // Test without season filter
  console.log('\n📅 Testing without season filter...');
  const allMatches = await getMatchesForLeague(testLeague.id);
  
  if (allMatches.length > 0) {
    console.log(`✅ Found ${allMatches.length} total matches:`);
    allMatches.slice(0, 3).forEach(match => {
      console.log(`  • ${match.homeTeam.name} ${match.score.home}-${match.score.away} ${match.awayTeam.name}`);
    });
  } else {
    console.log('❌ No matches found without season filter');
  }
  
  console.log('\n🎯 RESULT:');
  console.log('='.repeat(20));
  if (matches2024.length > 0 || allMatches.length > 0) {
    console.log('✅ Service is working! League pages should now show matches.');
  } else {
    console.log('❌ Service still not working properly.');
  }
}

testFixedService(); 
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Simplified version of the fixed service function
async function getMatchesForLeague(leagueId, season) {
  console.log(`[Test] Fetching matches for league: ${leagueId}, season: ${season}`);
  
  try {
    let query = supabase
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
        home_team:teams!matches_home_team_id_fkey(id, name, logo),
        away_team:teams!matches_away_team_id_fkey(id, name, logo),
        league:leagues!matches_league_id_fkey(id, name, logo)
      `)
      .eq('league_id', leagueId)
      .order('match_date', { ascending: false });

    if (season) {
      query = query.eq('season', season);
    }

    const { data: matchesData, error } = await query;

    if (error) {
      console.error('[Test] Error fetching league matches:', error);
      return [];
    }

    const transformedMatches = matchesData?.map((match) => ({
      id: match.id,
      date: match.match_date,
      time: match.match_time,
      status: match.status,
      homeTeam: {
        id: match.home_team?.id || match.home_team_id,
        name: match.home_team?.name || 'Unknown Team',
        logo: match.home_team?.logo || ''
      },
      awayTeam: {
        id: match.away_team?.id || match.away_team_id,
        name: match.away_team?.name || 'Unknown Team',
        logo: match.away_team?.logo || ''
      },
      score: {
        home: match.home_score || 0,
        away: match.away_score || 0
      },
      competition: {
        id: match.league?.id || match.league_id,
        name: match.league?.name || 'League'
      }
    })) || [];

    console.log(`[Test] Found ${transformedMatches.length} matches for league ${leagueId}`);
    return transformedMatches;

  } catch (error) {
    console.error('[Test] Error in getMatchesForLeague:', error);
    return [];
  }
}

async function testFixedService() {
  console.log('🧪 TESTING FIXED SERVICE');
  console.log('='.repeat(40));
  
  // Get a league ID to test with
  const { data: leagues } = await supabase
    .from('leagues')
    .select('id, name')
    .limit(1);
  
  if (!leagues || leagues.length === 0) {
    console.log('❌ No leagues found');
    return;
  }
  
  const testLeague = leagues[0];
  console.log(`\n🎯 Testing with: ${testLeague.name} (ID: ${testLeague.id})`);
  
  // Test with season filter
  console.log('\n📅 Testing with season 2024...');
  const matches2024 = await getMatchesForLeague(testLeague.id, '2024');
  
  if (matches2024.length > 0) {
    console.log(`✅ Found ${matches2024.length} matches for 2024 season:`);
    matches2024.slice(0, 5).forEach(match => {
      console.log(`  • ${match.homeTeam.name} ${match.score.home}-${match.score.away} ${match.awayTeam.name}`);
      console.log(`    Date: ${match.date}, Status: ${match.status}`);
    });
  } else {
    console.log('❌ No matches found for 2024 season');
  }
  
  // Test without season filter
  console.log('\n📅 Testing without season filter...');
  const allMatches = await getMatchesForLeague(testLeague.id);
  
  if (allMatches.length > 0) {
    console.log(`✅ Found ${allMatches.length} total matches:`);
    allMatches.slice(0, 3).forEach(match => {
      console.log(`  • ${match.homeTeam.name} ${match.score.home}-${match.score.away} ${match.awayTeam.name}`);
    });
  } else {
    console.log('❌ No matches found without season filter');
  }
  
  console.log('\n🎯 RESULT:');
  console.log('='.repeat(20));
  if (matches2024.length > 0 || allMatches.length > 0) {
    console.log('✅ Service is working! League pages should now show matches.');
  } else {
    console.log('❌ Service still not working properly.');
  }
}

testFixedService(); 
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Simplified version of the fixed service function
async function getMatchesForLeague(leagueId, season) {
  console.log(`[Test] Fetching matches for league: ${leagueId}, season: ${season}`);
  
  try {
    let query = supabase
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
        home_team:teams!matches_home_team_id_fkey(id, name, logo),
        away_team:teams!matches_away_team_id_fkey(id, name, logo),
        league:leagues!matches_league_id_fkey(id, name, logo)
      `)
      .eq('league_id', leagueId)
      .order('match_date', { ascending: false });

    if (season) {
      query = query.eq('season', season);
    }

    const { data: matchesData, error } = await query;

    if (error) {
      console.error('[Test] Error fetching league matches:', error);
      return [];
    }

    const transformedMatches = matchesData?.map((match) => ({
      id: match.id,
      date: match.match_date,
      time: match.match_time,
      status: match.status,
      homeTeam: {
        id: match.home_team?.id || match.home_team_id,
        name: match.home_team?.name || 'Unknown Team',
        logo: match.home_team?.logo || ''
      },
      awayTeam: {
        id: match.away_team?.id || match.away_team_id,
        name: match.away_team?.name || 'Unknown Team',
        logo: match.away_team?.logo || ''
      },
      score: {
        home: match.home_score || 0,
        away: match.away_score || 0
      },
      competition: {
        id: match.league?.id || match.league_id,
        name: match.league?.name || 'League'
      }
    })) || [];

    console.log(`[Test] Found ${transformedMatches.length} matches for league ${leagueId}`);
    return transformedMatches;

  } catch (error) {
    console.error('[Test] Error in getMatchesForLeague:', error);
    return [];
  }
}

async function testFixedService() {
  console.log('🧪 TESTING FIXED SERVICE');
  console.log('='.repeat(40));
  
  // Get a league ID to test with
  const { data: leagues } = await supabase
    .from('leagues')
    .select('id, name')
    .limit(1);
  
  if (!leagues || leagues.length === 0) {
    console.log('❌ No leagues found');
    return;
  }
  
  const testLeague = leagues[0];
  console.log(`\n🎯 Testing with: ${testLeague.name} (ID: ${testLeague.id})`);
  
  // Test with season filter
  console.log('\n📅 Testing with season 2024...');
  const matches2024 = await getMatchesForLeague(testLeague.id, '2024');
  
  if (matches2024.length > 0) {
    console.log(`✅ Found ${matches2024.length} matches for 2024 season:`);
    matches2024.slice(0, 5).forEach(match => {
      console.log(`  • ${match.homeTeam.name} ${match.score.home}-${match.score.away} ${match.awayTeam.name}`);
      console.log(`    Date: ${match.date}, Status: ${match.status}`);
    });
  } else {
    console.log('❌ No matches found for 2024 season');
  }
  
  // Test without season filter
  console.log('\n📅 Testing without season filter...');
  const allMatches = await getMatchesForLeague(testLeague.id);
  
  if (allMatches.length > 0) {
    console.log(`✅ Found ${allMatches.length} total matches:`);
    allMatches.slice(0, 3).forEach(match => {
      console.log(`  • ${match.homeTeam.name} ${match.score.home}-${match.score.away} ${match.awayTeam.name}`);
    });
  } else {
    console.log('❌ No matches found without season filter');
  }
  
  console.log('\n🎯 RESULT:');
  console.log('='.repeat(20));
  if (matches2024.length > 0 || allMatches.length > 0) {
    console.log('✅ Service is working! League pages should now show matches.');
  } else {
    console.log('❌ Service still not working properly.');
  }
}

testFixedService(); 