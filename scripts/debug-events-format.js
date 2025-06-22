import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://septerrkdnojsmtmmska.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugEventsFormat() {
  console.log('🔍 DEBUGGING EVENTS FORMAT AND TEAM MATCHING...\n');
  
  try {
    // Get a match with events
    const { data: match } = await supabase
      .from('matches')
      .select(`
        id,
        home_team_id,
        away_team_id,
        home_team:teams!matches_home_team_id_fkey(id, name),
        away_team:teams!matches_away_team_id_fkey(id, name)
      `)
      .limit(1)
      .single();

    if (!match) {
      console.log('❌ No match found');
      return;
    }

    console.log('📋 MATCH INFO:');
    console.log(`   Match ID: ${match.id}`);
    console.log(`   Home: ${match.home_team.name} (ID: ${match.home_team_id})`);
    console.log(`   Away: ${match.away_team.name} (ID: ${match.away_team_id})`);

    // Get events for this match
    const { data: events } = await supabase
      .from('match_events')
      .select('*')
      .eq('match_id', match.id)
      .limit(10);

    console.log(`\n🎬 EVENTS DATA (${events?.length || 0} events):`);
    
    if (events && events.length > 0) {
      events.forEach((event, i) => {
        console.log(`\n   Event ${i + 1}:`);
        console.log(`     ID: ${event.id}`);
        console.log(`     Type: ${event.event_type}`);
        console.log(`     Player: ${event.player_name}`);
        console.log(`     Team ID: ${event.team_id}`);
        console.log(`     Minute: ${event.minute}`);
        console.log(`     Added Time: ${event.added_time}`);
        console.log(`     Description: ${event.description}`);
        
        // Check team matching
        const isHome = event.team_id === match.home_team_id;
        const isAway = event.team_id === match.away_team_id;
        console.log(`     Team Match: ${isHome ? 'HOME' : isAway ? 'AWAY' : 'UNKNOWN'}`);
      });

      // Test the service transformation
      console.log(`\n🔧 TESTING SERVICE TRANSFORMATION:`);
      
      const processedEvents = events.map(event => ({
        id: event.id,
        minute: event.minute,
        addedTime: event.added_time,
        type: event.event_type,
        player: event.player_name,
        team: event.team_id === match.home_team_id ? match.home_team.name : match.away_team.name,
        team_id: event.team_id,
        description: event.description
      }));

      console.log(`   Processed ${processedEvents.length} events:`);
      processedEvents.slice(0, 3).forEach((event, i) => {
        console.log(`     ${i + 1}. ${event.minute}' - ${event.type} - ${event.player} (${event.team})`);
      });

      // Test team separation logic
      console.log(`\n🏠 HOME TEAM EVENTS:`);
      const homeEvents = processedEvents.filter(event => 
        event.team === match.home_team.name || event.team_id === match.home_team_id
      );
      console.log(`   Found ${homeEvents.length} home events`);
      homeEvents.slice(0, 2).forEach(event => {
        console.log(`     ${event.minute}' - ${event.type} - ${event.player}`);
      });

      console.log(`\n✈️  AWAY TEAM EVENTS:`);
      const awayEvents = processedEvents.filter(event => 
        event.team === match.away_team.name || event.team_id === match.away_team_id
      );
      console.log(`   Found ${awayEvents.length} away events`);
      awayEvents.slice(0, 2).forEach(event => {
        console.log(`     ${event.minute}' - ${event.type} - ${event.player}`);
      });

    } else {
      console.log('   No events found for this match');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugEventsFormat(); 