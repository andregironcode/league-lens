import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://septerrkdnojsmtmmska.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4'
);

async function callHighlightlyAPI(endpoint, params = {}) {
  try {
    const url = new URL(`http://localhost:3001/api/highlightly/${endpoint}`);
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(`API call failed: ${error.message}`);
  }
}

async function populateAllLeagueTeams() {
  console.log('🏗️ POPULATING ALL TEAMS FOR ALL LEAGUES FROM API...');
  
  try {
    // Get all leagues with API data
    const { data: leagues } = await supabase
      .from('leagues')
      .select('id, name, api_data')
      .not('api_data', 'is', null);
    
    if (!leagues || leagues.length === 0) {
      console.log('❌ No leagues with API data found');
      return;
    }
    
    console.log(`📊 Found ${leagues.length} leagues with API data`);
    
    const allTeamsToAdd = new Map();
    let processedLeagues = 0;
    let successfulLeagues = 0;
    let failedLeagues = 0;
    
    for (const league of leagues) {
      try {
        console.log(`\n🏆 Processing league: ${league.name} (${league.id})...`);
        
        const highlightlyId = league.api_data?.highlightly_id;
        if (!highlightlyId) {
          console.log(`  ⚠️ No Highlightly ID found for ${league.name}`);
          failedLeagues++;
          continue;
        }
        
        // Try to fetch teams for this league
        console.log(`  📡 Fetching teams for league ${highlightlyId}...`);
        
        try {
          // Try teams endpoint
          const teamsData = await callHighlightlyAPI('teams', {
            leagueId: highlightlyId,
            season: '2025'
          });
          
          if (teamsData?.data && Array.isArray(teamsData.data) && teamsData.data.length > 0) {
            console.log(`  ✅ Found ${teamsData.data.length} teams for ${league.name}`);
            
            teamsData.data.forEach(team => {
              const teamId = team.id?.toString();
              if (teamId && !allTeamsToAdd.has(teamId)) {
                allTeamsToAdd.set(teamId, {
                  id: teamId,
                  name: team.name || 'Unknown Team',
                  logo: team.logo || `https://highlightly.net/soccer/images/teams/${teamId}.png`,
                  country: team.country?.code || team.country?.name || null,
                  league_id: league.id,
                  api_data: team
                });
              }
            });
            
            successfulLeagues++;
          } else {
            // Try standings endpoint as fallback
            console.log(`  🔄 No teams endpoint data, trying standings...`);
            
            const standingsData = await callHighlightlyAPI('standings', {
              leagueId: highlightlyId,
              season: '2025'
            });
            
            if (standingsData?.data && Array.isArray(standingsData.data)) {
              let teamsFromStandings = 0;
              
              standingsData.data.forEach(standing => {
                if (standing.team && standing.team.id) {
                  const teamId = standing.team.id.toString();
                  if (!allTeamsToAdd.has(teamId)) {
                    allTeamsToAdd.set(teamId, {
                      id: teamId,
                      name: standing.team.name || 'Unknown Team',
                      logo: standing.team.logo || `https://highlightly.net/soccer/images/teams/${teamId}.png`,
                      country: standing.team.country?.code || standing.team.country?.name || null,
                      league_id: league.id,
                      api_data: standing.team
                    });
                    teamsFromStandings++;
                  }
                }
              });
              
              if (teamsFromStandings > 0) {
                console.log(`  ✅ Found ${teamsFromStandings} teams from standings for ${league.name}`);
                successfulLeagues++;
              } else {
                console.log(`  ❌ No teams found in standings for ${league.name}`);
                failedLeagues++;
              }
            } else {
              console.log(`  ❌ No teams or standings data for ${league.name}`);
              failedLeagues++;
            }
          }
          
        } catch (apiError) {
          console.log(`  ❌ API error for ${league.name}: ${apiError.message}`);
          failedLeagues++;
        }
        
        processedLeagues++;
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Progress update
        if (processedLeagues % 10 === 0) {
          console.log(`\n📊 Progress: ${processedLeagues}/${leagues.length} leagues processed...`);
          console.log(`  ✅ Successful: ${successfulLeagues}, ❌ Failed: ${failedLeagues}`);
          console.log(`  🎯 Unique teams found so far: ${allTeamsToAdd.size}`);
        }
        
      } catch (error) {
        console.error(`  ❌ Error processing league ${league.name}:`, error.message);
        failedLeagues++;
        processedLeagues++;
      }
    }
    
    console.log(`\n📊 LEAGUE PROCESSING COMPLETE:`);
    console.log(`  📋 Total leagues processed: ${processedLeagues}`);
    console.log(`  ✅ Successful leagues: ${successfulLeagues}`);
    console.log(`  ❌ Failed leagues: ${failedLeagues}`);
    console.log(`  🎯 Total unique teams found: ${allTeamsToAdd.size}`);
    
    if (allTeamsToAdd.size === 0) {
      console.log('\n❌ No teams found from API - all leagues may be inactive or have API issues');
      return;
    }
    
    // Check which teams already exist
    console.log('\n🔍 Checking which teams already exist...');
    const teamIds = Array.from(allTeamsToAdd.keys());
    
    const batchSize = 1000;
    const existingTeamIds = new Set();
    
    for (let i = 0; i < teamIds.length; i += batchSize) {
      const batch = teamIds.slice(i, i + batchSize);
      const { data: existingBatch } = await supabase
        .from('teams')
        .select('id')
        .in('id', batch);
      
      if (existingBatch) {
        existingBatch.forEach(team => existingTeamIds.add(team.id));
      }
      
      console.log(`  Checked ${Math.min(i + batchSize, teamIds.length)}/${teamIds.length} team IDs...`);
    }
    
    const newTeams = Array.from(allTeamsToAdd.values()).filter(team => !existingTeamIds.has(team.id));
    
    console.log(`\n📊 TEAM SUMMARY:`);
    console.log(`  📋 Total teams from API: ${allTeamsToAdd.size}`);
    console.log(`  ✅ Already exist: ${existingTeamIds.size}`);
    console.log(`  🆕 New teams to add: ${newTeams.length}`);
    
    if (newTeams.length === 0) {
      console.log('\n✅ All teams from API already exist in database!');
      
      // Show final team count
      const { count: finalTeamCount } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true });
      
      console.log(`📊 Total teams in database: ${finalTeamCount}`);
      return;
    }
    
    // Show sample of new teams by league
    console.log('\n📋 Sample new teams by league:');
    const teamsByLeague = {};
    newTeams.forEach(team => {
      const league = team.league_id || 'Unknown';
      if (!teamsByLeague[league]) teamsByLeague[league] = [];
      teamsByLeague[league].push(team);
    });
    
    Object.keys(teamsByLeague).slice(0, 10).forEach(leagueId => {
      const teams = teamsByLeague[leagueId];
      console.log(`  🏆 League ${leagueId}: ${teams.length} new teams`);
      teams.slice(0, 3).forEach(team => {
        console.log(`    - ${team.id}: ${team.name}`);
      });
      if (teams.length > 3) {
        console.log(`    ... and ${teams.length - 3} more teams`);
      }
    });
    
    // Insert new teams
    console.log(`\n🚀 Inserting ${newTeams.length} new teams...`);
    const insertBatchSize = 50;
    let inserted = 0;
    let failed = 0;
    
    for (let i = 0; i < newTeams.length; i += insertBatchSize) {
      const batch = newTeams.slice(i, i + insertBatchSize);
      const batchNum = Math.floor(i/insertBatchSize) + 1;
      const totalBatches = Math.ceil(newTeams.length/insertBatchSize);
      
      console.log(`\n🔄 Inserting batch ${batchNum}/${totalBatches} (${batch.length} teams)...`);
      
      try {
        const { error: insertError } = await supabase
          .from('teams')
          .insert(batch);
        
        if (!insertError) {
          console.log(`  ✅ Successfully inserted ${batch.length} teams`);
          inserted += batch.length;
        } else {
          console.log(`  ❌ Failed to insert batch: ${insertError.message}`);
          failed += batch.length;
        }
      } catch (error) {
        console.log(`  ❌ Error inserting batch: ${error.message}`);
        failed += batch.length;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📊 FINAL RESULTS:`);
    console.log(`  ✅ Successfully inserted: ${inserted} teams`);
    console.log(`  ❌ Failed to insert: ${failed} teams`);
    
    if (inserted > 0) {
      const { count: finalTeamCount } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true });
      
      console.log(`\n🎉 SUCCESS! Total teams in database now: ${finalTeamCount}`);
      console.log('✅ All leagues should now have comprehensive team coverage!');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

populateAllLeagueTeams().catch(console.error); 