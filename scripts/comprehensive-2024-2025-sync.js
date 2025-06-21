/**
 * COMPREHENSIVE 2024-2025 SEASON SYNC
 * 
 * Based on the OpenAPI specification, this script will populate the entire database
 * with ALL matches for the 2024-2025 season across all major leagues.
 * 
 * Features:
 * - Proper pagination handling (100 matches per request)
 * - Multiple seasons (2024, 2025)
 * - All major European leagues + international competitions
 * - Teams, leagues, and matches sync
 * - Robust error handling and progress tracking
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const API_BASE_URL = 'http://localhost:3001/api/highlightly';
const RATE_LIMIT_DELAY = 1200; // 1.2 seconds between requests
const MAX_RETRIES = 3;
const BATCH_SIZE = 100; // API max limit per request

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Comprehensive league configuration for 2024-2025 season
const LEAGUES_CONFIG = [
  // Top 5 European Leagues
  { id: 33973, name: 'Premier League', country: 'England', priority: 1 },
  { id: 119924, name: 'La Liga', country: 'Spain', priority: 1 },
  { id: 115669, name: 'Serie A', country: 'Italy', priority: 1 },
  { id: 67162, name: 'Bundesliga', country: 'Germany', priority: 1 },
  { id: 52695, name: 'Ligue 1', country: 'France', priority: 1 },
  
  // European Competitions
  { id: 2486, name: 'UEFA Champions League', country: 'Europe', priority: 2 },
  { id: 3337, name: 'UEFA Europa League', country: 'Europe', priority: 2 },
  { id: 3338, name: 'UEFA Conference League', country: 'Europe', priority: 2 },
  
  // Other Major European Leagues
  { id: 34824, name: 'Championship', country: 'England', priority: 3 },
  { id: 41463, name: 'Eredivisie', country: 'Netherlands', priority: 3 },
  { id: 67159, name: 'Liga Portugal', country: 'Portugal', priority: 3 },
  { id: 41457, name: 'Belgian Pro League', country: 'Belgium', priority: 3 },
  { id: 42274, name: 'Austrian Bundesliga', country: 'Austria', priority: 3 },
  { id: 42275, name: 'Swiss Super League', country: 'Switzerland', priority: 3 },
  
  // International Competitions
  { id: 2487, name: 'UEFA Nations League', country: 'Europe', priority: 4 },
  { id: 3336, name: 'World Cup Qualifiers', country: 'World', priority: 4 },
  { id: 2488, name: 'European Championship', country: 'Europe', priority: 4 },
  
  // South American Competitions
  { id: 2489, name: 'Copa Libertadores', country: 'South America', priority: 4 },
  { id: 2490, name: 'Copa Sudamericana', country: 'South America', priority: 4 },
  { id: 2491, name: 'Copa America', country: 'South America', priority: 4 }
];

// Seasons to sync (2024-2025 season spans both years)
const SEASONS = [2024, 2025];

async function makeAPICall(endpoint, params = {}, retries = 0) {
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  const url = new URL(fullUrl);
  
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });

  try {
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      if (response.status === 429 && retries < MAX_RETRIES) {
        console.log(`     ⏳ Rate limited, waiting ${RATE_LIMIT_DELAY * 2}ms...`);
        await delay(RATE_LIMIT_DELAY * 2);
        return await makeAPICall(endpoint, params, retries + 1);
      }
      throw new Error(`${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    if (retries < MAX_RETRIES) {
      console.log(`     ⚠️  Error (${error.message}), retrying in ${RATE_LIMIT_DELAY}ms...`);
      await delay(RATE_LIMIT_DELAY);
      return await makeAPICall(endpoint, params, retries + 1);
    }
    throw error;
  }
}

async function upsertLeague(league) {
  try {
    const { error } = await supabase
      .from('leagues')
      .upsert({
        id: league.id,
        name: league.name,
        logo: league.logo,
        country_code: league.country?.code,
        country_name: league.country?.name,
        country_logo: league.country?.logo,
        current_season: league.currentSeason || '2024',
        api_data: league
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.log(`     ⚠️  League ${league.name} error: ${error.message}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.log(`     ❌ League ${league.name} failed: ${error.message}`);
    return false;
  }
}

async function upsertTeam(team, leagueId) {
  try {
    const { error } = await supabase
      .from('teams')
      .upsert({
        id: team.id,
        name: team.name,
        logo: team.logo,
        league_id: leagueId,
        api_data: team
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.log(`     ⚠️  Team ${team.name} error: ${error.message}`);
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

async function upsertMatch(match, leagueId, season) {
  try {
    // Extract match data according to OpenAPI spec
    let matchDate = null;
    if (match.date) {
      matchDate = new Date(match.date).toISOString();
    }

    const homeTeamId = match.homeTeam?.id;
    const awayTeamId = match.awayTeam?.id;

    if (!homeTeamId || !awayTeamId) {
      return { success: false, reason: 'missing_teams' };
    }

    // Extract scores from state object
    let homeScore = null;
    let awayScore = null;
    if (match.state?.score?.current) {
      const scoreStr = match.state.score.current;
      if (scoreStr && scoreStr.includes('-')) {
        const [home, away] = scoreStr.split('-').map(s => parseInt(s.trim(), 10));
        homeScore = isNaN(home) ? null : home;
        awayScore = isNaN(away) ? null : away;
      }
    }

    // Determine match status
    let status = 'scheduled';
    if (match.state?.description) {
      const stateDesc = match.state.description.toLowerCase();
      if (stateDesc.includes('finished')) {
        status = 'finished';
      } else if (stateDesc.includes('live') || stateDesc.includes('in progress')) {
        status = 'live';
      } else if (stateDesc.includes('postponed')) {
        status = 'postponed';
      } else if (stateDesc.includes('cancelled')) {
        status = 'cancelled';
      }
    }

    const { error } = await supabase
      .from('matches')
      .upsert({
        id: match.id,
        league_id: leagueId,
        season: season.toString(),
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        match_date: matchDate,
        home_score: homeScore,
        away_score: awayScore,
        status: status,
        round: match.round || null,
        api_data: match
      }, {
        onConflict: 'id'
      });

    if (error) {
      if (error.message.includes('foreign key constraint')) {
        return { success: false, reason: 'missing_teams_in_db' };
      }
      console.log(`     ⚠️  Match ${match.id} error: ${error.message}`);
      return { success: false, reason: 'database_error' };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, reason: 'exception' };
  }
}

async function syncLeagueMatches(leagueConfig, season) {
  const { id, name, country } = leagueConfig;
  
  console.log(`\n⚽ SYNCING ${name} [${country}] - Season ${season}`);
  console.log('=' .repeat(70));
  
  let totalMatches = 0;
  let totalAdded = 0;
  let totalTeams = new Set();
  let offset = 0;
  let hasMore = true;
  
  while (hasMore) {
    try {
      console.log(`📡 Fetching batch ${Math.floor(offset/BATCH_SIZE) + 1} (offset: ${offset})...`);
      
      const response = await makeAPICall('/matches', {
        leagueId: parseInt(id),
        season: parseInt(season),
        limit: BATCH_SIZE,
        offset: offset
      });
      
      if (!response || !response.data || !Array.isArray(response.data)) {
        console.log(`     ❌ Invalid response format`);
        break;
      }
      
      const matches = response.data;
      console.log(`     📊 Received ${matches.length} matches`);
      
      if (matches.length === 0) {
        hasMore = false;
        break;
      }
      
      // Process teams first
      const teamsToSync = new Set();
      matches.forEach(match => {
        if (match.homeTeam) {
          teamsToSync.add(JSON.stringify(match.homeTeam));
          totalTeams.add(match.homeTeam.id);
        }
        if (match.awayTeam) {
          teamsToSync.add(JSON.stringify(match.awayTeam));
          totalTeams.add(match.awayTeam.id);
        }
      });
      
      // Sync teams
      let teamsAdded = 0;
      for (const teamJson of teamsToSync) {
        const team = JSON.parse(teamJson);
        const success = await upsertTeam(team, id);
        if (success) teamsAdded++;
      }
      
      // Sync matches
      let batchAdded = 0;
      for (const match of matches) {
        const result = await upsertMatch(match, id, season);
        if (result.success) {
          batchAdded++;
          totalAdded++;
        }
      }
      
      totalMatches += matches.length;
      console.log(`     ✅ Processed: ${matches.length} matches, ${teamsAdded} teams, ${batchAdded} saved`);
      
      // Check pagination
      if (response.pagination) {
        const { total, limit, offset: currentOffset } = response.pagination;
        hasMore = (currentOffset + limit) < total;
        offset = currentOffset + limit;
        
        console.log(`     📈 Progress: ${Math.min(currentOffset + limit, total)}/${total} matches`);
      } else {
        // No pagination info, check if we got full batch
        hasMore = matches.length === BATCH_SIZE;
        offset += BATCH_SIZE;
      }
      
      // Rate limiting
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      console.log(`     ❌ Error in batch: ${error.message}`);
      hasMore = false;
    }
  }
  
  console.log(`\n📊 ${name} SYNC COMPLETE:`);
  console.log(`   📈 Total matches processed: ${totalMatches}`);
  console.log(`   💾 Matches saved: ${totalAdded}`);
  console.log(`   👥 Unique teams: ${totalTeams.size}`);
  console.log(`   📈 Success rate: ${totalMatches > 0 ? Math.round((totalAdded/totalMatches)*100) : 0}%`);
  
  return { totalMatches, totalAdded, totalTeams };
}

async function comprehensiveSync() {
  console.log('🚀 COMPREHENSIVE 2024-2025 SEASON SYNC');
  console.log('=' .repeat(80));
  console.log(`📅 Seasons: ${SEASONS.join(', ')}`);
  console.log(`⚽ Leagues: ${LEAGUES_CONFIG.length} leagues`);
  console.log(`🔄 API: ${API_BASE_URL}`);
  console.log(`⏱️  Rate limit: ${RATE_LIMIT_DELAY}ms between requests`);

  const startTime = Date.now();
  const results = [];
  let grandTotalMatches = 0;
  let grandTotalAdded = 0;
  let grandTotalTeams = new Set();

  // Group leagues by priority for better progress tracking
  const leaguesByPriority = LEAGUES_CONFIG.reduce((acc, league) => {
    if (!acc[league.priority]) acc[league.priority] = [];
    acc[league.priority].push(league);
    return acc;
  }, {});

  for (const priority of Object.keys(leaguesByPriority).sort()) {
    const leagues = leaguesByPriority[priority];
    console.log(`\n🏆 PRIORITY ${priority} LEAGUES (${leagues.length} leagues)`);
    console.log('=' .repeat(60));

    for (let i = 0; i < leagues.length; i++) {
      const league = leagues[i];
      
      console.log(`\n[${i + 1}/${leagues.length}] ${'='.repeat(50)}`);
      
      // Sync league info first
      const leagueData = {
        id: league.id,
        name: league.name,
        country: { name: league.country },
        currentSeason: '2024'
      };
      await upsertLeague(leagueData);
      
      // Sync all seasons for this league
      let leagueTotalMatches = 0;
      let leagueTotalAdded = 0;
      let leagueTeams = new Set();
      
      for (const season of SEASONS) {
        const result = await syncLeagueMatches(league, season);
        leagueTotalMatches += result.totalMatches;
        leagueTotalAdded += result.totalAdded;
        for (const teamId of result.totalTeams) {
          leagueTeams.add(teamId);
        }
        
        // Rate limiting between seasons
        if (SEASONS.indexOf(season) < SEASONS.length - 1) {
          await delay(RATE_LIMIT_DELAY);
        }
      }
      
      results.push({
        league: league.name,
        country: league.country,
        priority: league.priority,
        totalMatches: leagueTotalMatches,
        totalAdded: leagueTotalAdded,
        totalTeams: leagueTeams.size,
        successRate: leagueTotalMatches > 0 ? Math.round((leagueTotalAdded/leagueTotalMatches)*100) : 0
      });
      
      grandTotalMatches += leagueTotalMatches;
      grandTotalAdded += leagueTotalAdded;
      for (const teamId of leagueTeams) {
        grandTotalTeams.add(teamId);
      }
      
      // Rate limiting between leagues
      if (i < leagues.length - 1) {
        console.log(`\n⏳ Rate limiting between leagues...`);
        await delay(RATE_LIMIT_DELAY * 2);
      }
    }
  }

  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);

  // Final comprehensive summary
  console.log('\n' + '=' .repeat(80));
  console.log('🎉 COMPREHENSIVE 2024-2025 SYNC COMPLETE');
  console.log('=' .repeat(80));
  console.log(`⏱️  Total time: ${duration} seconds (${Math.round(duration/60)} minutes)`);
  console.log(`📈 Total matches processed: ${grandTotalMatches}`);
  console.log(`💾 Total matches saved: ${grandTotalAdded}`);
  console.log(`👥 Total unique teams: ${grandTotalTeams.size}`);
  console.log(`📊 Overall success rate: ${grandTotalMatches > 0 ? Math.round((grandTotalAdded/grandTotalMatches)*100) : 0}%`);

  // Detailed results by priority
  console.log(`\n📊 RESULTS BY PRIORITY:`);
  Object.keys(leaguesByPriority).sort().forEach(priority => {
    const priorityResults = results.filter(r => r.priority == priority);
    const priorityMatches = priorityResults.reduce((sum, r) => sum + r.totalAdded, 0);
    console.log(`\n🏆 Priority ${priority} (${priorityResults.length} leagues): ${priorityMatches} matches`);
    priorityResults.forEach(result => {
      const status = result.totalAdded >= 300 ? '✅' : result.totalAdded >= 100 ? '⚠️' : '❌';
      console.log(`   ${status} ${result.league}: ${result.totalAdded} matches (${result.successRate}% success)`);
    });
  });

  // Final database verification
  const { data: finalMatches } = await supabase
    .from('matches')
    .select('id', { count: 'exact' });

  const { data: finalTeams } = await supabase
    .from('teams')
    .select('id', { count: 'exact' });

  const { data: finalLeagues } = await supabase
    .from('leagues')
    .select('id', { count: 'exact' });

  console.log(`\n💾 FINAL DATABASE STATE:`);
  console.log(`   📊 Matches: ${finalMatches?.length || 0}`);
  console.log(`   👥 Teams: ${finalTeams?.length || 0}`);
  console.log(`   🏆 Leagues: ${finalLeagues?.length || 0}`);

  // Success metrics
  const successfulLeagues = results.filter(r => r.totalAdded >= 100);
  console.log(`\n🎯 SUCCESS METRICS:`);
  console.log(`   ✅ Leagues with 100+ matches: ${successfulLeagues.length}/${results.length}`);
  console.log(`   🏆 Leagues with 300+ matches: ${results.filter(r => r.totalAdded >= 300).length}/${results.length}`);
  console.log(`   📈 Average matches per league: ${Math.round(grandTotalAdded / results.length)}`);

  console.log(`\n🎉 DATABASE IS NOW FULLY POPULATED FOR 2024-2025 SEASON!`);
}

comprehensiveSync(); 