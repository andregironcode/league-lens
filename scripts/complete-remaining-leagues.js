/**
 * COMPLETE REMAINING LEAGUES MATCHES
 * 
 * Complete La Liga, Serie A and add Champions League + Europa League matches
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const API_BASE_URL = 'http://localhost:3001/api/highlightly';
const RATE_LIMIT_DELAY = 1200;
const SEASON = '2024';

// Leagues to complete
const REMAINING_LEAGUES = [
  { id: 119924, name: 'La Liga' },
  { id: 115669, name: 'Serie A' },
  { id: 2486, name: 'UEFA Champions League' },
  { id: 3337, name: 'UEFA Europa League' }
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function makeAPICall(endpoint, params = {}) {
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  const url = new URL(fullUrl);
  
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });

  console.log(`📡 API Call: ${url.toString()}`);
  
  try {
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.log(`❌ API Error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data && data.data && Array.isArray(data.data)) {
      console.log(`✅ API Success: ${data.data.length} matches`);
      return data.data;
    } else if (Array.isArray(data)) {
      console.log(`✅ API Success: ${data.length} matches`);
      return data;
    } else {
      console.log(`⚠️  Unexpected API response format`);
      return null;
    }
  } catch (error) {
    console.log(`❌ API Error: ${error.message}`);
    return null;
  }
}

async function upsertMatch(match, leagueId) {
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
        season: SEASON,
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
        console.log(`❌ Error upserting match: ${error.message}`);
      }
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

async function syncLeagueMatches(league) {
  console.log(`\n⚽ Syncing ${league.name} (ID: ${league.id})`);
  console.log('=' .repeat(50));

  // Check if already has matches
  const { data: existingMatches } = await supabase
    .from('matches')
    .select('id', { count: 'exact' })
    .eq('league_id', league.id)
    .eq('season', SEASON);

  if (existingMatches && existingMatches.length > 0) {
    console.log(`ℹ️  Already has ${existingMatches.length} matches, skipping...`);
    return { success: true, totalMatches: existingMatches.length, matchesUpserted: 0 };
  }

  const matches = await makeAPICall('/matches', {
    leagueId: parseInt(league.id),
    season: parseInt(SEASON)
  });

  if (!matches || matches.length === 0) {
    console.log(`⚠️  No matches found for ${league.name}`);
    return { success: false, totalMatches: 0, matchesUpserted: 0 };
  }

  console.log(`📊 Found ${matches.length} matches`);

  let matchesUpserted = 0;
  const sampleMatches = [];

  for (const match of matches) {
    const success = await upsertMatch(match, league.id);
    if (success) {
      matchesUpserted++;
      
      if (sampleMatches.length < 3 && match.homeTeam && match.awayTeam) {
        sampleMatches.push(`${match.homeTeam.name} vs ${match.awayTeam.name}`);
      }
    }
  }

  console.log(`✅ ${league.name} sync complete:`);
  console.log(`   • Total matches: ${matches.length}`);
  console.log(`   • Successfully saved: ${matchesUpserted}`);
  if (sampleMatches.length > 0) {
    console.log(`   • Sample matches: ${sampleMatches.join(', ')}`);
  }

  return {
    success: matchesUpserted > 0,
    totalMatches: matches.length,
    matchesUpserted
  };
}

async function completeRemainingLeagues() {
  console.log('⚽ COMPLETING REMAINING LEAGUES MATCHES');
  console.log('=' .repeat(60));
  console.log('🏆 Completing: La Liga, Serie A, Champions League, Europa League');

  const startTime = Date.now();
  let totalMatches = 0;
  let totalSaved = 0;
  const results = [];

  for (let i = 0; i < REMAINING_LEAGUES.length; i++) {
    const league = REMAINING_LEAGUES[i];
    
    console.log(`\n[${i + 1}/${REMAINING_LEAGUES.length}] Processing ${league.name}...`);
    
    const result = await syncLeagueMatches(league);
    results.push({
      league: league.name,
      ...result
    });
    
    totalMatches += result.totalMatches;
    totalSaved += result.matchesUpserted;
    
    if (i < REMAINING_LEAGUES.length - 1) {
      console.log(`⏳ Waiting ${RATE_LIMIT_DELAY}ms for rate limiting...`);
      await delay(RATE_LIMIT_DELAY);
    }
  }

  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);

  console.log('\n' + '=' .repeat(60));
  console.log('🎉 REMAINING LEAGUES SYNC COMPLETE');
  console.log('=' .repeat(60));
  console.log(`⏱️  Total time: ${duration} seconds`);
  console.log(`⚽ Total matches found: ${totalMatches}`);
  console.log(`💾 Total new matches saved: ${totalSaved}`);
  
  console.log('\n📊 Results:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`   ${status} ${result.league}: ${result.matchesUpserted}/${result.totalMatches} matches`);
  });

  // Final database check
  const { data: allMatches } = await supabase
    .from('matches')
    .select('league_id, leagues:league_id(name)')
    .eq('season', SEASON);

  if (allMatches) {
    const matchesByLeague = {};
    allMatches.forEach(match => {
      const leagueName = match.leagues?.name || 'Unknown';
      if (!matchesByLeague[leagueName]) matchesByLeague[leagueName] = 0;
      matchesByLeague[leagueName]++;
    });
    
    console.log(`\n💾 Total matches in database: ${allMatches.length}`);
    console.log('\n📊 Final matches by league:');
    Object.entries(matchesByLeague)
      .sort((a, b) => b[1] - a[1])
      .forEach(([league, count]) => {
        console.log(`   ⚽ ${league}: ${count} matches`);
      });
  }
}

completeRemainingLeagues(); 