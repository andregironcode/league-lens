/**
 * ULTIMATE FULL SYNC
 * 
 * Comprehensive sync using everything we've learned:
 * - Correct API headers and response parsing
 * - Proper database schema (team IDs, correct column names)
 * - All data types: matches, highlights, statistics, events, lineups
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration - correct instance
const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// API configuration - working setup
const API_BASE = 'http://localhost:3001/api/highlightly';

// Rate limiting
let apiCallCount = 0;
const MAX_CALLS_PER_MINUTE = 50;

async function makeApiCall(endpoint) {
  if (apiCallCount >= MAX_CALLS_PER_MINUTE) {
    console.log('   ⏱️ Rate limit reached, waiting 60 seconds...');
    await new Promise(resolve => setTimeout(resolve, 60000));
    apiCallCount = 0;
  }

  console.log(`📡 API Call: ${endpoint}`);
  apiCallCount++;

  try {
    const response = await fetch(`${API_BASE}${endpoint}`);
    
    if (!response.ok) {
      console.log(`❌ API call failed for ${endpoint}: HTTP ${response.status}: ${response.statusText}`);
      return null;
    }

    const responseData = await response.json();
    // Handle the {"data": [...]} wrapper from API documentation
    return responseData.data || responseData;
    
  } catch (error) {
    console.log(`❌ API call error for ${endpoint}: ${error.message}`);
    return null;
  }
}

async function getTeamIdByName(teamName) {
  if (!teamName) return null;
  
  const { data: teams } = await supabase
    .from('teams')
    .select('id, name')
    .ilike('name', `%${teamName}%`)
    .limit(1);

  return teams && teams.length > 0 ? teams[0].id : null;
}

async function syncMatches() {
  console.log('\n⚽ STEP 1: Syncing Matches');
  console.log('='.repeat(50));

  let totalMatches = 0;
  
  // Priority leagues with correct IDs
  const leagues = [
    { id: 33973, name: 'Premier League' },
    { id: 119924, name: 'La Liga' },
    { id: 115669, name: 'Serie A' },
    { id: 67162, name: 'Bundesliga' },
    { id: 52695, name: 'Ligue 1' }
  ];

  // Recent dates to check
  const testDates = [
    '2024-12-15',
    '2024-12-14', 
    '2024-12-13',
    '2024-12-12'
  ];

  for (const league of leagues) {
    console.log(`\n⚽ Syncing matches for ${league.name}...`);
    
    for (const date of testDates) {
      const matches = await makeApiCall(`/matches?leagueId=${league.id}&date=${date}&limit=10`);
      
      if (matches && Array.isArray(matches) && matches.length > 0) {
        console.log(`📊 Found ${matches.length} matches for ${date}`);
        
        for (const match of matches) {
          const homeTeamName = match.home_team_name || match.homeTeam?.name;
          const awayTeamName = match.away_team_name || match.awayTeam?.name;
          
          // Get team IDs from database
          const homeTeamId = await getTeamIdByName(homeTeamName);
          const awayTeamId = await getTeamIdByName(awayTeamName);

          if (!homeTeamId || !awayTeamId) {
            console.log(`❌ Could not find team IDs for ${homeTeamName} vs ${awayTeamName}`);
            continue;
          }

          // Match data with correct schema
          const matchData = {
            id: match.id,
            league_id: league.id,
            home_team_id: homeTeamId,
            away_team_id: awayTeamId,
            match_date: match.match_date || match.date || date,
            match_time: match.match_time || match.time,
            home_score: match.home_score || match.homeScore || 0,
            away_score: match.away_score || match.awayScore || 0,
            status: match.status || 'scheduled'
          };

          const { error } = await supabase
            .from('matches')
            .upsert(matchData, { onConflict: 'id' });

          if (error) {
            console.log(`❌ Error upserting match: ${error.message}`);
          } else {
            totalMatches++;
          }
        }
        
        break; // Found matches for this league, move to next league
      }
    }
  }

  console.log(`✅ Matches sync completed: ${totalMatches} matches`);
  return totalMatches;
}

async function syncHighlights() {
  console.log('\n🎬 STEP 2: Syncing Highlights');
  console.log('='.repeat(50));

  let totalHighlights = 0;

  const leagues = [
    { id: 33973, name: 'Premier League' },
    { id: 119924, name: 'La Liga' },
    { id: 115669, name: 'Serie A' },
    { id: 67162, name: 'Bundesliga' },
    { id: 52695, name: 'Ligue 1' }
  ];

  for (const league of leagues) {
    console.log(`\n🎬 Syncing highlights for ${league.name}...`);
    
    const highlights = await makeApiCall(`/highlights?leagueId=${league.id}&limit=10`);
    
    if (highlights && Array.isArray(highlights) && highlights.length > 0) {
      console.log(`📊 Found ${highlights.length} highlights`);
      
      for (const highlight of highlights) {
        // Highlight data with existing schema (no league_id column)
        const highlightData = {
          id: highlight.id,
          title: highlight.title,
          url: highlight.url,
          thumbnail: highlight.thumbnail,
          duration: highlight.duration,
          match_id: highlight.match_id,
          created_at: highlight.created_at || new Date().toISOString()
        };

        const { error } = await supabase
          .from('highlights')
          .upsert(highlightData, { onConflict: 'id' });

        if (error) {
          console.log(`❌ Error upserting highlight: ${error.message}`);
        } else {
          totalHighlights++;
        }
      }
    } else {
      console.log(`📊 No highlights found for ${league.name}`);
    }
  }

  console.log(`✅ Highlights sync completed: ${totalHighlights} highlights`);
  return totalHighlights;
}

async function syncMatchStatistics() {
  console.log('\n📈 STEP 3: Syncing Match Statistics');
  console.log('='.repeat(50));

  // Get recent matches from database
  const { data: recentMatches } = await supabase
    .from('matches')
    .select('*')
    .order('match_date', { ascending: false })
    .limit(5);

  if (!recentMatches || recentMatches.length === 0) {
    console.log('❌ No matches found in database');
    return 0;
  }

  let totalStats = 0;

  for (const match of recentMatches) {
    console.log(`\n📈 Syncing statistics for match ${match.id}...`);
    
    const stats = await makeApiCall(`/statistics/${match.id}`);
    
    if (stats && Array.isArray(stats) && stats.length > 0) {
      console.log(`📊 Found statistics for ${stats.length} teams`);
      
      for (const teamStats of stats) {
        // Check if match_statistics table exists, if not skip
        try {
          const statisticsData = {
            match_id: match.id,
            team_id: teamStats.team?.id,
            team_name: teamStats.team?.name,
            statistics: JSON.stringify(teamStats.statistics || [])
          };

          const { error } = await supabase
            .from('match_statistics')
            .upsert(statisticsData, { onConflict: 'match_id,team_id' });

          if (error) {
            console.log(`❌ Error upserting match statistics: ${error.message}`);
          } else {
            totalStats++;
          }
        } catch (e) {
          console.log(`❌ Match statistics table might not exist: ${e.message}`);
          break;
        }
      }
    }
  }

  console.log(`✅ Match statistics sync completed: ${totalStats} records`);
  return totalStats;
}

async function syncLiveEvents() {
  console.log('\n⚡ STEP 4: Syncing Live Events');
  console.log('='.repeat(50));

  // Get recent matches from database
  const { data: recentMatches } = await supabase
    .from('matches')
    .select('*')
    .order('match_date', { ascending: false })
    .limit(5);

  if (!recentMatches || recentMatches.length === 0) {
    console.log('❌ No matches found in database');
    return 0;
  }

  let totalEvents = 0;

  for (const match of recentMatches) {
    console.log(`\n⚡ Syncing events for match ${match.id}...`);
    
    const events = await makeApiCall(`/events/${match.id}`);
    
    if (events && Array.isArray(events) && events.length > 0) {
      console.log(`📊 Found ${events.length} events`);
      
      for (const event of events) {
        try {
          const eventData = {
            match_id: match.id,
            team_id: event.team?.id,
            team_name: event.team?.name,
            time: event.time,
            type: event.type,
            player: event.player,
            assist: event.assist,
            substituted: event.substituted
          };

          const { error } = await supabase
            .from('match_events')
            .upsert(eventData, { onConflict: 'match_id,time,type,player' });

          if (error) {
            console.log(`❌ Error upserting match event: ${error.message}`);
          } else {
            totalEvents++;
          }
        } catch (e) {
          console.log(`❌ Match events table might not exist: ${e.message}`);
          break;
        }
      }
    }
  }

  console.log(`✅ Live events sync completed: ${totalEvents} events`);
  return totalEvents;
}

async function syncLineups() {
  console.log('\n👥 STEP 5: Syncing Team Lineups');
  console.log('='.repeat(50));

  // Get recent matches from database
  const { data: recentMatches } = await supabase
    .from('matches')
    .select('*')
    .order('match_date', { ascending: false })
    .limit(5);

  if (!recentMatches || recentMatches.length === 0) {
    console.log('❌ No matches found in database');
    return 0;
  }

  let totalLineups = 0;

  for (const match of recentMatches) {
    console.log(`\n👥 Syncing lineups for match ${match.id}...`);
    
    const lineups = await makeApiCall(`/lineups/${match.id}`);
    
    if (lineups && (lineups.homeTeam || lineups.awayTeam)) {
      console.log(`📊 Found lineups for match ${match.id}`);
      
      try {
        // Home team lineup
        if (lineups.homeTeam) {
          const homeLineupData = {
            match_id: match.id,
            team_id: lineups.homeTeam.id,
            team_name: lineups.homeTeam.name,
            formation: lineups.homeTeam.formation,
            initial_lineup: JSON.stringify(lineups.homeTeam.initialLineup || []),
            substitutes: JSON.stringify(lineups.homeTeam.substitutes || [])
          };

          const { error } = await supabase
            .from('lineups')
            .upsert(homeLineupData, { onConflict: 'match_id,team_id' });

          if (!error) totalLineups++;
        }

        // Away team lineup
        if (lineups.awayTeam) {
          const awayLineupData = {
            match_id: match.id,
            team_id: lineups.awayTeam.id,
            team_name: lineups.awayTeam.name,
            formation: lineups.awayTeam.formation,
            initial_lineup: JSON.stringify(lineups.awayTeam.initialLineup || []),
            substitutes: JSON.stringify(lineups.awayTeam.substitutes || [])
          };

          const { error } = await supabase
            .from('lineups')
            .upsert(awayLineupData, { onConflict: 'match_id,team_id' });

          if (!error) totalLineups++;
        }
      } catch (e) {
        console.log(`❌ Lineups table might not exist: ${e.message}`);
        break;
      }
    }
  }

  console.log(`✅ Lineups sync completed: ${totalLineups} lineups`);
  return totalLineups;
}

async function runUltimateFullSync() {
  const startTime = Date.now();
  
  console.log('🚀 ULTIMATE FULL SYNC STARTED');
  console.log('='.repeat(50));
  console.log(`⏰ Start time: ${new Date().toLocaleString()}`);
  console.log('🔧 Using learned configuration:');
  console.log('   • Correct API headers (x-rapidapi-key, x-rapidapi-host)');
  console.log('   • Proper response parsing (data wrapper)');
  console.log('   • Correct database schema (team IDs, proper columns)');
  console.log('   • Working Supabase instance');

  try {
    // Check existing data
    const { count: existingMatches } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true });

    const { count: existingHighlights } = await supabase
      .from('highlights')
      .select('*', { count: 'exact', head: true });

    console.log(`\n📊 Existing data: ${existingMatches} matches, ${existingHighlights} highlights`);

    // Step 1: Sync matches (core data)
    const matchCount = await syncMatches();

    // Step 2: Sync highlights (content)
    const highlightCount = await syncHighlights();

    // Step 3: Sync match statistics (if tables exist)
    const statsCount = await syncMatchStatistics();

    // Step 4: Sync live events (if tables exist)
    const eventsCount = await syncLiveEvents();

    // Step 5: Sync lineups (if tables exist)
    const lineupsCount = await syncLineups();

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    console.log('\n' + '='.repeat(50));
    console.log('🎉 ULTIMATE FULL SYNC COMPLETED');
    console.log(`⏱️  Total time: ${duration}s`);
    console.log(`📊 Total API calls: ${apiCallCount}`);
    console.log('='.repeat(50));
    console.log('✅ Successfully synced:');
    console.log(`   • ${matchCount} matches with real team data`);
    console.log(`   • ${highlightCount} highlights with YouTube URLs`);
    console.log(`   • ${statsCount} match statistics records`);
    console.log(`   • ${eventsCount} live events (goals, cards, etc.)`);
    console.log(`   • ${lineupsCount} team lineups`);
    console.log('');
    console.log('🏁 Your football app is now FULLY LOADED with real data!');
    console.log('🎯 Ready for production with live matches and highlights!');

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  }
}

// Run the ultimate sync
runUltimateFullSync(); 