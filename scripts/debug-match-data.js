import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugMatchData() {
  const matchId = '1028070056'; // The failing match ID from the error
  
  console.log(`🔍 DEBUGGING MATCH DATA FOR ID: ${matchId}`);
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

    console.log('📋 BASIC MATCH INFO:');
    console.log(`   Teams: ${matchData.home_team?.name} vs ${matchData.away_team?.name}`);
    console.log(`   Date: ${matchData.match_date}`);
    console.log(`   Status: ${matchData.status}`);
    console.log(`   Score: ${matchData.home_score}-${matchData.away_score}`);
    
    console.log('\n📦 API_DATA STRUCTURE:');
    const apiData = matchData.api_data || {};
    console.log('   api_data keys:', Object.keys(apiData));
    
    if (apiData.detailedMatch) {
      console.log('   detailedMatch keys:', Object.keys(apiData.detailedMatch));
      console.log('   events count:', apiData.detailedMatch.events?.length || 0);
      console.log('   venue:', apiData.detailedMatch.venue?.name || 'N/A');
      console.log('   referee:', apiData.detailedMatch.referee?.name || 'N/A');
    }
    
    if (apiData.statistics) {
      console.log('   statistics type:', Array.isArray(apiData.statistics) ? 'array' : typeof apiData.statistics);
      if (typeof apiData.statistics === 'object' && !Array.isArray(apiData.statistics)) {
        console.log('   statistics keys:', Object.keys(apiData.statistics));
        if (apiData.statistics.homeTeam) {
          console.log('   homeTeam stats count:', apiData.statistics.homeTeam.statistics?.length || 0);
        }
        if (apiData.statistics.awayTeam) {
          console.log('   awayTeam stats count:', apiData.statistics.awayTeam.statistics?.length || 0);
        }
      }
    }
    
    if (apiData.lineups) {
      console.log('   lineups keys:', Object.keys(apiData.lineups));
      if (apiData.lineups.homeTeam) {
        console.log('   home formation:', apiData.lineups.homeTeam.formation);
        console.log('   home starting XI:', apiData.lineups.homeTeam.initialLineup?.length || 0);
      }
      if (apiData.lineups.awayTeam) {
        console.log('   away formation:', apiData.lineups.awayTeam.formation);
        console.log('   away starting XI:', apiData.lineups.awayTeam.initialLineup?.length || 0);
      }
    }
    
    if (apiData.headToHead) {
      console.log('   headToHead matches count:', apiData.headToHead.matches?.length || apiData.headToHead.totalMatches || 0);
    }
    
    // Sample an event if available
    if (apiData.detailedMatch?.events?.length > 0) {
      console.log('\n⚽ SAMPLE EVENT:');
      const event = apiData.detailedMatch.events[0];
      console.log('   ', JSON.stringify(event, null, 2));
    }
    
    // Sample a statistic if available
    if (apiData.statistics?.homeTeam?.statistics?.length > 0) {
      console.log('\n📊 SAMPLE HOME TEAM STATISTIC:');
      const stat = apiData.statistics.homeTeam.statistics[0];
      console.log('   ', JSON.stringify(stat, null, 2));
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

debugMatchData(); 
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugMatchData() {
  const matchId = '1028070056'; // The failing match ID from the error
  
  console.log(`🔍 DEBUGGING MATCH DATA FOR ID: ${matchId}`);
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

    console.log('📋 BASIC MATCH INFO:');
    console.log(`   Teams: ${matchData.home_team?.name} vs ${matchData.away_team?.name}`);
    console.log(`   Date: ${matchData.match_date}`);
    console.log(`   Status: ${matchData.status}`);
    console.log(`   Score: ${matchData.home_score}-${matchData.away_score}`);
    
    console.log('\n📦 API_DATA STRUCTURE:');
    const apiData = matchData.api_data || {};
    console.log('   api_data keys:', Object.keys(apiData));
    
    if (apiData.detailedMatch) {
      console.log('   detailedMatch keys:', Object.keys(apiData.detailedMatch));
      console.log('   events count:', apiData.detailedMatch.events?.length || 0);
      console.log('   venue:', apiData.detailedMatch.venue?.name || 'N/A');
      console.log('   referee:', apiData.detailedMatch.referee?.name || 'N/A');
    }
    
    if (apiData.statistics) {
      console.log('   statistics type:', Array.isArray(apiData.statistics) ? 'array' : typeof apiData.statistics);
      if (typeof apiData.statistics === 'object' && !Array.isArray(apiData.statistics)) {
        console.log('   statistics keys:', Object.keys(apiData.statistics));
        if (apiData.statistics.homeTeam) {
          console.log('   homeTeam stats count:', apiData.statistics.homeTeam.statistics?.length || 0);
        }
        if (apiData.statistics.awayTeam) {
          console.log('   awayTeam stats count:', apiData.statistics.awayTeam.statistics?.length || 0);
        }
      }
    }
    
    if (apiData.lineups) {
      console.log('   lineups keys:', Object.keys(apiData.lineups));
      if (apiData.lineups.homeTeam) {
        console.log('   home formation:', apiData.lineups.homeTeam.formation);
        console.log('   home starting XI:', apiData.lineups.homeTeam.initialLineup?.length || 0);
      }
      if (apiData.lineups.awayTeam) {
        console.log('   away formation:', apiData.lineups.awayTeam.formation);
        console.log('   away starting XI:', apiData.lineups.awayTeam.initialLineup?.length || 0);
      }
    }
    
    if (apiData.headToHead) {
      console.log('   headToHead matches count:', apiData.headToHead.matches?.length || apiData.headToHead.totalMatches || 0);
    }
    
    // Sample an event if available
    if (apiData.detailedMatch?.events?.length > 0) {
      console.log('\n⚽ SAMPLE EVENT:');
      const event = apiData.detailedMatch.events[0];
      console.log('   ', JSON.stringify(event, null, 2));
    }
    
    // Sample a statistic if available
    if (apiData.statistics?.homeTeam?.statistics?.length > 0) {
      console.log('\n📊 SAMPLE HOME TEAM STATISTIC:');
      const stat = apiData.statistics.homeTeam.statistics[0];
      console.log('   ', JSON.stringify(stat, null, 2));
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

debugMatchData(); 
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugMatchData() {
  const matchId = '1028070056'; // The failing match ID from the error
  
  console.log(`🔍 DEBUGGING MATCH DATA FOR ID: ${matchId}`);
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

    console.log('📋 BASIC MATCH INFO:');
    console.log(`   Teams: ${matchData.home_team?.name} vs ${matchData.away_team?.name}`);
    console.log(`   Date: ${matchData.match_date}`);
    console.log(`   Status: ${matchData.status}`);
    console.log(`   Score: ${matchData.home_score}-${matchData.away_score}`);
    
    console.log('\n📦 API_DATA STRUCTURE:');
    const apiData = matchData.api_data || {};
    console.log('   api_data keys:', Object.keys(apiData));
    
    if (apiData.detailedMatch) {
      console.log('   detailedMatch keys:', Object.keys(apiData.detailedMatch));
      console.log('   events count:', apiData.detailedMatch.events?.length || 0);
      console.log('   venue:', apiData.detailedMatch.venue?.name || 'N/A');
      console.log('   referee:', apiData.detailedMatch.referee?.name || 'N/A');
    }
    
    if (apiData.statistics) {
      console.log('   statistics type:', Array.isArray(apiData.statistics) ? 'array' : typeof apiData.statistics);
      if (typeof apiData.statistics === 'object' && !Array.isArray(apiData.statistics)) {
        console.log('   statistics keys:', Object.keys(apiData.statistics));
        if (apiData.statistics.homeTeam) {
          console.log('   homeTeam stats count:', apiData.statistics.homeTeam.statistics?.length || 0);
        }
        if (apiData.statistics.awayTeam) {
          console.log('   awayTeam stats count:', apiData.statistics.awayTeam.statistics?.length || 0);
        }
      }
    }
    
    if (apiData.lineups) {
      console.log('   lineups keys:', Object.keys(apiData.lineups));
      if (apiData.lineups.homeTeam) {
        console.log('   home formation:', apiData.lineups.homeTeam.formation);
        console.log('   home starting XI:', apiData.lineups.homeTeam.initialLineup?.length || 0);
      }
      if (apiData.lineups.awayTeam) {
        console.log('   away formation:', apiData.lineups.awayTeam.formation);
        console.log('   away starting XI:', apiData.lineups.awayTeam.initialLineup?.length || 0);
      }
    }
    
    if (apiData.headToHead) {
      console.log('   headToHead matches count:', apiData.headToHead.matches?.length || apiData.headToHead.totalMatches || 0);
    }
    
    // Sample an event if available
    if (apiData.detailedMatch?.events?.length > 0) {
      console.log('\n⚽ SAMPLE EVENT:');
      const event = apiData.detailedMatch.events[0];
      console.log('   ', JSON.stringify(event, null, 2));
    }
    
    // Sample a statistic if available
    if (apiData.statistics?.homeTeam?.statistics?.length > 0) {
      console.log('\n📊 SAMPLE HOME TEAM STATISTIC:');
      const stat = apiData.statistics.homeTeam.statistics[0];
      console.log('   ', JSON.stringify(stat, null, 2));
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

debugMatchData(); 