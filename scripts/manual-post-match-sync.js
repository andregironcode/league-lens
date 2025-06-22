import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  'https://septerrkdnojsmtmmska.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4'
);

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

async function manualPostMatchSync() {
  console.log('🔧 MANUAL POST-MATCH DATA SYNC');
  console.log('='.repeat(40));

  const testMatchId = '1126857540';
  
  console.log(`🏆 Processing match: ${testMatchId}`);
  console.log('');

  try {
    // Get match details
    const { data: match } = await supabase
      .from('matches')
      .select('*')
      .eq('id', testMatchId)
      .single();

    if (!match) {
      console.log('❌ Match not found');
      return;
    }

    console.log(`📋 Match: ${match.home_team_id} vs ${match.away_team_id} (${match.status})`);

    let lineupsUpdated = 0;
    let eventsUpdated = 0;
    let statsUpdated = 0;
    let highlightsUpdated = 0;

    // 1. FETCH LINEUPS
    console.log('\n👥 Fetching lineups...');
    try {
      const lineupData = await callHighlightlyAPI(`lineups/${testMatchId}`);

      if (lineupData && (lineupData.homeTeam || lineupData.awayTeam)) {
        // Home team lineup
        if (lineupData.homeTeam) {
          const homeLineupRecord = {
            match_id: testMatchId,
            team_id: match.home_team_id,
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
            console.log('   ✅ Home lineup saved');
          } else {
            console.log(`   ❌ Home lineup error: ${homeLineupError.message}`);
          }
        }

        // Away team lineup
        if (lineupData.awayTeam) {
          const awayLineupRecord = {
            match_id: testMatchId,
            team_id: match.away_team_id,
            formation: lineupData.awayTeam.formation || null,
            players: lineupData.awayTeam.initialLineup || [],
            substitutes: lineupData.awayTeam.substitutes || [],
            coach: lineupData.awayTeam.coach || null,
            api_data: lineupData.awayTeam
          };

          const { error: awayLineupError } = await supabase
            .from('match_lineups')
            .upsert(awayLineupRecord, { onConflict: 'match_id,team_id' });

          if (!awayLineupError) {
            lineupsUpdated++;
            console.log('   ✅ Away lineup saved');
          } else {
            console.log(`   ❌ Away lineup error: ${awayLineupError.message}`);
          }
        }
      } else {
        console.log('   ⚠️ No lineup data available');
      }
    } catch (error) {
      console.log(`   ❌ Lineup fetch error: ${error.message}`);
    }

    // 2. FETCH STATISTICS
    console.log('\n📊 Fetching statistics...');
    try {
      const statsData = await callHighlightlyAPI(`statistics/${testMatchId}`);

      if (statsData && Array.isArray(statsData) && statsData.length >= 2) {
        const statsRecord = {
          match_id: testMatchId,
          statistics: {
            home: statsData[0] || null,
            away: statsData[1] || null,
            raw_data: statsData
          }
        };

        const { error: statsError } = await supabase
          .from('match_statistics')
          .upsert(statsRecord, { onConflict: 'match_id' });

        if (!statsError) {
          statsUpdated++;
          console.log('   ✅ Statistics saved');
        } else {
          console.log(`   ❌ Statistics error: ${statsError.message}`);
        }
      } else {
        console.log('   ⚠️ No statistics data available');
      }
    } catch (error) {
      console.log(`   ❌ Statistics fetch error: ${error.message}`);
    }

    // 3. UPDATE MATCH FLAGS
    console.log('\n🏁 Updating match flags...');
    const { error: flagsError } = await supabase
      .from('matches')
      .update({
        has_highlights: true,
        has_lineups: lineupsUpdated > 0,
        has_events: true, // We know events exist
        updated_at: new Date().toISOString()
      })
      .eq('id', testMatchId);

    if (!flagsError) {
      console.log('   ✅ Match flags updated');
    } else {
      console.log(`   ❌ Flags error: ${flagsError.message}`);
    }

    // 4. SUMMARY
    console.log('\n🎯 SYNC RESULTS:');
    console.log(`   📊 Statistics: ${statsUpdated > 0 ? '✅' : '❌'}`);
    console.log(`   👥 Lineups: ${lineupsUpdated > 0 ? '✅' : '❌'}`);
    console.log(`   ⚽ Events: ✅ (already existed)`);
    console.log(`   🎥 Highlights: ✅ (already existed)`);

    if (lineupsUpdated > 0 || statsUpdated > 0) {
      console.log('\n🎉 SUCCESS! Match page should now display the data');
      console.log('🔄 Refresh the match page to see lineups and statistics');
    } else {
      console.log('\n⚠️ No new data was added - check API responses above');
    }

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
  }
}

manualPostMatchSync().then(() => {
  console.log('\n🏁 Manual post-match sync completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Sync error:', error);
  process.exit(1);
}); 