import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://septerrkdnojsmtmmska.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4'
);

async function checkTeamsTable() {
  console.log('🔍 CHECKING TEAMS TABLE...');
  
  try {
    // Check teams table structure and count
    const { count: teamsCount } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total teams in database: ${teamsCount}`);
    
    if (teamsCount > 0) {
      // Get sample teams
      const { data: sampleTeams } = await supabase
        .from('teams')
        .select('*')
        .limit(5);
      
      console.log('\n📋 Sample teams:');
      sampleTeams?.forEach(team => {
        console.log(`  - ID: ${team.id}, Name: ${team.name}`);
      });
      
      // Check if specific team IDs from our failed matches exist
      const testTeamIds = ['106308', '2355501', '134391', '384585', '422880'];
      console.log('\n🔍 Checking if API team IDs exist in teams table:');
      
      for (const teamId of testTeamIds) {
        const { data: teamExists } = await supabase
          .from('teams')
          .select('id, name')
          .eq('id', teamId)
          .single();
        
        if (teamExists) {
          console.log(`  ✅ Team ${teamId}: ${teamExists.name}`);
        } else {
          console.log(`  ❌ Team ${teamId}: NOT FOUND`);
        }
      }
    }
    
    // Check what team IDs range we have
    console.log('\n📊 Team ID ranges:');
    const { data: minMaxTeams } = await supabase
      .from('teams')
      .select('id')
      .order('id', { ascending: true })
      .limit(1);
    
    const { data: maxTeams } = await supabase
      .from('teams')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);
    
    if (minMaxTeams && minMaxTeams.length > 0 && maxTeams && maxTeams.length > 0) {
      console.log(`  Lowest team ID: ${minMaxTeams[0].id}`);
      console.log(`  Highest team ID: ${maxTeams[0].id}`);
    }
    
    // Check matches that DO have team IDs - what's the pattern?
    console.log('\n🔍 Checking matches that DO have team IDs:');
    const { data: workingMatches } = await supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, league_id')
      .not('home_team_id', 'is', null)
      .not('away_team_id', 'is', null)
      .limit(5);
    
    if (workingMatches && workingMatches.length > 0) {
      console.log('Working matches:');
      for (const match of workingMatches) {
        console.log(`  Match ${match.id}: ${match.home_team_id} vs ${match.away_team_id} (League: ${match.league_id})`);
        
        // Check if these team IDs exist in teams table
        const { data: homeTeam } = await supabase
          .from('teams')
          .select('name')
          .eq('id', match.home_team_id)
          .single();
        
        const { data: awayTeam } = await supabase
          .from('teams')
          .select('name')
          .eq('id', match.away_team_id)
          .single();
        
        console.log(`    Home: ${homeTeam?.name || 'NOT FOUND'}, Away: ${awayTeam?.name || 'NOT FOUND'}`);
      }
    }
    
    console.log('\n💡 ANALYSIS:');
    console.log('The issue is that team IDs from the API don\'t exist in the teams table.');
    console.log('We need to either:');
    console.log('1. Remove the foreign key constraints, OR');
    console.log('2. Populate the teams table with all teams from the API');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkTeamsTable().catch(console.error); 