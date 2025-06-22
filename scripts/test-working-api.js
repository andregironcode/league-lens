import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://septerrkdnojsmtmmska.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(supabaseUrl, supabaseKey);

const PROXY_BASE_URL = 'http://localhost:3001/api/highlightly';

async function testAPI() {
  console.log('🧪 Testing API and Database Schema...');
  
  try {
    // 1. Test database connection
    console.log('\n1️⃣ Testing database connection...');
    const { data: matches } = await supabase
      .from('matches')
      .select('id, home_team_id, away_team_id')
      .limit(5);
    
    console.log(`✅ Database connection OK - found ${matches.length} matches`);
    
    if (matches.length === 0) {
      console.log('❌ No matches in database');
      return;
    }
    
    const testMatchId = matches[0].id;
    console.log(`🎯 Using match ID ${testMatchId} for testing`);
    
    // 2. Test lineups API
    console.log('\n2️⃣ Testing lineups API...');
    const lineupResponse = await fetch(`${PROXY_BASE_URL}/lineups/${testMatchId}`);
    console.log(`📞 Lineups API Status: ${lineupResponse.status}`);
    
    if (lineupResponse.ok) {
      const lineupData = await lineupResponse.json();
      console.log('✅ Lineups API Response Structure:');
      console.log(`   - Type: ${Array.isArray(lineupData) ? 'Array' : 'Object'}`);
      console.log(`   - Keys: ${Object.keys(lineupData).join(', ')}`);
      
      if (lineupData.home) {
        console.log(`   - Home formation: ${lineupData.home.formation}`);
        console.log(`   - Home players: ${lineupData.home.initialLineup?.length || 0}`);
      }
      if (lineupData.away) {
        console.log(`   - Away formation: ${lineupData.away.formation}`);
        console.log(`   - Away players: ${lineupData.away.initialLineup?.length || 0}`);
      }
    } else {
      console.log('❌ Lineups API failed');
    }
    
    // 3. Test events API
    console.log('\n3️⃣ Testing events API...');
    const eventsResponse = await fetch(`${PROXY_BASE_URL}/events/${testMatchId}`);
    console.log(`📞 Events API Status: ${eventsResponse.status}`);
    
    if (eventsResponse.ok) {
      const eventsData = await eventsResponse.json();
      console.log('✅ Events API Response Structure:');
      console.log(`   - Type: ${Array.isArray(eventsData) ? 'Array' : 'Object'}`);
      console.log(`   - Length: ${Array.isArray(eventsData) ? eventsData.length : 'N/A'}`);
      
      if (Array.isArray(eventsData) && eventsData.length > 0) {
        const firstEvent = eventsData[0];
        console.log(`   - Sample event keys: ${Object.keys(firstEvent).join(', ')}`);
        console.log(`   - Sample event type: ${firstEvent.type}`);
        console.log(`   - Sample event player: ${firstEvent.player?.name || firstEvent.player}`);
      }
    } else {
      console.log('❌ Events API failed');
    }
    
    // 4. Test database schema
    console.log('\n4️⃣ Testing database schema...');
    
    // Test inserting a sample lineup
    const { error: lineupError } = await supabase
      .from('match_lineups')
      .insert({
        match_id: testMatchId,
        team_id: matches[0].home_team_id,
        formation: 'TEST-4-4-2',
        players: [{'name': 'Test Player', 'position': 'GK'}],
        substitutes: [],
        coach: 'Test Coach'
      });
    
    if (lineupError) {
      console.log('❌ Lineup schema error:', lineupError.message);
    } else {
      console.log('✅ Lineup schema OK');
      // Clean up test data
      await supabase.from('match_lineups').delete().eq('formation', 'TEST-4-4-2');
    }
    
    // Test inserting a sample event
    const { error: eventError } = await supabase
      .from('match_events')
      .insert({
        match_id: testMatchId,
        team_id: matches[0].home_team_id,
        player_name: 'Test Player',
        event_type: 'Test Goal',
        minute: 45,
        description: 'Test event'
      });
    
    if (eventError) {
      console.log('❌ Event schema error:', eventError.message);
    } else {
      console.log('✅ Event schema OK');
      // Clean up test data
      await supabase.from('match_events').delete().eq('event_type', 'Test Goal');
    }
    
    console.log('\n🎉 API and schema tests complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAPI(); 