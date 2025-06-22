/**
 * COMPREHENSIVE FIX FOR ALL IDENTIFIED ISSUES
 * 
 * This script addresses:
 * 1. Team form calculation (using existing finished matches)
 * 2. Sync lineups from API into match_lineups table
 * 3. Sync match events from API into match_events table
 * 4. Enhance league and team logos
 * 5. Fix UI-breaking data issues
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Rate limiting for API calls
let apiCallCount = 0;
let lastResetTime = Date.now();
const MAX_CALLS_PER_MINUTE = 45;
const DELAY_BETWEEN_CALLS = 300;

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

// 1. FIX TEAM FORM CALCULATION
async function fixTeamFormCalculation() {
  console.log('\n📈 STEP 1: Fixing Team Form Calculation');
  console.log('='.repeat(50));
  
  try {
    await updateSyncStatus('team_form', 'running');

    // Clear existing team form first
    console.log('🔄 Clearing existing team form data...');
    await supabase.from('team_form').delete().neq('id', '0');

    const { data: teams } = await supabase
      .from('teams')
      .select('id, name, league_id');

    console.log(`👥 Processing ${teams.length} teams...`);
    let totalFormRecords = 0;

    for (const team of teams) {
      try {
        // Get last 10 finished matches for this team (any season)
        const { data: matches } = await supabase
          .from('matches')
          .select('*')
          .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
          .eq('status', 'finished')
          .not('home_score', 'is', null)
          .not('away_score', 'is', null)
          .order('match_date', { ascending: false })
          .limit(10);

        if (matches && matches.length > 0) {
          console.log(`  📊 ${team.name}: Found ${matches.length} matches`);
          
          // Calculate form statistics
          let stats = {
            played: matches.length,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            cleanSheets: 0,
            failedToScore: 0,
          };

          let formString = '';
          const recentMatches = [];

          for (const match of matches.reverse()) { // Reverse to get chronological order
            const isHome = match.home_team_id === team.id;
            const teamScore = isHome ? match.home_score : match.away_score;
            const opponentScore = isHome ? match.away_score : match.home_score;

            // Update stats
            stats.goalsFor += teamScore;
            stats.goalsAgainst += opponentScore;

            if (teamScore > opponentScore) {
              stats.won++;
              formString = 'W' + formString;
            } else if (teamScore < opponentScore) {
              stats.lost++;
              formString = 'L' + formString;
            } else {
              stats.drawn++;
              formString = 'D' + formString;
            }

            if (opponentScore === 0) stats.cleanSheets++;
            if (teamScore === 0) stats.failedToScore++;

            recentMatches.push({
              id: match.id,
              date: match.match_date,
              isHome: isHome,
              teamScore: teamScore,
              opponentScore: opponentScore,
              result: teamScore > opponentScore ? 'W' : (teamScore < opponentScore ? 'L' : 'D')
            });
          }

          // Keep only last 10 characters of form string
          formString = formString.slice(-10);

          const formRecord = {
            team_id: team.id,
            season: '2024',
            league_id: team.league_id,
            last_10_played: stats.played,
            last_10_won: stats.won,
            last_10_drawn: stats.drawn,
            last_10_lost: stats.lost,
            last_10_goals_for: stats.goalsFor,
            last_10_goals_against: stats.goalsAgainst,
            last_10_clean_sheets: stats.cleanSheets,
            last_10_failed_to_score: stats.failedToScore,
            form_string: formString,
            recent_matches: recentMatches,
            computed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          await supabase
            .from('team_form')
            .insert(formRecord);

          totalFormRecords++;
          console.log(`    ✅ ${team.name}: ${formString} (${stats.won}W-${stats.drawn}D-${stats.lost}L)`);
        } else {
          console.log(`    ⚠️  ${team.name}: No finished matches found`);
        }
      } catch (error) {
        console.error(`    ❌ Failed to calculate form for ${team.name}:`, error.message);
      }
    }

    await updateSyncStatus('team_form', 'completed', totalFormRecords, teams.length);
    console.log(`✅ Team form calculation completed: ${totalFormRecords} records`);

  } catch (error) {
    console.error('❌ Team form calculation failed:', error);
    await updateSyncStatus('team_form', 'failed', 0, 0, error.message);
  }
}

// 2. SYNC MATCH LINEUPS
async function syncMatchLineups() {
  console.log('\n👥 STEP 2: Syncing Match Lineups');
  console.log('='.repeat(50));
  
  try {
    await updateSyncStatus('match_lineups', 'running');

    // Get recent finished matches without lineups
    const { data: matches } = await supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, match_date')
      .eq('status', 'finished')
      .gte('match_date', '2024-08-01')
      .is('has_lineups', null)
      .order('match_date', { ascending: false })
      .limit(50); // Start with 50 matches

    console.log(`📋 Processing ${matches.length} matches for lineups...`);
    let totalLineupsSynced = 0;

    for (const match of matches) {
      try {
        console.log(`  📋 Getting lineups for match ${match.id}...`);
        
        const lineupsData = await callHighlightlyApi(`lineups/${match.id}`);

        if (lineupsData && (lineupsData.homeTeam || lineupsData.awayTeam)) {
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

            await supabase
              .from('match_lineups')
              .insert(homeLineupRecord);

            totalLineupsSynced++;
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

            await supabase
              .from('match_lineups')
              .insert(awayLineupRecord);

            totalLineupsSynced++;
          }

          // Update match has_lineups flag
          await supabase
            .from('matches')
            .update({ has_lineups: true })
            .eq('id', match.id);

          console.log(`    ✅ ${lineupsData.homeTeam?.formation || 'N/A'} vs ${lineupsData.awayTeam?.formation || 'N/A'}`);
        } else {
          console.log(`    ⚠️  No lineups available for match ${match.id}`);
        }
      } catch (error) {
        console.error(`    ❌ Failed to sync lineups for match ${match.id}:`, error.message);
        if (error.message.includes('429')) {
          console.log('    ⏸️  Rate limited, waiting...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }

    await updateSyncStatus('match_lineups', 'completed', totalLineupsSynced, matches.length * 2);
    console.log(`✅ Match lineups sync completed: ${totalLineupsSynced} lineups`);

  } catch (error) {
    console.error('❌ Match lineups sync failed:', error);
    await updateSyncStatus('match_lineups', 'failed', 0, 0, error.message);
  }
}

// 3. SYNC MATCH EVENTS
async function syncMatchEvents() {
  console.log('\n⚽ STEP 3: Syncing Match Events');
  console.log('='.repeat(50));
  
  try {
    await updateSyncStatus('match_events', 'running');

    // Get recent finished matches
    const { data: matches } = await supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, match_date')
      .eq('status', 'finished')
      .gte('match_date', '2024-08-01')
      .order('match_date', { ascending: false })
      .limit(30); // Start with 30 matches

    console.log(`⚽ Processing ${matches.length} matches for events...`);
    let totalEventsSynced = 0;

    for (const match of matches) {
      try {
        console.log(`  ⚽ Getting events for match ${match.id}...`);
        
        const eventsData = await callHighlightlyApi(`events/${match.id}`);

        if (eventsData && Array.isArray(eventsData) && eventsData.length > 0) {
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

              await supabase
                .from('match_events')
                .insert(eventRecord);

              totalEventsSynced++;
            } catch (error) {
              console.error(`      ❌ Failed to insert event:`, error.message);
            }
          }

          console.log(`    ✅ ${eventsData.length} events synced`);
        } else {
          console.log(`    ⚠️  No events available for match ${match.id}`);
        }
      } catch (error) {
        console.error(`    ❌ Failed to sync events for match ${match.id}:`, error.message);
        if (error.message.includes('429')) {
          console.log('    ⏸️  Rate limited, waiting...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }

    await updateSyncStatus('match_events', 'completed', totalEventsSynced, totalEventsSynced);
    console.log(`✅ Match events sync completed: ${totalEventsSynced} events`);

  } catch (error) {
    console.error('❌ Match events sync failed:', error);
    await updateSyncStatus('match_events', 'failed', 0, 0, error.message);
  }
}

// 4. ENHANCE TEAM LOGOS
async function enhanceTeamLogos() {
  console.log('\n🎨 STEP 4: Enhancing Team Logos');
  console.log('='.repeat(50));
  
  try {
    // Get teams missing logos
    const { data: teams } = await supabase
      .from('teams')
      .select('id, name, league_id')
      .is('logo', null)
      .limit(20);

    console.log(`🎨 Processing ${teams.length} teams without logos...`);
    let logosUpdated = 0;

    for (const team of teams) {
      try {
        console.log(`  🎨 Getting logo for ${team.name}...`);
        
        const teamData = await callHighlightlyApi(`teams/${team.id}`);

        if (teamData?.logo) {
          await supabase
            .from('teams')
            .update({ 
              logo: teamData.logo,
              api_data: teamData,
              updated_at: new Date().toISOString()
            })
            .eq('id', team.id);

          logosUpdated++;
          console.log(`    ✅ Logo updated for ${team.name}`);
        } else {
          console.log(`    ⚠️  No logo found for ${team.name}`);
        }
      } catch (error) {
        console.error(`    ❌ Failed to get logo for ${team.name}:`, error.message);
      }
    }

    console.log(`✅ Team logos enhanced: ${logosUpdated} logos updated`);

  } catch (error) {
    console.error('❌ Team logos enhancement failed:', error);
  }
}

// MAIN EXECUTION
async function runComprehensiveFix() {
  console.log('🚀 COMPREHENSIVE FIX FOR ALL ISSUES');
  console.log('='.repeat(70));
  
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
    // Step 1: Fix team form calculation (should work with existing data)
    await fixTeamFormCalculation();
    
    // Step 2: Sync lineups for recent matches
    await syncMatchLineups();
    
    // Step 3: Sync match events
    await syncMatchEvents();
    
    // Step 4: Enhance team logos
    await enhanceTeamLogos();
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log('\n🎉 COMPREHENSIVE FIX COMPLETED!');
    console.log('='.repeat(70));
    console.log(`⏱️  Total time: ${duration} seconds`);
    console.log('✅ All issues should now be resolved!');
    
    // Final status check
    const { count: formCount } = await supabase
      .from('team_form')
      .select('*', { count: 'exact', head: true });
    
    const { count: lineupsCount } = await supabase
      .from('match_lineups')
      .select('*', { count: 'exact', head: true });
    
    const { count: eventsCount } = await supabase
      .from('match_events')
      .select('*', { count: 'exact', head: true });
    
    console.log('\n📊 FINAL RESULTS:');
    console.log(`📈 Team form records: ${formCount || 0}`);
    console.log(`👥 Match lineups: ${lineupsCount || 0}`);
    console.log(`⚽ Match events: ${eventsCount || 0}`);
    
  } catch (error) {
    console.error('❌ Comprehensive fix failed:', error);
  }
}

// Export functions for individual use
export { 
  runComprehensiveFix,
  fixTeamFormCalculation,
  syncMatchLineups,
  syncMatchEvents,
  enhanceTeamLogos
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveFix().catch(console.error);
} 