/**
 * SYNC INTERNATIONAL TEAMS 2024
 * 
 * Comprehensive sync script to get national teams from international tournaments
 * including Euro Championship, Copa America, FIFA World Cup, and other competitions
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// API Configuration
const API_BASE_URL = 'http://localhost:3001/api/highlightly';
const RATE_LIMIT_DELAY = 1200; // 50 calls per minute = 1200ms between calls
const SEASON = '2024';

// International tournaments to sync
const INTERNATIONAL_TOURNAMENTS = [
  {
    id: 4188,
    name: 'Euro Championship',
    description: 'UEFA European Championship 2024',
    expectedTeams: ['Germany', 'Spain', 'France', 'Italy', 'England', 'Portugal', 'Netherlands', 'Belgium', 'Croatia', 'Denmark', 'Switzerland', 'Austria', 'Poland', 'Czech Republic', 'Hungary', 'Scotland', 'Slovenia', 'Slovakia', 'Serbia', 'Romania', 'Ukraine', 'Turkey', 'Georgia', 'Albania']
  },
  {
    id: 8443,
    name: 'Copa America',
    description: 'Copa América 2024',
    expectedTeams: ['Argentina', 'Brazil', 'Uruguay', 'Colombia', 'Chile', 'Peru', 'Ecuador', 'Venezuela', 'Bolivia', 'Paraguay', 'United States', 'Mexico', 'Canada', 'Costa Rica', 'Panama', 'Jamaica']
  },
  {
    id: 13549,
    name: 'FIFA Club World Cup',
    description: 'FIFA Club World Cup 2024',
    expectedTeams: [] // This is for clubs, not national teams
  },
  // Additional tournaments we want to check
  {
    id: 1,
    name: 'FIFA World Cup',
    description: 'FIFA World Cup (if available)',
    expectedTeams: ['France', 'Argentina', 'Spain', 'Germany', 'Brazil', 'England', 'Portugal', 'Netherlands', 'Belgium', 'Croatia', 'Italy', 'Morocco', 'Japan', 'South Korea', 'Australia', 'Mexico', 'Poland', 'Senegal', 'Denmark', 'Switzerland']
  }
];

// Major national teams to ensure we have
const MAJOR_NATIONAL_TEAMS = [
  // European teams
  'Germany', 'Spain', 'France', 'Italy', 'England', 'Portugal', 'Netherlands', 'Belgium',
  'Croatia', 'Denmark', 'Switzerland', 'Austria', 'Poland', 'Czech Republic', 'Hungary',
  'Scotland', 'Wales', 'Ireland', 'Norway', 'Sweden', 'Finland', 'Greece', 'Turkey',
  'Serbia', 'Romania', 'Ukraine', 'Slovenia', 'Slovakia', 'Bulgaria', 'Bosnia and Herzegovina',
  
  // South American teams
  'Argentina', 'Brazil', 'Uruguay', 'Colombia', 'Chile', 'Peru', 'Ecuador', 'Venezuela',
  'Bolivia', 'Paraguay',
  
  // North/Central American teams
  'United States', 'Mexico', 'Canada', 'Costa Rica', 'Jamaica', 'Panama', 'Honduras',
  'Guatemala', 'El Salvador', 'Nicaragua',
  
  // African teams
  'Morocco', 'Senegal', 'Nigeria', 'Ghana', 'Cameroon', 'Algeria', 'Tunisia', 'Egypt',
  'South Africa', 'Ivory Coast', 'Mali', 'Burkina Faso',
  
  // Asian teams
  'Japan', 'South Korea', 'Iran', 'Saudi Arabia', 'Australia', 'Qatar', 'Iraq', 'UAE',
  'China', 'Thailand', 'India', 'Uzbekistan',
  
  // Oceania
  'New Zealand'
];

// Utility function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Utility function to make API calls with proper error handling
async function makeAPICall(endpoint, params = {}) {
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  const url = new URL(fullUrl);
  
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });

  console.log(`📡 API Call: ${url.toString()}`);
  
  try {
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.log(`❌ API Error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    // Handle different response formats
    if (data && data.groups && Array.isArray(data.groups) && data.groups.length > 0) {
      const standings = data.groups[0].standings;
      console.log(`✅ API Success: ${standings.length || 0} standings records`);
      return standings;
    } else if (data && data.data) {
      console.log(`✅ API Success: ${data.data.length || 0} records`);
      return data.data;
    } else if (Array.isArray(data)) {
      console.log(`✅ API Success: ${data.length} records`);
      return data;
    } else {
      console.log(`⚠️  API returned unexpected format:`, JSON.stringify(data, null, 2));
      return null;
    }
  } catch (error) {
    console.log(`❌ API Error: ${error.message}`);
    return null;
  }
}

// Function to upsert team data
async function upsertTeam(team, leagueId) {
  try {
    const { error } = await supabase
      .from('teams')
      .upsert({
        id: team.id,
        name: team.name,
        logo: team.logo || null,
        league_id: leagueId
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.log(`❌ Error upserting team ${team.name}: ${error.message}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Error upserting team ${team.name}: ${error.message}`);
    return false;
  }
}

// Function to sync teams from a specific tournament
async function syncTournamentTeams(tournament) {
  console.log(`\n🏆 Syncing ${tournament.name} (ID: ${tournament.id})`);
  console.log('=' .repeat(60));
  console.log(`📝 Description: ${tournament.description}`);

  // Get standings data (which includes team data)
  const standingsData = await makeAPICall('/standings', {
    leagueId: parseInt(tournament.id),
    season: parseInt(SEASON)
  });

  if (!standingsData || !Array.isArray(standingsData) || standingsData.length === 0) {
    console.log(`⚠️  No standings data found for ${tournament.name}`);
    
    // Try to get teams directly if standings fail
    const teamsData = await makeAPICall('/teams', {
      leagueId: parseInt(tournament.id),
      season: parseInt(SEASON)
    });
    
    if (!teamsData || !Array.isArray(teamsData) || teamsData.length === 0) {
      console.log(`⚠️  No teams data found for ${tournament.name}`);
      return {
        success: false,
        teamsCount: 0
      };
    }
    
    console.log(`📊 Found ${teamsData.length} teams (direct teams API)`);
    
    let teamsUpserted = 0;
    for (const team of teamsData) {
      if (!team.id) {
        console.log(`⚠️  Skipping team without ID: ${team.name || 'Unknown'}`);
        continue;
      }

      const teamSuccess = await upsertTeam(team, tournament.id);
      if (teamSuccess) {
        teamsUpserted++;
        console.log(`✅ Synced team: ${team.name}`);
      }
    }
    
    return {
      success: true,
      teamsCount: teamsUpserted
    };
  }

  console.log(`📊 Found ${standingsData.length} standings records`);

  let teamsUpserted = 0;
  const syncedTeams = [];

  // Process each standing record
  for (const standing of standingsData) {
    if (!standing.team || !standing.team.id) {
      console.log(`⚠️  Skipping standing record without team data`);
      continue;
    }

    // Upsert team data
    const teamSuccess = await upsertTeam(standing.team, tournament.id);
    if (teamSuccess) {
      teamsUpserted++;
      syncedTeams.push(standing.team.name);
      console.log(`✅ Synced national team: ${standing.team.name}`);
    }
  }

  console.log(`\n🏆 ${tournament.name} sync complete:`);
  console.log(`   • Teams synced: ${teamsUpserted}/${standingsData.length}`);
  console.log(`   • Teams: ${syncedTeams.join(', ')}`);

  // Check if we got the expected major teams
  const expectedCount = tournament.expectedTeams.length;
  const foundExpected = tournament.expectedTeams.filter(expectedTeam => 
    syncedTeams.some(syncedTeam => 
      syncedTeam.toLowerCase().includes(expectedTeam.toLowerCase()) ||
      expectedTeam.toLowerCase().includes(syncedTeam.toLowerCase())
    )
  );
  
  if (expectedCount > 0) {
    console.log(`   • Expected teams found: ${foundExpected.length}/${expectedCount}`);
    if (foundExpected.length < expectedCount) {
      const missing = tournament.expectedTeams.filter(expectedTeam => 
        !syncedTeams.some(syncedTeam => 
          syncedTeam.toLowerCase().includes(expectedTeam.toLowerCase()) ||
          expectedTeam.toLowerCase().includes(syncedTeam.toLowerCase())
        )
      );
      console.log(`   • Missing teams: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? ` (and ${missing.length - 5} more)` : ''}`);
    }
  }

  return {
    success: true,
    teamsCount: teamsUpserted
  };
}

// Function to add missing leagues if they don't exist
async function ensureInternationalLeagues() {
  console.log('\n🌍 ENSURING INTERNATIONAL LEAGUES EXIST');
  console.log('=' .repeat(60));

  const leaguesToAdd = [
    {
      id: 1,
      name: 'FIFA World Cup',
      logo: 'https://highlightly.net/soccer/images/leagues/1.png',
      country_code: 'World',
      country_name: 'World',
      country_logo: 'https://highlightly.net/soccer/images/countries/World.png',
      priority: false
    },
    // Note: Other leagues already exist from the check script output
  ];

  for (const league of leaguesToAdd) {
    const { data: existing, error: checkError } = await supabase
      .from('leagues')
      .select('id')
      .eq('id', league.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // Not "no rows found"
      console.log(`❌ Error checking league ${league.name}: ${checkError.message}`);
      continue;
    }

    if (!existing) {
      const { error: insertError } = await supabase
        .from('leagues')
        .insert(league);

      if (insertError) {
        console.log(`❌ Error adding league ${league.name}: ${insertError.message}`);
      } else {
        console.log(`✅ Added league: ${league.name}`);
      }
    } else {
      console.log(`ℹ️  League already exists: ${league.name}`);
    }
  }
}

// Main sync function
async function syncInternationalTeams() {
  console.log('🌍 SYNCING INTERNATIONAL TEAMS 2024');
  console.log('=' .repeat(80));
  console.log(`🔗 API Base URL: ${API_BASE_URL}`);
  console.log(`📅 Season: ${SEASON}`);
  console.log(`⏰ Rate Limit: ${RATE_LIMIT_DELAY}ms between calls`);

  const startTime = Date.now();
  let totalTeams = 0;
  const results = [];

  try {
    // Ensure leagues exist
    await ensureInternationalLeagues();

    // Process each tournament
    for (let i = 0; i < INTERNATIONAL_TOURNAMENTS.length; i++) {
      const tournament = INTERNATIONAL_TOURNAMENTS[i];
      
      console.log(`\n[${i + 1}/${INTERNATIONAL_TOURNAMENTS.length}] Processing ${tournament.name}...`);
      
      const result = await syncTournamentTeams(tournament);
      results.push({
        tournament: tournament.name,
        ...result
      });
      
      totalTeams += result.teamsCount;
      
      // Rate limiting - wait between API calls
      if (i < INTERNATIONAL_TOURNAMENTS.length - 1) {
        console.log(`⏳ Waiting ${RATE_LIMIT_DELAY}ms for rate limiting...`);
        await delay(RATE_LIMIT_DELAY);
      }
    }

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    // Final summary
    console.log('\n' + '=' .repeat(80));
    console.log('🎉 INTERNATIONAL TEAMS SYNC COMPLETE');
    console.log('=' .repeat(80));
    console.log(`⏱️  Total time: ${duration} seconds`);
    console.log(`🏴 Total national teams synced: ${totalTeams}`);
    
    console.log('\n📊 Results by tournament:');
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${status} ${result.tournament}: ${result.teamsCount} teams`);
    });

    // Show total unique national teams in database
    const { data: allNationalTeams, error } = await supabase
      .from('teams')
      .select('name, leagues:league_id(name)')
      .in('league_id', INTERNATIONAL_TOURNAMENTS.map(t => t.id));

    if (!error) {
      console.log(`\n🏴 Total national teams in database: ${allNationalTeams.length}`);
      
      // Group by tournament
      const teamsByTournament = {};
      allNationalTeams.forEach(team => {
        const tournament = team.leagues?.name || 'Unknown';
        if (!teamsByTournament[tournament]) {
          teamsByTournament[tournament] = [];
        }
        teamsByTournament[tournament].push(team.name);
      });
      
      Object.keys(teamsByTournament).forEach(tournament => {
        console.log(`   ${tournament}: ${teamsByTournament[tournament].length} teams`);
        console.log(`      ${teamsByTournament[tournament].slice(0, 8).join(', ')}${teamsByTournament[tournament].length > 8 ? '...' : ''}`);
      });
    }

  } catch (error) {
    console.log('❌ Fatal error:', error);
  }
}

// Run the sync
syncInternationalTeams(); 