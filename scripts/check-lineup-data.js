import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkLineupData() {
  console.log('🔍 CHECKING LINEUP DATA IN SYNCED MATCHES');
  console.log('='.repeat(50));
  
  try {
    // Get a few matches with api_data
    const { data: matches, error } = await supabase
      .from('matches')
      .select('id, api_data, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)')
      .not('api_data', 'is', null)
      .limit(3);
    
    if (error) {
      console.log('❌ Error fetching matches:', error.message);
      return;
    }
    
    if (!matches || matches.length === 0) {
      console.log('❌ No matches with api_data found');
      return;
    }
    
    for (const match of matches) {
      console.log(`\n🎯 Checking match: ${match.home_team?.name} vs ${match.away_team?.name} (ID: ${match.id})`);
      
      const apiData = match.api_data || {};
      
      // Check for lineup data in the api_data
      console.log('📊 Available data in api_data:');
      console.log('   Properties:', Object.keys(apiData));
      
      // Check for lineups specifically
      if (apiData.lineups) {
        console.log('   ✅ LINEUPS: Found');
        
        // Check structure
        const lineups = apiData.lineups;
        console.log('   📋 Lineup structure:');
        console.log('      Teams with lineups:', Object.keys(lineups));
        
        // Sample first team's lineup
        const firstTeamId = Object.keys(lineups)[0];
        if (firstTeamId && lineups[firstTeamId]) {
          const teamLineup = lineups[firstTeamId];
          console.log(`      Team ${firstTeamId} lineup properties:`, Object.keys(teamLineup));
          
          if (teamLineup.starting11) {
            console.log(`      Starting XI: ${teamLineup.starting11.length} players`);
          }
          if (teamLineup.substitutes) {
            console.log(`      Substitutes: ${teamLineup.substitutes.length} players`);
          }
          if (teamLineup.formation) {
            console.log(`      Formation: ${teamLineup.formation}`);
          }
        }
        
      } else if (apiData.homeTeam && apiData.awayTeam) {
        console.log('   🔍 Checking homeTeam/awayTeam for lineup data...');
        
        // Check if lineup data is in homeTeam/awayTeam objects
        const homeTeam = apiData.homeTeam || {};
        const awayTeam = apiData.awayTeam || {};
        
        console.log('   📋 Home team properties:', Object.keys(homeTeam));
        console.log('   📋 Away team properties:', Object.keys(awayTeam));
        
        if (homeTeam.formation && homeTeam.initialLineup) {
          console.log('   ✅ LINEUPS: Found in homeTeam/awayTeam structure');
          console.log(`      Home formation: ${homeTeam.formation}`);
          console.log(`      Home starting XI: ${homeTeam.initialLineup?.flat().length || 0} players`);
          console.log(`      Home substitutes: ${homeTeam.substitutes?.length || 0} players`);
          
          if (awayTeam.formation && awayTeam.initialLineup) {
            console.log(`      Away formation: ${awayTeam.formation}`);
            console.log(`      Away starting XI: ${awayTeam.initialLineup?.flat().length || 0} players`);
            console.log(`      Away substitutes: ${awayTeam.substitutes?.length || 0} players`);
          }
        } else {
          console.log('   ❌ No lineup data in homeTeam/awayTeam');
        }
        
      } else {
        console.log('   ❌ LINEUPS: Not found');
      }
      
      // Check for events
      if (apiData.events) {
        console.log(`   ✅ EVENTS: ${apiData.events.length} events`);
      } else {
        console.log('   ❌ EVENTS: Not found');
      }
      
      // Check for statistics
      if (apiData.statistics) {
        console.log(`   ✅ STATISTICS: ${apiData.statistics.length} teams`);
      } else {
        console.log('   ❌ STATISTICS: Not found');
      }
      
      console.log('   ' + '-'.repeat(40));
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('='.repeat(30));
    console.log('✅ Checked synced match data for lineup information');
    console.log('📋 If lineups are missing, we need to update sync script');
    
  } catch (error) {
    console.log('❌ Error checking lineup data:', error.message);
  }
}

checkLineupData(); 
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkLineupData() {
  console.log('🔍 CHECKING LINEUP DATA IN SYNCED MATCHES');
  console.log('='.repeat(50));
  
  try {
    // Get a few matches with api_data
    const { data: matches, error } = await supabase
      .from('matches')
      .select('id, api_data, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)')
      .not('api_data', 'is', null)
      .limit(3);
    
    if (error) {
      console.log('❌ Error fetching matches:', error.message);
      return;
    }
    
    if (!matches || matches.length === 0) {
      console.log('❌ No matches with api_data found');
      return;
    }
    
    for (const match of matches) {
      console.log(`\n🎯 Checking match: ${match.home_team?.name} vs ${match.away_team?.name} (ID: ${match.id})`);
      
      const apiData = match.api_data || {};
      
      // Check for lineup data in the api_data
      console.log('📊 Available data in api_data:');
      console.log('   Properties:', Object.keys(apiData));
      
      // Check for lineups specifically
      if (apiData.lineups) {
        console.log('   ✅ LINEUPS: Found');
        
        // Check structure
        const lineups = apiData.lineups;
        console.log('   📋 Lineup structure:');
        console.log('      Teams with lineups:', Object.keys(lineups));
        
        // Sample first team's lineup
        const firstTeamId = Object.keys(lineups)[0];
        if (firstTeamId && lineups[firstTeamId]) {
          const teamLineup = lineups[firstTeamId];
          console.log(`      Team ${firstTeamId} lineup properties:`, Object.keys(teamLineup));
          
          if (teamLineup.starting11) {
            console.log(`      Starting XI: ${teamLineup.starting11.length} players`);
          }
          if (teamLineup.substitutes) {
            console.log(`      Substitutes: ${teamLineup.substitutes.length} players`);
          }
          if (teamLineup.formation) {
            console.log(`      Formation: ${teamLineup.formation}`);
          }
        }
        
      } else if (apiData.homeTeam && apiData.awayTeam) {
        console.log('   🔍 Checking homeTeam/awayTeam for lineup data...');
        
        // Check if lineup data is in homeTeam/awayTeam objects
        const homeTeam = apiData.homeTeam || {};
        const awayTeam = apiData.awayTeam || {};
        
        console.log('   📋 Home team properties:', Object.keys(homeTeam));
        console.log('   📋 Away team properties:', Object.keys(awayTeam));
        
        if (homeTeam.formation && homeTeam.initialLineup) {
          console.log('   ✅ LINEUPS: Found in homeTeam/awayTeam structure');
          console.log(`      Home formation: ${homeTeam.formation}`);
          console.log(`      Home starting XI: ${homeTeam.initialLineup?.flat().length || 0} players`);
          console.log(`      Home substitutes: ${homeTeam.substitutes?.length || 0} players`);
          
          if (awayTeam.formation && awayTeam.initialLineup) {
            console.log(`      Away formation: ${awayTeam.formation}`);
            console.log(`      Away starting XI: ${awayTeam.initialLineup?.flat().length || 0} players`);
            console.log(`      Away substitutes: ${awayTeam.substitutes?.length || 0} players`);
          }
        } else {
          console.log('   ❌ No lineup data in homeTeam/awayTeam');
        }
        
      } else {
        console.log('   ❌ LINEUPS: Not found');
      }
      
      // Check for events
      if (apiData.events) {
        console.log(`   ✅ EVENTS: ${apiData.events.length} events`);
      } else {
        console.log('   ❌ EVENTS: Not found');
      }
      
      // Check for statistics
      if (apiData.statistics) {
        console.log(`   ✅ STATISTICS: ${apiData.statistics.length} teams`);
      } else {
        console.log('   ❌ STATISTICS: Not found');
      }
      
      console.log('   ' + '-'.repeat(40));
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('='.repeat(30));
    console.log('✅ Checked synced match data for lineup information');
    console.log('📋 If lineups are missing, we need to update sync script');
    
  } catch (error) {
    console.log('❌ Error checking lineup data:', error.message);
  }
}

checkLineupData(); 
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkLineupData() {
  console.log('🔍 CHECKING LINEUP DATA IN SYNCED MATCHES');
  console.log('='.repeat(50));
  
  try {
    // Get a few matches with api_data
    const { data: matches, error } = await supabase
      .from('matches')
      .select('id, api_data, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)')
      .not('api_data', 'is', null)
      .limit(3);
    
    if (error) {
      console.log('❌ Error fetching matches:', error.message);
      return;
    }
    
    if (!matches || matches.length === 0) {
      console.log('❌ No matches with api_data found');
      return;
    }
    
    for (const match of matches) {
      console.log(`\n🎯 Checking match: ${match.home_team?.name} vs ${match.away_team?.name} (ID: ${match.id})`);
      
      const apiData = match.api_data || {};
      
      // Check for lineup data in the api_data
      console.log('📊 Available data in api_data:');
      console.log('   Properties:', Object.keys(apiData));
      
      // Check for lineups specifically
      if (apiData.lineups) {
        console.log('   ✅ LINEUPS: Found');
        
        // Check structure
        const lineups = apiData.lineups;
        console.log('   📋 Lineup structure:');
        console.log('      Teams with lineups:', Object.keys(lineups));
        
        // Sample first team's lineup
        const firstTeamId = Object.keys(lineups)[0];
        if (firstTeamId && lineups[firstTeamId]) {
          const teamLineup = lineups[firstTeamId];
          console.log(`      Team ${firstTeamId} lineup properties:`, Object.keys(teamLineup));
          
          if (teamLineup.starting11) {
            console.log(`      Starting XI: ${teamLineup.starting11.length} players`);
          }
          if (teamLineup.substitutes) {
            console.log(`      Substitutes: ${teamLineup.substitutes.length} players`);
          }
          if (teamLineup.formation) {
            console.log(`      Formation: ${teamLineup.formation}`);
          }
        }
        
      } else if (apiData.homeTeam && apiData.awayTeam) {
        console.log('   🔍 Checking homeTeam/awayTeam for lineup data...');
        
        // Check if lineup data is in homeTeam/awayTeam objects
        const homeTeam = apiData.homeTeam || {};
        const awayTeam = apiData.awayTeam || {};
        
        console.log('   📋 Home team properties:', Object.keys(homeTeam));
        console.log('   📋 Away team properties:', Object.keys(awayTeam));
        
        if (homeTeam.formation && homeTeam.initialLineup) {
          console.log('   ✅ LINEUPS: Found in homeTeam/awayTeam structure');
          console.log(`      Home formation: ${homeTeam.formation}`);
          console.log(`      Home starting XI: ${homeTeam.initialLineup?.flat().length || 0} players`);
          console.log(`      Home substitutes: ${homeTeam.substitutes?.length || 0} players`);
          
          if (awayTeam.formation && awayTeam.initialLineup) {
            console.log(`      Away formation: ${awayTeam.formation}`);
            console.log(`      Away starting XI: ${awayTeam.initialLineup?.flat().length || 0} players`);
            console.log(`      Away substitutes: ${awayTeam.substitutes?.length || 0} players`);
          }
        } else {
          console.log('   ❌ No lineup data in homeTeam/awayTeam');
        }
        
      } else {
        console.log('   ❌ LINEUPS: Not found');
      }
      
      // Check for events
      if (apiData.events) {
        console.log(`   ✅ EVENTS: ${apiData.events.length} events`);
      } else {
        console.log('   ❌ EVENTS: Not found');
      }
      
      // Check for statistics
      if (apiData.statistics) {
        console.log(`   ✅ STATISTICS: ${apiData.statistics.length} teams`);
      } else {
        console.log('   ❌ STATISTICS: Not found');
      }
      
      console.log('   ' + '-'.repeat(40));
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('='.repeat(30));
    console.log('✅ Checked synced match data for lineup information');
    console.log('📋 If lineups are missing, we need to update sync script');
    
  } catch (error) {
    console.log('❌ Error checking lineup data:', error.message);
  }
}

checkLineupData(); 