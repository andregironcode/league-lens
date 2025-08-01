import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://septerrkdnojsmtmmska.supabase.co';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;
const apiKey = process.env.HIGHLIGHTLY_API_KEY22 || process.env.HIGHLIGHTLY_API_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fetchFromHighlightly(endpoint) {
  try {
    const response = await fetch(
      `https://soccer.highlightly.net/${endpoint}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'football-highlights-api.p.rapidapi.com'
        }
      }
    );
    
    if (response.ok) {
      return await response.json();
    }
    console.error(`[Fetch] Failed to fetch ${endpoint}: ${response.status}`);
    return null;
  } catch (error) {
    console.error(`[Fetch] Error fetching ${endpoint}:`, error.message);
    return null;
  }
}

async function populateMatchDetails() {
  try {
    console.log('[Populate] Starting to populate match details...');
    
    // Get recent matches that might need details
    const { data: recentMatches, error } = await supabase
      .from('matches')
      .select('id, league_id, home_team_id, away_team_id, match_date, status')
      .gte('match_date', '2024-12-10')
      .lte('match_date', '2024-12-20')
      .order('match_date', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('[Populate] Error fetching matches:', error);
      return;
    }
    
    console.log(`[Populate] Processing ${recentMatches.length} matches...`);
    
    let statsCount = 0;
    let lineupsCount = 0;
    let eventsCount = 0;
    
    for (const match of recentMatches) {
      console.log(`[Populate] Processing match ${match.id}...`);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Fetch match statistics
      const statsData = await fetchFromHighlightly(`statistics/${match.id}`);
      if (statsData && statsData.data) {
        try {
          await supabase
            .from('match_statistics')
            .upsert({
              match_id: match.id,
              statistics: statsData.data,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'match_id'
            });
          statsCount++;
        } catch (err) {
          console.error(`[Populate] Error storing stats for match ${match.id}:`, err.message);
        }
      }
      
      // Fetch match lineups
      const lineupsData = await fetchFromHighlightly(`lineups/${match.id}`);
      if (lineupsData && lineupsData.data) {
        try {
          // Store lineups for each team
          for (const lineup of lineupsData.data || []) {
            await supabase
              .from('match_lineups')
              .upsert({
                match_id: match.id,
                team_id: lineup.team?.id || (lineup.team?.name?.includes(match.home_team_id) ? match.home_team_id : match.away_team_id),
                formation: lineup.formation || '4-4-2',
                players: lineup.startXI || [],
                substitutes: lineup.substitutes || [],
                api_data: lineup,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'match_id,team_id'
              });
          }
          lineupsCount++;
        } catch (err) {
          console.error(`[Populate] Error storing lineups for match ${match.id}:`, err.message);
        }
      }
      
      // Fetch match events
      const eventsData = await fetchFromHighlightly(`events/${match.id}`);
      if (eventsData && eventsData.data && Array.isArray(eventsData.data)) {
        try {
          // Delete existing events for this match
          await supabase
            .from('match_events')
            .delete()
            .eq('match_id', match.id);
          
          // Insert new events
          for (const event of eventsData.data) {
            await supabase
              .from('match_events')
              .insert({
                match_id: match.id,
                minute: event.time?.elapsed || 0,
                added_time: event.time?.extra || 0,
                event_type: event.type || 'Unknown',
                team_id: event.team?.id || null,
                player_name: event.player?.name || null,
                description: event.detail || event.type,
                api_data: event
              });
          }
          eventsCount++;
        } catch (err) {
          console.error(`[Populate] Error storing events for match ${match.id}:`, err.message);
        }
      }
    }
    
    console.log(`[Populate] Completed!`);
    console.log(`[Populate] - Statistics: ${statsCount} matches`);
    console.log(`[Populate] - Lineups: ${lineupsCount} matches`);
    console.log(`[Populate] - Events: ${eventsCount} matches`);
    
    // Now populate league standings
    await populateStandings();
    
    // Populate team form data
    await populateTeamForm();
    
  } catch (error) {
    console.error('[Populate] Error:', error);
  }
}

async function populateStandings() {
  console.log('\n[Populate] Fetching league standings...');
  
  // Get active leagues
  const { data: leagues } = await supabase
    .from('leagues')
    .select('id, name')
    .limit(20);
  
  let standingsCount = 0;
  
  for (const league of leagues || []) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const standingsData = await fetchFromHighlightly(`standings?leagueId=${league.id}&season=2024`);
    if (standingsData && standingsData.data) {
      try {
        // Clear old standings
        await supabase
          .from('standings')
          .delete()
          .eq('league_id', league.id)
          .eq('season', '2024');
        
        // Insert new standings
        const standings = Array.isArray(standingsData.data) ? standingsData.data : 
                         (standingsData.data.standings || []);
        
        for (const standing of standings) {
          await supabase
            .from('standings')
            .insert({
              league_id: league.id,
              season: '2024',
              team_id: standing.team?.id || null,
              position: standing.rank || standing.position || 0,
              played: standing.all?.played || 0,
              won: standing.all?.win || 0,
              drawn: standing.all?.draw || 0,
              lost: standing.all?.lose || 0,
              goals_for: standing.all?.goals?.for || 0,
              goals_against: standing.all?.goals?.against || 0,
              goal_difference: standing.goalsDiff || 0,
              points: standing.points || 0,
              form: standing.form || '',
              api_data: standing
            });
        }
        standingsCount++;
        console.log(`[Populate] Stored standings for ${league.name}`);
      } catch (err) {
        console.error(`[Populate] Error storing standings for league ${league.id}:`, err.message);
      }
    }
  }
  
  console.log(`[Populate] Stored standings for ${standingsCount} leagues`);
}

async function populateTeamForm() {
  console.log('\n[Populate] Fetching team form data...');
  
  // Get active teams from recent matches
  const { data: teams } = await supabase
    .from('matches')
    .select('home_team_id, away_team_id')
    .gte('match_date', '2024-12-01')
    .limit(50);
  
  const uniqueTeamIds = new Set();
  teams?.forEach(match => {
    if (match.home_team_id) uniqueTeamIds.add(match.home_team_id);
    if (match.away_team_id) uniqueTeamIds.add(match.away_team_id);
  });
  
  let formCount = 0;
  
  for (const teamId of uniqueTeamIds) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const formData = await fetchFromHighlightly(`last-five-games?teamId=${teamId}`);
    if (formData && formData.data) {
      try {
        await supabase
          .from('team_form')
          .upsert({
            team_id: teamId,
            last_5_matches: formData.data,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'team_id'
          });
        formCount++;
      } catch (err) {
        console.error(`[Populate] Error storing form for team ${teamId}:`, err.message);
      }
    }
  }
  
  console.log(`[Populate] Stored form data for ${formCount} teams`);
}

// Run the population
populateMatchDetails()
  .then(() => {
    console.log('[Populate] All done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('[Populate] Fatal error:', error);
    process.exit(1);
  });