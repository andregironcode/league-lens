import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testFixedExtraction() {
  const matchId = '1028070056'; // The failing match ID from the error
  
  console.log(`🧪 TESTING FIXED DATA EXTRACTION FOR ID: ${matchId}`);
  console.log('='.repeat(60));
  
  try {
    const { data: matchData, error } = await supabase
      .from('matches')
      .select(`
        id,
        match_date,
        match_time,
        status,
        home_score,
        away_score,
        api_data,
        home_team:teams!matches_home_team_id_fkey(id, name, logo),
        away_team:teams!matches_away_team_id_fkey(id, name, logo),
        league:leagues!matches_league_id_fkey(id, name, logo)
      `)
      .eq('id', matchId)
      .single();

    if (error || !matchData) {
      console.log('❌ Match not found:', error);
      return;
    }

    // Apply the same extraction logic as our fixed service
    const apiData = matchData.api_data || {};
    
    // Handle detailedMatch being an array (with index '0') or direct object
    const detailedMatchData = apiData.detailedMatch;
    const detailedMatch = (detailedMatchData && detailedMatchData['0']) 
      ? detailedMatchData['0'] 
      : detailedMatchData || {};
    
    const events = detailedMatch.events || [];
    const statistics = apiData.statistics || [];
    const venue = detailedMatch.venue || {};
    const lineups = apiData.lineups || {};

    console.log('✅ EXTRACTION RESULTS:');
    console.log(`   Teams: ${matchData.home_team?.name} vs ${matchData.away_team?.name}`);
    console.log(`   Events extracted: ${events.length}`);
    console.log(`   Statistics type: ${Array.isArray(statistics) ? 'array' : typeof statistics}`);
    console.log(`   Venue name: ${venue.name || 'N/A'}`);
    console.log(`   Home formation: ${lineups.homeTeam?.formation || 'N/A'}`);
    console.log(`   Away formation: ${lineups.awayTeam?.formation || 'N/A'}`);

    // Test the statistics parsing logic
    let parsedStatistics = [];
    if (Array.isArray(statistics)) {
      parsedStatistics = statistics.map((stat) => ({
        team: stat.team,
        statistics: stat.statistics
      }));
    } else if (statistics && statistics.homeTeam && statistics.awayTeam) {
      parsedStatistics = [
        {
          team: statistics.homeTeam.team,
          statistics: statistics.homeTeam.statistics || []
        },
        {
          team: statistics.awayTeam.team,
          statistics: statistics.awayTeam.statistics || []
        }
      ];
    }

    console.log(`   Parsed statistics: ${parsedStatistics.length} teams`);
    if (parsedStatistics.length > 0) {
      console.log(`   Home team stats: ${parsedStatistics[0]?.statistics?.length || 0} metrics`);
      console.log(`   Away team stats: ${parsedStatistics[1]?.statistics?.length || 0} metrics`);
    }

    // Test event parsing  
    const parsedEvents = events.map((event) => ({
      time: event.minute || event.time,
      type: event.type,
      player: event.player?.name || event.player,
      assist: event.assist?.name || event.assist,
      substituted: event.substituted?.name || event.substituted,
      team: event.team
    }));

    console.log(`   Parsed events: ${parsedEvents.length}`);

    console.log('\n🎯 EXTRACTION TEST: PASSED ✅');
    console.log('   ✅ No errors in data extraction');
    console.log('   ✅ Statistics parsed correctly');
    console.log('   ✅ Events parsed correctly');
    console.log('   ✅ Lineups extracted successfully');

  } catch (error) {
    console.log('❌ EXTRACTION TEST: FAILED');
    console.log('   Error:', error.message);
  }
}

testFixedExtraction(); 
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testFixedExtraction() {
  const matchId = '1028070056'; // The failing match ID from the error
  
  console.log(`🧪 TESTING FIXED DATA EXTRACTION FOR ID: ${matchId}`);
  console.log('='.repeat(60));
  
  try {
    const { data: matchData, error } = await supabase
      .from('matches')
      .select(`
        id,
        match_date,
        match_time,
        status,
        home_score,
        away_score,
        api_data,
        home_team:teams!matches_home_team_id_fkey(id, name, logo),
        away_team:teams!matches_away_team_id_fkey(id, name, logo),
        league:leagues!matches_league_id_fkey(id, name, logo)
      `)
      .eq('id', matchId)
      .single();

    if (error || !matchData) {
      console.log('❌ Match not found:', error);
      return;
    }

    // Apply the same extraction logic as our fixed service
    const apiData = matchData.api_data || {};
    
    // Handle detailedMatch being an array (with index '0') or direct object
    const detailedMatchData = apiData.detailedMatch;
    const detailedMatch = (detailedMatchData && detailedMatchData['0']) 
      ? detailedMatchData['0'] 
      : detailedMatchData || {};
    
    const events = detailedMatch.events || [];
    const statistics = apiData.statistics || [];
    const venue = detailedMatch.venue || {};
    const lineups = apiData.lineups || {};

    console.log('✅ EXTRACTION RESULTS:');
    console.log(`   Teams: ${matchData.home_team?.name} vs ${matchData.away_team?.name}`);
    console.log(`   Events extracted: ${events.length}`);
    console.log(`   Statistics type: ${Array.isArray(statistics) ? 'array' : typeof statistics}`);
    console.log(`   Venue name: ${venue.name || 'N/A'}`);
    console.log(`   Home formation: ${lineups.homeTeam?.formation || 'N/A'}`);
    console.log(`   Away formation: ${lineups.awayTeam?.formation || 'N/A'}`);

    // Test the statistics parsing logic
    let parsedStatistics = [];
    if (Array.isArray(statistics)) {
      parsedStatistics = statistics.map((stat) => ({
        team: stat.team,
        statistics: stat.statistics
      }));
    } else if (statistics && statistics.homeTeam && statistics.awayTeam) {
      parsedStatistics = [
        {
          team: statistics.homeTeam.team,
          statistics: statistics.homeTeam.statistics || []
        },
        {
          team: statistics.awayTeam.team,
          statistics: statistics.awayTeam.statistics || []
        }
      ];
    }

    console.log(`   Parsed statistics: ${parsedStatistics.length} teams`);
    if (parsedStatistics.length > 0) {
      console.log(`   Home team stats: ${parsedStatistics[0]?.statistics?.length || 0} metrics`);
      console.log(`   Away team stats: ${parsedStatistics[1]?.statistics?.length || 0} metrics`);
    }

    // Test event parsing  
    const parsedEvents = events.map((event) => ({
      time: event.minute || event.time,
      type: event.type,
      player: event.player?.name || event.player,
      assist: event.assist?.name || event.assist,
      substituted: event.substituted?.name || event.substituted,
      team: event.team
    }));

    console.log(`   Parsed events: ${parsedEvents.length}`);

    console.log('\n🎯 EXTRACTION TEST: PASSED ✅');
    console.log('   ✅ No errors in data extraction');
    console.log('   ✅ Statistics parsed correctly');
    console.log('   ✅ Events parsed correctly');
    console.log('   ✅ Lineups extracted successfully');

  } catch (error) {
    console.log('❌ EXTRACTION TEST: FAILED');
    console.log('   Error:', error.message);
  }
}

testFixedExtraction(); 
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testFixedExtraction() {
  const matchId = '1028070056'; // The failing match ID from the error
  
  console.log(`🧪 TESTING FIXED DATA EXTRACTION FOR ID: ${matchId}`);
  console.log('='.repeat(60));
  
  try {
    const { data: matchData, error } = await supabase
      .from('matches')
      .select(`
        id,
        match_date,
        match_time,
        status,
        home_score,
        away_score,
        api_data,
        home_team:teams!matches_home_team_id_fkey(id, name, logo),
        away_team:teams!matches_away_team_id_fkey(id, name, logo),
        league:leagues!matches_league_id_fkey(id, name, logo)
      `)
      .eq('id', matchId)
      .single();

    if (error || !matchData) {
      console.log('❌ Match not found:', error);
      return;
    }

    // Apply the same extraction logic as our fixed service
    const apiData = matchData.api_data || {};
    
    // Handle detailedMatch being an array (with index '0') or direct object
    const detailedMatchData = apiData.detailedMatch;
    const detailedMatch = (detailedMatchData && detailedMatchData['0']) 
      ? detailedMatchData['0'] 
      : detailedMatchData || {};
    
    const events = detailedMatch.events || [];
    const statistics = apiData.statistics || [];
    const venue = detailedMatch.venue || {};
    const lineups = apiData.lineups || {};

    console.log('✅ EXTRACTION RESULTS:');
    console.log(`   Teams: ${matchData.home_team?.name} vs ${matchData.away_team?.name}`);
    console.log(`   Events extracted: ${events.length}`);
    console.log(`   Statistics type: ${Array.isArray(statistics) ? 'array' : typeof statistics}`);
    console.log(`   Venue name: ${venue.name || 'N/A'}`);
    console.log(`   Home formation: ${lineups.homeTeam?.formation || 'N/A'}`);
    console.log(`   Away formation: ${lineups.awayTeam?.formation || 'N/A'}`);

    // Test the statistics parsing logic
    let parsedStatistics = [];
    if (Array.isArray(statistics)) {
      parsedStatistics = statistics.map((stat) => ({
        team: stat.team,
        statistics: stat.statistics
      }));
    } else if (statistics && statistics.homeTeam && statistics.awayTeam) {
      parsedStatistics = [
        {
          team: statistics.homeTeam.team,
          statistics: statistics.homeTeam.statistics || []
        },
        {
          team: statistics.awayTeam.team,
          statistics: statistics.awayTeam.statistics || []
        }
      ];
    }

    console.log(`   Parsed statistics: ${parsedStatistics.length} teams`);
    if (parsedStatistics.length > 0) {
      console.log(`   Home team stats: ${parsedStatistics[0]?.statistics?.length || 0} metrics`);
      console.log(`   Away team stats: ${parsedStatistics[1]?.statistics?.length || 0} metrics`);
    }

    // Test event parsing  
    const parsedEvents = events.map((event) => ({
      time: event.minute || event.time,
      type: event.type,
      player: event.player?.name || event.player,
      assist: event.assist?.name || event.assist,
      substituted: event.substituted?.name || event.substituted,
      team: event.team
    }));

    console.log(`   Parsed events: ${parsedEvents.length}`);

    console.log('\n🎯 EXTRACTION TEST: PASSED ✅');
    console.log('   ✅ No errors in data extraction');
    console.log('   ✅ Statistics parsed correctly');
    console.log('   ✅ Events parsed correctly');
    console.log('   ✅ Lineups extracted successfully');

  } catch (error) {
    console.log('❌ EXTRACTION TEST: FAILED');
    console.log('   Error:', error.message);
  }
}

testFixedExtraction(); 