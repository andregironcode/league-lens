/**
 * COMPLETE ALL MATCHES SYNC
 * Process ALL 4,211 matches for lineups and events
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://septerrkdnojsmtmmska.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(supabaseUrl, supabaseKey);

const PROXY_BASE_URL = 'http://localhost:3001/api/highlightly';
const RATE_LIMIT_DELAY = 1500; // 1.5 seconds between calls

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchFromProxy(endpoint) {
  try {
    const response = await fetch(`${PROXY_BASE_URL}${endpoint}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null; // Data not available
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error.message);
    return null;
  }
}

async function syncLineupForMatch(matchId) {
  try {
    // Check if lineup already exists
    const { data: existingLineup } = await supabase
      .from('match_lineups')
      .select('id')
      .eq('match_id', matchId)
      .limit(1);

    if (existingLineup && existingLineup.length > 0) {
      return { status: 'exists' };
    }

    // Fetch lineup data
    const lineupData = await fetchFromProxy(`/lineups/${matchId}`);
    
    if (!lineupData || (!lineupData.homeTeam && !lineupData.awayTeam)) {
      return { status: 'no_data' };
    }

    // Get match team IDs
    const { data: match } = await supabase
      .from('matches')
      .select('home_team_id, away_team_id')
      .eq('id', matchId)
      .single();
    
    if (!match) {
      return { status: 'no_match' };
    }

    const lineupsToInsert = [];
    
    if (lineupData.homeTeam) {
      lineupsToInsert.push({
        match_id: matchId,
        team_id: match.home_team_id,
        formation: lineupData.homeTeam.formation || 'Unknown',
        players: lineupData.homeTeam.initialLineup || lineupData.homeTeam.startXI || [],
        substitutes: lineupData.homeTeam.substitutes || [],
        coach: lineupData.homeTeam.coach?.name || null,
        api_data: lineupData.homeTeam
      });
    }
    
    if (lineupData.awayTeam) {
      lineupsToInsert.push({
        match_id: matchId,
        team_id: match.away_team_id,
        formation: lineupData.awayTeam.formation || 'Unknown',
        players: lineupData.awayTeam.initialLineup || lineupData.awayTeam.startXI || [],
        substitutes: lineupData.awayTeam.substitutes || [],
        coach: lineupData.awayTeam.coach?.name || null,
        api_data: lineupData.awayTeam
      });
    }

    if (lineupsToInsert.length === 0) {
      return { status: 'no_data' };
    }

    // Insert lineups
    const { error } = await supabase
      .from('match_lineups')
      .insert(lineupsToInsert);

    if (error) {
      console.error(`Lineup insert error for match ${matchId}:`, error);
      return { status: 'error', error };
    }

    return { status: 'saved', count: lineupsToInsert.length };

  } catch (error) {
    console.error(`Lineup sync error for match ${matchId}:`, error);
    return { status: 'error', error };
  }
}

async function syncEventsForMatch(matchId) {
  try {
    // Check if events already exist
    const { data: existingEvents } = await supabase
      .from('match_events')
      .select('id')
      .eq('match_id', matchId)
      .limit(1);

    if (existingEvents && existingEvents.length > 0) {
      return { status: 'exists' };
    }

    // Fetch events data
    const eventsData = await fetchFromProxy(`/events/${matchId}`);
    
    if (!eventsData || !Array.isArray(eventsData) || eventsData.length === 0) {
      return { status: 'no_data' };
    }

    // Process events
    const eventsToInsert = eventsData.map(event => ({
      match_id: matchId,
      team_id: event.team?.id || null,
      player_id: event.player?.id || null,
      player_name: event.player?.name || event.player || null,
      event_type: event.type || 'Unknown',
      minute: event.minute || event.time?.elapsed || 0,
      added_time: event.addedTime || 0,
      description: event.description || event.detail || null,
      api_data: event
    }));

    // Insert events
    const { error } = await supabase
      .from('match_events')
      .insert(eventsToInsert);

    if (error) {
      console.error(`Events insert error for match ${matchId}:`, error);
      return { status: 'error', error };
    }

    return { status: 'saved', count: eventsData.length };

  } catch (error) {
    console.error(`Events sync error for match ${matchId}:`, error);
    return { status: 'error', error };
  }
}

async function syncAllMatches() {
  console.log('🚀 COMPLETE ALL MATCHES SYNC - Processing ALL 4,211 matches');
  console.log('📋 Target: Lineups and Events for every single match\n');
  
  const startTime = Date.now();
  
  // Get ALL matches
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id')
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ Error fetching matches:', error);
    return;
  }

  console.log(`📊 Found ${matches.length} total matches to process`);
  console.log(`⏰ Estimated time: ${Math.round(matches.length * 3 / 60)} minutes\n`);

  const stats = {
    lineups: { processed: 0, saved: 0, exists: 0, no_data: 0, errors: 0 },
    events: { processed: 0, saved: 0, exists: 0, no_data: 0, errors: 0 }
  };

  // Process ALL matches
  for (let i = 0; i < matches.length; i++) {
    const matchId = matches[i].id;
    const progress = `[${i + 1}/${matches.length}]`;
    
    // Show progress every 100 matches or for first 10
    if (i < 10 || (i + 1) % 100 === 0) {
      console.log(`\n${progress} Processing match ${matchId}:`);
    }
    
    // Sync lineups
    const lineupResult = await syncLineupForMatch(matchId);
    stats.lineups.processed++;
    stats.lineups[lineupResult.status] = (stats.lineups[lineupResult.status] || 0) + 1;
    
    if (i < 10 || (i + 1) % 100 === 0) {
      console.log(`  Lineups: ${lineupResult.status}`);
    }
    
    await delay(RATE_LIMIT_DELAY);
    
    // Sync events
    const eventsResult = await syncEventsForMatch(matchId);
    stats.events.processed++;
    stats.events[eventsResult.status] = (stats.events[eventsResult.status] || 0) + 1;
    
    if (i < 10 || (i + 1) % 100 === 0) {
      console.log(`  Events: ${eventsResult.status}`);
    }
    
    // Progress summary every 500 matches
    if ((i + 1) % 500 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
      const remaining = Math.round((matches.length - i - 1) * 3 / 60);
      
      console.log(`\n📊 PROGRESS UPDATE (${i + 1}/${matches.length}) - ${elapsed}min elapsed, ~${remaining}min remaining:`);
      console.log(`   Lineups: ${stats.lineups.saved} saved, ${stats.lineups.exists} exists, ${stats.lineups.no_data} no data`);
      console.log(`   Events:  ${stats.events.saved} saved, ${stats.events.exists} exists, ${stats.events.no_data} no data`);
    }
    
    await delay(RATE_LIMIT_DELAY);
  }

  // Final results
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000 / 60).toFixed(1);
  
  console.log(`\n🏁 COMPLETE SYNC FINISHED! (${duration} minutes)`);
  console.log('========================================');
  console.log(`📊 FINAL RESULTS for ${matches.length} matches:`);
  console.log('\nLINEUPS:');
  console.log(`   ✅ Saved: ${stats.lineups.saved}`);
  console.log(`   ♻️  Already exists: ${stats.lineups.exists}`);
  console.log(`   ⚠️  No data: ${stats.lineups.no_data}`);
  console.log(`   ❌ Errors: ${stats.lineups.errors}`);
  
  console.log('\nEVENTS:');
  console.log(`   ✅ Saved: ${stats.events.saved}`);
  console.log(`   ♻️  Already exists: ${stats.events.exists}`);
  console.log(`   ⚠️  No data: ${stats.events.no_data}`);
  console.log(`   ❌ Errors: ${stats.events.errors}`);

  // Check final database counts
  const { count: finalLineups } = await supabase.from('match_lineups').select('*', { count: 'exact', head: true });
  const { count: finalEvents } = await supabase.from('match_events').select('*', { count: 'exact', head: true });
  
  console.log(`\n🎯 FINAL DATABASE COUNTS:`);
  console.log(`   📋 Lineups: ${finalLineups || 0}`);
  console.log(`   🎬 Events: ${finalEvents || 0}`);
}

// Run the complete sync
syncAllMatches().catch(console.error); 