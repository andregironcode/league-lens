import { createClient } from '@supabase/supabase-js';

// Supabase configuration - using correct credentials from working scripts
const supabaseUrl = 'https://septerrkdnojsmtmmska.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(supabaseUrl, supabaseKey);

const PROXY_BASE_URL = 'http://localhost:3001/api/highlightly';

// Rate limiting: 40 calls per minute
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

async function syncLineupData(matchId) {
  console.log(`[LINEUPS] Processing match ${matchId}...`);
  
  try {
    // Check if lineup already exists
    const { data: existingLineup } = await supabase
      .from('match_lineups')
      .select('id')
      .eq('match_id', matchId)
      .limit(1);

    if (existingLineup && existingLineup.length > 0) {
      console.log(`[LINEUPS] ✓ Already exists for match ${matchId}`);
      return { status: 'exists' };
    }

    // Fetch lineup data from API using correct endpoint structure
    const lineupData = await fetchFromProxy(`/lineups/${matchId}`);
    
    if (!lineupData) {
      console.log(`[LINEUPS] ⚠ No data available for match ${matchId}`);
      return { status: 'no_data' };
    }

    // Check if we have valid lineup data structure
    if (!lineupData.homeTeam && !lineupData.awayTeam && !lineupData.home && !lineupData.away && !Array.isArray(lineupData)) {
      console.log(`[LINEUPS] ⚠ Invalid data structure for match ${matchId}`);
      return { status: 'invalid_data' };
    }

    // Handle different response formats from API
    let lineupsToInsert = [];
    
    if (lineupData.homeTeam && lineupData.awayTeam) {
      // Format 1: {homeTeam: {...}, awayTeam: {...}} - CORRECT FORMAT
      const homeFormation = lineupData.homeTeam.formation || 'Unknown';
      const awayFormation = lineupData.awayTeam.formation || 'Unknown';
      
      // Get home and away team IDs from match
      const { data: match } = await supabase
        .from('matches')
        .select('home_team_id, away_team_id')
        .eq('id', matchId)
        .single();
      
      if (match) {
        lineupsToInsert.push({
          match_id: matchId,
          team_id: match.home_team_id,
          formation: homeFormation,
          players: lineupData.homeTeam.initialLineup || lineupData.homeTeam.startXI || [],
          substitutes: lineupData.homeTeam.substitutes || [],
          coach: lineupData.homeTeam.coach?.name || null,
          api_data: lineupData.homeTeam
        });
        
        lineupsToInsert.push({
          match_id: matchId,
          team_id: match.away_team_id,
          formation: awayFormation,
          players: lineupData.awayTeam.initialLineup || lineupData.awayTeam.startXI || [],
          substitutes: lineupData.awayTeam.substitutes || [],
          coach: lineupData.awayTeam.coach?.name || null,
          api_data: lineupData.awayTeam
        });
      }
    } else if (lineupData.home && lineupData.away) {
      // Format 2: {home: {...}, away: {...}} - Alternative format
      const homeFormation = lineupData.home.formation || 'Unknown';
      const awayFormation = lineupData.away.formation || 'Unknown';
      
      // Get home and away team IDs from match
      const { data: match } = await supabase
        .from('matches')
        .select('home_team_id, away_team_id')
        .eq('id', matchId)
        .single();
      
      if (match) {
        lineupsToInsert.push({
          match_id: matchId,
          team_id: match.home_team_id,
          formation: homeFormation,
          players: lineupData.home.initialLineup || lineupData.home.startXI || [],
          substitutes: lineupData.home.substitutes || [],
          coach: lineupData.home.coach?.name || null,
          api_data: lineupData.home
        });
        
        lineupsToInsert.push({
          match_id: matchId,
          team_id: match.away_team_id,
          formation: awayFormation,
          players: lineupData.away.initialLineup || lineupData.away.startXI || [],
          substitutes: lineupData.away.substitutes || [],
          coach: lineupData.away.coach?.name || null,
          api_data: lineupData.away
        });
      }
    } else if (Array.isArray(lineupData)) {
      // Format 2: Array of team lineups
      for (const teamLineup of lineupData) {
        lineupsToInsert.push({
          match_id: matchId,
          team_id: teamLineup.team?.id || null,
          formation: teamLineup.formation || 'Unknown',
          players: teamLineup.startXI || teamLineup.players || [],
          substitutes: teamLineup.substitutes || [],
          coach: teamLineup.coach?.name || null,
          api_data: teamLineup
        });
      }
    }

    if (lineupsToInsert.length === 0) {
      console.log(`[LINEUPS] ⚠ No valid lineup data for match ${matchId}`);
      return { status: 'no_data' };
    }

    // Insert lineups
    const { error: insertError } = await supabase
      .from('match_lineups')
      .insert(lineupsToInsert);

    if (insertError) {
      console.error(`[LINEUPS] ✗ Error inserting lineup for match ${matchId}:`, insertError);
      return { status: 'error', error: insertError };
    }

    const formationInfo = lineupsToInsert.map(l => l.formation).join(' vs ');
    console.log(`[LINEUPS] ✓ Saved ${lineupsToInsert.length} lineups for match ${matchId} (${formationInfo})`);
    return { status: 'saved', count: lineupsToInsert.length };

  } catch (error) {
    console.error(`[LINEUPS] ✗ Error processing match ${matchId}:`, error);
    return { status: 'error', error };
  }
}

async function syncEventsData(matchId) {
  console.log(`[EVENTS] Processing match ${matchId}...`);
  
  try {
    // Check if events already exist
    const { data: existingEvents } = await supabase
      .from('match_events')
      .select('id')
      .eq('match_id', matchId)
      .limit(1);

    if (existingEvents && existingEvents.length > 0) {
      console.log(`[EVENTS] ✓ Already exist for match ${matchId}`);
      return { status: 'exists' };
    }

    // Fetch events data from API using correct endpoint structure
    const eventsData = await fetchFromProxy(`/events/${matchId}`);
    
    if (!eventsData || !Array.isArray(eventsData) || eventsData.length === 0) {
      console.log(`[EVENTS] ⚠ No events available for match ${matchId}`);
      return { status: 'no_data' };
    }

    // Process and insert events using correct database schema
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

    const { error: insertError } = await supabase
      .from('match_events')
      .insert(eventsToInsert);

    if (insertError) {
      console.error(`[EVENTS] ✗ Error inserting events for match ${matchId}:`, insertError);
      return { status: 'error', error: insertError };
    }

    console.log(`[EVENTS] ✓ Saved ${eventsData.length} events for match ${matchId}`);
    return { status: 'saved', count: eventsData.length };

  } catch (error) {
    console.error(`[EVENTS] ✗ Error processing match ${matchId}:`, error);
    return { status: 'error', error };
  }
}

async function syncAllData() {
  console.log('🚀 Starting ULTIMATE complete data sync...');
  console.log('📋 Using CORRECT API structure from OpenAPI specification');
  console.log('🗄️ Using CORRECT database schema from database-setup.sql');
  
  const startTime = Date.now();
  
  // Statistics tracking
  const stats = {
    lineups: { processed: 0, saved: 0, exists: 0, no_data: 0, errors: 0 },
    events: { processed: 0, saved: 0, exists: 0, no_data: 0, errors: 0 }
  };

  try {
    // Get all matches from database
    console.log('\n📊 Fetching all matches from database...');
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('id')
      .order('id', { ascending: true });

    if (matchesError) {
      console.error('❌ Error fetching matches:', matchesError);
      return;
    }

    console.log(`📋 Found ${matches.length} total matches`);
    console.log('⏰ Processing with 1.5s delay between API calls to respect rate limits\n');

    // Process each match
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const progress = `[${i + 1}/${matches.length}]`;
      
      console.log(`\n${progress} Processing match ${match.id}:`);
      
      // Sync lineups
      const lineupResult = await syncLineupData(match.id);
      stats.lineups.processed++;
      stats.lineups[lineupResult.status]++;
      
      // Wait between API calls
      await delay(RATE_LIMIT_DELAY);
      
      // Sync events  
      const eventsResult = await syncEventsData(match.id);
      stats.events.processed++;
      stats.events[eventsResult.status]++;
      
      // Show progress every 50 matches
      if ((i + 1) % 50 === 0) {
        console.log(`\n📊 Progress Update (${i + 1}/${matches.length}):`);
        console.log(`   Lineups: ${stats.lineups.saved} saved, ${stats.lineups.exists} exists, ${stats.lineups.no_data} no data, ${stats.lineups.errors} errors`);
        console.log(`   Events:  ${stats.events.saved} saved, ${stats.events.exists} exists, ${stats.events.no_data} no data, ${stats.events.errors} errors`);
      }
      
      // Wait between API calls
      await delay(RATE_LIMIT_DELAY);
    }

  } catch (error) {
    console.error('❌ Fatal error during sync:', error);
  }

  // Final results
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(1);
  
  console.log('\n🏁 ULTIMATE SYNC COMPLETE!');
  console.log('==================================');
  console.log(`⏱️  Total time: ${duration} seconds`);
  console.log('\n📊 LINEUPS Results:');
  console.log(`   Processed: ${stats.lineups.processed}`);
  console.log(`   ✅ Saved: ${stats.lineups.saved}`);
  console.log(`   ♻️  Already exists: ${stats.lineups.exists}`);
  console.log(`   ⚠️  No data: ${stats.lineups.no_data}`);
  console.log(`   ❌ Errors: ${stats.lineups.errors}`);
  
  console.log('\n📊 EVENTS Results:');
  console.log(`   Processed: ${stats.events.processed}`);
  console.log(`   ✅ Saved: ${stats.events.saved}`);
  console.log(`   ♻️  Already exists: ${stats.events.exists}`);
  console.log(`   ⚠️  No data: ${stats.events.no_data}`);
  console.log(`   ❌ Errors: ${stats.events.errors}`);

  // Final database status
  console.log('\n📋 Checking final database status...');
  const { count: finalLineups } = await supabase.from('match_lineups').select('*', { count: 'exact', head: true });
  const { count: finalEvents } = await supabase.from('match_events').select('*', { count: 'exact', head: true });
  
  console.log(`🎯 Final counts: ${finalLineups || 0} lineups, ${finalEvents || 0} events`);
}

// Run the sync
syncAllData().catch(console.error); 