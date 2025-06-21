/**
 * ENHANCED FULL SEASON SYNC
 * 
 * This script focuses on getting ALL matches from working leagues by:
 * - Proper pagination implementation
 * - Multiple seasons (2024, 2023, 2022, 2021)
 * - Focus on leagues that returned data
 * - Enhanced error handling and progress tracking
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const API_BASE_URL = 'http://localhost:3001/api/highlightly';
const RATE_LIMIT_DELAY = 1000;
const MAX_RETRIES = 3;
const BATCH_SIZE = 100;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Focus on leagues that returned data in previous sync
const WORKING_LEAGUES = [
  { id: 33973, name: 'Premier League', country: 'England', target: 500 },
  { id: 119924, name: 'La Liga', country: 'Spain', target: 500 },
  { id: 115669, name: 'Serie A', country: 'Italy', target: 500 },
  { id: 67162, name: 'Bundesliga', country: 'Germany', target: 500 },
  { id: 52695, name: 'Ligue 1', country: 'France', target: 500 },
  { id: 2486, name: 'UEFA Champions League', country: 'Europe', target: 300 },
  { id: 3337, name: 'UEFA Europa League', country: 'Europe', target: 300 },
  { id: 34824, name: 'Championship', country: 'England', target: 500 }
];

// Multiple seasons to get more matches
const SEASONS = [2024, 2023, 2022, 2021];

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

    return !error;
  } catch (error) {
    return false;
  }
}

async function upsertMatch(match, leagueId, season) {
  try {
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
      return { success: false, reason: 'database_error' };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, reason: 'exception' };
  }
}

async function syncLeagueCompletely(leagueConfig) {
  const { id, name, country, target } = leagueConfig;
  
  console.log(`\n🎯 COMPLETE SYNC: ${name} [${country}] - Target: ${target} matches`);
  console.log('=' .repeat(80));
  
  let grandTotalMatches = 0;
  let grandTotalAdded = 0;
  let allTeams = new Set();
  
  for (const season of SEASONS) {
    console.log(`\n📅 Season ${season}:`);
    
    let seasonMatches = 0;
    let seasonAdded = 0;
    let offset = 0;
    let hasMore = true;
    let batchCount = 0;
    
    while (hasMore && seasonAdded < target) {
      try {
        batchCount++;
        console.log(`   📡 Batch ${batchCount} (offset: ${offset})...`);
        
        const response = await makeAPICall('/matches', {
          leagueId: parseInt(id),
          season: parseInt(season),
          limit: BATCH_SIZE,
          offset: offset
        });
        
        if (!response || !response.data || !Array.isArray(response.data)) {
          console.log(`      ❌ Invalid response format`);
          break;
        }
        
        const matches = response.data;
        console.log(`      📊 Received ${matches.length} matches`);
        
        if (matches.length === 0) {
          hasMore = false;
          break;
        }
        
        // Process teams first
        const teamsToSync = new Set();
        matches.forEach(match => {
          if (match.homeTeam) {
            teamsToSync.add(JSON.stringify(match.homeTeam));
            allTeams.add(match.homeTeam.id);
          }
          if (match.awayTeam) {
            teamsToSync.add(JSON.stringify(match.awayTeam));
            allTeams.add(match.awayTeam.id);
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
            seasonAdded++;
            grandTotalAdded++;
          }
        }
        
        seasonMatches += matches.length;
        grandTotalMatches += matches.length;
        console.log(`      ✅ Processed: ${matches.length} matches, ${teamsAdded} teams, ${batchAdded} saved`);
        
        // Check pagination - be more aggressive about continuing
        if (response.pagination && response.pagination.total) {
          const { total, limit, offset: currentOffset } = response.pagination;
          hasMore = (currentOffset + limit) < total;
          offset = currentOffset + limit;
          console.log(`      📈 Progress: ${Math.min(currentOffset + limit, total)}/${total} (${Math.round((currentOffset + limit)/total*100)}%)`);
        } else {
          // No pagination info, continue if we got full batch
          hasMore = matches.length === BATCH_SIZE;
          offset += BATCH_SIZE;
        }
        
        // Rate limiting
        await delay(RATE_LIMIT_DELAY);
        
        // Stop if we've reached our target for this league
        if (grandTotalAdded >= target) {
          console.log(`      🎯 Target reached! (${grandTotalAdded}/${target})`);
          hasMore = false;
          break;
        }
        
      } catch (error) {
        console.log(`      ❌ Error in batch: ${error.message}`);
        hasMore = false;
      }
    }
    
    console.log(`   📊 Season ${season}: ${seasonMatches} processed, ${seasonAdded} saved`);
    
    // If we reached our target, break out of seasons loop
    if (grandTotalAdded >= target) {
      break;
    }
    
    // Rate limiting between seasons
    await delay(RATE_LIMIT_DELAY);
  }
  
  console.log(`\n🏆 ${name} COMPLETE SYNC RESULTS:`);
  console.log(`   📈 Total matches processed: ${grandTotalMatches}`);
  console.log(`   💾 Total matches saved: ${grandTotalAdded}`);
  console.log(`   👥 Unique teams: ${allTeams.size}`);
  console.log(`   🎯 Target achievement: ${grandTotalAdded}/${target} (${Math.round(grandTotalAdded/target*100)}%)`);
  console.log(`   📈 Success rate: ${grandTotalMatches > 0 ? Math.round((grandTotalAdded/grandTotalMatches)*100) : 0}%`);
  
  return { 
    totalMatches: grandTotalMatches, 
    totalAdded: grandTotalAdded, 
    totalTeams: allTeams.size,
    targetAchieved: grandTotalAdded >= target
  };
}

async function enhancedFullSync() {
  console.log('🚀 ENHANCED FULL SEASON SYNC');
  console.log('=' .repeat(80));
  console.log(`📅 Seasons: ${SEASONS.join(', ')}`);
  console.log(`⚽ Leagues: ${WORKING_LEAGUES.length} working leagues`);
  console.log(`🎯 Total target: ${WORKING_LEAGUES.reduce((sum, l) => sum + l.target, 0)} matches`);
  console.log(`🔄 API: ${API_BASE_URL}`);
  console.log(`⏱️  Rate limit: ${RATE_LIMIT_DELAY}ms between requests`);

  const startTime = Date.now();
  const results = [];
  let grandTotalMatches = 0;
  let grandTotalAdded = 0;

  for (let i = 0; i < WORKING_LEAGUES.length; i++) {
    const league = WORKING_LEAGUES[i];
    
    console.log(`\n[${i + 1}/${WORKING_LEAGUES.length}] ${'='.repeat(60)}`);
    
    try {
      const result = await syncLeagueCompletely(league);
      
      results.push({
        league: league.name,
        country: league.country,
        target: league.target,
        totalMatches: result.totalMatches,
        totalAdded: result.totalAdded,
        totalTeams: result.totalTeams,
        targetAchieved: result.targetAchieved,
        successRate: result.totalMatches > 0 ? Math.round((result.totalAdded/result.totalMatches)*100) : 0
      });
      
      grandTotalMatches += result.totalMatches;
      grandTotalAdded += result.totalAdded;
      
      // Rate limiting between leagues
      if (i < WORKING_LEAGUES.length - 1) {
        console.log(`\n⏳ Rate limiting between leagues...`);
        await delay(RATE_LIMIT_DELAY * 2);
      }
      
    } catch (error) {
      console.log(`❌ Failed to sync ${league.name}: ${error.message}`);
      results.push({
        league: league.name,
        country: league.country,
        target: league.target,
        totalMatches: 0,
        totalAdded: 0,
        totalTeams: 0,
        targetAchieved: false,
        successRate: 0,
        error: error.message
      });
    }
  }

  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);

  // Final comprehensive summary
  console.log('\n' + '=' .repeat(80));
  console.log('🎉 ENHANCED FULL SEASON SYNC COMPLETE');
  console.log('=' .repeat(80));
  console.log(`⏱️  Total time: ${duration} seconds (${Math.round(duration/60)} minutes)`);
  console.log(`📈 Total matches processed: ${grandTotalMatches}`);
  console.log(`💾 Total matches saved: ${grandTotalAdded}`);
  console.log(`📊 Overall success rate: ${grandTotalMatches > 0 ? Math.round((grandTotalAdded/grandTotalMatches)*100) : 0}%`);

  // Detailed results
  console.log(`\n📊 DETAILED RESULTS:`);
  results.forEach(result => {
    const status = result.targetAchieved ? '✅' : result.totalAdded >= 300 ? '⚠️' : '❌';
    const progress = `${result.totalAdded}/${result.target}`;
    console.log(`   ${status} ${result.league}: ${progress} matches (${result.successRate}% success)`);
  });

  // Final database verification
  const { data: finalMatches } = await supabase
    .from('matches')
    .select('id', { count: 'exact' });

  const { data: finalTeams } = await supabase
    .from('teams')
    .select('id', { count: 'exact' });

  console.log(`\n💾 FINAL DATABASE STATE:`);
  console.log(`   📊 Total matches: ${finalMatches?.length || 0}`);
  console.log(`   👥 Total teams: ${finalTeams?.length || 0}`);

  // Success metrics
  const targetAchieved = results.filter(r => r.targetAchieved);
  const over300 = results.filter(r => r.totalAdded >= 300);
  
  console.log(`\n🎯 SUCCESS METRICS:`);
  console.log(`   🏆 Leagues reaching target: ${targetAchieved.length}/${results.length}`);
  console.log(`   ✅ Leagues with 300+ matches: ${over300.length}/${results.length}`);
  console.log(`   📈 Average matches per league: ${Math.round(grandTotalAdded / results.length)}`);
  console.log(`   🎯 Total target achievement: ${grandTotalAdded}/${WORKING_LEAGUES.reduce((sum, l) => sum + l.target, 0)} (${Math.round(grandTotalAdded/WORKING_LEAGUES.reduce((sum, l) => sum + l.target, 0)*100)}%)`);

  console.log(`\n🎉 DATABASE NOW HAS COMPREHENSIVE MATCH DATA!`);
}

enhancedFullSync(); 