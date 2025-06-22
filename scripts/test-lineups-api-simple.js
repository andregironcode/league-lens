import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://septerrkdnojsmtmmska.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(supabaseUrl, supabaseKey);

const PROXY_BASE_URL = 'http://localhost:3001/api/highlightly';



async function testLineupParsing() {
  console.log('🧪 Testing Lineup Parsing with Correct Format...');
  
  try {
    // Get a test match
    const { data: matches } = await supabase
      .from('matches')
      .select('id, home_team_id, away_team_id')
      .limit(3);
    
    for (const match of matches) {
      console.log(`\n🎯 Testing match ${match.id}:`);
      
      // Fetch lineup data
      const response = await fetch(`${PROXY_BASE_URL}/lineups/${match.id}`);
      
      if (response.ok) {
        const lineupData = await response.json();
        console.log(`✅ API Response Structure:`);
        console.log(`   - Keys: ${Object.keys(lineupData).join(', ')}`);
        
        if (lineupData.homeTeam && lineupData.awayTeam) {
          console.log(`✅ CORRECT FORMAT: homeTeam/awayTeam`);
          console.log(`   - Home formation: ${lineupData.homeTeam.formation || 'N/A'}`);
          console.log(`   - Away formation: ${lineupData.awayTeam.formation || 'N/A'}`);
          console.log(`   - Home players: ${lineupData.homeTeam.initialLineup?.length || 0}`);
          console.log(`   - Away players: ${lineupData.awayTeam.initialLineup?.length || 0}`);
          
          // Test database insertion
          const lineupsToInsert = [
            {
              match_id: match.id,
              team_id: match.home_team_id,
              formation: lineupData.homeTeam.formation || 'Unknown',
              players: lineupData.homeTeam.initialLineup || [],
              substitutes: lineupData.homeTeam.substitutes || [],
              coach: lineupData.homeTeam.coach?.name || null,
              api_data: lineupData.homeTeam
            },
            {
              match_id: match.id,
              team_id: match.away_team_id,
              formation: lineupData.awayTeam.formation || 'Unknown',
              players: lineupData.awayTeam.initialLineup || [],
              substitutes: lineupData.awayTeam.substitutes || [],
              coach: lineupData.awayTeam.coach?.name || null,
              api_data: lineupData.awayTeam
            }
          ];
          
          console.log(`📝 Testing database insertion...`);
          const { error } = await supabase
            .from('match_lineups')
            .insert(lineupsToInsert);
          
          if (error) {
            console.log(`❌ Database error: ${error.message}`);
          } else {
            console.log(`✅ Successfully inserted ${lineupsToInsert.length} lineups!`);
            
            // Clean up test data
            await supabase
              .from('match_lineups')
              .delete()
              .eq('match_id', match.id);
            console.log(`🧹 Cleaned up test data`);
          }
          
        } else {
          console.log(`❌ Unexpected format - missing homeTeam/awayTeam`);
        }
        
      } else {
        console.log(`❌ API failed: ${response.status}`);
      }
    }
    
    console.log('\n🎉 Lineup parsing test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testLineupParsing(); 