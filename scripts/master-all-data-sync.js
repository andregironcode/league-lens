/**
 * MASTER ALL DATA SYNC
 * Comprehensive sync for ALL teams, matches, lineups, and events
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BASE_URL = 'http://localhost:3001/api/highlightly';

// Rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Country names to filter out from teams
const COUNTRY_NAMES = [
  'Scotland', 'France', 'Spain', 'Germany', 'Italy', 'England', 'Portugal',
  'Netherlands', 'Belgium', 'Brazil', 'Argentina', 'Croatia', 'Poland', 
  'Morocco', 'Japan', 'Korea Republic', 'Australia', 'Mexico', 'Canada',
  'United States', 'Uruguay', 'Colombia', 'Denmark', 'Sweden', 'Switzerland',
  'Austria', 'Czech Republic', 'Ukraine', 'Hungary', 'Turkey', 'Romania',
  'Serbia', 'Slovenia', 'Slovakia', 'Georgia', 'Albania', 'Wales', 'Norway',
  'Finland', 'Ireland', 'Israel', 'Bosnia and Herzegovina', 'North Macedonia',
  'Montenegro', 'Moldova', 'Luxembourg', 'Latvia', 'Lithuania', 'Estonia',
  'Iceland', 'Faroe Islands', 'Malta', 'Andorra', 'San Marino', 'Gibraltar',
  'Liechtenstein', 'Kazakhstan', 'Azerbaijan', 'Armenia', 'Cyprus'
];

async function fetchFromAPI(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}/${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error.message);
    return null;
  }
}

async function checkDatabaseStatus() {
  console.log('\n=== DATABASE STATUS ===');
  
  const tables = [
    'leagues', 'teams', 'matches', 'standings', 
    'team_form', 'highlights', 'match_lineups', 'match_events'
  ];

  const results = {};
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        results[table] = `Error - ${error.message}`;
      } else {
        results[table] = count || 0;
      }
    } catch (error) {
      results[table] = `Error - ${error.message}`;
    }
  }

  for (const [table, count] of Object.entries(results)) {
    console.log(`${table}: ${count}`);
  }
  
  return results;
}

async function syncAllTeamForm() {
  console.log('\n=== SYNCING TEAM FORM FOR ALL TEAMS ===');
  
  try {
    // Get all real teams (not country names)
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, league_id')
      .not('name', 'in', `(${COUNTRY_NAMES.map(name => `"${name}"`).join(',')})`);

    if (teamsError) {
      console.error('Error fetching teams:', teamsError);
      return;
    }

    console.log(`Found ${teams.length} real teams to process`);

    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;

    for (const team of teams) {
      processedCount++;
      console.log(`Processing team ${processedCount}/${teams.length}: ${team.name}...`);

      try {
        // Get team's recent matches (last 15)
        const { data: matches, error: matchesError } = await supabase
          .from('matches')
          .select('id, home_team_id, away_team_id, home_score, away_score, status, match_date')
          .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
          .eq('status', 'finished')
          .not('home_score', 'is', null)
          .not('away_score', 'is', null)
          .order('match_date', { ascending: false })
          .limit(15);

        if (matchesError) {
          console.error(`Error fetching matches for ${team.name}:`, matchesError);
          errorCount++;
          continue;
        }

        if (!matches || matches.length === 0) {
          console.log(`No matches found for ${team.name}, skipping...`);
          continue;
        }

        // Calculate comprehensive form statistics
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

        for (const match of matches.reverse()) { // Reverse for chronological order
          const isHome = match.home_team_id === team.id;
          const teamScore = isHome ? match.home_score : match.away_score;
          const opponentScore = isHome ? match.away_score : match.home_score;

          // Update stats
          stats.goalsFor += teamScore || 0;
          stats.goalsAgainst += opponentScore || 0;

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

        // Check if team_form already exists
        const { data: existingForm } = await supabase
          .from('team_form')
          .select('id')
          .eq('team_id', team.id)
          .single();

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

        if (existingForm) {
          // Update existing
          const { error: updateError } = await supabase
            .from('team_form')
            .update(formRecord)
            .eq('team_id', team.id);

          if (updateError) {
            console.error(`Error updating team form for ${team.name}:`, updateError);
            errorCount++;
          } else {
            successCount++;
            console.log(`✓ Updated form for ${team.name}: ${formString} (${stats.won}W ${stats.drawn}D ${stats.lost}L)`);
          }
        } else {
          // Insert new
          const { error: insertError } = await supabase
            .from('team_form')
            .insert([formRecord]);

          if (insertError) {
            console.error(`Error inserting team form for ${team.name}:`, insertError);
            errorCount++;
          } else {
            successCount++;
            console.log(`✓ Created form for ${team.name}: ${formString} (${stats.won}W ${stats.drawn}D ${stats.lost}L)`);
          }
        }

        // Rate limiting
        await delay(100);

      } catch (error) {
        console.error(`Error processing team ${team.name}:`, error);
        errorCount++;
      }
    }

    console.log(`\nTeam Form Complete: ${successCount} success, ${errorCount} errors out of ${processedCount} teams`);

  } catch (error) {
    console.error('Team form sync failed:', error);
  }
}

async function syncAllLineups() {
  console.log('\n=== SYNCING LINEUPS FOR ALL FINISHED MATCHES ===');

  try {
    // Get all finished matches
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, status, match_date')
      .eq('status', 'finished')
      .order('match_date', { ascending: false });

    if (matchesError) {
      console.error('Error fetching matches:', matchesError);
      return;
    }

    console.log(`Found ${matches.length} finished matches to check for lineups`);

    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const match of matches) {
      processedCount++;
      
      if (processedCount % 100 === 0) {
        console.log(`Processing match ${processedCount}/${matches.length}...`);
      }

      try {
        // Check if lineups already exist
        const { data: existingLineups } = await supabase
          .from('match_lineups')
          .select('id')
          .eq('match_id', match.id);

        if (existingLineups && existingLineups.length > 0) {
          skippedCount++;
          continue;
        }

        // Fetch lineups from API
        const lineupData = await fetchFromAPI(`lineups/${match.id}`);
        
        if (!lineupData || !lineupData.lineups) {
          continue;
        }

        // Process each team's lineup
        for (const teamLineup of lineupData.lineups) {
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
            errorCount++;
          } else {
            successCount++;
            if (successCount % 50 === 0) {
              console.log(`✓ Saved ${successCount} lineups so far...`);
            }
          }
        }

        // Rate limiting
        await delay(150);

      } catch (error) {
        errorCount++;
      }
    }

    console.log(`\nLineups Sync Complete: ${successCount} lineups saved, ${errorCount} errors, ${skippedCount} skipped out of ${processedCount} matches`);

  } catch (error) {
    console.error('Lineups sync failed:', error);
  }
}

async function syncAllEvents() {
  console.log('\n=== SYNCING EVENTS FOR ALL FINISHED MATCHES ===');

  try {
    // Get all finished matches
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, status, match_date')
      .eq('status', 'finished')
      .order('match_date', { ascending: false });

    if (matchesError) {
      console.error('Error fetching matches:', matchesError);
      return;
    }

    console.log(`Found ${matches.length} finished matches to check for events`);

    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const match of matches) {
      processedCount++;
      
      if (processedCount % 100 === 0) {
        console.log(`Processing match ${processedCount}/${matches.length}...`);
      }

      try {
        // Check if events already exist
        const { data: existingEvents } = await supabase
          .from('match_events')
          .select('id')
          .eq('match_id', match.id);

        if (existingEvents && existingEvents.length > 0) {
          skippedCount++;
          continue;
        }

        // Fetch events from API
        const eventsData = await fetchFromAPI(`events/${match.id}`);
        
        if (!eventsData || !eventsData.events) {
          continue;
        }

        // Process each event
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
            errorCount++;
          } else {
            successCount += eventsToInsert.length;
            if (successCount % 100 === 0) {
              console.log(`✓ Saved ${successCount} events so far...`);
            }
          }
        }

        // Rate limiting
        await delay(150);

      } catch (error) {
        errorCount++;
      }
    }

    console.log(`\nEvents Sync Complete: ${successCount} events saved, ${errorCount} errors, ${skippedCount} matches skipped out of ${processedCount} matches`);

  } catch (error) {
    console.error('Events sync failed:', error);
  }
}

async function main() {
  console.log('🚀 STARTING MASTER ALL DATA SYNC...');
  const startTime = Date.now();

  try {
    // Check initial status
    console.log('\n📊 INITIAL STATUS:');
    await checkDatabaseStatus();

    // 1. Sync team form for ALL teams
    await syncAllTeamForm();

    // 2. Sync lineups for ALL finished matches
    await syncAllLineups();

    // 3. Sync events for ALL finished matches  
    await syncAllEvents();

    // Check final status
    console.log('\n📊 FINAL STATUS:');
    await checkDatabaseStatus();

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n✅ MASTER ALL DATA SYNC COMPLETED in ${duration} seconds!`);

  } catch (error) {
    console.error('❌ Master sync failed:', error);
    process.exit(1);
  }
}

main(); 