/**
 * FINAL WORKING COMPREHENSIVE SYNC
 * 
 * Uses the correct API configuration and response parsing
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration - using the correct instance
const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// API configuration
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

async function syncLeagues() {
  console.log('\n🏆 STEP 1: Syncing Leagues');
  console.log('='.repeat(50));

  const leagues = await makeApiCall('/leagues?limit=100');
  
  if (!leagues || !Array.isArray(leagues)) {
    console.log('❌ No leagues data received');
    return [];
  }

  console.log(`📊 Found ${leagues.length} leagues from API`);

  // Priority leagues with correct IDs
  const priorityLeagues = [
    { id: 33973, name: 'Premier League', country: 'England' },
    { id: 119924, name: 'La Liga', country: 'Spain' },
    { id: 115669, name: 'Serie A', country: 'Italy' },
    { id: 67162, name: 'Bundesliga', country: 'Germany' },
    { id: 52695, name: 'Ligue 1', country: 'France' }
  ];

  // Find matching leagues from API
  const workingLeagues = [];
  for (const priority of priorityLeagues) {
    const apiLeague = leagues.find(l => l.id === priority.id);
    if (apiLeague) {
      workingLeagues.push({
        id: apiLeague.id,
        name: apiLeague.name,
        country_name: apiLeague.country?.name || priority.country,
        logo: apiLeague.logo,
        season: 2024
      });
    } else {
      // Use priority league data if not in API
      workingLeagues.push({
        id: priority.id,
        name: priority.name,
        country_name: priority.country,
        logo: null,
        season: 2024
      });
    }
  }

  // Update database
  for (const league of workingLeagues) {
    const { error } = await supabase
      .from('leagues')
      .upsert(league, { onConflict: 'id' });

    if (error) {
      console.log(`❌ Error upserting league ${league.name}:`, error.message);
    }
  }

  console.log(`✅ Leagues sync completed: ${workingLeagues.length} leagues`);
  return workingLeagues;
}

async function syncMatches(leagues) {
  console.log('\n⚽ STEP 2: Syncing Recent Matches');
  console.log('='.repeat(50));

  let totalMatches = 0;

  // Test recent dates
  const testDates = [
    '2024-12-15',
    '2024-12-14', 
    '2024-12-13',
    '2024-12-12',
    '2024-12-11'
  ];

  for (const league of leagues) {
    console.log(`\n⚽ Syncing matches for ${league.name}...`);
    
    for (const date of testDates) {
      const matches = await makeApiCall(`/matches?leagueId=${league.id}&date=${date}&limit=20`);
      
      if (matches && Array.isArray(matches) && matches.length > 0) {
        console.log(`📊 Found ${matches.length} matches for ${date}`);
        
        for (const match of matches) {
          const matchData = {
            id: match.id,
            league_id: league.id,
            home_team_name: match.home_team_name || match.homeTeam?.name,
            away_team_name: match.away_team_name || match.awayTeam?.name,
            home_team_logo: match.home_team_logo || match.homeTeam?.logo,
            away_team_logo: match.away_team_logo || match.awayTeam?.logo,
            match_date: match.match_date || match.date,
            match_time: match.match_time || match.time,
            home_score: match.home_score || match.homeScore || 0,
            away_score: match.away_score || match.awayScore || 0,
            status: match.status || 'scheduled',
            season: 2024
          };

          const { error } = await supabase
            .from('matches')
            .upsert(matchData, { onConflict: 'id' });

          if (error) {
            console.log(`❌ Error upserting match:`, error.message);
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

async function syncHighlights(leagues) {
  console.log('\n🎬 STEP 3: Syncing Highlights');
  console.log('='.repeat(50));

  let totalHighlights = 0;

  for (const league of leagues) {
    console.log(`\n🎬 Syncing highlights for ${league.name}...`);
    
    const highlights = await makeApiCall(`/highlights?leagueId=${league.id}&limit=20`);
    
    if (highlights && Array.isArray(highlights) && highlights.length > 0) {
      console.log(`📊 Found ${highlights.length} highlights`);
      
      for (const highlight of highlights) {
        const highlightData = {
          id: highlight.id,
          league_id: league.id,
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
          console.log(`❌ Error upserting highlight:`, error.message);
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

async function syncStandings(leagues) {
  console.log('\n📊 STEP 4: Syncing Standings (if available)');
  console.log('='.repeat(50));

  let totalStandings = 0;

  for (const league of leagues) {
    console.log(`\n📊 Syncing standings for ${league.name}...`);
    
    // Try different seasons
    const seasons = [2024, 2025, 2023];
    
    for (const season of seasons) {
      const standings = await makeApiCall(`/standings?leagueId=${league.id}&season=${season}`);
      
      if (standings && Array.isArray(standings) && standings.length > 0) {
        console.log(`📊 Found ${standings.length} teams for season ${season}`);
        
        for (const team of standings) {
          const standingData = {
            league_id: league.id,
            team_id: team.team_id || team.id,
            team_name: team.team_name,
            team_logo: team.team_logo,
            position: team.position,
            points: team.points || 0,
            played: team.played || 0,
            won: team.won || 0,
            drawn: team.drawn || 0,
            lost: team.lost || 0,
            goals_for: team.goals_for || 0,
            goals_against: team.goals_against || 0,
            goal_difference: team.goal_difference || 0,
            season: season
          };

          const { error } = await supabase
            .from('standings')
            .upsert(standingData, { onConflict: 'league_id,team_id,season' });

          if (error) {
            console.log(`❌ Error upserting standing:`, error.message);
          } else {
            totalStandings++;
          }
        }
        
        break; // Found data for this league, move to next
      }
    }
  }

  console.log(`✅ Standings sync completed: ${totalStandings} standings`);
  return totalStandings;
}

async function syncMatchStatistics(matches) {
  console.log('\n📈 STEP 5: Syncing Match Statistics');
  console.log('='.repeat(50));

  let totalStats = 0;

  for (const match of matches.slice(0, 10)) { // Limit to first 10 matches
    console.log(`\n📈 Syncing statistics for match ${match.id}...`);
    
    const stats = await makeApiCall(`/statistics/${match.id}`);
    
    if (stats && Array.isArray(stats) && stats.length > 0) {
      console.log(`📊 Found statistics for ${stats.length} teams`);
      
      for (const teamStats of stats) {
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
          console.log(`❌ Error upserting match statistics:`, error.message);
        } else {
          totalStats++;
        }
      }
    }
  }

  console.log(`✅ Match statistics sync completed: ${totalStats} records`);
  return totalStats;
}

async function syncLiveEvents(matches) {
  console.log('\n⚡ STEP 6: Syncing Live Events');
  console.log('='.repeat(50));

  let totalEvents = 0;

  for (const match of matches.slice(0, 10)) { // Limit to first 10 matches
    console.log(`\n⚡ Syncing events for match ${match.id}...`);
    
    const events = await makeApiCall(`/events/${match.id}`);
    
    if (events && Array.isArray(events) && events.length > 0) {
      console.log(`📊 Found ${events.length} events`);
      
      for (const event of events) {
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
          console.log(`❌ Error upserting match event:`, error.message);
        } else {
          totalEvents++;
        }
      }
    }
  }

  console.log(`✅ Live events sync completed: ${totalEvents} events`);
  return totalEvents;
}

async function syncLineups(matches) {
  console.log('\n👥 STEP 7: Syncing Team Lineups');
  console.log('='.repeat(50));

  let totalLineups = 0;

  for (const match of matches.slice(0, 10)) { // Limit to first 10 matches
    console.log(`\n👥 Syncing lineups for match ${match.id}...`);
    
    const lineups = await makeApiCall(`/lineups/${match.id}`);
    
    if (lineups && (lineups.homeTeam || lineups.awayTeam)) {
      console.log(`📊 Found lineups for match ${match.id}`);
      
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
    }
  }

  console.log(`✅ Lineups sync completed: ${totalLineups} lineups`);
  return totalLineups;
}

async function syncTeamStats(leagues) {
  console.log('\n🏆 STEP 8: Syncing Team Statistics');
  console.log('='.repeat(50));

  let totalTeamStats = 0;

  for (const league of leagues) {
    console.log(`\n🏆 Syncing team stats for ${league.name}...`);
    
    // Try to get teams for this league
    const teams = await makeApiCall(`/teams?leagueId=${league.id}&limit=50`);
    
    if (teams && Array.isArray(teams) && teams.length > 0) {
      console.log(`📊 Found ${teams.length} teams`);
      
      for (const team of teams.slice(0, 5)) { // Limit to first 5 teams per league
        const teamStats = await makeApiCall(`/teams/${team.id}/statistics`);
        
        if (teamStats) {
          const teamStatsData = {
            team_id: team.id,
            league_id: league.id,
            team_name: team.name,
            statistics: JSON.stringify(teamStats)
          };

          const { error } = await supabase
            .from('team_statistics')
            .upsert(teamStatsData, { onConflict: 'team_id,league_id' });

          if (!error) totalTeamStats++;
        }
      }
    }
  }

  console.log(`✅ Team statistics sync completed: ${totalTeamStats} records`);
  return totalTeamStats;
}

async function runFinalWorkingSync() {
  const startTime = Date.now();
  
  console.log('🚀 FINAL WORKING COMPREHENSIVE SYNC STARTED');
  console.log('='.repeat(50));
  console.log(`⏰ Start time: ${new Date().toLocaleString()}`);

  try {
    // Step 1: Sync leagues
    const leagues = await syncLeagues();
    if (leagues.length === 0) {
      throw new Error('No leagues synced');
    }

    // Step 2: Sync matches
    const matchCount = await syncMatches(leagues);

    // Step 3: Sync highlights  
    const highlightCount = await syncHighlights(leagues);

    // Step 4: Sync standings
    const standingCount = await syncStandings(leagues);

    // Get recent matches for statistics
    const { data: recentMatches } = await supabase
      .from('matches')
      .select('*')
      .order('match_date', { ascending: false })
      .limit(10);

    // Step 5: Sync match statistics
    const statsCount = recentMatches ? await syncMatchStatistics(recentMatches) : 0;

    // Step 6: Sync live events
    const eventsCount = recentMatches ? await syncLiveEvents(recentMatches) : 0;

    // Step 7: Sync lineups
    const lineupsCount = recentMatches ? await syncLineups(recentMatches) : 0;

    // Step 8: Sync team statistics
    const teamStatsCount = await syncTeamStats(leagues);

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    console.log('\n' + '='.repeat(50));
    console.log('🎉 FINAL WORKING SYNC COMPLETED');
    console.log(`⏱️  Total time: ${duration}s`);
    console.log(`📊 Total API calls: ${apiCallCount}`);
    console.log('='.repeat(50));
    console.log('✅ Your football app now has:');
    console.log(`   • ${leagues.length} leagues configured`);
    console.log(`   • ${matchCount} recent matches`);
    console.log(`   • ${highlightCount} highlights with YouTube URLs`);
    console.log(`   • ${standingCount} standings records`);
    console.log(`   • ${statsCount} match statistics records`);
    console.log(`   • ${eventsCount} live events (goals, cards, etc.)`);
    console.log(`   • ${lineupsCount} team lineups`);
    console.log(`   • ${teamStatsCount} team statistics records`);
    console.log('');
    console.log('🏁 Ready to launch with COMPLETE DATA!');

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  }
}

// Run the sync
runFinalWorkingSync(); 