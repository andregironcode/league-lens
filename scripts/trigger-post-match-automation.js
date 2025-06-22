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
    console.log(`   ❌ API Error: ${error.message}`);
    return null;
  }
}

async function triggerPostMatchAutomation() {
  console.log('🚀 MANUALLY TRIGGERING POST-MATCH AUTOMATION');
  console.log('='.repeat(55));

  try {
    // Get finished matches that need processing
    const { data: finishedMatches, error } = await supabase
      .from('matches')
      .select(`
        id,
        match_date,
        home_team_id,
        away_team_id,
        status,
        has_highlights,
        has_lineups,
        has_events,
        home_team:teams!matches_home_team_id_fkey(name),
        away_team:teams!matches_away_team_id_fkey(name)
      `)
      .eq('status', 'Finished')
      .gte('match_date', '2025-06-21')
      .order('match_date', { ascending: false })
      .limit(3); // Test with first 3 matches

    if (error) {
      throw new Error(`Failed to fetch finished matches: ${error.message}`);
    }

    console.log(`📊 Processing ${finishedMatches.length} finished matches...`);

    let statsUpdated = 0;
    let highlightsUpdated = 0;
    let lineupsUpdated = 0;
    let eventsUpdated = 0;

    for (const match of finishedMatches) {
      console.log(`\n🏆 Processing: ${match.home_team?.name || 'Home'} vs ${match.away_team?.name || 'Away'}`);
      console.log(`   📅 Date: ${match.match_date}`);
      console.log(`   🆔 Match ID: ${match.id}`);

      try {
        // 1. FETCH HIGHLIGHTS
        console.log('   🎥 Checking highlights...');
        const { data: existingHighlights } = await supabase
          .from('highlights')
          .select('id')
          .eq('match_id', match.id)
          .limit(1);

        if (!existingHighlights || existingHighlights.length === 0) {
          console.log('   📡 Fetching highlights from API...');
          const highlightsData = await callHighlightlyAPI('highlights', {
            matchId: match.id
          });

          if (highlightsData?.data && Array.isArray(highlightsData.data) && highlightsData.data.length > 0) {
            for (const highlight of highlightsData.data) {
              const highlightRecord = {
                id: highlight.id || `${match.id}_${Date.now()}`,
                match_id: match.id,
                title: highlight.title || `${match.home_team?.name || 'Home'} vs ${match.away_team?.name || 'Away'} - Highlights`,
                url: highlight.url || highlight.videoUrl || '',
                thumbnail: highlight.thumbnail || highlight.thumbnailUrl || '',
                duration: highlight.duration || null,
                embed_url: highlight.embedUrl || highlight.embed_url || '',
                views: highlight.views || 0,
                quality: highlight.quality || 'HD',
                api_data: highlight
              };

              const { error: highlightError } = await supabase
                .from('highlights')
                .upsert(highlightRecord, { onConflict: 'id' });

              if (!highlightError) {
                highlightsUpdated++;
                console.log(`   ✅ Highlight saved: ${highlight.title || 'Untitled'}`);
              } else {
                console.log(`   ❌ Error saving highlight: ${highlightError.message}`);
              }
            }
          } else {
            console.log('   ⚠️ No highlights available from API');
          }
        } else {
          console.log('   ✅ Highlights already exist');
        }

        // 2. FETCH LINEUPS
        console.log('   👥 Checking lineups...');
        const { data: existingLineups } = await supabase
          .from('match_lineups')
          .select('id')
          .eq('match_id', match.id)
          .limit(1);

        if (!existingLineups || existingLineups.length === 0) {
          console.log('   📡 Fetching lineups from API...');
          const lineupData = await callHighlightlyAPI('lineups', {
            matchId: match.id
          });

          if (lineupData?.data) {
            let lineupsSaved = 0;

            // Home team lineup
            if (lineupData.data.home || lineupData.data.homeTeam) {
              const homeLineup = lineupData.data.home || lineupData.data.homeTeam;
              const homeLineupRecord = {
                match_id: match.id,
                team_id: match.home_team_id,
                formation: homeLineup.formation || null,
                players: homeLineup.players || homeLineup.initialLineup || [],
                substitutes: homeLineup.substitutes || [],
                coach: homeLineup.coach || null,
                api_data: homeLineup
              };

              const { error: homeLineupError } = await supabase
                .from('match_lineups')
                .upsert(homeLineupRecord, { onConflict: 'match_id,team_id' });

              if (!homeLineupError) {
                lineupsSaved++;
                console.log(`   ✅ Home lineup saved (${homeLineup.formation || 'No formation'})`);
              }
            }

            // Away team lineup
            if (lineupData.data.away || lineupData.data.awayTeam) {
              const awayLineup = lineupData.data.away || lineupData.data.awayTeam;
              const awayLineupRecord = {
                match_id: match.id,
                team_id: match.away_team_id,
                formation: awayLineup.formation || null,
                players: awayLineup.players || awayLineup.initialLineup || [],
                substitutes: awayLineup.substitutes || [],
                coach: awayLineup.coach || null,
                api_data: awayLineup
              };

              const { error: awayLineupError } = await supabase
                .from('match_lineups')
                .upsert(awayLineupRecord, { onConflict: 'match_id,team_id' });

              if (!awayLineupError) {
                lineupsSaved++;
                console.log(`   ✅ Away lineup saved (${awayLineup.formation || 'No formation'})`);
              }
            }

            lineupsUpdated += lineupsSaved;
          } else {
            console.log('   ⚠️ No lineup data available from API');
          }
        } else {
          console.log('   ✅ Lineups already exist');
        }

        // 3. FETCH MATCH EVENTS
        console.log('   ⚽ Checking match events...');
        const { data: existingEvents } = await supabase
          .from('match_events')
          .select('id')
          .eq('match_id', match.id)
          .limit(1);

        if (!existingEvents || existingEvents.length === 0) {
          console.log('   📡 Fetching events from API...');
          const eventsData = await callHighlightlyAPI('events', {
            matchId: match.id
          });

          if (eventsData?.data && Array.isArray(eventsData.data) && eventsData.data.length > 0) {
            let eventsSaved = 0;
            
            for (const event of eventsData.data) {
              const eventRecord = {
                match_id: match.id,
                team_id: event.team_id || event.teamId || null,
                player_id: event.player_id || event.playerId || null,
                player_name: event.player_name || event.playerName || event.player || null,
                event_type: event.type || event.event_type || 'Unknown',
                minute: event.minute || event.time || null,
                added_time: event.added_time || event.addedTime || 0,
                description: event.description || event.detail || null,
                api_data: event
              };

              const { error: eventError } = await supabase
                .from('match_events')
                .insert(eventRecord);

              if (!eventError) {
                eventsSaved++;
              }
            }
            
            if (eventsSaved > 0) {
              eventsUpdated += eventsSaved;
              console.log(`   ✅ ${eventsSaved} events saved`);
            }
          } else {
            console.log('   ⚠️ No events data available from API');
          }
        } else {
          console.log('   ✅ Events already exist');
        }

        // 4. FETCH STATISTICS
        console.log('   📊 Checking statistics...');
        const { data: existingStats } = await supabase
          .from('match_statistics')
          .select('id')
          .eq('match_id', match.id)
          .limit(1);

        if (!existingStats || existingStats.length === 0) {
          console.log('   📡 Fetching statistics from API...');
          const statsData = await callHighlightlyAPI('statistics', {
            matchId: match.id
          });

          if (statsData?.data) {
            const statsRecord = {
              match_id: match.id,
              home_stats: statsData.data.home || null,
              away_stats: statsData.data.away || null,
              api_data: statsData.data
            };

            const { error: statsError } = await supabase
              .from('match_statistics')
              .upsert(statsRecord, { onConflict: 'match_id' });

            if (!statsError) {
              statsUpdated++;
              console.log('   ✅ Statistics saved');
            }
          } else {
            console.log('   ⚠️ No statistics data available from API');
          }
        } else {
          console.log('   ✅ Statistics already exist');
        }

        // Update match flags
        await supabase
          .from('matches')
          .update({
            has_highlights: true,
            has_lineups: true,
            has_events: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', match.id);

        console.log('   🏁 Match processing completed');

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`   ❌ Error processing match ${match.id}:`, error.message);
      }
    }

    console.log('\n🎯 AUTOMATION TEST RESULTS:');
    console.log('='.repeat(30));
    console.log(`📊 Statistics updated: ${statsUpdated}`);
    console.log(`🎥 Highlights updated: ${highlightsUpdated}`);
    console.log(`👥 Lineups updated: ${lineupsUpdated}`);
    console.log(`⚽ Events updated: ${eventsUpdated}`);
    
    if (statsUpdated + highlightsUpdated + lineupsUpdated + eventsUpdated > 0) {
      console.log('\n✅ SUCCESS! Post-match automation is working!');
      console.log('🔄 The server will now automatically process future finished matches every 5 minutes.');
    } else {
      console.log('\n⚠️ No new data was fetched. This could mean:');
      console.log('  • API doesn\'t have data for these specific matches');
      console.log('  • Data already exists in the database');
      console.log('  • API endpoints might need different parameters');
    }

  } catch (error) {
    console.error('❌ Automation test failed:', error.message);
  }
}

// Run the automation test
triggerPostMatchAutomation().then(() => {
  console.log('\n🏁 Post-match automation test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test error:', error);
  process.exit(1);
}); 