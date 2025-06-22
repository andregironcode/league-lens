import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://septerrkdnojsmtmmska.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(supabaseUrl, supabaseKey);

// Simulate the updated getMatchById function
async function testUpdatedService() {
  console.log('🧪 Testing Updated Service Logic...\n');
  
  try {
    const matchId = '1028225789'; // Brentford vs Tottenham
    
    // Fetch match data
    const { data: match, error } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(id, name, logo),
        away_team:teams!matches_away_team_id_fkey(id, name, logo),
        league:leagues!matches_league_id_fkey(id, name, logo, country_name)
      `)
      .eq('id', matchId)
      .single();

    if (error || !match) {
      console.error('❌ Error fetching match:', error);
      return;
    }

    console.log(`📋 Match: ${match.home_team.name} vs ${match.away_team.name}`);

    // Fetch lineups
    const { data: lineups, error: lineupsError } = await supabase
      .from('match_lineups')
      .select('*')
      .eq('match_id', matchId);

    if (lineupsError) {
      console.error('❌ Lineups error:', lineupsError);
      return;
    }

    console.log(`\n📊 TESTING LINEUP PROCESSING:`);
    console.log(`   Found ${lineups?.length || 0} lineup records`);

    if (lineups && lineups.length > 0) {
      const homeLineup = lineups.find(l => l.team_id === match.home_team_id);
      const awayLineup = lineups.find(l => l.team_id === match.away_team_id);

      // Test the updated processing logic
      const processLineupData = (lineupData) => {
        if (!lineupData || !lineupData.players) return [];
        
        // Check if players is already organized (nested arrays) or flat
        if (Array.isArray(lineupData.players) && lineupData.players.length > 0) {
          // If first element is an array, it's already organized by position
          if (Array.isArray(lineupData.players[0])) {
            console.log('   ✅ Lineup already organized by formation');
            return lineupData.players;
          } else {
            console.log('   🔄 Organizing flat lineup by formation');
            // Flat array organization logic would go here
            return [];
          }
        }
        
        return [];
      };

      if (homeLineup) {
        console.log(`\n🏠 HOME TEAM (${match.home_team.name}):`);
        console.log(`   Formation: ${homeLineup.formation}`);
        console.log(`   Raw players data type: ${Array.isArray(homeLineup.players) ? 'Array' : typeof homeLineup.players}`);
        console.log(`   Raw players length: ${homeLineup.players?.length || 0}`);
        console.log(`   First element is array: ${Array.isArray(homeLineup.players?.[0])}`);
        
        const processed = processLineupData(homeLineup);
        console.log(`   Processed formation lines: ${processed.length}`);
        
        if (processed.length > 0) {
          console.log(`   Formation structure: ${processed.map(line => line.length)} (total: ${processed.flat().length} players)`);
          
          // Show sample players
          const allPlayers = processed.flat();
          console.log(`   Sample players:`);
          allPlayers.slice(0, 3).forEach((player, i) => {
            console.log(`     ${i + 1}. ${player.name} (#${player.number}) - ${player.position}`);
          });
        }
      }

      if (awayLineup) {
        console.log(`\n✈️  AWAY TEAM (${match.away_team.name}):`);
        console.log(`   Formation: ${awayLineup.formation}`);
        const processed = processLineupData(awayLineup);
        console.log(`   Processed formation lines: ${processed.length}`);
        
        if (processed.length > 0) {
          const allPlayers = processed.flat();
          console.log(`   Formation structure: ${processed.map(line => line.length)} (total: ${allPlayers.length} players)`);
        }
      }

      // Test the full transformation
      console.log(`\n🔧 TESTING FULL TRANSFORMATION:`);
      let processedLineups = null;
      
      if (homeLineup || awayLineup) {
        processedLineups = {
          homeTeam: homeLineup ? {
            id: match.home_team.id,
            name: match.home_team.name,
            logo: match.home_team.logo,
            formation: homeLineup.formation,
            initialLineup: processLineupData(homeLineup),
            substitutes: homeLineup.substitutes || []
          } : null,
          awayTeam: awayLineup ? {
            id: match.away_team.id,
            name: match.away_team.name,
            logo: match.away_team.logo,
            formation: awayLineup.formation,
            initialLineup: processLineupData(awayLineup),
            substitutes: awayLineup.substitutes || []
          } : null
        };
      }

      if (processedLineups) {
        console.log(`   ✅ Processed lineups structure created`);
        console.log(`   Home team lineup: ${processedLineups.homeTeam ? 'Available' : 'Missing'}`);
        console.log(`   Away team lineup: ${processedLineups.awayTeam ? 'Available' : 'Missing'}`);
        
        if (processedLineups.homeTeam) {
          console.log(`   Home formation: ${processedLineups.homeTeam.formation}`);
          console.log(`   Home initialLineup: ${processedLineups.homeTeam.initialLineup.length} lines`);
          console.log(`   Home substitutes: ${processedLineups.homeTeam.substitutes.length} players`);
        }
      }
    }

    console.log('\n✅ Service test complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testUpdatedService(); 