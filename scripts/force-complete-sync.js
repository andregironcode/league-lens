/**
 * FORCE COMPLETE SYNC - Actually add data to database
 * Process ALL matches and FORCE insert lineups and events
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BASE_URL = 'http://localhost:3001/api/highlightly';

// Rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchFromAPI(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}/${endpoint}`);
    if (!response.ok) {
      return { error: `HTTP ${response.status}`, data: null };
    }
    const data = await response.json();
    return { error: null, data };
  } catch (error) {
    return { error: error.message, data: null };
  }
}

async function syncLineupsForAllMatches() {
  console.log('\n=== FORCE SYNCING LINEUPS FOR ALL MATCHES ===');

  // Get all matches in batches
  let allMatches = [];
  let offset = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data: matches, error } = await supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, status, match_date')
      .order('match_date', { ascending: false })
      .range(offset, offset + batchSize - 1);

    if (error || !matches || matches.length === 0) break;
    
    allMatches = allMatches.concat(matches);
    offset += batchSize;
    
    if (allMatches.length % 1000 === 0) {
      console.log(`Fetched ${allMatches.length} matches so far...`);
    }
  }

  console.log(`Processing ${allMatches.length} matches for lineups...`);

  let processedCount = 0;
  let successCount = 0;
  let errorCount = 0;
  let noDataCount = 0;
  let alreadyExistsCount = 0;

  for (const match of allMatches) {
    processedCount++;
    
    if (processedCount % 100 === 0) {
      console.log(`Processing match ${processedCount}/${allMatches.length} (${Math.round((processedCount/allMatches.length)*100)}%)...`);
      console.log(`  Progress: ${successCount} saved, ${alreadyExistsCount} existed, ${noDataCount} no data, ${errorCount} errors`);
    }

    try {
      // Fetch lineups from API
      const { error: apiError, data: lineupData } = await fetchFromAPI(`lineups/${match.id}`);
      
      if (apiError) {
        if (apiError.includes('404')) {
          noDataCount++;
        } else {
          console.log(`API Error for match ${match.id}: ${apiError}`);
          errorCount++;
        }
        continue;
      }

      if (!lineupData || !lineupData.lineups || lineupData.lineups.length === 0) {
        noDataCount++;
        continue;
      }

      // Process each team's lineup
      for (const teamLineup of lineupData.lineups) {
        if (!teamLineup.team || !teamLineup.team.id) continue;
        
        // Check if this specific lineup already exists
        const { data: existingLineup } = await supabase
          .from('match_lineups')
          .select('id')
          .eq('match_id', match.id)
          .eq('team_id', teamLineup.team.id)
          .single();

        if (existingLineup) {
          alreadyExistsCount++;
          continue; // Skip this specific team lineup
        }
        
        const isHomeTeam = teamLineup.team.id === match.home_team_id;
        
        const lineupRecord = {
          match_id: match.id,
          team_id: teamLineup.team.id,
          is_home_team: isHomeTeam,
          formation: teamLineup.formation || null,
          starting_eleven: JSON.stringify(teamLineup.startXI || []),
          substitutes: JSON.stringify(teamLineup.substitutes || []),
          coach: teamLineup.coach ? JSON.stringify(teamLineup.coach) : null
        };

        const { error: insertError } = await supabase
          .from('match_lineups')
          .insert([lineupRecord]);

        if (insertError) {
          console.log(`Error inserting lineup for match ${match.id}, team ${teamLineup.team.id}: ${insertError.message}`);
          errorCount++;
        } else {
          successCount++;
          if (successCount % 50 === 0) {
            console.log(`✓ ${successCount} lineups saved so far...`);
          }
        }
      }

      // Rate limiting
      await delay(150);

    } catch (error) {
      console.log(`Error processing match ${match.id}: ${error.message}`);
      errorCount++;
    }
  }

  console.log(`\n📊 LINEUPS SYNC COMPLETE:`);
  console.log(`  Total matches processed: ${processedCount}`);
  console.log(`  New lineups saved: ${successCount}`);
  console.log(`  Already existed: ${alreadyExistsCount}`);
  console.log(`  No data available: ${noDataCount}`);
  console.log(`  Errors: ${errorCount}`);
}

async function syncEventsForAllMatches() {
  console.log('\n=== FORCE SYNCING EVENTS FOR ALL MATCHES ===');

  // Get all matches in batches
  let allMatches = [];
  let offset = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data: matches, error } = await supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, status, match_date')
      .order('match_date', { ascending: false })
      .range(offset, offset + batchSize - 1);

    if (error || !matches || matches.length === 0) break;
    
    allMatches = allMatches.concat(matches);
    offset += batchSize;
  }

  console.log(`Processing ${allMatches.length} matches for events...`);

  let processedCount = 0;
  let successCount = 0;
  let errorCount = 0;
  let noDataCount = 0;
  let alreadyExistsCount = 0;

  for (const match of allMatches) {
    processedCount++;
    
    if (processedCount % 100 === 0) {
      console.log(`Processing match ${processedCount}/${allMatches.length} (${Math.round((processedCount/allMatches.length)*100)}%)...`);
      console.log(`  Progress: ${successCount} events saved, ${alreadyExistsCount} existed, ${noDataCount} no data, ${errorCount} errors`);
    }

    try {
      // Check if events already exist for this match
      const { data: existingEvents } = await supabase
        .from('match_events')
        .select('id')
        .eq('match_id', match.id);

      if (existingEvents && existingEvents.length > 0) {
        alreadyExistsCount++;
        continue; // Skip matches that already have events
      }

      // Fetch events from API
      const { error: apiError, data: eventsData } = await fetchFromAPI(`events/${match.id}`);
      
      if (apiError) {
        if (apiError.includes('404')) {
          noDataCount++;
        } else {
          console.log(`API Error for match ${match.id}: ${apiError}`);
          errorCount++;
        }
        continue;
      }

      if (!eventsData || !eventsData.events || eventsData.events.length === 0) {
        noDataCount++;
        continue;
      }

      // Process events
      const eventsToInsert = [];
      
      for (const event of eventsData.events) {
        const eventRecord = {
          match_id: match.id,
          team_id: event.team?.id || null,
          player_id: event.player?.id || null,
          player_name: event.player?.name || null,
          event_type: event.type || 'unknown',
          minute: event.time?.elapsed || null,
          description: event.detail || null,
          assist_player_id: event.assist?.id || null,
          assist_player_name: event.assist?.name || null
        };

        eventsToInsert.push(eventRecord);
      }

      if (eventsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('match_events')
          .insert(eventsToInsert);

        if (insertError) {
          console.log(`Error inserting events for match ${match.id}: ${insertError.message}`);
          errorCount++;
        } else {
          successCount += eventsToInsert.length;
          if (successCount % 100 === 0) {
            console.log(`✓ ${successCount} events saved so far...`);
          }
        }
      }

      // Rate limiting
      await delay(150);

    } catch (error) {
      console.log(`Error processing match ${match.id}: ${error.message}`);
      errorCount++;
    }
  }

  console.log(`\n📊 EVENTS SYNC COMPLETE:`);
  console.log(`  Total matches processed: ${processedCount}`);
  console.log(`  New events saved: ${successCount}`);
  console.log(`  Already existed: ${alreadyExistsCount}`);
  console.log(`  No data available: ${noDataCount}`);
  console.log(`  Errors: ${errorCount}`);
}

async function checkDatabaseStatus() {
  const tables = ['match_lineups', 'match_events'];
  const results = {};
  
  for (const table of tables) {
    try {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      results[table] = count || 0;
    } catch (error) {
      results[table] = 0;
    }
  }
  
  console.log(`match_lineups: ${results.match_lineups}`);
  console.log(`match_events: ${results.match_events}`);
  
  return results;
}

async function main() {
  console.log('🚀 STARTING FORCE COMPLETE SYNC...');
  console.log('📋 Will process ALL matches and FORCE insert lineups and events');
  const startTime = Date.now();

  try {
    console.log('\n📊 INITIAL STATUS:');
    const initialStatus = await checkDatabaseStatus();

    // 1. Force sync lineups
    await syncLineupsForAllMatches();

    // 2. Force sync events  
    await syncEventsForAllMatches();

    console.log('\n📊 FINAL STATUS:');
    const finalStatus = await checkDatabaseStatus();

    console.log('\n📈 CHANGES:');
    console.log(`match_lineups: ${initialStatus.match_lineups} → ${finalStatus.match_lineups} (+${finalStatus.match_lineups - initialStatus.match_lineups})`);
    console.log(`match_events: ${initialStatus.match_events} → ${finalStatus.match_events} (+${finalStatus.match_events - initialStatus.match_events})`);

    const duration = Math.round((Date.now() - startTime) / 1000);
    const minutes = Math.round(duration / 60);
    console.log(`\n✅ FORCE COMPLETE SYNC FINISHED in ${duration} seconds (${minutes} minutes)!`);

  } catch (error) {
    console.error('❌ Force sync failed:', error);
  }
}

main(); 