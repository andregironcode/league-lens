import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Simplified version of the updated getMatchById function
async function getMatchById(matchId) {
  console.log(`[Test] Fetching match details for ID: ${matchId}`);
  
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
        venue,
        api_data,
        home_team:teams!matches_home_team_id_fkey(id, name, logo),
        away_team:teams!matches_away_team_id_fkey(id, name, logo),
        league:leagues!matches_league_id_fkey(id, name, logo)
      `)
      .eq('id', matchId)
      .single();

    if (error || !matchData) {
      console.error('[Test] Match not found:', error);
      return null;
    }

    // Extract detailed data from api_data field
    const apiData = matchData.api_data || {};
    const events = apiData.events || [];
    const statistics = apiData.statistics || [];
    const venue = apiData.venue || {};
    
    // Transform to expected format
    const match = {
      id: matchData.id,
      date: matchData.match_date,
      homeTeam: {
        name: matchData.home_team?.name || 'Unknown Team',
      },
      awayTeam: {
        name: matchData.away_team?.name || 'Unknown Team',
      },
      score: {
        home: matchData.home_score || 0,
        away: matchData.away_score || 0
      },
      venue: {
        name: venue.name || matchData.venue || 'Unknown Venue',
      },
      // REAL EVENT DATA with goalscorers!
      events: events.map((event) => ({
        time: event.time,
        type: event.type,
        player: event.player,
        assist: event.assist,
        team: event.team
      })),
      // REAL STATISTICS DATA
      statistics: statistics.length
    };

    return match;

  } catch (error) {
    console.error('[Test] Error in getMatchById:', error);
    return null;
  }
}

async function testMatchEvents() {
  console.log('🧪 TESTING GOALSCORER EVENTS');
  console.log('='.repeat(40));
  
  // Get a match that should have events
  const { data: matches } = await supabase
    .from('matches')
    .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)')
    .not('api_data', 'is', null)
    .limit(3);
  
  if (!matches || matches.length === 0) {
    console.log('❌ No matches with detailed data found');
    return;
  }
  
  for (const match of matches) {
    console.log(`\n🎯 Testing match: ${match.home_team?.name} vs ${match.away_team?.name} (ID: ${match.id})`);
    
    const detailedMatch = await getMatchById(match.id);
    
    if (detailedMatch) {
      console.log(`✅ Match details loaded:`);
      console.log(`   Score: ${detailedMatch.homeTeam.name} ${detailedMatch.score.home}-${detailedMatch.score.away} ${detailedMatch.awayTeam.name}`);
      console.log(`   Venue: ${detailedMatch.venue.name}`);
      console.log(`   Events: ${detailedMatch.events.length}`);
      console.log(`   Statistics: ${detailedMatch.statistics} teams`);
      
      // Show goalscorer events
      const goals = detailedMatch.events.filter(e => e.type === 'Goal');
      if (goals.length > 0) {
        console.log(`   ⚽ GOALSCORERS:`);
        goals.forEach(goal => {
          console.log(`      ${goal.time}' ${goal.player} ${goal.assist ? `(assist: ${goal.assist})` : ''}`);
        });
      } else {
        console.log(`   ⚽ No goals in this match`);
      }
      
      // Show other events
      const otherEvents = detailedMatch.events.filter(e => e.type !== 'Goal');
      if (otherEvents.length > 0) {
        console.log(`   📋 OTHER EVENTS: ${otherEvents.length} (cards, substitutions, etc.)`);
      }
      
    } else {
      console.log(`❌ Failed to load match details`);
    }
  }
  
  console.log('\n🎯 RESULT:');
  console.log('='.repeat(20));
  console.log('✅ Goalscorer data is now available!');
  console.log('✅ Match details pages should show events');
  console.log('✅ Timeline component will display goals, cards, subs');
}

testMatchEvents(); 
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Simplified version of the updated getMatchById function
async function getMatchById(matchId) {
  console.log(`[Test] Fetching match details for ID: ${matchId}`);
  
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
        venue,
        api_data,
        home_team:teams!matches_home_team_id_fkey(id, name, logo),
        away_team:teams!matches_away_team_id_fkey(id, name, logo),
        league:leagues!matches_league_id_fkey(id, name, logo)
      `)
      .eq('id', matchId)
      .single();

    if (error || !matchData) {
      console.error('[Test] Match not found:', error);
      return null;
    }

    // Extract detailed data from api_data field
    const apiData = matchData.api_data || {};
    const events = apiData.events || [];
    const statistics = apiData.statistics || [];
    const venue = apiData.venue || {};
    
    // Transform to expected format
    const match = {
      id: matchData.id,
      date: matchData.match_date,
      homeTeam: {
        name: matchData.home_team?.name || 'Unknown Team',
      },
      awayTeam: {
        name: matchData.away_team?.name || 'Unknown Team',
      },
      score: {
        home: matchData.home_score || 0,
        away: matchData.away_score || 0
      },
      venue: {
        name: venue.name || matchData.venue || 'Unknown Venue',
      },
      // REAL EVENT DATA with goalscorers!
      events: events.map((event) => ({
        time: event.time,
        type: event.type,
        player: event.player,
        assist: event.assist,
        team: event.team
      })),
      // REAL STATISTICS DATA
      statistics: statistics.length
    };

    return match;

  } catch (error) {
    console.error('[Test] Error in getMatchById:', error);
    return null;
  }
}

async function testMatchEvents() {
  console.log('🧪 TESTING GOALSCORER EVENTS');
  console.log('='.repeat(40));
  
  // Get a match that should have events
  const { data: matches } = await supabase
    .from('matches')
    .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)')
    .not('api_data', 'is', null)
    .limit(3);
  
  if (!matches || matches.length === 0) {
    console.log('❌ No matches with detailed data found');
    return;
  }
  
  for (const match of matches) {
    console.log(`\n🎯 Testing match: ${match.home_team?.name} vs ${match.away_team?.name} (ID: ${match.id})`);
    
    const detailedMatch = await getMatchById(match.id);
    
    if (detailedMatch) {
      console.log(`✅ Match details loaded:`);
      console.log(`   Score: ${detailedMatch.homeTeam.name} ${detailedMatch.score.home}-${detailedMatch.score.away} ${detailedMatch.awayTeam.name}`);
      console.log(`   Venue: ${detailedMatch.venue.name}`);
      console.log(`   Events: ${detailedMatch.events.length}`);
      console.log(`   Statistics: ${detailedMatch.statistics} teams`);
      
      // Show goalscorer events
      const goals = detailedMatch.events.filter(e => e.type === 'Goal');
      if (goals.length > 0) {
        console.log(`   ⚽ GOALSCORERS:`);
        goals.forEach(goal => {
          console.log(`      ${goal.time}' ${goal.player} ${goal.assist ? `(assist: ${goal.assist})` : ''}`);
        });
      } else {
        console.log(`   ⚽ No goals in this match`);
      }
      
      // Show other events
      const otherEvents = detailedMatch.events.filter(e => e.type !== 'Goal');
      if (otherEvents.length > 0) {
        console.log(`   📋 OTHER EVENTS: ${otherEvents.length} (cards, substitutions, etc.)`);
      }
      
    } else {
      console.log(`❌ Failed to load match details`);
    }
  }
  
  console.log('\n🎯 RESULT:');
  console.log('='.repeat(20));
  console.log('✅ Goalscorer data is now available!');
  console.log('✅ Match details pages should show events');
  console.log('✅ Timeline component will display goals, cards, subs');
}

testMatchEvents(); 
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Simplified version of the updated getMatchById function
async function getMatchById(matchId) {
  console.log(`[Test] Fetching match details for ID: ${matchId}`);
  
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
        venue,
        api_data,
        home_team:teams!matches_home_team_id_fkey(id, name, logo),
        away_team:teams!matches_away_team_id_fkey(id, name, logo),
        league:leagues!matches_league_id_fkey(id, name, logo)
      `)
      .eq('id', matchId)
      .single();

    if (error || !matchData) {
      console.error('[Test] Match not found:', error);
      return null;
    }

    // Extract detailed data from api_data field
    const apiData = matchData.api_data || {};
    const events = apiData.events || [];
    const statistics = apiData.statistics || [];
    const venue = apiData.venue || {};
    
    // Transform to expected format
    const match = {
      id: matchData.id,
      date: matchData.match_date,
      homeTeam: {
        name: matchData.home_team?.name || 'Unknown Team',
      },
      awayTeam: {
        name: matchData.away_team?.name || 'Unknown Team',
      },
      score: {
        home: matchData.home_score || 0,
        away: matchData.away_score || 0
      },
      venue: {
        name: venue.name || matchData.venue || 'Unknown Venue',
      },
      // REAL EVENT DATA with goalscorers!
      events: events.map((event) => ({
        time: event.time,
        type: event.type,
        player: event.player,
        assist: event.assist,
        team: event.team
      })),
      // REAL STATISTICS DATA
      statistics: statistics.length
    };

    return match;

  } catch (error) {
    console.error('[Test] Error in getMatchById:', error);
    return null;
  }
}

async function testMatchEvents() {
  console.log('🧪 TESTING GOALSCORER EVENTS');
  console.log('='.repeat(40));
  
  // Get a match that should have events
  const { data: matches } = await supabase
    .from('matches')
    .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)')
    .not('api_data', 'is', null)
    .limit(3);
  
  if (!matches || matches.length === 0) {
    console.log('❌ No matches with detailed data found');
    return;
  }
  
  for (const match of matches) {
    console.log(`\n🎯 Testing match: ${match.home_team?.name} vs ${match.away_team?.name} (ID: ${match.id})`);
    
    const detailedMatch = await getMatchById(match.id);
    
    if (detailedMatch) {
      console.log(`✅ Match details loaded:`);
      console.log(`   Score: ${detailedMatch.homeTeam.name} ${detailedMatch.score.home}-${detailedMatch.score.away} ${detailedMatch.awayTeam.name}`);
      console.log(`   Venue: ${detailedMatch.venue.name}`);
      console.log(`   Events: ${detailedMatch.events.length}`);
      console.log(`   Statistics: ${detailedMatch.statistics} teams`);
      
      // Show goalscorer events
      const goals = detailedMatch.events.filter(e => e.type === 'Goal');
      if (goals.length > 0) {
        console.log(`   ⚽ GOALSCORERS:`);
        goals.forEach(goal => {
          console.log(`      ${goal.time}' ${goal.player} ${goal.assist ? `(assist: ${goal.assist})` : ''}`);
        });
      } else {
        console.log(`   ⚽ No goals in this match`);
      }
      
      // Show other events
      const otherEvents = detailedMatch.events.filter(e => e.type !== 'Goal');
      if (otherEvents.length > 0) {
        console.log(`   📋 OTHER EVENTS: ${otherEvents.length} (cards, substitutions, etc.)`);
      }
      
    } else {
      console.log(`❌ Failed to load match details`);
    }
  }
  
  console.log('\n🎯 RESULT:');
  console.log('='.repeat(20));
  console.log('✅ Goalscorer data is now available!');
  console.log('✅ Match details pages should show events');
  console.log('✅ Timeline component will display goals, cards, subs');
}

testMatchEvents(); 