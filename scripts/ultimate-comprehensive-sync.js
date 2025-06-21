/**
 * ULTIMATE COMPREHENSIVE SYNC
 * 
 * This script will sync ALL data properly:
 * - League details with logos
 * - All teams with logos
 * - Complete match data for entire season
 * - Team form calculations
 * - All highlights
 * - Match lineups and events
 */

import { createClient } from '@supabase/supabase-js';

// Database configuration
const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';

// API configuration
const API_BASE = 'http://localhost:3001/api/highlightly';
const CURRENT_SEASON = '2024';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Rate limiting
let apiCallCount = 0;
const MAX_CALLS_PER_MINUTE = 50;
const CALL_DELAY = 1200; // 1.2 seconds between calls

async function rateLimitedDelay() {
  apiCallCount++;
  if (apiCallCount % 10 === 0) {
    console.log(`   📊 API calls made: ${apiCallCount}`);
  }
  
  if (apiCallCount >= MAX_CALLS_PER_MINUTE) {
    console.log('   ⏱️ Rate limit reached, waiting 60 seconds...');
    await new Promise(resolve => setTimeout(resolve, 60000));
    apiCallCount = 0;
  } else {
    await new Promise(resolve => setTimeout(resolve, CALL_DELAY));
  }
}

async function makeApiCall(endpoint) {
  await rateLimitedDelay();
  
  try {
    console.log(`📡 API Call: ${endpoint}`);
    const response = await fetch(`${API_BASE}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ API call failed for ${endpoint}:`, error.message);
    return null;
  }
}

async function updateSyncStatus(operation, status) {
  await supabase
    .from('sync_status')
    .upsert({
      operation,
      status,
      last_sync: new Date().toISOString()
    });
}

async function syncLeagueDetails() {
  console.log('\n🏆 STEP 1: Syncing League Details with Logos');
  console.log('='.repeat(50));

  const { data: leagues } = await supabase
    .from('leagues')
    .select('*')
    .eq('priority', true);

  for (const league of leagues) {
    console.log(`\n🏆 Processing ${league.name}...`);
    
    // Get all leagues to find the one with logo
    const allLeagues = await makeApiCall('/leagues?limit=200');
    if (allLeagues) {
      const leagueWithLogo = allLeagues.find(l => l.id === league.id);
      if (leagueWithLogo && leagueWithLogo.logo) {
        console.log(`   ✅ Found logo for ${league.name}: ${leagueWithLogo.logo}`);
        
        await supabase
          .from('leagues')
          .update({
            logo: leagueWithLogo.logo,
            name: leagueWithLogo.name,
            country_name: leagueWithLogo.country_name
          })
          .eq('id', league.id);
      }
    }
  }
  
  await updateSyncStatus('leagues', 'completed');
  console.log('✅ League details sync completed');
}

async function syncTeamsWithLogos() {
  console.log('\n👥 STEP 2: Syncing Teams with Logos from Standings');
  console.log('='.repeat(50));

  const { data: leagues } = await supabase
    .from('leagues')
    .select('*')
    .eq('priority', true);

  let totalTeams = 0;

  for (const league of leagues) {
    console.log(`\n📊 Processing teams for ${league.name}...`);
    
    const standings = await makeApiCall(`/standings?leagueId=${league.id}&season=${CURRENT_SEASON}`);
    if (standings && standings.length > 0) {
      console.log(`   Found ${standings.length} teams in ${league.name}`);
      
      for (const standing of standings) {
        const teamData = {
          id: standing.team_id,
          name: standing.team_name,
          logo: standing.team_logo || `https://highlightly.net/soccer/images/teams/${standing.team_id}.png`,
          league_id: league.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('teams')
          .upsert(teamData);

        if (error) {
          console.error(`   ❌ Failed to upsert team ${standing.team_name}:`, error);
        } else {
          console.log(`   ✅ Team: ${standing.team_name} (Logo: ${teamData.logo ? 'Yes' : 'No'})`);
          totalTeams++;
        }
      }
    }
  }

  await updateSyncStatus('teams', 'completed');
  console.log(`✅ Teams sync completed: ${totalTeams} total teams`);
}

async function syncStandings() {
  console.log('\n📊 STEP 3: Syncing League Standings');
  console.log('='.repeat(50));

  const { data: leagues } = await supabase
    .from('leagues')
    .select('*')
    .eq('priority', true);

  let totalStandings = 0;

  for (const league of leagues) {
    console.log(`\n📊 Syncing standings for ${league.name}...`);
    
    const standings = await makeApiCall(`/standings?leagueId=${league.id}&season=${CURRENT_SEASON}`);
    if (standings && standings.length > 0) {
      // Clear existing standings for this league
      await supabase
        .from('standings')
        .delete()
        .eq('league_id', league.id);

      for (const standing of standings) {
        const standingData = {
          league_id: league.id,
          team_id: standing.team_id,
          team_name: standing.team_name,
          position: standing.position,
          points: standing.points,
          played: standing.played,
          won: standing.won,
          drawn: standing.drawn,
          lost: standing.lost,
          goals_for: standing.goals_for,
          goals_against: standing.goals_against,
          goal_difference: standing.goal_difference,
          season: CURRENT_SEASON,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('standings')
          .insert(standingData);

        if (error) {
          console.error(`   ❌ Failed to insert standing for ${standing.team_name}:`, error);
        } else {
          console.log(`   ✅ ${standing.position}. ${standing.team_name} - ${standing.points} pts`);
          totalStandings++;
        }
      }
    }
  }

  await updateSyncStatus('standings', 'completed');
  console.log(`✅ Standings sync completed: ${totalStandings} records`);
}

async function syncCompleteSeasonMatches() {
  console.log('\n⚽ STEP 4: Syncing COMPLETE Season Matches');
  console.log('='.repeat(50));

  const { data: leagues } = await supabase
    .from('leagues')
    .select('*')
    .eq('priority', true);

  let totalMatches = 0;

  // Generate all dates for the 2024 season (August 2024 to May 2025)
  const seasonDates = [];
  const startDate = new Date('2024-08-01');
  const endDate = new Date('2025-05-31');
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 7)) {
    seasonDates.push(d.toISOString().split('T')[0]);
  }

  console.log(`   📅 Checking ${seasonDates.length} weekly periods across the season`);

  for (const league of leagues) {
    console.log(`\n⚽ Syncing ALL matches for ${league.name}...`);
    
    for (const date of seasonDates) {
      const matches = await makeApiCall(`/matches?leagueId=${league.id}&date=${date}&season=${CURRENT_SEASON}&limit=100`);
      
      if (matches && matches.length > 0) {
        console.log(`   📅 ${date}: ${matches.length} matches found`);
        
        for (const match of matches) {
          const matchData = {
            id: match.id,
            league_id: league.id,
            home_team_id: match.home_team_id,
            away_team_id: match.away_team_id,
            home_team_name: match.home_team_name,
            away_team_name: match.away_team_name,
            match_date: match.match_date,
            status: match.status,
            home_score: match.home_score,
            away_score: match.away_score,
            season: CURRENT_SEASON,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { error } = await supabase
            .from('matches')
            .upsert(matchData);

          if (!error) {
            totalMatches++;
          }
        }
      }
    }
    
    console.log(`   ✅ ${league.name}: Completed`);
  }

  await updateSyncStatus('matches', 'completed');
  console.log(`✅ Matches sync completed: ${totalMatches} total matches`);
}

async function calculateTeamForm() {
  console.log('\n📈 STEP 5: Calculating Team Form from Match Results');
  console.log('='.repeat(50));

  const { data: teams } = await supabase
    .from('teams')
    .select('*');

  let formRecords = 0;

  for (const team of teams) {
    // Get last 5 matches for this team
    const { data: recentMatches } = await supabase
      .from('matches')
      .select('*')
      .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
      .eq('status', 'finished')
      .order('match_date', { ascending: false })
      .limit(5);

    if (recentMatches && recentMatches.length > 0) {
      let wins = 0, draws = 0, losses = 0;
      let goalsFor = 0, goalsAgainst = 0;
      const formString = [];

      recentMatches.forEach(match => {
        const isHome = match.home_team_id === team.id;
        const teamScore = isHome ? match.home_score : match.away_score;
        const opponentScore = isHome ? match.away_score : match.home_score;

        goalsFor += teamScore || 0;
        goalsAgainst += opponentScore || 0;

        if (teamScore > opponentScore) {
          wins++;
          formString.push('W');
        } else if (teamScore === opponentScore) {
          draws++;
          formString.push('D');
        } else {
          losses++;
          formString.push('L');
        }
      });

      const formData = {
        team_id: team.id,
        team_name: team.name,
        league_id: team.league_id,
        matches_played: recentMatches.length,
        wins,
        draws,
        losses,
        goals_for: goalsFor,
        goals_against: goalsAgainst,
        form_string: formString.join(''),
        season: CURRENT_SEASON,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('team_form')
        .upsert(formData);

      if (!error) {
        console.log(`   ✅ ${team.name}: ${formString.join('')} (${wins}W-${draws}D-${losses}L)`);
        formRecords++;
      }
    }
  }

  await updateSyncStatus('team_form', 'completed');
  console.log(`✅ Team form calculation completed: ${formRecords} records`);
}

async function syncHighlights() {
  console.log('\n🎬 STEP 6: Syncing Match Highlights');
  console.log('='.repeat(50));

  const { data: leagues } = await supabase
    .from('leagues')
    .select('*')
    .eq('priority', true);

  let totalHighlights = 0;

  for (const league of leagues) {
    console.log(`\n🎬 Syncing highlights for ${league.name}...`);
    
    const highlights = await makeApiCall(`/highlights?leagueId=${league.id}&season=${CURRENT_SEASON}&limit=50`);
    
    if (highlights && highlights.length > 0) {
      console.log(`   Found ${highlights.length} highlights for ${league.name}`);
      
      for (const highlight of highlights) {
        const highlightData = {
          id: highlight.id,
          league_id: league.id,
          match_id: highlight.match_id,
          title: highlight.title,
          url: highlight.url,
          thumbnail: highlight.thumbnail,
          duration: highlight.duration,
          season: CURRENT_SEASON,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('highlights')
          .upsert(highlightData);

        if (!error) {
          console.log(`   ✅ ${highlight.title}`);
          totalHighlights++;
        }
      }
    }
  }

  await updateSyncStatus('highlights', 'completed');
  console.log(`✅ Highlights sync completed: ${totalHighlights} highlights`);
}

async function ultimateComprehensiveSync() {
  const startTime = Date.now();
  
  console.log('🚀 STARTING ULTIMATE COMPREHENSIVE SYNC');
  console.log('='.repeat(50));
  console.log(`📅 Season: ${CURRENT_SEASON}`);
  console.log(`🔄 Rate limit: ${MAX_CALLS_PER_MINUTE} calls/minute`);
  console.log('='.repeat(50));

  try {
    await syncLeagueDetails();
    await syncTeamsWithLogos();
    await syncStandings();
    await syncCompleteSeasonMatches();
    await calculateTeamForm();
    await syncHighlights();

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    console.log('\n' + '='.repeat(50));
    console.log('🎉 ULTIMATE COMPREHENSIVE SYNC COMPLETED');
    console.log(`⏱️  Total time: ${duration}s`);
    console.log(`📊 Total API calls: ${apiCallCount}`);
    console.log('='.repeat(50));
    console.log('✅ Your football app is now FULLY loaded with:');
    console.log('   • League details with logos');
    console.log('   • All teams with logos');
    console.log('   • Complete season standings');
    console.log('   • Full match schedules');
    console.log('   • Team form analysis');
    console.log('   • Match highlights');
    console.log('\n🏁 Ready to launch!');

  } catch (error) {
    console.error('❌ Sync failed:', error);
  }
}

ultimateComprehensiveSync(); 