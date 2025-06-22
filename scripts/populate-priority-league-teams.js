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

async function populatePriorityLeagueTeams() {
  console.log('🏗️ POPULATING TEAMS FOR PRIORITY LEAGUES...');
  
  try {
    // Define priority leagues that are missing teams (from our top 50 list)
    const priorityLeagues = [
      { id: '33973', name: 'Premier League' },
      { id: '119924', name: 'La Liga' },
      { id: '115669', name: 'Serie A' },
      { id: '67162', name: 'Bundesliga' },
      { id: '52695', name: 'Ligue 1' },
      { id: '13549', name: 'FIFA Club World Cup' },
      { id: '84182', name: 'J1 League' },
      { id: '75672', name: 'Eredivisie' },
      { id: '80778', name: 'Liga Portugal' },
      { id: '34824', name: 'Championship' },
      { id: '39079', name: 'FA Cup' },
      { id: '109712', name: 'Liga Profesional Argentina' },
      { id: '69715', name: 'DFB Pokal' },
      { id: '122477', name: 'Copa del Rey' },
      { id: '223746', name: 'Liga MX' }
    ];
    
    console.log(`📊 Processing ${priorityLeagues.length} priority leagues...`);
    
    const allTeamsToAdd = new Map();
    let successfulLeagues = 0;
    let failedLeagues = 0;
    
    for (const league of priorityLeagues) {
      try {
        console.log(`\n🏆 Processing ${league.name} (${league.id})...`);
        
        let teamsFound = 0;
        
        // Try multiple approaches to get teams
        
        // 1. Try standings endpoint
        try {
          console.log(`  📡 Trying standings for ${league.name}...`);
          const standingsData = await callHighlightlyAPI('standings', {
            leagueId: league.id,
            season: '2025'
          });
          
          if (standingsData?.data && Array.isArray(standingsData.data)) {
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
                  teamsFound++;
                }
              }
            });
            
            if (teamsFound > 0) {
              console.log(`  ✅ Found ${teamsFound} teams from standings`);
            }
          }
        } catch (error) {
          console.log(`  ⚠️ Standings failed: ${error.message}`);
        }
        
        // 2. Try teams endpoint if standings didn't work
        if (teamsFound === 0) {
          try {
            console.log(`  📡 Trying teams endpoint for ${league.name}...`);
            const teamsData = await callHighlightlyAPI('teams', {
              leagueId: league.id,
              season: '2025'
            });
            
            if (teamsData?.data && Array.isArray(teamsData.data)) {
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
                  teamsFound++;
                }
              });
              
              if (teamsFound > 0) {
                console.log(`  ✅ Found ${teamsFound} teams from teams endpoint`);
              }
            }
          } catch (error) {
            console.log(`  ⚠️ Teams endpoint failed: ${error.message}`);
          }
        }
        
        // 3. Try recent matches as fallback
        if (teamsFound === 0) {
          try {
            console.log(`  📡 Trying recent matches for ${league.name}...`);
            const matchesData = await callHighlightlyAPI('matches', {
              leagueId: league.id,
              season: '2025',
              date: '2025-01-01'
            });
            
            if (matchesData?.data && Array.isArray(matchesData.data)) {
              matchesData.data.forEach(match => {
                if (match.homeTeam && match.homeTeam.id) {
                  const teamId = match.homeTeam.id.toString();
                  if (!allTeamsToAdd.has(teamId)) {
                    allTeamsToAdd.set(teamId, {
                      id: teamId,
                      name: match.homeTeam.name || 'Unknown Team',
                      logo: match.homeTeam.logo || `https://highlightly.net/soccer/images/teams/${teamId}.png`,
                      country: match.country?.code || match.country?.name || null,
                      league_id: league.id,
                      api_data: match.homeTeam
                    });
                    teamsFound++;
                  }
                }
                
                if (match.awayTeam && match.awayTeam.id) {
                  const teamId = match.awayTeam.id.toString();
                  if (!allTeamsToAdd.has(teamId)) {
                    allTeamsToAdd.set(teamId, {
                      id: teamId,
                      name: match.awayTeam.name || 'Unknown Team',
                      logo: match.awayTeam.logo || `https://highlightly.net/soccer/images/teams/${teamId}.png`,
                      country: match.country?.code || match.country?.name || null,
                      league_id: league.id,
                      api_data: match.awayTeam
                    });
                    teamsFound++;
                  }
                }
              });
              
              if (teamsFound > 0) {
                console.log(`  ✅ Found ${teamsFound} teams from matches`);
              }
            }
          } catch (error) {
            console.log(`  ⚠️ Matches failed: ${error.message}`);
          }
        }
        
        if (teamsFound > 0) {
          successfulLeagues++;
        } else {
          console.log(`  ❌ No teams found for ${league.name}`);
          failedLeagues++;
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`  ❌ Error processing ${league.name}:`, error.message);
        failedLeagues++;
      }
    }
    
    console.log(`\n📊 PROCESSING COMPLETE:`);
    console.log(`  ✅ Successful leagues: ${successfulLeagues}`);
    console.log(`  ❌ Failed leagues: ${failedLeagues}`);
    console.log(`  🎯 Total unique teams found: ${allTeamsToAdd.size}`);
    
    if (allTeamsToAdd.size === 0) {
      console.log('\n❌ No new teams found from priority leagues');
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
    }
    
    const newTeams = Array.from(allTeamsToAdd.values()).filter(team => !existingTeamIds.has(team.id));
    
    console.log(`\n📊 TEAM SUMMARY:`);
    console.log(`  📋 Total teams from API: ${allTeamsToAdd.size}`);
    console.log(`  ✅ Already exist: ${existingTeamIds.size}`);
    console.log(`  🆕 New teams to add: ${newTeams.length}`);
    
    if (newTeams.length === 0) {
      console.log('\n✅ All teams from priority leagues already exist!');
      return;
    }
    
    // Show sample of new teams
    console.log('\n📋 Sample new teams:');
    const teamsByLeague = {};
    newTeams.forEach(team => {
      const league = team.league_id || 'Unknown';
      if (!teamsByLeague[league]) teamsByLeague[league] = [];
      teamsByLeague[league].push(team);
    });
    
    Object.keys(teamsByLeague).forEach(leagueId => {
      const teams = teamsByLeague[leagueId];
      const leagueName = priorityLeagues.find(l => l.id === leagueId)?.name || `League ${leagueId}`;
      console.log(`  🏆 ${leagueName}: ${teams.length} new teams`);
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
      console.log('✅ Priority leagues should now have better team coverage!');
      
      // Show updated coverage
      const { count: totalLeagues } = await supabase
        .from('leagues')
        .select('*', { count: 'exact', head: true });
      
      const { data: leaguesWithTeams } = await supabase
        .from('teams')
        .select('league_id')
        .not('league_id', 'is', null);
      
      const uniqueLeaguesWithTeams = new Set(leaguesWithTeams?.map(t => t.league_id) || []);
      const newCoveragePercentage = ((uniqueLeaguesWithTeams.size / totalLeagues) * 100).toFixed(1);
      
      console.log(`📊 Updated league coverage: ${newCoveragePercentage}% (${uniqueLeaguesWithTeams.size}/${totalLeagues})`);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

populatePriorityLeagueTeams().catch(console.error); 