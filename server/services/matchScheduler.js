import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Initialize environment variables
dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '../../.env') });

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const HIGHLIGHTLY_API_URL = 'https://soccer.highlightly.net';
const HIGHLIGHTLY_API_KEY = process.env.HIGHLIGHTLY_API_KEY || 'f1f4e3c0a7msh07b3b9d6e8c2f5a8b3c';

class MatchScheduler {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
    this.status = {
      hourlySync: { lastRun: null, status: 'idle', errors: 0 },
      lineupSync: { lastRun: null, status: 'idle', errors: 0 },
      liveSync: { lastRun: null, status: 'idle', errors: 0 },
      postMatchSync: { lastRun: null, status: 'idle', errors: 0 }
    };
  }

  start() {
    if (this.isRunning) {
      console.log('[MatchScheduler] Already running');
      return;
    }

    console.log('[MatchScheduler] Starting match scheduler...');
    this.isRunning = true;

    // 1. Every hour: Fetch upcoming match data
    this.jobs.set('hourlySync', cron.schedule('0 * * * *', () => {
      this.fetchUpcomingMatches();
    }, { scheduled: true }));

    // 2. Every 10 minutes: Check for lineup sync (50 minutes before matches)
    this.jobs.set('lineupSync', cron.schedule('*/10 * * * *', () => {
      this.checkAndFetchLineups();
    }, { scheduled: true }));

    // 3. Every 2 minutes: Fetch live scores during matches
    this.jobs.set('liveSync', cron.schedule('*/2 * * * *', () => {
      this.fetchLiveScores();
    }, { scheduled: true }));

    // 4. Every 5 minutes: Check for finished matches and fetch final stats
    this.jobs.set('postMatchSync', cron.schedule('*/5 * * * *', () => {
      this.fetchPostMatchStats();
    }, { scheduled: true }));

    // Initial sync
    setTimeout(() => {
      this.fetchUpcomingMatches();
    }, 1000);

    console.log('[MatchScheduler] All cron jobs scheduled');
  }

  stop() {
    if (!this.isRunning) return;

    console.log('[MatchScheduler] Stopping match scheduler...');
    
    for (const [name, job] of this.jobs) {
      job.destroy();
      console.log(`[MatchScheduler] Stopped ${name} job`);
    }
    
    this.jobs.clear();
    this.isRunning = false;
  }

  async callHighlightlyAPI(endpoint, params = {}) {
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
      console.error(`[MatchScheduler] API Error for ${endpoint}:`, error.message);
      throw error;
    }
  }

  async fetchUpcomingMatches() {
    this.status.hourlySync.status = 'running';
    this.status.hourlySync.lastRun = new Date();

    try {
      console.log('[MatchScheduler] Fetching upcoming matches...');

      // Fetch leagues with API IDs from database
      const { data: leagues, error: leaguesError } = await supabase
        .from('leagues')
        .select('id, name, api_data')
        .not('api_data', 'is', null);

      if (leaguesError) {
        console.error('[MatchScheduler] Error fetching leagues:', leaguesError);
        throw leaguesError;
      }

      // Create dynamic API mapping from database
      const LEAGUE_API_MAPPING = {};
      let validLeagues = 0;

      leagues.forEach(league => {
        try {
          const apiData = JSON.parse(league.api_data);
          if (apiData.highlightly_id) {
            LEAGUE_API_MAPPING[league.name] = parseInt(apiData.highlightly_id);
            validLeagues++;
          }
        } catch (e) {
          console.warn(`[MatchScheduler] Invalid API data for league: ${league.name}`);
        }
      });

      console.log(`[MatchScheduler] Loaded ${validLeagues} leagues with API IDs from database`);
      console.log('[MatchScheduler] API Mapping sample:', Object.keys(LEAGUE_API_MAPPING).slice(0, 5));

      // Get leagues from database that we can fetch for
      const { data: fetchableLeagues, error: fetchableLeaguesError } = await supabase
        .from('leagues')
        .select('id, name');

      if (fetchableLeaguesError) {
        throw new Error(`Failed to fetch leagues: ${fetchableLeaguesError.message}`);
      }

      // Filter to only leagues we have API IDs for
      const fetchableLeaguesFiltered = fetchableLeagues.filter(league => {
        const apiId = LEAGUE_API_MAPPING[league.name] || 
                     Object.entries(LEAGUE_API_MAPPING).find(([name]) => 
                       league.name.toLowerCase().includes(name.toLowerCase()) ||
                       name.toLowerCase().includes(league.name.toLowerCase())
                     )?.[1];
        return apiId !== undefined;
      });

      console.log(`[MatchScheduler] Found ${fetchableLeaguesFiltered.length} fetchable leagues:`, fetchableLeaguesFiltered.map(l => l.name));

      // Date range: -1 day to +5 days
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 1);
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 5);

      let totalMatches = 0;
      let totalUpdated = 0;

      for (const league of fetchableLeaguesFiltered) {
        // Get API ID for this league
        const apiId = LEAGUE_API_MAPPING[league.name] || 
                     Object.entries(LEAGUE_API_MAPPING).find(([name]) => 
                       league.name.toLowerCase().includes(name.toLowerCase()) ||
                       name.toLowerCase().includes(league.name.toLowerCase())
                     )?.[1];

        if (!apiId) continue;

        console.log(`[MatchScheduler] Fetching for ${league.name} (API ID: ${apiId})`);

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateString = d.toISOString().split('T')[0];

          try {
            const matchData = await this.callHighlightlyAPI('matches', {
              leagueId: apiId,
              date: dateString,
              season: new Date().getFullYear().toString()
            });

            if (matchData?.data && Array.isArray(matchData.data)) {
              console.log(`[MatchScheduler] Found ${matchData.data.length} matches for ${league.name} on ${dateString}`);
              
              for (const match of matchData.data) {
                const matchRecord = {
                  id: match.id,
                  league_id: league.id,
                  home_team_id: match.homeTeam?.id?.toString() || null,
                  away_team_id: match.awayTeam?.id?.toString() || null,
                  home_score: match.state?.score?.current ? parseInt(match.state.score.current.split(' - ')[0]) : null,
                  away_score: match.state?.score?.current ? parseInt(match.state.score.current.split(' - ')[1]) : null,
                  match_date: match.date,
                  status: match.state?.description || 'Scheduled',
                  venue: match.venue?.name || null,
                  season: match.league?.season?.toString() || new Date().getFullYear().toString(),
                  round: match.round || null,
                  has_highlights: false,
                  has_lineups: false,
                  has_events: false,
                  api_data: match
                };

                const { error: upsertError } = await supabase
                  .from('matches')
                  .upsert(matchRecord, { onConflict: 'id' });

                if (!upsertError) {
                  totalUpdated++;
                } else {
                  console.log(`[MatchScheduler] Error upserting match ${match.id}: ${upsertError.message}`);
                }
              }
              totalMatches += matchData.data.length;
            } else {
              console.log(`[MatchScheduler] No matches for ${league.name} on ${dateString}`);
            }

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));

          } catch (error) {
            console.error(`[MatchScheduler] Error fetching matches for ${league.name} on ${dateString}:`, error.message);
          }
        }
      }

      console.log(`[MatchScheduler] Hourly sync complete: ${totalMatches} matches processed, ${totalUpdated} updated`);
      this.status.hourlySync.status = 'success';
      this.status.hourlySync.errors = 0;

    } catch (error) {
      console.error('[MatchScheduler] Hourly sync failed:', error.message);
      this.status.hourlySync.status = 'error';
      this.status.hourlySync.errors++;
    }
  }

  async checkAndFetchLineups() {
    this.status.lineupSync.status = 'running';
    this.status.lineupSync.lastRun = new Date();

    try {
      const now = new Date();
      const in50Minutes = new Date(now.getTime() + 50 * 60 * 1000);
      const in60Minutes = new Date(now.getTime() + 60 * 60 * 1000);

      // Find matches starting in 50-60 minutes
      const { data: upcomingMatches, error } = await supabase
        .from('matches')
        .select('*')
        .gte('match_date', in50Minutes.toISOString().split('T')[0])
        .lte('match_date', in60Minutes.toISOString().split('T')[0])
        .in('status', ['Scheduled', 'Not Started']);

      if (error) {
        throw new Error(`Failed to fetch upcoming matches: ${error.message}`);
      }

      let lineupsUpdated = 0;

      for (const match of upcomingMatches) {
        try {
          // Check if we already have lineups
          const { data: existingLineups } = await supabase
            .from('match_lineups')
            .select('id')
            .eq('match_id', match.id)
            .limit(1);

          if (existingLineups && existingLineups.length > 0) {
            continue; // Already have lineups
          }

          // Fetch lineups from API
          const lineupData = await this.callHighlightlyAPI(`lineups/${match.id}`);

          if (lineupData) {
            // Home team lineup
            if (lineupData.homeTeam) {
              const homeLineup = lineupData.homeTeam;
              const homeLineupRecord = {
                match_id: match.id,
                team_id: match.home_team_id,
                formation: homeLineup.formation || null,
                players: homeLineup.initialLineup || [],
                substitutes: homeLineup.substitutes || [],
                coach: homeLineup.coach || null,
                api_data: homeLineup
              };

              const { error: homeLineupError } = await supabase
                .from('match_lineups')
                .upsert(homeLineupRecord, { onConflict: 'match_id,team_id' });

              if (!homeLineupError) {
                lineupsUpdated++;
              }
            }

            // Away team lineup
            if (lineupData.awayTeam) {
              const awayLineup = lineupData.awayTeam;
              const awayLineupRecord = {
                match_id: match.id,
                team_id: match.away_team_id,
                formation: awayLineup.formation || null,
                players: awayLineup.initialLineup || [],
                substitutes: awayLineup.substitutes || [],
                coach: awayLineup.coach || null,
                api_data: awayLineup
              };

              const { error: awayLineupError } = await supabase
                .from('match_lineups')
                .upsert(awayLineupRecord, { onConflict: 'match_id,team_id' });

              if (!awayLineupError) {
                lineupsUpdated++;
              }
            }
            console.log(`[MatchScheduler] ✅ Lineups updated for match ${match.id}`);
          }

          await new Promise(resolve => setTimeout(resolve, 300));

        } catch (error) {
          console.error(`[MatchScheduler] Error fetching lineup for match ${match.id}:`, error.message);
        }
      }

      console.log(`[MatchScheduler] Lineup sync complete: ${lineupsUpdated} lineups updated`);
      this.status.lineupSync.status = 'success';
      this.status.lineupSync.errors = 0;

    } catch (error) {
      console.error('[MatchScheduler] Lineup sync failed:', error.message);
      this.status.lineupSync.status = 'error';
      this.status.lineupSync.errors++;
    }
  }

  async fetchLiveScores() {
    this.status.liveSync.status = 'running';
    this.status.liveSync.lastRun = new Date();

    try {
      // Find live matches
      const { data: liveMatches, error } = await supabase
        .from('matches')
        .select('*')
        .in('status', ['Live', 'First Half', 'Second Half', 'Half Time']);

      if (error) {
        throw new Error(`Failed to fetch live matches: ${error.message}`);
      }

      let scoresUpdated = 0;

      for (const match of liveMatches) {
        try {
          // Fetch live match data
          const matchData = await this.callHighlightlyAPI('matches', {
            matchId: match.id
          });

          if (matchData?.data && matchData.data.length > 0) {
            const liveMatch = matchData.data[0];

            const updates = {
              home_score: liveMatch.goals?.home || match.home_score,
              away_score: liveMatch.goals?.away || match.away_score,
              status: liveMatch.status?.long || match.status,
              api_data: liveMatch
            };

            const { error: updateError } = await supabase
              .from('matches')
              .update(updates)
              .eq('id', match.id);

            if (!updateError) {
              scoresUpdated++;
            }
          }

          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          console.error(`[MatchScheduler] Error updating live match ${match.id}:`, error.message);
        }
      }

      if (liveMatches.length > 0) {
        console.log(`[MatchScheduler] Live sync complete: ${scoresUpdated} matches updated`);
      }
      this.status.liveSync.status = 'success';
      this.status.liveSync.errors = 0;

    } catch (error) {
      console.error('[MatchScheduler] Live sync failed:', error.message);
      this.status.liveSync.status = 'error';
      this.status.liveSync.errors++;
    }
  }

  async fetchPostMatchStats() {
    this.status.postMatchSync.status = 'running';
    this.status.postMatchSync.lastRun = new Date();

    try {
      // Find recently finished matches (last 6 hours to catch more matches)
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
      
      const { data: finishedMatches, error } = await supabase
        .from('matches')
        .select('*')
        .in('status', ['Finished', 'Match Finished', 'FT', 'Full Time'])
        .gte('updated_at', sixHoursAgo.toISOString());

      if (error) {
        throw new Error(`Failed to fetch finished matches: ${error.message}`);
      }

      let statsUpdated = 0;
      let highlightsUpdated = 0;
      let lineupsUpdated = 0;
      let eventsUpdated = 0;

      console.log(`[MatchScheduler] Processing ${finishedMatches.length} finished matches for post-match data...`);

      for (const match of finishedMatches) {
        try {
          console.log(`[MatchScheduler] Processing match ${match.id}...`);

          // 4. FETCH MATCH EVENTS
          const { data: existingEvents } = await supabase
            .from('match_events')
            .select('id')
            .eq('match_id', match.id)
            .limit(1);

          if (!existingEvents || existingEvents.length === 0) {
            try {
              const eventsData = await this.callHighlightlyAPI(`events/${match.id}`);

              if (eventsData && Array.isArray(eventsData) && eventsData.length > 0) {
                for (const event of eventsData) {
                  const eventRecord = {
                    match_id: match.id,
                    team_id: event.team?.id || null,
                    player_id: null,
                    player_name: event.player || null,
                    event_type: event.type || 'Unknown',
                    minute: event.time || null,
                    added_time: 0,
                    description: event.assist ? `Assist: ${event.assist}` : null,
                    api_data: event
                  };

                  const { error: eventError } = await supabase
                    .from('match_events')
                    .insert(eventRecord);

                  if (!eventError) {
                    eventsUpdated++;
                  }
                }
                console.log(`[MatchScheduler] ✅ Events updated for match ${match.id}`);
              }
            } catch (error) {
              console.error(`[MatchScheduler] Error fetching events for match ${match.id}:`, error.message);
            }
          }

          // 1. FETCH MATCH STATISTICS (moved after events)
          const { data: existingStats } = await supabase
            .from('match_statistics')
            .select('id')
            .eq('match_id', match.id)
            .limit(1);

          if (!existingStats || existingStats.length === 0) {
            try {
              const statsData = await this.callHighlightlyAPI(`statistics/${match.id}`);

              if (statsData && Array.isArray(statsData) && statsData.length >= 2) {
                const statsRecord = {
                  match_id: match.id,
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
                  console.log(`[MatchScheduler] ✅ Statistics updated for match ${match.id}`);
                }
              }
            } catch (error) {
              console.error(`[MatchScheduler] Error fetching statistics for match ${match.id}:`, error.message);
            }
          }

          // 2. FETCH HIGHLIGHTS
          const { data: existingHighlights } = await supabase
            .from('highlights')
            .select('id')
            .eq('match_id', match.id)
            .limit(1);

          if (!existingHighlights || existingHighlights.length === 0) {
            try {
              const highlightsData = await this.callHighlightlyAPI('highlights', {
                matchId: match.id
              });

              if (highlightsData?.data && Array.isArray(highlightsData.data) && highlightsData.data.length > 0) {
                for (const highlight of highlightsData.data) {
                  const highlightRecord = {
                    id: highlight.id || `${match.id}_${Date.now()}`,
                    match_id: match.id,
                    title: highlight.title || `${match.home_team_name || 'Home'} vs ${match.away_team_name || 'Away'} - Highlights`,
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
                  }
                }
                console.log(`[MatchScheduler] ✅ Highlights updated for match ${match.id}`);
              } else {
                console.log(`[MatchScheduler] ⚠️ No highlights available for match ${match.id}`);
              }
            } catch (error) {
              console.error(`[MatchScheduler] Error fetching highlights for match ${match.id}:`, error.message);
            }
          }

          // 3. FETCH LINEUPS (if not already fetched)
          const { data: existingLineups } = await supabase
            .from('match_lineups')
            .select('id')
            .eq('match_id', match.id)
            .limit(1);

          if (!existingLineups || existingLineups.length === 0) {
            try {
              const lineupData = await this.callHighlightlyAPI(`lineups/${match.id}`);

              if (lineupData) {
                // Home team lineup
                if (lineupData.homeTeam) {
                  const homeLineup = lineupData.homeTeam;
                  const homeLineupRecord = {
                    match_id: match.id,
                    team_id: match.home_team_id,
                    formation: homeLineup.formation || null,
                    players: homeLineup.initialLineup || [],
                    substitutes: homeLineup.substitutes || [],
                    coach: homeLineup.coach || null,
                    api_data: homeLineup
                  };

                  const { error: homeLineupError } = await supabase
                    .from('match_lineups')
                    .upsert(homeLineupRecord, { onConflict: 'match_id,team_id' });

                  if (!homeLineupError) {
                    lineupsUpdated++;
                  }
                }

                // Away team lineup
                if (lineupData.awayTeam) {
                  const awayLineup = lineupData.awayTeam;
                  const awayLineupRecord = {
                    match_id: match.id,
                    team_id: match.away_team_id,
                    formation: awayLineup.formation || null,
                    players: awayLineup.initialLineup || [],
                    substitutes: awayLineup.substitutes || [],
                    coach: awayLineup.coach || null,
                    api_data: awayLineup
                  };

                  const { error: awayLineupError } = await supabase
                    .from('match_lineups')
                    .upsert(awayLineupRecord, { onConflict: 'match_id,team_id' });

                  if (!awayLineupError) {
                    lineupsUpdated++;
                  }
                }
                console.log(`[MatchScheduler] ✅ Lineups updated for match ${match.id}`);
              }
            } catch (error) {
              console.error(`[MatchScheduler] Error fetching lineups for match ${match.id}:`, error.message);
            }
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

          // Rate limiting delay
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          console.error(`[MatchScheduler] Error processing match ${match.id}:`, error.message);
        }
      }

      if (finishedMatches.length > 0) {
        console.log(`[MatchScheduler] Post-match sync complete:`);
        console.log(`  - Statistics: ${statsUpdated} updated`);
        console.log(`  - Highlights: ${highlightsUpdated} updated`);
        console.log(`  - Lineups: ${lineupsUpdated} updated`);
        console.log(`  - Events: ${eventsUpdated} updated`);
      }
      this.status.postMatchSync.status = 'success';
      this.status.postMatchSync.errors = 0;

    } catch (error) {
      console.error('[MatchScheduler] Post-match sync failed:', error.message);
      this.status.postMatchSync.status = 'error';
      this.status.postMatchSync.errors++;
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: Array.from(this.jobs.keys()),
      status: this.status
    };
  }
}

export default MatchScheduler; 