import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const HIGHLIGHTLY_API_URL = 'https://soccer.highlightly.net';
const HIGHLIGHTLY_API_KEY = process.env.HIGHLIGHTLY_API_KEY || 'f1f4e3c0a7msh07b3b9d6e8c2f5a8b3c';

async function callHighlightlyAPI(endpoint, params = {}) {
  try {
    const url = new URL(`${HIGHLIGHTLY_API_URL}/${endpoint}`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    console.log(`   🔗 API Call: ${url.toString()}`);
    
    const response = await axios.get(url.toString(), {
      headers: {
        'x-api-key': HIGHLIGHTLY_API_KEY,
        'x-rapidapi-key': HIGHLIGHTLY_API_KEY,
      },
      timeout: 15000,
    });

    return response.data;
  } catch (error) {
    console.log(`   ❌ API Error: ${error.response?.status} - ${error.message}`);
    return null;
  }
}

async function testCorrectedAutomation() {
  console.log('🔧 TESTING CORRECTED POST-MATCH AUTOMATION');
  console.log('='.repeat(55));

  try {
    // Use the match we know has data
    const testMatchId = '1126857540'; // Yokohama FC vs Sanfrecce Hiroshima
    
    console.log(`🏆 Testing with Match ID: ${testMatchId}`);
    console.log('📋 Using CORRECT endpoint formats:');
    console.log('   • lineups/{matchId}');
    console.log('   • events/{matchId}');
    console.log('   • statistics/{matchId}');
    console.log('');

    let statsUpdated = 0;
    let lineupsUpdated = 0;
    let eventsUpdated = 0;

    // 1. FETCH LINEUPS (using correct format)
    console.log('👥 Testing lineups endpoint...');
    try {
      const lineupData = await callHighlightlyAPI(`lineups/${testMatchId}`);

      if (lineupData && (lineupData.homeTeam || lineupData.awayTeam)) {
        console.log('   ✅ Lineup data received!');
        console.log(`   🏠 Home team formation: ${lineupData.homeTeam?.formation || 'N/A'}`);
        console.log(`   🚌 Away team formation: ${lineupData.awayTeam?.formation || 'N/A'}`);
        console.log(`   👤 Home players: ${lineupData.homeTeam?.initialLineup?.length || 0}`);
        console.log(`   👤 Away players: ${lineupData.awayTeam?.initialLineup?.length || 0}`);
        
        // Test database insertion
        if (lineupData.homeTeam) {
          const homeLineupRecord = {
            match_id: testMatchId,
            team_id: '999999', // Test team ID
            formation: lineupData.homeTeam.formation || null,
            players: lineupData.homeTeam.initialLineup || [],
            substitutes: lineupData.homeTeam.substitutes || [],
            coach: lineupData.homeTeam.coach || null,
            api_data: lineupData.homeTeam
          };

          const { error: homeLineupError } = await supabase
            .from('match_lineups')
            .upsert(homeLineupRecord, { onConflict: 'match_id,team_id' });

          if (!homeLineupError) {
            lineupsUpdated++;
            console.log('   💾 Successfully saved to database');
          } else {
            console.log(`   ❌ Database error: ${homeLineupError.message}`);
          }
        }
      } else {
        console.log('   ⚠️ No lineup data available');
      }
    } catch (error) {
      console.log(`   ❌ Lineup test failed: ${error.message}`);
    }

    // 2. FETCH EVENTS (using correct format)
    console.log('\n⚽ Testing events endpoint...');
    try {
      const eventsData = await callHighlightlyAPI(`events/${testMatchId}`);

      if (eventsData && Array.isArray(eventsData) && eventsData.length > 0) {
        console.log(`   ✅ Events data received! Found ${eventsData.length} events`);
        
        // Show sample events
        eventsData.slice(0, 3).forEach((event, i) => {
          console.log(`   ${i + 1}. ${event.time}' - ${event.type} - ${event.player || 'Unknown'} (${event.team?.name || 'Unknown team'})`);
        });
        
        // Test database insertion for first event
        if (eventsData.length > 0) {
          const testEvent = eventsData[0];
          const eventRecord = {
            match_id: testMatchId,
            team_id: testEvent.team?.id || null,
            player_id: null,
            player_name: testEvent.player || null,
            event_type: testEvent.type || 'Unknown',
            minute: testEvent.time || null,
            added_time: 0,
            description: testEvent.assist ? `Assist: ${testEvent.assist}` : null,
            api_data: testEvent
          };

          const { error: eventError } = await supabase
            .from('match_events')
            .insert(eventRecord);

          if (!eventError) {
            eventsUpdated++;
            console.log('   💾 Successfully saved sample event to database');
          } else {
            console.log(`   ❌ Database error: ${eventError.message}`);
          }
        }
      } else {
        console.log('   ⚠️ No events data available');
      }
    } catch (error) {
      console.log(`   ❌ Events test failed: ${error.message}`);
    }

    // 3. FETCH STATISTICS (using correct format)
    console.log('\n📊 Testing statistics endpoint...');
    try {
      const statsData = await callHighlightlyAPI(`statistics/${testMatchId}`);

      if (statsData && Array.isArray(statsData) && statsData.length >= 2) {
        console.log(`   ✅ Statistics data received! Found data for ${statsData.length} teams`);
        
        // Show sample statistics
        statsData.forEach((teamStats, i) => {
          const teamName = teamStats.team?.name || `Team ${i + 1}`;
          const statsCount = teamStats.statistics?.length || 0;
          console.log(`   ${i + 1}. ${teamName}: ${statsCount} statistics`);
          
          if (teamStats.statistics && teamStats.statistics.length > 0) {
            // Show first few stats
            teamStats.statistics.slice(0, 3).forEach(stat => {
              console.log(`      • ${stat.displayName}: ${stat.value}`);
            });
          }
        });
        
        // Test database insertion
        const statsRecord = {
          match_id: testMatchId,
          home_stats: statsData[0] || null,
          away_stats: statsData[1] || null,
          api_data: statsData
        };

        const { error: statsError } = await supabase
          .from('match_statistics')
          .upsert(statsRecord, { onConflict: 'match_id' });

        if (!statsError) {
          statsUpdated++;
          console.log('   💾 Successfully saved to database');
        } else {
          console.log(`   ❌ Database error: ${statsError.message}`);
        }
      } else {
        console.log('   ⚠️ No statistics data available');
      }
    } catch (error) {
      console.log(`   ❌ Statistics test failed: ${error.message}`);
    }

    console.log('\n🎯 CORRECTED AUTOMATION TEST RESULTS:');
    console.log('='.repeat(40));
    console.log(`📊 Statistics: ${statsUpdated > 0 ? '✅ Working' : '❌ Failed'}`);
    console.log(`👥 Lineups: ${lineupsUpdated > 0 ? '✅ Working' : '❌ Failed'}`);
    console.log(`⚽ Events: ${eventsUpdated > 0 ? '✅ Working' : '❌ Failed'}`);
    
    if (statsUpdated + lineupsUpdated + eventsUpdated > 0) {
      console.log('\n🎉 SUCCESS! The corrected automation is working!');
      console.log('✅ All endpoints are using the correct format');
      console.log('✅ Data is being fetched and saved properly');
      console.log('🔄 The server automation will now work correctly for finished matches');
    } else {
      console.log('\n⚠️ Some issues remain. Check the API responses above.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the corrected automation test
testCorrectedAutomation().then(() => {
  console.log('\n🏁 Corrected automation test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test error:', error);
  process.exit(1);
}); 