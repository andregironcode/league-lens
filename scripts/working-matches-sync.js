/**
 * WORKING MATCHES SYNC
 * 
 * Sync matches using the correct database schema with team IDs
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🚀 STARTING WORKING MATCHES SYNC');

// API configuration
const API_BASE = 'http://localhost:3001/api/highlightly';

async function makeApiCall(endpoint) {
  console.log(`📡 API Call: ${endpoint}`);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`);
    
    if (!response.ok) {
      console.log(`❌ API call failed: HTTP ${response.status}`);
      return null;
    }

    const responseData = await response.json();
    return responseData.data || responseData;
    
  } catch (error) {
    console.log(`❌ API call error: ${error.message}`);
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
  console.log('\n⚽ SYNCING MATCHES WITH CORRECT SCHEMA');
  console.log('='.repeat(40));

  // Get Premier League matches
  const matches = await makeApiCall('/matches?leagueId=33973&date=2024-12-15&limit=5');
  
  if (!matches || !Array.isArray(matches)) {
    console.log('❌ No matches found');
    return 0;
  }

  console.log(`📊 Found ${matches.length} matches`);
  let successCount = 0;

  for (const match of matches) {
    const homeTeamName = match.home_team_name || match.homeTeam?.name;
    const awayTeamName = match.away_team_name || match.awayTeam?.name;
    
    console.log(`📝 Processing: ${homeTeamName} vs ${awayTeamName}`);

    // Get team IDs from database
    const homeTeamId = await getTeamIdByName(homeTeamName);
    const awayTeamId = await getTeamIdByName(awayTeamName);

    if (!homeTeamId || !awayTeamId) {
      console.log(`❌ Could not find team IDs (Home: ${homeTeamId}, Away: ${awayTeamId})`);
      continue;
    }

    // Match data with correct schema
    const matchData = {
      id: match.id,
      league_id: 33973,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      match_date: match.match_date || match.date || '2024-12-15',
      match_time: match.match_time || match.time,
      home_score: match.home_score || match.homeScore || 0,
      away_score: match.away_score || match.awayScore || 0,
      status: match.status || 'scheduled'
    };

    console.log(`📝 Saving: Team ${homeTeamId} vs Team ${awayTeamId}`);

    const { error } = await supabase
      .from('matches')
      .upsert(matchData, { onConflict: 'id' });

    if (error) {
      console.log(`❌ Error: ${error.message}`);
    } else {
      successCount++;
      console.log(`✅ Saved successfully`);
    }
  }

  console.log(`✅ Matches sync: ${successCount}/${matches.length} successful`);
  return successCount;
}

async function runSync() {
  try {
    console.log('📊 Starting matches sync...');
    
    const matchCount = await syncMatches();

    console.log('\n🎉 MATCHES SYNC COMPLETED!');
    console.log(`✅ ${matchCount} matches synced`);

    if (matchCount > 0) {
      console.log('\n🎯 Your app now has REAL MATCH DATA!');
    }

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
  }
}

runSync(); 