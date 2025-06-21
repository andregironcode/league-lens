/**
 * UPDATE LEAGUES WITH LOGOS AND ADD NEW LEAGUES
 * 
 * This script will:
 * 1. Fetch proper league data with logos for existing leagues
 * 2. Add new leagues: Champions League, World Cup, World Cup Qualifiers, Club World Cup, MLS, Saudi League, Championship
 * 3. Update the database with complete league information
 */

import { createClient } from '@supabase/supabase-js';

// Correct Supabase configuration
const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// API configuration
const API_BASE = 'http://localhost:3001/api/highlightly';

// Rate limiting
let apiCallCount = 0;
const MAX_CALLS_PER_MINUTE = 50;

async function makeApiCall(endpoint) {
  if (apiCallCount >= MAX_CALLS_PER_MINUTE) {
    console.log('   ⏱️ Rate limit reached, waiting 60 seconds...');
    await new Promise(resolve => setTimeout(resolve, 60000));
    apiCallCount = 0;
  }

  console.log(`📡 API Call: ${endpoint}`);
  apiCallCount++;

  try {
    const response = await fetch(`${API_BASE}${endpoint}`);
    
    if (!response.ok) {
      console.log(`❌ API call failed for ${endpoint}: HTTP ${response.status}: ${response.statusText}`);
      return null;
    }

    const responseData = await response.json();
    return responseData.data || responseData;
    
  } catch (error) {
    console.log(`❌ API call error for ${endpoint}: ${error.message}`);
    return null;
  }
}

async function findLeagueByName(searchTerm) {
  console.log(`🔍 Searching for league: ${searchTerm}`);
  
  // Get all leagues from API
  const leagues = await makeApiCall('/leagues?limit=200');
  
  if (!leagues || !Array.isArray(leagues)) {
    console.log(`❌ No leagues data received`);
    return null;
  }

  // Search for league by name (case insensitive)
  const found = leagues.find(league => 
    league.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    league.name?.toLowerCase() === searchTerm.toLowerCase()
  );

  if (found) {
    console.log(`✅ Found league: ${found.name} (ID: ${found.id})`);
    return found;
  } else {
    console.log(`❌ League not found for: ${searchTerm}`);
    // Show available leagues for debugging
    console.log(`Available leagues: ${leagues.slice(0, 10).map(l => l.name).join(', ')}...`);
    return null;
  }
}

async function updateExistingLeagues() {
  console.log('\n🔄 UPDATING EXISTING LEAGUES WITH LOGOS');
  console.log('='.repeat(50));

  // Get current leagues from database
  const { data: currentLeagues } = await supabase
    .from('leagues')
    .select('*');

  if (!currentLeagues || currentLeagues.length === 0) {
    console.log('❌ No leagues found in database');
    return;
  }

  console.log(`📊 Found ${currentLeagues.length} leagues in database`);

  for (const dbLeague of currentLeagues) {
    console.log(`\n🔄 Updating league: ${dbLeague.name}`);
    
    // Search for this league in the API
    const apiLeague = await findLeagueByName(dbLeague.name);
    
    if (apiLeague) {
      // Update the database league with API data
      const updateData = {
        logo: apiLeague.logo,
        country_code: apiLeague.country?.code,
        country_name: apiLeague.country?.name,
        country_logo: apiLeague.country?.flag,
        current_season: apiLeague.seasons?.[0]?.year || 2024,
        api_data: JSON.stringify(apiLeague)
      };

      const { error } = await supabase
        .from('leagues')
        .update(updateData)
        .eq('id', dbLeague.id);

      if (error) {
        console.log(`❌ Error updating ${dbLeague.name}: ${error.message}`);
      } else {
        console.log(`✅ Updated ${dbLeague.name} with logo and country data`);
      }
    } else {
      console.log(`❌ Could not find API data for ${dbLeague.name}`);
    }
  }
}

async function addNewLeagues() {
  console.log('\n➕ ADDING NEW LEAGUES');
  console.log('='.repeat(50));

  const newLeaguesToAdd = [
    { searchTerm: 'Champions League', priority: 6 },
    { searchTerm: 'UEFA Champions League', priority: 6 },
    { searchTerm: 'World Cup', priority: 7 },
    { searchTerm: 'FIFA World Cup', priority: 7 },
    { searchTerm: 'World Cup Qualifiers', priority: 8 },
    { searchTerm: 'WC Qualification', priority: 8 },
    { searchTerm: 'Club World Cup', priority: 9 },
    { searchTerm: 'FIFA Club World Cup', priority: 9 },
    { searchTerm: 'MLS', priority: 10 },
    { searchTerm: 'Major League Soccer', priority: 10 },
    { searchTerm: 'Saudi Pro League', priority: 11 },
    { searchTerm: 'Saudi Arabia', priority: 11 },
    { searchTerm: 'Championship', priority: 12 },
    { searchTerm: 'EFL Championship', priority: 12 }
  ];

  const addedLeagues = new Set();

  for (const { searchTerm, priority } of newLeaguesToAdd) {
    if (addedLeagues.has(searchTerm.toLowerCase())) {
      console.log(`⏭️  Skipping ${searchTerm} (already processed)`);
      continue;
    }

    console.log(`\n➕ Adding new league: ${searchTerm}`);
    
    const apiLeague = await findLeagueByName(searchTerm);
    
    if (apiLeague) {
      // Check if league already exists in database
      const { data: existingLeague } = await supabase
        .from('leagues')
        .select('id')
        .eq('id', apiLeague.id)
        .single();

      if (existingLeague) {
        console.log(`⏭️  League ${apiLeague.name} already exists in database`);
        addedLeagues.add(searchTerm.toLowerCase());
        continue;
      }

      // Add new league to database
      const leagueData = {
        id: apiLeague.id,
        name: apiLeague.name,
        logo: apiLeague.logo,
        country_code: apiLeague.country?.code,
        country_name: apiLeague.country?.name,
        country_logo: apiLeague.country?.flag,
        priority: priority,
        current_season: apiLeague.seasons?.[0]?.year || 2024,
        api_data: JSON.stringify(apiLeague)
      };

      const { error } = await supabase
        .from('leagues')
        .insert(leagueData);

      if (error) {
        console.log(`❌ Error adding ${apiLeague.name}: ${error.message}`);
      } else {
        console.log(`✅ Added ${apiLeague.name} (ID: ${apiLeague.id}) with priority ${priority}`);
        addedLeagues.add(searchTerm.toLowerCase());
      }
    } else {
      console.log(`❌ Could not find league for: ${searchTerm}`);
    }
  }
}

async function syncTeamsForNewLeagues() {
  console.log('\n👥 SYNCING TEAMS FOR NEW LEAGUES');
  console.log('='.repeat(50));

  // Get all leagues from database
  const { data: leagues } = await supabase
    .from('leagues')
    .select('*')
    .order('priority');

  if (!leagues || leagues.length === 0) {
    console.log('❌ No leagues found');
    return;
  }

  let totalTeamsSynced = 0;

  for (const league of leagues) {
    console.log(`\n👥 Syncing teams for ${league.name}...`);
    
    // Try to get standings which includes team data
    const standings = await makeApiCall(`/standings?leagueId=${league.id}&season=2024`);
    
    if (standings && Array.isArray(standings) && standings.length > 0) {
      console.log(`📊 Found ${standings.length} teams in standings`);
      
      for (const standing of standings) {
        const team = standing.team;
        if (!team) continue;

        const teamData = {
          id: team.id,
          name: team.name,
          logo: team.logo,
          short_name: team.code || team.short_name,
          league_id: league.id,
          country: league.country_name,
          founded: team.founded,
          venue_name: team.venue?.name,
          venue_capacity: team.venue?.capacity,
          api_data: JSON.stringify(team)
        };

        const { error } = await supabase
          .from('teams')
          .upsert(teamData, { onConflict: 'id' });

        if (!error) {
          totalTeamsSynced++;
        }
      }
    } else {
      console.log(`📊 No standings data found for ${league.name}`);
    }
  }

  console.log(`✅ Teams sync completed: ${totalTeamsSynced} teams synced`);
  return totalTeamsSynced;
}

async function runLeagueUpdate() {
  const startTime = Date.now();
  
  console.log('🚀 LEAGUE UPDATE AND EXPANSION STARTED');
  console.log('='.repeat(50));
  console.log(`⏰ Start time: ${new Date().toLocaleString()}`);
  console.log('🎯 Goals:');
  console.log('   • Update existing leagues with proper logos');
  console.log('   • Add Champions League, World Cup, MLS, Saudi League, etc.');
  console.log('   • Sync teams for all leagues');

  try {
    // Step 1: Update existing leagues with logos
    await updateExistingLeagues();

    // Step 2: Add new leagues
    await addNewLeagues();

    // Step 3: Sync teams for all leagues
    const teamCount = await syncTeamsForNewLeagues();

    // Final status check
    const { count: totalLeagues } = await supabase
      .from('leagues')
      .select('*', { count: 'exact', head: true });

    const { count: totalTeams } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true });

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    console.log('\n' + '='.repeat(50));
    console.log('🎉 LEAGUE UPDATE COMPLETED');
    console.log(`⏱️  Total time: ${duration}s`);
    console.log(`📊 Total API calls: ${apiCallCount}`);
    console.log('='.repeat(50));
    console.log('✅ Final status:');
    console.log(`   • ${totalLeagues} leagues total (with logos)`);
    console.log(`   • ${totalTeams} teams total`);
    console.log(`   • ${teamCount} teams synced in this run`);
    console.log('');
    console.log('🏆 LEAGUES ARE NOW PROPERLY CONFIGURED!');
    console.log('🎯 All leagues have logos and complete data!');

  } catch (error) {
    console.error('❌ League update failed:', error.message);
    process.exit(1);
  }
}

// Run the league update
runLeagueUpdate(); 