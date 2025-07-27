/*
 * ENHANCED SUPABASE DATA SERVICE
 * 
 * Replaces direct API calls with fast Supabase queries
 * This eliminates rate limiting and provides instant data loading
 * 
 * Now includes: standings, team form, match events, lineups
 */

import { supabase } from '@/integrations/supabase/client';

class SupabaseDataService {
  private subscriptions: Map<string, any> = new Map();
  
  /**
   * Get recent matches with full team and league information
   */
  async getMatchesForDate(date: string): Promise<any[]> {
    console.log(`[SupabaseData] Fetching matches for date: ${date}`);
    
    try {
      // Get matches for the specific date with all related data
      const { data: matchesData, error } = await supabase
        .from('matches')
        .select(`
          id,
          match_date,
          match_time,
          status,
          home_score,
          away_score,
          has_highlights,
          has_lineups,
          has_events,
          league_id,
          home_team:teams!matches_home_team_id_fkey(id, name, logo),
          away_team:teams!matches_away_team_id_fkey(id, name, logo),
          league:leagues!matches_league_id_fkey(id, name, logo, country_name)
        `)
        .eq('match_date', date)
        .order('match_time', { ascending: true });

      if (error) {
        console.error('[SupabaseData] Error fetching matches:', error);
        return [];
      }

      if (!matchesData || matchesData.length === 0) {
        console.log(`[SupabaseData] No matches found for ${date}`);
        return [];
      }

      // Group matches by league
      const leagueMatchesMap = new Map<string, any>();

      matchesData.forEach((match: any) => {
        const leagueId = match.league_id;
        
        if (!leagueMatchesMap.has(leagueId)) {
          leagueMatchesMap.set(leagueId, {
            id: leagueId,
            name: match.league?.name || 'League',
            logo: match.league?.logo || '',
            country: { code: '', name: match.league?.country_name || '' },
            matches: []
          });
        }

        // Transform match data to expected format
        const transformedMatch = {
          id: match.id,
          date: match.match_date,
          time: match.match_time,
          status: match.status,
          homeTeam: {
            id: match.home_team?.id || '',
            name: match.home_team?.name || 'Unknown Team',
            logo: match.home_team?.logo || ''
          },
          awayTeam: {
            id: match.away_team?.id || '',
            name: match.away_team?.name || 'Unknown Team',
            logo: match.away_team?.logo || ''
          },
          score: {
            home: match.home_score || 0,
            away: match.away_score || 0
          },
          highlights: match.has_highlights ? [] : undefined,
          league: {
            id: leagueId,
            name: match.league?.name || 'League'
          }
        };

        leagueMatchesMap.get(leagueId)!.matches.push(transformedMatch);
      });

      const result = Array.from(leagueMatchesMap.values());
      console.log(`[SupabaseData] Found ${result.length} leagues with matches for ${date}`);
      
      return result;

    } catch (error) {
      console.error('[SupabaseData] Error in getMatchesForDate:', error);
      return [];
    }
  }

  /**
   * Get ALL leagues (for TopLeaguesFilter - now shows all leagues, not just priority)
   */
  async getPriorityLeagues(): Promise<any[]> {
    console.log('[SupabaseData] Fetching ALL leagues for featured sidebar');
    
    try {
      const { data: leagues, error } = await supabase
        .from('leagues')
        .select('*')
        .order('name');

      if (error) {
        console.error('[SupabaseData] Error fetching leagues:', error);
        return [];
      }

      const transformedLeagues = leagues?.map((league: any) => ({
        id: league.id,
        name: league.name,
        logo: league.logo || '',
        country: league.country_name ? {
          code: league.country_code || '',
          name: league.country_name,
          logo: league.country_logo
        } : undefined,
        highlights: [] // Add required highlights property
      })) || [];

      console.log(`[SupabaseData] Found ${transformedLeagues.length} leagues for featured sidebar`);
      return transformedLeagues;

    } catch (error) {
      console.error('[SupabaseData] Error in getPriorityLeagues:', error);
      return [];
    }
  }

  /**
   * Get standings for a league
   */
  async getStandingsForLeague(leagueId: string, season: string = '2024'): Promise<any[]> {
    console.log(`[SupabaseData] Fetching standings for league ${leagueId}, season ${season}`);
    
    try {
      const { data: standings, error } = await supabase
        .from('standings')
        .select(`
          *,
          team:teams!standings_team_id_fkey(id, name, logo)
        `)
        .eq('league_id', leagueId)
        .eq('season', season)
        .order('position', { ascending: true });

      if (error) {
        console.error('[SupabaseData] Error fetching standings:', error);
        return [];
      }

      // Transform to expected format
      const transformedStandings = standings?.map((standing: any) => ({
        position: standing.position,
        team: {
          id: standing.team.id,
          name: standing.team.name,
          logo: standing.team.logo
        },
        points: standing.points,
        played: standing.played,
        won: standing.won,
        drawn: standing.drawn,
        lost: standing.lost,
        goalsFor: standing.goals_for,
        goalsAgainst: standing.goals_against,
        goalDifference: standing.goal_difference,
        form: standing.form_string,
        // Additional stats for detailed view
        home: {
          played: standing.home_played,
          won: standing.home_won,
          drawn: standing.home_drawn,
          lost: standing.home_lost,
          goalsFor: standing.home_goals_for,
          goalsAgainst: standing.home_goals_against
        },
        away: {
          played: standing.away_played,
          won: standing.away_won,
          drawn: standing.away_drawn,
          lost: standing.away_lost,
          goalsFor: standing.away_goals_for,
          goalsAgainst: standing.away_goals_against
        }
      })) || [];

      console.log(`[SupabaseData] Found ${transformedStandings.length} teams in standings`);
      return transformedStandings;

    } catch (error) {
      console.error('[SupabaseData] Error in getStandingsForLeague:', error);
      return [];
    }
  }

  /**
   * Get team form data
   */
  async getTeamForm(teamId: string, season: string = '2024'): Promise<any | null> {
    console.log(`[SupabaseData] Fetching team form for ${teamId}, season ${season}`);
    
    try {
      const { data: teamForm, error } = await supabase
        .from('team_form')
        .select(`
          *,
          team:teams!team_form_team_id_fkey(id, name, logo)
        `)
        .eq('team_id', teamId)
        .eq('season', season)
        .single();

      if (error) {
        console.error('[SupabaseData] Error fetching team form:', error);
        return null;
      }

      if (!teamForm) {
        console.log(`[SupabaseData] No form data found for team ${teamId}`);
        return null;
      }

      // Transform to expected format
      const transformedForm = {
        teamId: teamForm.team_id,
        teamName: teamForm.team.name,
        teamLogo: teamForm.team.logo,
        season: teamForm.season,
        last10: {
          played: teamForm.last_10_played,
          won: teamForm.last_10_won,
          drawn: teamForm.last_10_drawn,
          lost: teamForm.last_10_lost,
          goalsFor: teamForm.last_10_goals_for,
          goalsAgainst: teamForm.last_10_goals_against,
          cleanSheets: teamForm.last_10_clean_sheets,
          failedToScore: teamForm.last_10_failed_to_score,
          over25Goals: teamForm.last_10_over_25_goals,
          under25Goals: teamForm.last_10_under_25_goals,
          conceded: teamForm.last_10_conceded,
          concededTwoPlus: teamForm.last_10_conceded_two_plus
        },
        formString: teamForm.form_string,
        recentMatches: teamForm.recent_matches || [],
        computedAt: teamForm.computed_at
      };

      console.log(`[SupabaseData] Found form data for ${teamForm.team.name}: ${teamForm.form_string}`);
      return transformedForm;

    } catch (error) {
      console.error('[SupabaseData] Error in getTeamForm:', error);
      return null;
    }
  }

  /**
   * Get multiple team forms (for head-to-head comparison)
   */
  async getMultipleTeamForms(teamIds: string[], season: string = '2024'): Promise<any[]> {
    console.log(`[SupabaseData] Fetching form for ${teamIds.length} teams`);
    
    try {
      const { data: teamForms, error } = await supabase
        .from('team_form')
        .select(`
          *,
          team:teams!team_form_team_id_fkey(id, name, logo)
        `)
        .in('team_id', teamIds)
        .eq('season', season);

      if (error) {
        console.error('[SupabaseData] Error fetching multiple team forms:', error);
        return [];
      }

      const transformedForms = teamForms?.map((teamForm: any) => ({
        teamId: teamForm.team_id,
        teamName: teamForm.team.name,
        teamLogo: teamForm.team.logo,
        season: teamForm.season,
        last10: {
          played: teamForm.last_10_played,
          won: teamForm.last_10_won,
          drawn: teamForm.last_10_drawn,
          lost: teamForm.last_10_lost,
          goalsFor: teamForm.last_10_goals_for,
          goalsAgainst: teamForm.last_10_goals_against,
          cleanSheets: teamForm.last_10_clean_sheets,
          failedToScore: teamForm.last_10_failed_to_score,
          over25Goals: teamForm.last_10_over_25_goals,
          under25Goals: teamForm.last_10_under_25_goals,
          conceded: teamForm.last_10_conceded,
          concededTwoPlus: teamForm.last_10_conceded_two_plus
        },
        formString: teamForm.form_string,
        recentMatches: teamForm.recent_matches || [],
        computedAt: teamForm.computed_at
      })) || [];

      console.log(`[SupabaseData] Found form data for ${transformedForms.length} teams`);
      return transformedForms;

    } catch (error) {
      console.error('[SupabaseData] Error in getMultipleTeamForms:', error);
      return [];
    }
  }

  /**
   * Get highlights for matches (replaces getLast5FeaturedMatches)
   */
  async getRecentHighlights(limit: number = 10): Promise<any[]> {
    console.log(`[SupabaseData] Fetching recent highlights (limit: ${limit})`);
    
    try {
      const { data: highlightsData, error } = await supabase
        .from('highlights')
        .select(`
          *,
          matches!inner (
            id,
            match_date,
            home_team_id,
            away_team_id,
            home_score,
            away_score,
            league_id,
            home_team:teams!matches_home_team_id_fkey(id, name, logo),
            away_team:teams!matches_away_team_id_fkey(id, name, logo),
            league:leagues!matches_league_id_fkey(id, name, logo)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[SupabaseData] Error fetching highlights:', error);
        return [];
      }

      // Transform to expected format
      const transformedHighlights = highlightsData?.map((highlight: any) => ({
        id: highlight.id,
        title: highlight.title,
        url: highlight.url,
        videoUrl: highlight.url, // Add videoUrl alias
        thumbnailUrl: highlight.thumbnail, // Add thumbnailUrl alias
        thumbnail: highlight.thumbnail,
        duration: highlight.duration,
        views: highlight.views,
        homeTeam: {
          id: highlight.matches.home_team.id,
          name: highlight.matches.home_team.name,
          logo: highlight.matches.home_team.logo
        },
        awayTeam: {
          id: highlight.matches.away_team.id,
          name: highlight.matches.away_team.name,
          logo: highlight.matches.away_team.logo
        },
        score: {
          home: highlight.matches.home_score,
          away: highlight.matches.away_score
        },
        competition: {
          id: highlight.matches.league.id,
          name: highlight.matches.league.name,
          logo: highlight.matches.league.logo
        },
        date: highlight.matches.match_date
      })) || [];

      console.log(`[SupabaseData] Found ${transformedHighlights.length} recent highlights`);
      return transformedHighlights;

    } catch (error) {
      console.error('[SupabaseData] Error in getRecentHighlights:', error);
      return [];
    }
  }

  /**
   * Get last five games for a team
   */
  async getLastFiveGames(teamId: string): Promise<any[]> {
    console.log(`[SupabaseData] Fetching last 5 games for team ${teamId}`);
    
    try {
      const { data: matches, error } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(id, name, logo),
          away_team:teams!matches_away_team_id_fkey(id, name, logo),
          league:leagues!matches_league_id_fkey(id, name, logo)
        `)
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .not('status', 'eq', 'Not Started')
        .order('match_date', { ascending: false })
        .limit(5);

      if (error) {
        console.error('[SupabaseData] Error fetching last 5 games:', error);
        return [];
      }

      return matches || [];
    } catch (error) {
      console.error('[SupabaseData] Error in getLastFiveGames:', error);
      return [];
    }
  }

  /**
   * Get head to head matches between two teams
   */
  async getHeadToHead(teamId1: string, teamId2: string): Promise<any[]> {
    console.log(`[SupabaseData] Fetching H2H for teams ${teamId1} vs ${teamId2}`);
    
    try {
      const { data: matches, error } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(id, name, logo),
          away_team:teams!matches_away_team_id_fkey(id, name, logo),
          league:leagues!matches_league_id_fkey(id, name, logo)
        `)
        .or(`and(home_team_id.eq.${teamId1},away_team_id.eq.${teamId2}),and(home_team_id.eq.${teamId2},away_team_id.eq.${teamId1})`)
        .not('status', 'eq', 'Not Started')
        .order('match_date', { ascending: false })
        .limit(10);

      if (error) {
        console.error('[SupabaseData] Error fetching H2H:', error);
        return [];
      }

      return matches || [];
    } catch (error) {
      console.error('[SupabaseData] Error in getHeadToHead:', error);
      return [];
    }
  }

  /**
   * Get match by ID with full details
   */
  async getMatchById(matchId: string): Promise<any | null> {
    console.log(`[SupabaseData] Fetching match details for ${matchId}`);
    
    try {
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

      if (error) {
        console.error('[SupabaseData] Error fetching match:', error);
        return null;
      }

      if (!match) {
        console.log(`[SupabaseData] No match found with ID ${matchId}`);
        return null;
      }

      // Fetch lineups for this match
      const { data: lineups, error: lineupsError } = await supabase
        .from('match_lineups')
        .select('*')
        .eq('match_id', matchId);

      if (lineupsError) {
        console.error('[SupabaseData] Error fetching lineups:', lineupsError);
      }

      // Fetch events for this match
      const { data: events, error: eventsError } = await supabase
        .from('match_events')
        .select('*')
        .eq('match_id', matchId)
        .order('minute', { ascending: true });

      if (eventsError) {
        console.error('[SupabaseData] Error fetching events:', eventsError);
      }

      // Fetch statistics for this match
      const { data: statistics, error: statisticsError } = await supabase
        .from('match_statistics')
        .select('*')
        .eq('match_id', matchId)
        .maybeSingle();

      if (statisticsError) {
        console.error('[SupabaseData] Error fetching statistics:', statisticsError);
      }

      // Process lineups into expected format
      let processedLineups = null;
      if (lineups && lineups.length > 0) {
        const homeLineup = lineups.find(l => l.team_id === match.home_team_id);
        const awayLineup = lineups.find(l => l.team_id === match.away_team_id);
        
        // Helper function to process lineup data
        const processLineupData = (lineupData: any) => {
          if (!lineupData || !lineupData.players) return [];
          
          // Check if players is already organized (nested arrays) or flat
          if (Array.isArray(lineupData.players) && lineupData.players.length > 0) {
            // If first element is an array, it's already organized by position
            if (Array.isArray(lineupData.players[0])) {
              console.log('[SupabaseData] Lineup already organized by formation');
              return lineupData.players;
            } else {
              // If it's a flat array, organize by formation
              console.log('[SupabaseData] Organizing flat lineup by formation');
              const formation = lineupData.formation || '4-4-2';
              const formationParts = formation.split('-').map(n => parseInt(n, 10));
              const result = [];
              let playerIndex = 0;
              
              // Goalkeeper (always 1)
              if (lineupData.players.length > 0) {
                result.push([lineupData.players[0]]);
                playerIndex = 1;
              }
              
              // Field players by formation
              for (const lineSize of formationParts) {
                const line = [];
                for (let i = 0; i < lineSize && playerIndex < lineupData.players.length; i++) {
                  line.push(lineupData.players[playerIndex]);
                  playerIndex++;
                }
                if (line.length > 0) {
                  result.push(line);
                }
              }
              
              return result;
            }
          }
          
          return [];
        };
        
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
      }

      // Process events into expected format
      let processedEvents = null;
      if (events && events.length > 0) {
        processedEvents = events.map(event => {
          // Extract data from api_data if main columns are null
          const apiData = event.api_data || {};
          const minute = event.minute || (apiData.time ? parseInt(apiData.time, 10) : 0);
          const playerName = event.player_name || apiData.player || 'Unknown Player';
          const assist = apiData.assist;
          const substituted = apiData.substituted;
          
          return {
            id: event.id,
            minute: minute,
            addedTime: event.added_time || 0,
            type: event.event_type,
            player: playerName,
            player_name: playerName, // Add both formats for compatibility
            assist: assist,
            substituted: substituted,
            team: event.team_id === match.home_team_id ? match.home_team.name : match.away_team.name,
            team_id: event.team_id,
            description: event.description || apiData.type
          };
        });
      }

      // Process statistics into expected format
      let processedStatistics = null;
      if (statistics && statistics.statistics) {
        const statsData = statistics.statistics;
        if (statsData.home && statsData.away) {
          processedStatistics = [
            {
              team: {
                id: match.home_team.id,
                name: match.home_team.name,
                logo: match.home_team.logo
              },
              statistics: statsData.home.statistics || []
            },
            {
              team: {
                id: match.away_team.id,
                name: match.away_team.name,
                logo: match.away_team.logo
              },
              statistics: statsData.away.statistics || []
            }
          ];
        }
      }

      // Transform to expected format
      const transformedMatch = {
        id: match.id,
        date: match.match_date,
        time: match.match_time,
        status: match.status,
        homeTeam: {
          id: match.home_team.id,
          name: match.home_team.name,
          logo: match.home_team.logo
        },
        awayTeam: {
          id: match.away_team.id,
          name: match.away_team.name,
          logo: match.away_team.logo
        },
        score: {
          home: match.home_score,
          away: match.away_score
        },
        league: {
          id: match.league.id,
          name: match.league.name,
          logo: match.league.logo
        },
        competition: {
          id: match.league.id,
          name: match.league.name,
          logo: match.league.logo
        },
        venue: match.venue,
        round: match.round,
        season: match.season,
        hasHighlights: match.has_highlights,
        hasLineups: match.has_lineups,
        hasEvents: match.has_events,
        // Add the actual lineups and events data
        lineups: processedLineups,
        events: processedEvents,
        statistics: processedStatistics
      };

      console.log(`[SupabaseData] Found match: ${match.home_team.name} vs ${match.away_team.name}`);
      console.log(`[SupabaseData] Lineups: ${processedLineups ? 'Available' : 'None'}`);
      console.log(`[SupabaseData] Events: ${processedEvents ? processedEvents.length : 0}`);
      console.log(`[SupabaseData] Statistics: ${processedStatistics ? 'Available' : 'None'}`);
      
      return transformedMatch;

    } catch (error) {
      console.error('[SupabaseData] Error in getMatchById:', error);
      return null;
    }
  }

  /**
   * Get highlights for a specific match
   */
  async getHighlightsForMatch(matchId: string): Promise<any[]> {
    console.log(`[SupabaseData] Fetching highlights for match ${matchId}`);
    
    try {
      const { data: highlights, error } = await supabase
        .from('highlights')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[SupabaseData] Error fetching match highlights:', error);
        return [];
      }

      const transformedHighlights = highlights?.map((highlight: any) => ({
        id: highlight.id,
        title: highlight.title,
        url: highlight.url,
        thumbnail: highlight.thumbnail,
        duration: highlight.duration,
        views: highlight.views,
        quality: highlight.quality
      })) || [];

      console.log(`[SupabaseData] Found ${transformedHighlights.length} highlights for match`);
      return transformedHighlights;

    } catch (error) {
      console.error('[SupabaseData] Error in getHighlightsForMatch:', error);
      return [];
    }
  }

  /**
   * Get league by ID
   */
  async getLeagueById(leagueId: string): Promise<any | null> {
    console.log(`[SupabaseData] Fetching league details for ${leagueId}`);
    
    try {
      const { data: league, error } = await supabase
        .from('leagues')
        .select('*')
        .eq('id', leagueId)
        .single();

      if (error) {
        console.error('[SupabaseData] Error fetching league:', error);
        return null;
      }

      if (!league) {
        console.log(`[SupabaseData] No league found with ID ${leagueId}`);
        return null;
      }

      const transformedLeague = {
        id: league.id,
        name: league.name,
        logo: league.logo,
        country: {
          code: league.country_code,
          name: league.country_name,
          logo: league.country_logo
        },
        currentSeason: league.current_season,
        apiData: league.api_data
      };

      console.log(`[SupabaseData] Found league: ${league.name}`);
      return transformedLeague;

    } catch (error) {
      console.error('[SupabaseData] Error in getLeagueById:', error);
      return null;
    }
  }

  /**
   * Get matches for a league
   */
  async getMatchesForLeague(leagueId: string, season?: string, limit?: number): Promise<any[]> {
    console.log(`[SupabaseData] Fetching matches for league ${leagueId}`);
    
    try {
      let query = supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(id, name, logo),
          away_team:teams!matches_away_team_id_fkey(id, name, logo)
        `)
        .eq('league_id', leagueId);

      if (season) {
        query = query.eq('season', season);
      }

      // Use provided limit or default to 1000 (much higher than 50)
      const { data: matches, error } = await query
        .order('match_date', { ascending: false })
        .limit(limit || 1000);

      if (error) {
        console.error('[SupabaseData] Error fetching league matches:', error);
        return [];
      }

      const transformedMatches = matches?.map((match: any) => ({
        id: match.id,
        date: match.match_date,
        time: match.match_time,
        status: match.status,
        homeTeam: {
          id: match.home_team.id,
          name: match.home_team.name,
          logo: match.home_team.logo
        },
        awayTeam: {
          id: match.away_team.id,
          name: match.away_team.name,
          logo: match.away_team.logo
        },
        score: {
          home: match.home_score,
          away: match.away_score
        },
        hasHighlights: match.has_highlights
      })) || [];

      console.log(`[SupabaseData] Found ${transformedMatches.length} matches for league`);
      return transformedMatches;

    } catch (error) {
      console.error('[SupabaseData] Error in getMatchesForLeague:', error);
      return [];
    }
  }

  /**
   * Get sync status for monitoring
   */
  async getSyncStatus() {
    console.log('[SupabaseData] Fetching sync status');
    
    try {
      const { data: syncStatus, error } = await supabase
        .from('sync_status')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('[SupabaseData] Error fetching sync status:', error);
        return [];
      }

      return syncStatus || [];
    } catch (error) {
      console.error('[SupabaseData] Error in getSyncStatus:', error);
      return [];
    }
  }

  /**
   * Get data freshness information
   */
  async getDataFreshness() {
    const status = await this.getSyncStatus();
    return {
      leagues: status.find(s => s.table_name === 'leagues')?.last_sync,
      teams: status.find(s => s.table_name === 'teams')?.last_sync,
      matches: status.find(s => s.table_name === 'matches')?.last_sync,
      standings: status.find(s => s.table_name === 'standings')?.last_sync,
      teamForm: status.find(s => s.table_name === 'team_form')?.last_sync,
      highlights: status.find(s => s.table_name === 'highlights')?.last_sync
    };
  }
  
  /**
   * Subscribe to real-time match updates
   */
  subscribeToMatch(matchId: string, callback: (payload: any) => void) {
    const channel = supabase
      .channel(`match:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${matchId}`
        },
        (payload) => {
          console.log('[SupabaseData] Match update:', payload);
          callback(payload);
        }
      )
      .subscribe();
    
    this.subscriptions.set(`match:${matchId}`, channel);
    return channel;
  }
  
  /**
   * Subscribe to real-time updates for live matches
   */
  subscribeToLiveMatches(callback: (payload: any) => void) {
    const channel = supabase
      .channel('live-matches')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: "status=in.(LIVE,1H,2H,HT)"
        },
        (payload) => {
          console.log('[SupabaseData] Live match update:', payload);
          callback(payload);
        }
      )
      .subscribe();
    
    this.subscriptions.set('live-matches', channel);
    return channel;
  }
  
  /**
   * Subscribe to match events (goals, cards, etc.)
   */
  subscribeToMatchEvents(matchId: string, callback: (payload: any) => void) {
    const channel = supabase
      .channel(`match-events:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'match_events',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          console.log('[SupabaseData] New match event:', payload);
          callback(payload);
        }
      )
      .subscribe();
    
    this.subscriptions.set(`match-events:${matchId}`, channel);
    return channel;
  }
  
  /**
   * Unsubscribe from a specific channel
   */
  unsubscribe(key: string) {
    const channel = this.subscriptions.get(key);
    if (channel) {
      supabase.removeChannel(channel);
      this.subscriptions.delete(key);
    }
  }
  
  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll() {
    this.subscriptions.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.subscriptions.clear();
  }
}

// Export singleton instance
export const supabaseDataService = new SupabaseDataService(); 