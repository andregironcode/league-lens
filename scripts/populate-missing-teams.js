import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://septerrkdnojsmtmmska.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4'
);

async function populateMissingTeams() {
  console.log('🏗️ POPULATING MISSING TEAMS...');
  
  try {
    // Get matches with API data that have team information
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 1);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 5);
    
    const { data: matchesWithApiData } = await supabase
      .from('matches')
      .select('api_data')
      .gte('match_date', startDate.toISOString().split('T')[0])
      .lte('match_date', endDate.toISOString().split('T')[0])
      .not('api_data', 'is', null);
    
    if (!matchesWithApiData || matchesWithApiData.length === 0) {
      console.log('❌ No matches with API data found');
      return;
    }
    
    console.log(`📊 Found ${matchesWithApiData.length} matches with API data`);
    
    // Extract all unique teams from API data
    const teamsToAdd = new Map();
    
    matchesWithApiData.forEach(match => {
      const apiData = match.api_data;
      
      if (apiData.homeTeam && apiData.homeTeam.id) {
        const teamId = apiData.homeTeam.id.toString();
        if (!teamsToAdd.has(teamId)) {
          teamsToAdd.set(teamId, {
            id: teamId,
            name: apiData.homeTeam.name || 'Unknown Team',
            logo: apiData.homeTeam.logo || null,
            country: apiData.country?.code || null,
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
            country: apiData.country?.code || null,
            api_data: apiData.awayTeam
          });
        }
      }
    });
    
    console.log(`🎯 Found ${teamsToAdd.size} unique teams to potentially add`);
    
    // Check which teams already exist
    const teamIds = Array.from(teamsToAdd.keys());
    const { data: existingTeams } = await supabase
      .from('teams')
      .select('id')
      .in('id', teamIds);
    
    const existingTeamIds = new Set(existingTeams?.map(t => t.id) || []);
    
    // Filter to only new teams
    const newTeams = Array.from(teamsToAdd.values()).filter(team => !existingTeamIds.has(team.id));
    
    console.log(`📊 Teams already exist: ${existingTeamIds.size}`);
    console.log(`🆕 New teams to add: ${newTeams.length}`);
    
    if (newTeams.length === 0) {
      console.log('✅ All teams already exist in database');
      return;
    }
    
    // Show sample of teams to be added
    console.log('\n📋 Sample teams to be added:');
    newTeams.slice(0, 10).forEach(team => {
      console.log(`  - ${team.id}: ${team.name}`);
    });
    
    if (newTeams.length > 10) {
      console.log(`  ... and ${newTeams.length - 10} more teams`);
    }
    
    // Insert new teams in batches
    const batchSize = 50;
    let inserted = 0;
    let failed = 0;
    
    for (let i = 0; i < newTeams.length; i += batchSize) {
      const batch = newTeams.slice(i, i + batchSize);
      console.log(`\n🔄 Inserting batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(newTeams.length/batchSize)} (${batch.length} teams)...`);
      
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
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📊 RESULTS:`);
    console.log(`  ✅ Successfully inserted: ${inserted} teams`);
    console.log(`  ❌ Failed to insert: ${failed} teams`);
    
    if (inserted > 0) {
      console.log('\n🎉 SUCCESS: Teams have been populated!');
      console.log('Now you can re-run the match fetch to populate team IDs correctly.');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

populateMissingTeams().catch(console.error); 