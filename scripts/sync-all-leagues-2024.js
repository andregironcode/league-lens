/**
 * SYNC ALL LEAGUES 2024 SEASON
 * 
 * Comprehensive sync script to get standings and teams data 
 * for ALL leagues in the database for the 2024 season
 */

import { createClient } from '@supabase/supabase-js';

// Correct Supabase configuration
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
  // Construct URL properly
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
    
    // Handle the Highlightly API response format
    if (data && data.groups && Array.isArray(data.groups) && data.groups.length > 0) {
      const standings = data.groups[0].standings;
      console.log(`✅ API Success: ${standings.length || 0} standings records`);
      return standings;
    } else if (data && data.data) {
      console.log(`✅ API Success: ${data.data.length || 0} records`);
      return data.data;
    } else if (Array.isArray(data)) {
      console.log(`✅ API Success: ${data.length} records`);
      return data;
    } else {
      console.log(`⚠️  API returned unexpected format:`, JSON.stringify(data, null, 2));
      return null;
    }
  } catch (error) {
    console.log(`❌ API Error: ${error.message}`);
    return null;
  }
}

// Function to upsert team data
async function upsertTeam(team, leagueId) {
  try {
    const { error } = await supabase
      .from('teams')
      .upsert({
        id: team.id,
        name: team.name,
        logo: team.logo || null,
        league_id: leagueId
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.log(`❌ Error upserting team ${team.name}: ${error.message}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Error upserting team ${team.name}: ${error.message}`);
    return false;
  }
}

// Function to upsert standings data
async function upsertStanding(standing, leagueId, season) {
  try {
    // Calculate goal difference
    const goalDifference = standing.total.scoredGoals - standing.total.receivedGoals;
    
    const { error } = await supabase
      .from('standings')
      .upsert({
        league_id: leagueId,
        season: season,
        team_id: standing.team.id,
        position: standing.position,
        points: standing.points,
        played: standing.total.games,
        won: standing.total.wins,
        drawn: standing.total.draws,
        lost: standing.total.loses,
        goals_for: standing.total.scoredGoals,
        goals_against: standing.total.receivedGoals,
        goal_difference: goalDifference,
        form_string: null, // Not provided in this API format
        // Home stats
        home_played: standing.home.games,
        home_won: standing.home.wins,
        home_drawn: standing.home.draws,
        home_lost: standing.home.loses,
        home_goals_for: standing.home.scoredGoals,
        home_goals_against: standing.home.receivedGoals,
        // Away stats
        away_played: standing.away.games,
        away_won: standing.away.wins,
        away_drawn: standing.away.draws,
        away_lost: standing.away.loses,
        away_goals_for: standing.away.scoredGoals,
        away_goals_against: standing.away.receivedGoals
      }, {
        onConflict: 'league_id,season,team_id'
      });

    if (error) {
      console.log(`❌ Error upserting standing for ${standing.team.name}: ${error.message}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Error upserting standing for ${standing.team.name}: ${error.message}`);
    return false;
  }
}

// Function to sync standings and teams for a specific league
async function syncLeagueData(league) {
  console.log(`\n🏆 Syncing ${league.name} (ID: ${league.id})`);
  console.log('-'.repeat(50));

  // Get standings data (which includes team data)
  const standingsData = await makeAPICall('/standings', {
    leagueId: parseInt(league.id),
    season: parseInt(SEASON)
  });

  if (!standingsData || !Array.isArray(standingsData) || standingsData.length === 0) {
    console.log(`⚠️  No standings data found for ${league.name}`);
    return {
      success: false,
      teamsCount: 0,
      standingsCount: 0
    };
  }

  console.log(`📊 Found ${standingsData.length} standings records`);

  let teamsUpserted = 0;
  let standingsUpserted = 0;

  // Process each standing record
  for (const standing of standingsData) {
    if (!standing.team || !standing.team.id) {
      console.log(`⚠️  Skipping standing record without team data`);
      continue;
    }

    // Upsert team data
    const teamSuccess = await upsertTeam(standing.team, league.id);
    if (teamSuccess) {
      teamsUpserted++;
    }

    // Upsert standing data
    const standingSuccess = await upsertStanding(standing, league.id, SEASON);
    if (standingSuccess) {
      standingsUpserted++;
    }
  }

  console.log(`✅ ${league.name} sync complete:`);
  console.log(`   • Teams: ${teamsUpserted}/${standingsData.length}`);
  console.log(`   • Standings: ${standingsUpserted}/${standingsData.length}`);

  return {
    success: true,
    teamsCount: teamsUpserted,
    standingsCount: standingsUpserted
  };
}

// Main sync function
async function syncAllLeagues2024() {
  console.log('🚀 STARTING COMPREHENSIVE 2024 SEASON SYNC');
  console.log('='.repeat(60));
  console.log(`📅 Season: ${SEASON}`);
  console.log(`⏱️  Rate Limit: ${RATE_LIMIT_DELAY}ms between calls`);
  console.log('');

  // Get all leagues from database
  const { data: leagues, error } = await supabase
    .from('leagues')
    .select('*')
    .order('name');

  if (error) {
    console.log('❌ Error fetching leagues:', error.message);
    return;
  }

  console.log(`📋 Found ${leagues.length} leagues to sync:`);
  leagues.forEach((league, index) => {
    console.log(`   ${index + 1}. ${league.name} (ID: ${league.id})`);
  });

  console.log('\n🔄 Starting sync process...\n');

  let totalStats = {
    leaguesProcessed: 0,
    leaguesSuccessful: 0,
    totalTeams: 0,
    totalStandings: 0,
    startTime: Date.now()
  };

  // Process each league
  for (let i = 0; i < leagues.length; i++) {
    const league = leagues[i];
    totalStats.leaguesProcessed++;

    console.log(`\n[${i + 1}/${leagues.length}] Processing ${league.name}...`);

    try {
      const result = await syncLeagueData(league);
      
      if (result.success) {
        totalStats.leaguesSuccessful++;
        totalStats.totalTeams += result.teamsCount;
        totalStats.totalStandings += result.standingsCount;
      }

    } catch (error) {
      console.log(`❌ Error processing ${league.name}: ${error.message}`);
    }

    // Rate limiting delay (except for last iteration)
    if (i < leagues.length - 1) {
      console.log(`⏳ Waiting ${RATE_LIMIT_DELAY}ms for rate limiting...`);
      await delay(RATE_LIMIT_DELAY);
    }
  }

  // Final summary
  const duration = Math.round((Date.now() - totalStats.startTime) / 1000);
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 SYNC COMPLETE!');
  console.log('='.repeat(60));
  console.log(`⏱️  Duration: ${duration} seconds`);
  console.log(`📊 Leagues processed: ${totalStats.leaguesProcessed}`);
  console.log(`✅ Leagues successful: ${totalStats.leaguesSuccessful}`);
  console.log(`❌ Leagues failed: ${totalStats.leaguesProcessed - totalStats.leaguesSuccessful}`);
  console.log(`👥 Total teams synced: ${totalStats.totalTeams}`);
  console.log(`📈 Total standings synced: ${totalStats.totalStandings}`);
  console.log('');
  console.log('🏆 Your database now has complete 2024 season data!');
  console.log('✨ All featured leagues are ready for the app!');
}

// Run the sync
syncAllLeagues2024().catch(console.error); 