/**
 * EXPAND ALL LEAGUES TO 300+ MATCHES
 * 
 * Comprehensive script to expand all major leagues to at least 300 matches
 * by fetching from multiple seasons (2023, 2024, 2025) and broader date ranges
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const API_BASE_URL = 'http://localhost:3001/api/highlightly';
const RATE_LIMIT_DELAY = 1000;
const TARGET_MATCHES = 300;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// League configurations with multiple seasons to try
const LEAGUE_CONFIGS = [
  { id: 33973, name: 'Premier League', country: 'England', seasons: [2024, 2023, 2022] },
  { id: 119924, name: 'La Liga', country: 'Spain', seasons: [2024, 2023, 2022] },
  { id: 115669, name: 'Serie A', country: 'Italy', seasons: [2024, 2023, 2022] },
  { id: 67162, name: 'Bundesliga', country: 'Germany', seasons: [2024, 2023, 2022] },
  { id: 52695, name: 'Ligue 1', country: 'France', seasons: [2024, 2023, 2022] },
  { id: 2486, name: 'UEFA Champions League', country: 'World', seasons: [2024, 2023, 2022] },
  { id: 3337, name: 'UEFA Europa League', country: 'World', seasons: [2024, 2023, 2022] },
  { id: 34824, name: 'Championship', country: 'England', seasons: [2024, 2023, 2022] }
];

async function makeAPICall(endpoint, params = {}) {
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
      console.log(`     ❌ ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data && data.data && Array.isArray(data.data)) {
      return data.data;
    } else if (Array.isArray(data)) {
      return data;
    } else {
      return null;
    }
  } catch (error) {
    console.log(`     ❌ API Error: ${error.message}`);
    return null;
  }
}

async function upsertMatch(match, leagueId, season) {
  try {
    let matchDate = null;
    if (match.date || match.datetime || match.kickoff) {
      const dateStr = match.date || match.datetime || match.kickoff;
      matchDate = new Date(dateStr).toISOString();
    }

    const homeTeamId = match.homeTeam?.id || match.home?.id || match.home_team?.id;
    const awayTeamId = match.awayTeam?.id || match.away?.id || match.away_team?.id;

    if (!homeTeamId || !awayTeamId) {
      return false;
    }

    const homeScore = match.homeScore || match.home_score || match.score?.home || null;
    const awayScore = match.awayScore || match.away_score || match.score?.away || null;

    let status = 'scheduled';
    if (match.status) {
      const statusLower = match.status.toLowerCase();
      if (statusLower.includes('finished') || statusLower.includes('ft')) {
        status = 'finished';
      } else if (statusLower.includes('live') || statusLower.includes('playing')) {
        status = 'live';
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
        round: match.round || match.matchday || match.week || null
      }, {
        onConflict: 'id'
      });

    if (error) {
      // Silently skip foreign key errors (missing teams)
      if (!error.message.includes('foreign key constraint')) {
        console.log(`     ⚠️  Match ${match.id} error: ${error.message}`);
      }
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

async function getCurrentMatchCount(leagueId) {
  const { data } = await supabase
    .from('matches')
    .select('id', { count: 'exact' })
    .eq('league_id', leagueId);
  
  return data?.length || 0;
}

async function expandLeague(leagueConfig) {
  const { id, name, country, seasons } = leagueConfig;
  
  console.log(`\n⚽ EXPANDING ${name} [${country}]`);
  console.log('=' .repeat(60));
  
  const startCount = await getCurrentMatchCount(id);
  console.log(`📊 Starting matches: ${startCount}`);
  console.log(`🎯 Target: ${TARGET_MATCHES} matches`);
  
  if (startCount >= TARGET_MATCHES) {
    console.log(`✅ Already has ${TARGET_MATCHES}+ matches!`);
    return { success: true, added: 0, total: startCount };
  }
  
  const needed = TARGET_MATCHES - startCount;
  console.log(`📈 Need: ${needed} more matches`);
  
  let totalAdded = 0;
  let currentTotal = startCount;
  
  // Try each season until we reach the target
  for (const season of seasons) {
    if (currentTotal >= TARGET_MATCHES) break;
    
    console.log(`\n🗓️  Trying season ${season}...`);
    
    const matches = await makeAPICall('/matches', {
      leagueId: parseInt(id),
      season: parseInt(season)
    });
    
    if (!matches || matches.length === 0) {
      console.log(`     ❌ No matches found for season ${season}`);
      continue;
    }
    
    console.log(`     📡 Found ${matches.length} matches from season ${season}`);
    
    let seasonAdded = 0;
    for (const match of matches) {
      const success = await upsertMatch(match, id, season);
      if (success) {
        seasonAdded++;
        totalAdded++;
        currentTotal++;
        
        if (currentTotal >= TARGET_MATCHES) {
          console.log(`     🎉 Reached target of ${TARGET_MATCHES} matches!`);
          break;
        }
      }
    }
    
    console.log(`     ✅ Added ${seasonAdded} new matches from season ${season}`);
    console.log(`     📊 Current total: ${currentTotal} matches`);
    
    // Rate limiting between seasons
    await delay(RATE_LIMIT_DELAY);
  }
  
  const finalCount = await getCurrentMatchCount(id);
  const success = finalCount >= TARGET_MATCHES;
  
  console.log(`\n${success ? '✅' : '⚠️'} ${name} EXPANSION COMPLETE:`);
  console.log(`   📊 Final count: ${finalCount} matches`);
  console.log(`   📈 Added: ${totalAdded} new matches`);
  console.log(`   🎯 Target: ${success ? 'ACHIEVED' : `${TARGET_MATCHES - finalCount} still needed`}`);
  
  return { success, added: totalAdded, total: finalCount };
}

async function expandAllLeagues() {
  console.log('🚀 EXPANDING ALL LEAGUES TO 300+ MATCHES');
  console.log('=' .repeat(70));
  console.log(`🎯 Target: ${TARGET_MATCHES} matches per league`);
  console.log(`📅 Seasons: 2024, 2023, 2022`);
  console.log(`⚽ Leagues: ${LEAGUE_CONFIGS.length} major leagues`);

  const startTime = Date.now();
  const results = [];
  let totalAdded = 0;

  for (let i = 0; i < LEAGUE_CONFIGS.length; i++) {
    const league = LEAGUE_CONFIGS[i];
    
    console.log(`\n[${i + 1}/${LEAGUE_CONFIGS.length}] ${'='.repeat(50)}`);
    
    const result = await expandLeague(league);
    results.push({
      league: league.name,
      country: league.country,
      ...result
    });
    
    totalAdded += result.added;
    
    // Rate limiting between leagues
    if (i < LEAGUE_CONFIGS.length - 1) {
      console.log(`\n⏳ Rate limiting...`);
      await delay(RATE_LIMIT_DELAY * 2);
    }
  }

  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);

  // Final summary
  console.log('\n' + '=' .repeat(70));
  console.log('🎉 ALL LEAGUES EXPANSION COMPLETE');
  console.log('=' .repeat(70));
  console.log(`⏱️  Total time: ${duration} seconds (${Math.round(duration/60)} minutes)`);
  console.log(`📈 Total new matches added: ${totalAdded}`);
  
  const successfulLeagues = results.filter(r => r.success);
  console.log(`✅ Leagues reaching 300+: ${successfulLeagues.length}/${results.length}`);
  
  // Show results by league
  console.log(`\n📊 FINAL RESULTS:`);
  results
    .sort((a, b) => b.total - a.total)
    .forEach(result => {
      const status = result.success ? '✅' : '⚠️';
      const addedText = result.added > 0 ? ` (+${result.added})` : '';
      console.log(`   ${status} ${result.league}: ${result.total} matches${addedText}`);
    });

  // Final database verification
  const { data: finalMatches } = await supabase
    .from('matches')
    .select('id', { count: 'exact' });

  console.log(`\n💾 FINAL DATABASE TOTAL: ${finalMatches?.length || 0} matches`);
  console.log(`📈 Overall improvement: +${totalAdded} matches`);

  // Check if we need to try more seasons
  const stillNeedExpansion = results.filter(r => !r.success);
  if (stillNeedExpansion.length > 0) {
    console.log(`\n⚠️  Leagues still needing expansion:`);
    stillNeedExpansion.forEach(result => {
      const needed = TARGET_MATCHES - result.total;
      console.log(`   📈 ${result.league}: ${result.total}/300 (${needed} more needed)`);
    });
  }
}

expandAllLeagues(); 