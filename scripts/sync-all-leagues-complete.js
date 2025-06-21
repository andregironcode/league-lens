/**
 * SYNC ALL LEAGUES COMPLETE - 2024-2025 SEASON
 * 
 * Comprehensive script to sync ALL matches for ALL leagues in the database
 * This will ensure complete coverage of the 2024-2025 season
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const API_BASE_URL = 'http://localhost:3001/api/highlightly';
const RATE_LIMIT_DELAY = 1000; // Faster for comprehensive sync
const SEASON = '2024';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function makeAPICall(endpoint, params = {}) {
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  const url = new URL(fullUrl);
  
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });

  console.log(`📡 ${url.toString()}`);
  
  try {
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.log(`❌ ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data && data.data && Array.isArray(data.data)) {
      console.log(`✅ ${data.data.length} matches found`);
      return data.data;
    } else if (Array.isArray(data)) {
      console.log(`✅ ${data.length} matches found`);
      return data;
    } else {
      console.log(`⚠️  Unexpected response format`);
      return null;
    }
  } catch (error) {
    console.log(`❌ ${error.message}`);
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
        console.log(`❌ ${error.message}`);
      }
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

async function syncLeagueMatches(league, currentMatches = 0) {
  console.log(`\n⚽ ${league.name} (ID: ${league.id}) [${league.country_name}]`);
  console.log(`   Current: ${currentMatches} matches`);

  const matches = await makeAPICall('/matches', {
    leagueId: parseInt(league.id),
    season: parseInt(SEASON)
  });

  if (!matches || matches.length === 0) {
    console.log(`   ❌ No matches available`);
    return { success: false, totalMatches: 0, matchesUpserted: 0, skipped: false };
  }

  let matchesUpserted = 0;
  let sampleMatches = [];

  for (const match of matches) {
    const success = await upsertMatch(match, league.id);
    if (success) {
      matchesUpserted++;
      
      if (sampleMatches.length < 2 && match.homeTeam && match.awayTeam) {
        sampleMatches.push(`${match.homeTeam.name} vs ${match.awayTeam.name}`);
      }
    }
  }

  const newMatches = matchesUpserted - currentMatches;
  console.log(`   ✅ ${matches.length} found → ${matchesUpserted} saved (${newMatches} new)`);
  if (sampleMatches.length > 0) {
    console.log(`   📋 ${sampleMatches.join(', ')}`);
  }

  return {
    success: matchesUpserted > 0,
    totalMatches: matches.length,
    matchesUpserted,
    newMatches,
    skipped: false
  };
}

async function syncAllLeaguesComplete() {
  console.log('⚽ SYNCING ALL LEAGUES - COMPLETE 2024-2025 SEASON');
  console.log('=' .repeat(70));

  const startTime = Date.now();

  try {
    // Get all leagues
    const { data: leagues, error: leaguesError } = await supabase
      .from('leagues')
      .select('*')
      .order('name');

    if (leaguesError) {
      console.log('❌ Error fetching leagues:', leaguesError);
      return;
    }

    // Get current matches by league
    const { data: currentMatches } = await supabase
      .from('matches')
      .select('league_id')
      .eq('season', SEASON);

    const matchesByLeague = {};
    currentMatches?.forEach(match => {
      const leagueId = match.league_id;
      if (!matchesByLeague[leagueId]) matchesByLeague[leagueId] = 0;
      matchesByLeague[leagueId]++;
    });

    console.log(`\n📊 Found ${leagues.length} leagues to sync:`);
    
    // Show current status
    leagues.forEach(league => {
      const matchCount = matchesByLeague[league.id] || 0;
      const status = matchCount > 0 ? '✅' : '❌';
      console.log(`   ${status} ${league.name} - ${matchCount} matches [${league.country_name}]`);
    });

    const currentTotal = Object.values(matchesByLeague).reduce((sum, count) => sum + count, 0);
    console.log(`\n📊 Current total: ${currentTotal} matches`);
    console.log(`🎯 Processing ${leagues.length} leagues...\n`);

    let totalNewMatches = 0;
    let totalMatches = 0;
    const results = [];

    // Process each league
    for (let i = 0; i < leagues.length; i++) {
      const league = leagues[i];
      const currentCount = matchesByLeague[league.id] || 0;
      
      console.log(`[${i + 1}/${leagues.length}]`, '='.repeat(50));
      
      const result = await syncLeagueMatches(league, currentCount);
      results.push({
        league: league.name,
        country: league.country_name,
        ...result
      });
      
      totalMatches += result.matchesUpserted;
      totalNewMatches += result.newMatches || 0;
      
      // Short delay between leagues
      if (i < leagues.length - 1) {
        await delay(RATE_LIMIT_DELAY);
      }
    }

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    // Final summary
    console.log('\n' + '=' .repeat(70));
    console.log('🎉 ALL LEAGUES SYNC COMPLETE');
    console.log('=' .repeat(70));
    console.log(`⏱️  Total time: ${duration} seconds`);
    console.log(`⚽ Total matches in database: ${totalMatches}`);
    console.log(`🆕 New matches added: ${totalNewMatches}`);
    
    // Show successful leagues
    const successfulLeagues = results.filter(r => r.success);
    const failedLeagues = results.filter(r => !r.success);
    
    console.log(`\n✅ Successful leagues: ${successfulLeagues.length}/${leagues.length}`);
    console.log(`❌ Failed leagues: ${failedLeagues.length}/${leagues.length}`);
    
    if (successfulLeagues.length > 0) {
      console.log('\n📊 Matches by league:');
      successfulLeagues
        .sort((a, b) => b.matchesUpserted - a.matchesUpserted)
        .forEach(result => {
          const newText = result.newMatches > 0 ? ` (+${result.newMatches} new)` : '';
          console.log(`   ⚽ ${result.league}: ${result.matchesUpserted} matches${newText}`);
        });
    }

    if (failedLeagues.length > 0) {
      console.log('\n❌ Leagues with no matches:');
      failedLeagues.forEach(result => {
        console.log(`   ⚠️  ${result.league} [${result.country}]`);
      });
    }

    // Final database verification
    const { data: finalMatches } = await supabase
      .from('matches')
      .select('id', { count: 'exact' })
      .eq('season', SEASON);

    console.log(`\n💾 FINAL DATABASE COUNT: ${finalMatches?.length || 0} matches`);
    console.log(`📈 Improvement: +${(finalMatches?.length || 0) - currentTotal} matches`);

  } catch (error) {
    console.log('❌ Fatal error:', error);
  }
}

syncAllLeaguesComplete(); 