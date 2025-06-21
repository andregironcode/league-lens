/**
 * SCHEMA-COMPATIBLE SYNC
 * 
 * Sync script that matches the existing database schema
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration - using the correct instance
const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🚀 STARTING SCHEMA-COMPATIBLE SYNC');

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

async function syncMatches() {
  console.log('\n⚽ SYNCING MATCHES');
  console.log('='.repeat(30));

  // Get Premier League matches
  const matches = await makeApiCall('/matches?leagueId=33973&date=2024-12-15&limit=5');
  
  if (!matches || !Array.isArray(matches)) {
    console.log('❌ No matches found');
    return 0;
  }

  console.log(`📊 Found ${matches.length} matches`);
  let successCount = 0;

  for (const match of matches) {
    // Simple match data without problematic fields
    const matchData = {
      id: match.id,
      league_id: 33973,
      home_team_name: match.home_team_name || 'Unknown',
      away_team_name: match.away_team_name || 'Unknown',
      match_date: match.match_date || '2024-12-15',
      status: match.status || 'scheduled'
    };

    console.log(`📝 Saving: ${matchData.home_team_name} vs ${matchData.away_team_name}`);

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

async function syncHighlights() {
  console.log('\n🎬 SYNCING HIGHLIGHTS');
  console.log('='.repeat(30));

  // Get Premier League highlights
  const highlights = await makeApiCall('/highlights?leagueId=33973&limit=5');
  
  if (!highlights || !Array.isArray(highlights)) {
    console.log('❌ No highlights found');
    return 0;
  }

  console.log(`📊 Found ${highlights.length} highlights`);
  let successCount = 0;

  for (const highlight of highlights) {
    // Simple highlight data without problematic fields
    const highlightData = {
      id: highlight.id,
      title: highlight.title || 'Highlight',
      url: highlight.url,
      thumbnail: highlight.thumbnail,
      created_at: new Date().toISOString()
    };

    console.log(`📝 Saving: ${highlightData.title.substring(0, 50)}...`);

    const { error } = await supabase
      .from('highlights')
      .upsert(highlightData, { onConflict: 'id' });

    if (error) {
      console.log(`❌ Error: ${error.message}`);
    } else {
      successCount++;
      console.log(`✅ Saved successfully`);
    }
  }

  console.log(`✅ Highlights sync: ${successCount}/${highlights.length} successful`);
  return successCount;
}

async function runSync() {
  try {
    console.log('📊 Starting sync process...');
    
    const matchCount = await syncMatches();
    const highlightCount = await syncHighlights();

    console.log('\n🎉 SYNC COMPLETED!');
    console.log(`✅ ${matchCount} matches synced`);
    console.log(`✅ ${highlightCount} highlights synced`);

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
  }
}

runSync(); 