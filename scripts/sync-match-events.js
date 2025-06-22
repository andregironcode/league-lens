/**
 * Sync Match Events
 * This will populate the match_events table
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Rate limiting for API calls
let apiCallCount = 0;
let lastResetTime = Date.now();
const MAX_CALLS_PER_MINUTE = 40;
const DELAY_BETWEEN_CALLS = 500;

async function rateLimitedApiCall(apiCall) {
  const now = Date.now();
  if (now - lastResetTime > 60000) {
    apiCallCount = 0;
    lastResetTime = now;
  }

  if (apiCallCount >= MAX_CALLS_PER_MINUTE) {
    const waitTime = 60000 - (now - lastResetTime);
    console.log(`⏳ Rate limit reached, waiting ${Math.round(waitTime/1000)}s`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    apiCallCount = 0;
    lastResetTime = Date.now();
  }

  await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_CALLS));
  apiCallCount++;
  return apiCall();
}

async function callHighlightlyApi(endpoint) {
  return rateLimitedApiCall(async () => {
    const url = `http://localhost:3001/api/highlightly/${endpoint}`;
    console.log(`📡 API Call: ${endpoint}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  });
}

// Update sync status
async function updateSyncStatus(tableName, status, recordsSynced = 0, totalRecords = 0, errorMessage = null) {
  await supabase
    .from('sync_status')
    .upsert({
      table_name: tableName,
      status,
      records_synced: recordsSynced,
      total_records: totalRecords,
      error_message: errorMessage,
      last_sync: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
}

// SYNC MATCH EVENTS
async function syncMatchEvents() {
  console.log('\n⚽ SYNCING MATCH EVENTS');
  console.log('='.repeat(50));
  
  try {
    await updateSyncStatus('match_events', 'running');

    // Get recent finished matches from major leagues
    const { data: matches } = await supabase
      .from('matches')
      .select(`
        id, 
        home_team_id, 
        away_team_id, 
        match_date,
        league_id,
        leagues!inner(priority)
      `)
      .eq('status', 'finished')
      .eq('leagues.priority', true)
      .gte('match_date', '2024-12-01')
      .order('match_date', { ascending: false })
      .limit(20); // Start with 20 recent matches

    console.log(`⚽ Processing ${matches.length} matches for events...`);
    let totalEventsSynced = 0;
    let matchesWithEvents = 0;

    for (const match of matches) {
      try {
        console.log(`\n⚽ Getting events for match ${match.id} (${match.match_date?.slice(0,10)})...`);
        
        const eventsData = await callHighlightlyApi(`events/${match.id}`);

        if (eventsData && Array.isArray(eventsData) && eventsData.length > 0) {
          matchesWithEvents++;
          console.log(`  📋 Found ${eventsData.length} events`);

          for (const event of eventsData) {
            try {
              const eventRecord = {
                match_id: match.id,
                team_id: event.team?.id || null,
                player_id: event.player?.id || null,
                player_name: event.player?.name || null,
                event_type: event.type || 'unknown',
                minute: event.minute || null,
                added_time: event.addedTime || 0,
                description: event.description || null,
                api_data: event,
              };

              const { error } = await supabase
                .from('match_events')
                .insert(eventRecord);

              if (!error) {
                totalEventsSynced++;
              } else {
                console.log(`    ❌ Error inserting event: ${error.message}`);
              }
            } catch (error) {
              console.error(`    ❌ Failed to insert event:`, error.message);
            }
          }

          console.log(`  ✅ ${eventsData.length} events synced`);
        } else {
          console.log(`  ⚠️  No events available for match ${match.id}`);
        }
      } catch (error) {
        console.error(`  ❌ Failed to sync events for match ${match.id}:`, error.message);
        if (error.message.includes('429')) {
          console.log('  ⏸️  Rate limited, waiting longer...');
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      }
    }

    await updateSyncStatus('match_events', 'completed', totalEventsSynced, totalEventsSynced);
    console.log(`\n✅ Match events sync completed:`);
    console.log(`   📋 Matches processed: ${matches.length}`);
    console.log(`   ⚽ Matches with events: ${matchesWithEvents}`);
    console.log(`   📝 Total events synced: ${totalEventsSynced}`);

  } catch (error) {
    console.error('❌ Match events sync failed:', error);
    await updateSyncStatus('match_events', 'failed', 0, 0, error.message);
  }
}

// MAIN EXECUTION
async function runEventsSync() {
  console.log('🚀 SYNCING MATCH EVENTS');
  console.log('='.repeat(60));
  
  const startTime = Date.now();

  // First check that the server is running
  try {
    await callHighlightlyApi('leagues/33973');
    console.log('✅ Proxy server is running');
  } catch (error) {
    console.error('❌ Proxy server not running! Please start it with: npm run server');
    process.exit(1);
  }

  try {
    // Sync events for recent matches
    await syncMatchEvents();
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log('\n🎉 EVENTS SYNC COMPLETED!');
    console.log('='.repeat(60));
    console.log(`⏱️  Total time: ${duration} seconds`);
    
    // Final status check
    const { count: eventsCount } = await supabase
      .from('match_events')
      .select('*', { count: 'exact', head: true });
    
    console.log('\n📊 FINAL RESULTS:');
    console.log(`⚽ Match events: ${eventsCount || 0}`);
    
  } catch (error) {
    console.error('❌ Events sync failed:', error);
  }
}

runEventsSync().catch(console.error); 