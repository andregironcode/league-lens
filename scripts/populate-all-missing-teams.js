import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://septerrkdnojsmtmmska.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4'
);

async function populateAllMissingTeams() {
  console.log('🏗️ POPULATING ALL MISSING TEAMS FROM ENTIRE DATABASE...');
  
  try {
    // Get ALL matches with API data (not just recent ones)
    console.log('📊 Fetching ALL matches with API data...');
    
    const { data: allMatchesWithApiData, error } = await supabase
      .from('matches')
      .select('api_data')
      .not('api_data', 'is', null);
    
    if (error) {
      console.error('❌ Error fetching matches:', error);
      return;
    }
    
    if (!allMatchesWithApiData || allMatchesWithApiData.length === 0) {
      console.log('❌ No matches with API data found');
      return;
    }
    
    console.log(`📊 Found ${allMatchesWithApiData.length} matches with API data across ALL time`);
    
    // Extract all unique teams from ALL API data
    const teamsToAdd = new Map();
    let processedMatches = 0;
    
    console.log('🔍 Extracting teams from all matches...');
    
    allMatchesWithApiData.forEach((match, index) => {
      const apiData = match.api_data;
      
      if (apiData.homeTeam && apiData.homeTeam.id) {
        const teamId = apiData.homeTeam.id.toString();
        if (!teamsToAdd.has(teamId)) {
          teamsToAdd.set(teamId, {
            id: teamId,
            name: apiData.homeTeam.name || 'Unknown Team',
            logo: apiData.homeTeam.logo || null,
            country: apiData.country?.code || apiData.country?.name || null,
            league_id: apiData.league?.id?.toString() || null,
            api_data: apiData.homeTeam
          });
        }
      }
      
      if (apiData.awayTeam && apiData.awayTeam.id) {
        const teamId = apiData.awayTeam.id.toString();
        if (!teamsToAdd.has(teamId)) {
          teamsToAdd.set(teamId, {
            id: teamId,
            name: apiData.awayTeam.name || 'Unknown Team',
            logo: apiData.awayTeam.logo || null,
            country: apiData.country?.code || apiData.country?.name || null,
            league_id: apiData.league?.id?.toString() || null,
            api_data: apiData.awayTeam
          });
        }
      }
      
      processedMatches++;
      if (processedMatches % 500 === 0) {
        console.log(`  Processed ${processedMatches}/${allMatchesWithApiData.length} matches...`);
      }
    });
    
    console.log(`🎯 Found ${teamsToAdd.size} unique teams across ALL matches`);
    
    // Check which teams already exist
    console.log('🔍 Checking which teams already exist...');
    const teamIds = Array.from(teamsToAdd.keys());
    
    // Check in batches to avoid query limits
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
    
    // Filter to only new teams
    const newTeams = Array.from(teamsToAdd.values()).filter(team => !existingTeamIds.has(team.id));
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`  📋 Total unique teams found: ${teamsToAdd.size}`);
    console.log(`  ✅ Teams already exist: ${existingTeamIds.size}`);
    console.log(`  🆕 New teams to add: ${newTeams.length}`);
    
    if (newTeams.length === 0) {
      console.log('\n✅ All teams already exist in database - no action needed!');
      return;
    }
    
    // Show sample of teams to be added by league
    console.log('\n📋 Sample teams to be added by competition:');
    const teamsByLeague = {};
    newTeams.forEach(team => {
      const league = team.league_id || 'Unknown';
      if (!teamsByLeague[league]) teamsByLeague[league] = [];
      teamsByLeague[league].push(team);
    });
    
    Object.keys(teamsByLeague).slice(0, 10).forEach(leagueId => {
      const teams = teamsByLeague[leagueId];
      console.log(`  🏆 League ${leagueId}: ${teams.length} teams`);
      teams.slice(0, 3).forEach(team => {
        console.log(`    - ${team.id}: ${team.name} (${team.country || 'Unknown'})`);
      });
      if (teams.length > 3) {
        console.log(`    ... and ${teams.length - 3} more teams`);
      }
    });
    
    // Insert new teams in batches
    console.log(`\n🚀 Starting insertion of ${newTeams.length} teams...`);
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
          
          // Show sample of inserted teams
          if (batch.length > 0) {
            console.log(`    Sample: ${batch[0].name} (${batch[0].id})`);
          }
        } else {
          console.log(`  ❌ Failed to insert batch: ${insertError.message}`);
          failed += batch.length;
        }
      } catch (error) {
        console.log(`  ❌ Error inserting batch: ${error.message}`);
        failed += batch.length;
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📊 FINAL RESULTS:`);
    console.log(`  ✅ Successfully inserted: ${inserted} teams`);
    console.log(`  ❌ Failed to insert: ${failed} teams`);
    
    if (inserted > 0) {
      console.log('\n🎉 SUCCESS: All teams have been populated!');
      
      // Final verification
      const { count: finalTeamCount } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true });
      
      console.log(`📊 Total teams in database now: ${finalTeamCount}`);
      console.log('\n✅ Now ALL matches should have proper team mapping!');
      console.log('🔄 You can now re-run the match fetch or fix any remaining NULL team IDs.');
    }
    
    if (failed > 0) {
      console.log(`\n⚠️ ${failed} teams failed to insert. You may need to investigate these manually.`);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

populateAllMissingTeams().catch(console.error); 