import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://septerrkdnojsmtmmska.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugLineups() {
  console.log('🔧 DEBUGGING LINEUPS ISSUE...\n');
  
  try {
    // Get a match with lineups
    const { data: matches } = await supabase
      .from('matches')
      .select(`
        id,
        home_team:teams!matches_home_team_id_fkey(id, name),
        away_team:teams!matches_away_team_id_fkey(id, name)
      `)
      .limit(5);

    console.log('📋 Sample matches:');
    matches?.forEach(m => console.log(`   ${m.id}: ${m.home_team.name} vs ${m.away_team.name}`));

    // Get lineups for first match
    const testMatchId = matches?.[0]?.id;
    if (!testMatchId) {
      console.log('❌ No matches found');
      return;
    }

    console.log(`\n🧪 Testing lineups for match: ${testMatchId}`);

    const { data: lineups } = await supabase
      .from('match_lineups')
      .select('*')
      .eq('match_id', testMatchId);

    console.log(`\n📊 LINEUP DATA:`);
    console.log(`   Found ${lineups?.length || 0} lineup records`);
    
    if (lineups && lineups.length > 0) {
      lineups.forEach((lineup, index) => {
        console.log(`\n   Lineup ${index + 1}:`);
        console.log(`     Team ID: ${lineup.team_id}`);
        console.log(`     Formation: ${lineup.formation}`);
        console.log(`     Players: ${Array.isArray(lineup.players) ? lineup.players.length : 'Not array'}`);
        console.log(`     Substitutes: ${Array.isArray(lineup.substitutes) ? lineup.substitutes.length : 'Not array'}`);
        
        // Show first few players
        if (Array.isArray(lineup.players) && lineup.players.length > 0) {
          console.log(`     Sample players:`);
          lineup.players.slice(0, 3).forEach((player, i) => {
            console.log(`       ${i + 1}. ${JSON.stringify(player)}`);
          });
        }
        
        // Test formation organization
        if (lineup.formation && Array.isArray(lineup.players)) {
          console.log(`\n     🔧 Testing formation organization:`);
          const organizeLineupByFormation = (players, formation) => {
            if (!players || players.length === 0) return [];
            
            const formationParts = formation.split('-').map(n => parseInt(n, 10));
            const result = [];
            let playerIndex = 0;
            
            // Goalkeeper
            if (players.length > 0) {
              result.push([players[0]]);
              playerIndex = 1;
            }
            
            // Field players
            for (const lineSize of formationParts) {
              const line = [];
              for (let i = 0; i < lineSize && playerIndex < players.length; i++) {
                line.push(players[playerIndex]);
                playerIndex++;
              }
              if (line.length > 0) {
                result.push(line);
              }
            }
            
            return result;
          };

          const organized = organizeLineupByFormation(lineup.players, lineup.formation);
          console.log(`       Formation parts: ${lineup.formation} -> ${lineup.formation.split('-')}`);
          console.log(`       Organized structure: ${organized.map(line => line.length)} (${organized.length} lines)`);
          console.log(`       Total players in formation: ${organized.flat().length}`);
          
          // Check if players have required fields
          const flatPlayers = organized.flat();
          console.log(`       Players with names: ${flatPlayers.filter(p => p && p.name).length}`);
          console.log(`       Players with numbers: ${flatPlayers.filter(p => p && p.number).length}`);
        }
      });
    } else {
      console.log('   No lineups found for this match');
    }

    // Test events too
    const { data: events } = await supabase
      .from('match_events')
      .select('*')
      .eq('match_id', testMatchId)
      .limit(5);

    console.log(`\n🎬 EVENTS DATA:`);
    console.log(`   Found ${events?.length || 0} event records`);
    
    if (events && events.length > 0) {
      events.forEach((event, index) => {
        console.log(`\n   Event ${index + 1}:`);
        console.log(`     Type: ${event.event_type}`);
        console.log(`     Player: ${event.player_name}`);
        console.log(`     Team ID: ${event.team_id}`);
        console.log(`     Minute: ${event.minute}`);
        console.log(`     Description: ${event.description}`);
      });
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugLineups(); 