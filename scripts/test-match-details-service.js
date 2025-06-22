import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://septerrkdnojsmtmmska.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testMatchDetailsService() {
  console.log('🧪 Testing Match Details Service...\n');
  
  try {
    // Get a match that has lineups and events
    const { data: matchWithData } = await supabase
      .from('matches')
      .select(`
        id,
        home_team:teams!matches_home_team_id_fkey(name),
        away_team:teams!matches_away_team_id_fkey(name),
        match_lineups(count),
        match_events(count)
      `)
      .gt('match_lineups.count', 0)
      .gt('match_events.count', 0)
      .limit(1)
      .single();

    if (!matchWithData) {
      console.log('❌ No matches found with both lineups and events');
      return;
    }

    console.log(`📋 Testing with match: ${matchWithData.home_team.name} vs ${matchWithData.away_team.name}`);
    console.log(`   Match ID: ${matchWithData.id}\n`);

    // Simulate the getMatchById function logic
    const { data: match, error } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(id, name, logo),
        away_team:teams!matches_away_team_id_fkey(id, name, logo),
        league:leagues!matches_league_id_fkey(id, name, logo, country_name)
      `)
      .eq('id', matchWithData.id)
      .single();

    if (error || !match) {
      console.error('❌ Error fetching match:', error);
      return;
    }

    // Fetch lineups
    const { data: lineups, error: lineupsError } = await supabase
      .from('match_lineups')
      .select('*')
      .eq('match_id', matchWithData.id);

    console.log(`📋 LINEUPS TEST:`);
    if (lineupsError) {
      console.error('❌ Lineups error:', lineupsError);
    } else {
      console.log(`   Found ${lineups?.length || 0} lineup records`);
      lineups?.forEach(lineup => {
        const teamName = lineup.team_id === match.home_team_id ? 'Home' : 'Away';
        console.log(`   ${teamName}: ${lineup.formation}, ${lineup.players?.length || 0} players, ${lineup.substitutes?.length || 0} subs`);
      });
    }

    // Fetch events
    const { data: events, error: eventsError } = await supabase
      .from('match_events')
      .select('*')
      .eq('match_id', matchWithData.id)
      .order('minute', { ascending: true });

    console.log(`\n🎬 EVENTS TEST:`);
    if (eventsError) {
      console.error('❌ Events error:', eventsError);
    } else {
      console.log(`   Found ${events?.length || 0} event records`);
      events?.slice(0, 3).forEach(event => {
        console.log(`   ${event.minute}': ${event.event_type} - ${event.player_name}`);
      });
      if (events && events.length > 3) {
        console.log(`   ... and ${events.length - 3} more events`);
      }
    }

    // Test the formation organization
    if (lineups && lineups.length > 0) {
      const testLineup = lineups[0];
      console.log(`\n🔧 FORMATION TEST:`);
      console.log(`   Formation: ${testLineup.formation}`);
      console.log(`   Players data:`, testLineup.players?.slice(0, 2));
      
      // Test formation parsing
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

      const organized = organizeLineupByFormation(testLineup.players, testLineup.formation);
      console.log(`   Organized formation:`, organized.map(line => line.length));
    }

    console.log('\n✅ Match Details Service Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testMatchDetailsService(); 