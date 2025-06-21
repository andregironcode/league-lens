/**
 * SYNC ALL MATCHES 2024-2025 SEASON
 * 
 * Comprehensive script to load all matches for the 2024-2025 season
 * for all leagues in the database (domestic and international)
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// API Configuration
const API_BASE_URL = 'http://localhost:3001/api/highlightly';
const RATE_LIMIT_DELAY = 1200; // 50 calls per minute = 1200ms between calls
const SEASON = '2024';

// Utility function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Utility function to make API calls with proper error handling
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
    
    // Handle different response formats for matches
    if (data && data.data && Array.isArray(data.data)) {
      console.log(`✅ API Success: ${data.data.length} matches`);
      return data.data;
    } else if (Array.isArray(data)) {
      console.log(`✅ API Success: ${data.length} matches`);
      return data;
    } else if (data && data.matches && Array.isArray(data.matches)) {
      console.log(`✅ API Success: ${data.matches.length} matches`);
      return data.matches;
    } else {
      console.log(`⚠️  API returned unexpected format for matches`);
      console.log(`Response keys: ${Object.keys(data || {}).join(', ')}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ API Error: ${error.message}`);
    return null;
  }
}

// Function to format date for API calls
function formatDateForAPI(date) {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

// Function to upsert match data
async function upsertMatch(match, leagueId) {
  try {
    // Parse match date
    let matchDate = null;
    if (match.date || match.datetime || match.kickoff) {
      const dateStr = match.date || match.datetime || match.kickoff;
      matchDate = new Date(dateStr).toISOString();
    }

    // Extract team IDs (handle different response formats)
    const homeTeamId = match.homeTeam?.id || match.home?.id || match.home_team?.id;
    const awayTeamId = match.awayTeam?.id || match.away?.id || match.away_team?.id;

    if (!homeTeamId || !awayTeamId) {
      console.log(`⚠️  Skipping match without team IDs: ${JSON.stringify(match).slice(0, 100)}`);
      return false;
    }

    // Extract scores
    const homeScore = match.homeScore || match.home_score || match.score?.home || null;
    const awayScore = match.awayScore || match.away_score || match.score?.away || null;

    // Determine match status
    let status = 'scheduled';
    if (match.status) {
      const statusLower = match.status.toLowerCase();
      if (statusLower.includes('finished') || statusLower.includes('ft') || statusLower.includes('full-time')) {
        status = 'finished';
      } else if (statusLower.includes('live') || statusLower.includes('playing')) {
        status = 'live';
      } else if (statusLower.includes('postponed')) {
        status = 'postponed';
      } else if (statusLower.includes('cancelled')) {
        status = 'cancelled';
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
      console.log(`❌ Error upserting match: ${error.message}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Error upserting match: ${error.message}`);
    return false;
  }
}

// Function to get date range for season
function getSeasonDateRange() {
  // 2024-2025 season typically runs from August 2024 to May 2025
  const seasonStart = new Date('2024-08-01');
  const seasonEnd = new Date('2025-05-31');
  
  return { seasonStart, seasonEnd };
}

// Function to generate date chunks for API calls
function generateDateChunks(startDate, endDate, chunkSizeMonths = 1) {
  const chunks = [];
  let currentDate = new Date(startDate);
  
  while (currentDate < endDate) {
    const chunkEnd = new Date(currentDate);
    chunkEnd.setMonth(chunkEnd.getMonth() + chunkSizeMonths);
    
    if (chunkEnd > endDate) {
      chunks.push({
        start: new Date(currentDate),
        end: new Date(endDate)
      });
    } else {
      chunks.push({
        start: new Date(currentDate),
        end: new Date(chunkEnd)
      });
    }
    
    currentDate.setMonth(currentDate.getMonth() + chunkSizeMonths);
  }
  
  return chunks;
}

// Function to sync matches for a specific league
async function syncLeagueMatches(league) {
  console.log(`\n⚽ Syncing matches for ${league.name} (ID: ${league.id})`);
  console.log('=' .repeat(60));

  const { seasonStart, seasonEnd } = getSeasonDateRange();
  const dateChunks = generateDateChunks(seasonStart, seasonEnd, 2); // 2-month chunks

  console.log(`📅 Season range: ${formatDateForAPI(seasonStart)} to ${formatDateForAPI(seasonEnd)}`);
  console.log(`📊 Date chunks: ${dateChunks.length} (2-month intervals)`);

  let totalMatches = 0;
  let matchesUpserted = 0;

  for (let i = 0; i < dateChunks.length; i++) {
    const chunk = dateChunks[i];
    const startDate = formatDateForAPI(chunk.start);
    const endDate = formatDateForAPI(chunk.end);
    
    console.log(`\n📅 Chunk ${i + 1}/${dateChunks.length}: ${startDate} to ${endDate}`);

    // Try different API call patterns
    const apiCalls = [
      // Method 1: Date range
      {
        params: {
          leagueId: parseInt(league.id),
          season: parseInt(SEASON),
          from: startDate,
          to: endDate
        },
        description: 'Date range'
      },
      // Method 2: Single date (start of chunk)
      {
        params: {
          leagueId: parseInt(league.id),
          season: parseInt(SEASON),
          date: startDate
        },
        description: 'Single date (start)'
      },
      // Method 3: Just league and season
      {
        params: {
          leagueId: parseInt(league.id),
          season: parseInt(SEASON)
        },
        description: 'League and season only'
      }
    ];

    let chunkMatches = null;
    
    for (const apiCall of apiCalls) {
      console.log(`🔍 Trying ${apiCall.description}...`);
      chunkMatches = await makeAPICall('/matches', apiCall.params);
      
      if (chunkMatches && chunkMatches.length > 0) {
        console.log(`✅ Success with ${apiCall.description}: ${chunkMatches.length} matches`);
        break;
      }
      
      await delay(300); // Small delay between attempts
    }

    if (!chunkMatches || chunkMatches.length === 0) {
      console.log(`⚠️  No matches found for this chunk`);
      continue;
    }

    // Filter matches to the specific date range
    const filteredMatches = chunkMatches.filter(match => {
      if (!match.date && !match.datetime && !match.kickoff) return false;
      
      const matchDate = new Date(match.date || match.datetime || match.kickoff);
      return matchDate >= chunk.start && matchDate <= chunk.end;
    });

    console.log(`📊 Filtered to date range: ${filteredMatches.length} matches`);
    totalMatches += filteredMatches.length;

    // Process each match
    for (const match of filteredMatches) {
      const success = await upsertMatch(match, league.id);
      if (success) {
        matchesUpserted++;
      }
    }

    console.log(`✅ Chunk ${i + 1} complete: ${matchesUpserted}/${totalMatches} matches upserted`);

    // Rate limiting between chunks
    if (i < dateChunks.length - 1) {
      console.log(`⏳ Waiting ${RATE_LIMIT_DELAY}ms for rate limiting...`);
      await delay(RATE_LIMIT_DELAY);
    }
  }

  console.log(`\n✅ ${league.name} matches sync complete:`);
  console.log(`   • Total matches found: ${totalMatches}`);
  console.log(`   • Matches upserted: ${matchesUpserted}`);

  return {
    success: totalMatches > 0,
    totalMatches,
    matchesUpserted
  };
}

// Main sync function
async function syncAllMatches2024_2025() {
  console.log('⚽ SYNCING ALL MATCHES 2024-2025 SEASON');
  console.log('=' .repeat(80));
  console.log(`🔗 API Base URL: ${API_BASE_URL}`);
  console.log(`📅 Season: ${SEASON}`);
  console.log(`⏰ Rate Limit: ${RATE_LIMIT_DELAY}ms between calls`);

  const startTime = Date.now();
  let totalMatchesAcrossLeagues = 0;
  let totalMatchesUpserted = 0;
  const results = [];

  try {
    // Get all leagues from database
    const { data: leagues, error: leaguesError } = await supabase
      .from('leagues')
      .select('*')
      .order('name');

    if (leaguesError) {
      console.log('❌ Error fetching leagues:', leaguesError);
      return;
    }

    console.log(`\n📊 Found ${leagues.length} leagues to sync matches for:`);
    leagues.forEach((league, index) => {
      console.log(`   ${index + 1}. ${league.name} (ID: ${league.id}) [${league.country_name}]`);
    });

    // Process each league
    for (let i = 0; i < leagues.length; i++) {
      const league = leagues[i];
      
      console.log(`\n[${i + 1}/${leagues.length}] Processing ${league.name}...`);
      
      const result = await syncLeagueMatches(league);
      results.push({
        league: league.name,
        leagueId: league.id,
        ...result
      });
      
      totalMatchesAcrossLeagues += result.totalMatches;
      totalMatchesUpserted += result.matchesUpserted;
      
      // Rate limiting between leagues
      if (i < leagues.length - 1) {
        console.log(`⏳ Waiting ${RATE_LIMIT_DELAY}ms for rate limiting...`);
        await delay(RATE_LIMIT_DELAY);
      }
    }

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    // Final summary
    console.log('\n' + '=' .repeat(80));
    console.log('🎉 ALL MATCHES SYNC COMPLETE');
    console.log('=' .repeat(80));
    console.log(`⏱️  Total time: ${duration} seconds`);
    console.log(`⚽ Total matches found: ${totalMatchesAcrossLeagues}`);
    console.log(`💾 Total matches saved: ${totalMatchesUpserted}`);
    
    console.log('\n📊 Results by league:');
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${status} ${result.league}: ${result.matchesUpserted}/${result.totalMatches} matches`);
    });

    // Show leagues with most matches
    const topLeagues = results
      .filter(r => r.success)
      .sort((a, b) => b.matchesUpserted - a.matchesUpserted)
      .slice(0, 10);

    console.log('\n🏆 Top leagues by matches synced:');
    topLeagues.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.league}: ${result.matchesUpserted} matches`);
    });

    // Final database check
    const { data: dbMatches, error: dbError } = await supabase
      .from('matches')
      .select('league_id, leagues:league_id(name)', { count: 'exact' })
      .eq('season', SEASON);

    if (!dbError) {
      console.log(`\n💾 Total 2024 matches in database: ${dbMatches.length}`);
    }

  } catch (error) {
    console.log('❌ Fatal error:', error);
  }
}

// Run the sync
syncAllMatches2024_2025(); 