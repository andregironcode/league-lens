/**
 * Sync Match Lineups and Events
 * This will populate the match_lineups and match_events tables
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

// 1. SYNC MATCH LINEUPS
async function syncMatchLineups() {
  console.log('\n👥 STEP 1: Syncing Match Lineups');
  console.log('='.repeat(50));
  
  try {
    await updateSyncStatus('match_lineups', 'running');

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
      .gte('match_date', '2024-08-01')
      .order('match_date', { ascending: false })
      .limit(30); // Start with 30 recent matches

    console.log(`📋 Processing ${matches.length} matches for lineups...`);
    let totalLineupsSynced = 0;
    let matchesWithLineups = 0;

    for (const match of matches) {
      try {
        console.log(`\n📋 Getting lineups for match ${match.id} (${match.match_date?.slice(0,10)})...`);
        
        const lineupsData = await callHighlightlyApi(`lineups/${match.id}`);

        if (lineupsData && (lineupsData.homeTeam || lineupsData.awayTeam)) {
          matchesWithLineups++;
          
          // Home team lineup
          if (lineupsData.homeTeam) {
            const homeLineupRecord = {
              match_id: match.id,
              team_id: lineupsData.homeTeam.id || match.home_team_id,
              formation: lineupsData.homeTeam.formation || null,
              players: lineupsData.homeTeam.initialLineup || [],
              substitutes: lineupsData.homeTeam.substitutes || [],
              coach: lineupsData.homeTeam.coach || null,
              api_data: lineupsData.homeTeam,
            };

            const { error } = await supabase
              .from('match_lineups')
              .insert(homeLineupRecord);

            if (!error) {
              totalLineupsSynced++;
            } else {
              console.log(`  ❌ Error inserting home lineup: ${error.message}`);
            }
          }

          // Away team lineup
          if (lineupsData.awayTeam) {
            const awayLineupRecord = {
              match_id: match.id,
              team_id: lineupsData.awayTeam.id || match.away_team_id,
              formation: lineupsData.awayTeam.formation || null,
              players: lineupsData.awayTeam.initialLineup || [],
              substitutes: lineupsData.awayTeam.substitutes || [],
              coach: lineupsData.awayTeam.coach || null,
              api_data: lineupsData.awayTeam,
            };

            const { error } = await supabase
              .from('match_lineups')
              .insert(awayLineupRecord);

            if (!error) {
              totalLineupsSynced++;
            } else {
              console.log(`  ❌ Error inserting away lineup: ${error.message}`);
            }
          }

          // Update match has_lineups flag
          await supabase
            .from('matches')
            .update({ has_lineups: true })
            .eq('id', match.id);

          console.log(`  ✅ ${lineupsData.homeTeam?.formation || 'N/A'} vs ${lineupsData.awayTeam?.formation || 'N/A'}`);
        } else {
          console.log(`  ⚠️  No lineups available for match ${match.id}`);
        }
      } catch (error) {
        console.error(`  ❌ Failed to sync lineups for match ${match.id}:`, error.message);
        if (error.message.includes('429')) {
          console.log('  ⏸️  Rate limited, waiting longer...');
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      }
    }

    await updateSyncStatus('match_lineups', 'completed', totalLineupsSynced, matches.length * 2);
    console.log(`\n✅ Match lineups sync completed:`);
    console.log(`   📋 Matches processed: ${matches.length}`);
    console.log(`   ✅ Matches with lineups: ${matchesWithLineups}`);
    console.log(`   👥 Total lineups synced: ${totalLineupsSynced}`);

  } catch (error) {
    console.error('❌ Match lineups sync failed:', error);
    await updateSyncStatus('match_lineups', 'failed', 0, 0, error.message);
  }
}

// MAIN EXECUTION
async function runLineupsSync() {
  console.log('🚀 SYNCING MATCH LINEUPS');
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
    // Step 1: Sync lineups for recent matches
    await syncMatchLineups();
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log('\n🎉 LINEUPS SYNC COMPLETED!');
    console.log('='.repeat(60));
    console.log(`⏱️  Total time: ${duration} seconds`);
    
    // Final status check
    const { count: lineupsCount } = await supabase
      .from('match_lineups')
      .select('*', { count: 'exact', head: true });
    
    console.log('\n📊 FINAL RESULTS:');
    console.log(`👥 Match lineups: ${lineupsCount || 0}`);
    
  } catch (error) {
    console.error('❌ Lineups sync failed:', error);
  }
}

runLineupsSync().catch(console.error); 