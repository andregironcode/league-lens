import { createClient } from '@supabase/supabase-js';
import { LEAGUE_PRIORITIES, getTopLeaguesWithUpcomingGames } from '../utils/leaguePriority.js';
import { calculateMatchWeight, getTopWeightedMatches } from '../utils/matchWeighing.js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class DatabaseMatchService {
  getDateRange(daysBack = 1, daysForward = 5) {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - daysBack);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(now);
    end.setDate(end.getDate() + daysForward);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }

  formatDateForApi(date) {
    return date.toISOString().split('T')[0];
  }

  async getTopLeaguesMatches() {
    const dateRange = this.getDateRange(1, 5); // -1 to +5 days
    
    try {
      // First try to get matches in the date range
      let { data: matches, error } = await supabase
        .from('matches')
        .select(`
          id,
          league_id,
          home_team_id,
          away_team_id,
          home_score,
          away_score,
          match_date,
          status,
          venue,
          season,
          round,
          has_highlights,
          api_data,
          home_team:teams!home_team_id (
            id,
            name,
            logo
          ),
          away_team:teams!away_team_id (
            id,
            name,
            logo
          ),
          leagues!inner (
            id,
            name,
            logo
          )
        `)
        .gte('match_date', this.formatDateForApi(dateRange.start))
        .lte('match_date', this.formatDateForApi(dateRange.end))
        .order('match_date', { ascending: true });

      if (error) {
        console.error('[DatabaseMatchService] Error fetching matches:', error);
        return { matches: [], leagues: [], dateRange: {}, lastUpdated: new Date().toISOString() };
      }

      // If no matches in date range, get most recent matches
      if (!matches || matches.length === 0) {
        console.log('[DatabaseMatchService] No matches in date range, fetching recent matches...');
        
        const { data: recentMatches, error: recentError } = await supabase
          .from('matches')
          .select(`
            id,
            league_id,
            home_team_id,
            away_team_id,
            home_score,
            away_score,
            match_date,
            status,
            venue,
            season,
            round,
            has_highlights,
            api_data,
            home_team:teams!home_team_id (
              id,
              name,
              logo
            ),
            away_team:teams!away_team_id (
              id,
              name,
              logo
            ),
            leagues!inner (
              id,
              name,
              logo
            )
          `)
          .order('match_date', { ascending: false })
          .limit(100);
          
        if (recentError) {
          console.error('[DatabaseMatchService] Error fetching recent matches:', recentError);
          return { matches: [], leagues: [], dateRange: {}, lastUpdated: new Date().toISOString() };
        }
        
        matches = recentMatches;
      }

      if (!matches || matches.length === 0) {
        return { matches: [], leagues: [], dateRange: {}, lastUpdated: new Date().toISOString() };
      }

      // Transform matches to expected format
      const transformedMatches = matches.map(match => {
        // Ensure we have a valid date
        const matchDate = match.match_date || match.api_data?.date;
        const dateObj = matchDate ? new Date(matchDate) : null;
        
        // Create ISO date string with time if available
        let utcDate = matchDate;
        if (dateObj && match.api_data?.time) {
          const [hours, minutes] = match.api_data.time.split(':');
          dateObj.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0);
          utcDate = dateObj.toISOString();
        }
        
        return {
          id: parseInt(match.id) || match.id,
          competition_id: parseInt(match.league_id) || match.league_id,
          home_team: match.home_team || { id: match.home_team_id, name: 'Unknown', logo: '/teams/default.png' },
          away_team: match.away_team || { id: match.away_team_id, name: 'Unknown', logo: '/teams/default.png' },
          home_score: match.home_score,
          away_score: match.away_score,
          utc_date: utcDate,
          match_date: match.match_date,
          date: utcDate, // Add date field for consistency
          status: match.status,
          venue: match.venue,
          league: match.leagues
        };
      });

      // Get top 8 leagues with upcoming games
      // If no upcoming games, just get leagues with any matches in the range
      const topLeagueIds = getTopLeaguesWithUpcomingGames(transformedMatches, {
        start: dateRange.start,  // Use full date range instead of just future
        end: dateRange.end
      });

      // Filter matches to only include top 8 leagues
      const filteredMatches = transformedMatches.filter(match => 
        topLeagueIds.includes(match.competition_id)
      );

      // If no matches found with priority leagues, return all matches
      const finalMatches = filteredMatches.length > 0 ? filteredMatches : transformedMatches;
      const finalLeagues = topLeagueIds.length > 0 ? topLeagueIds : 
        [...new Set(transformedMatches.map(m => m.competition_id))].slice(0, 8);

      return {
        matches: finalMatches,
        leagues: finalLeagues.map(id => {
          const league = Object.values(LEAGUE_PRIORITIES).find(l => l.id === id);
          const matchLeague = transformedMatches.find(m => m.competition_id === id)?.league;
          return {
            id,
            name: league?.name || matchLeague?.name || 'Unknown League',
            tier: league?.tier || 4
          };
        }),
        dateRange: {
          start: this.formatDateForApi(dateRange.start),
          end: this.formatDateForApi(dateRange.end)
        },
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('[DatabaseMatchService] Error:', error);
      return { matches: [], leagues: [], dateRange: {}, lastUpdated: new Date().toISOString() };
    }
  }

  async getForYouMatches() {
    const dateRange = this.getDateRange(7, 0); // Last 7 days
    
    try {
      // Fetch matches from database
      const { data: matches, error } = await supabase
        .from('matches')
        .select(`
          id,
          league_id,
          home_team_id,
          away_team_id,
          home_score,
          away_score,
          match_date,
          status,
          venue,
          season,
          round,
          has_highlights,
          api_data,
          home_team:teams!home_team_id (
            id,
            name,
            logo
          ),
          away_team:teams!away_team_id (
            id,
            name,
            logo
          ),
          leagues!inner (
            id,
            name,
            logo
          )
        `)
        .gte('match_date', this.formatDateForApi(dateRange.start))
        .lte('match_date', this.formatDateForApi(dateRange.end))
        .order('match_date', { ascending: true });

      if (error || !matches) {
        console.error('[DatabaseMatchService] Error fetching matches:', error);
        return { matches: [], dateRange: {}, lastUpdated: new Date().toISOString() };
      }

      // Transform matches
      const transformedMatches = matches.map(match => {
        // Ensure we have a valid date
        const matchDate = match.match_date || match.api_data?.date;
        const dateObj = matchDate ? new Date(matchDate) : null;
        
        // Create ISO date string with time if available
        let utcDate = matchDate;
        if (dateObj && match.api_data?.time) {
          const [hours, minutes] = match.api_data.time.split(':');
          dateObj.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0);
          utcDate = dateObj.toISOString();
        }
        
        return {
          id: parseInt(match.id) || match.id,
          competition_id: parseInt(match.league_id) || match.league_id,
          home_team_id: parseInt(match.home_team_id) || match.home_team_id,
          away_team_id: parseInt(match.away_team_id) || match.away_team_id,
          home_team: match.home_team || { id: match.home_team_id, name: 'Unknown', logo: '/teams/default.png' },
          away_team: match.away_team || { id: match.away_team_id, name: 'Unknown', logo: '/teams/default.png' },
          home_score: match.home_score,
          away_score: match.away_score,
          utc_date: utcDate,
          match_date: match.match_date,
          date: utcDate, // Add date field for consistency
          status: match.status,
          venue: match.venue,
          stage: match.round,
          league: match.leagues
        };
      });

      // Fetch standings for all leagues
      const leagueIds = [...new Set(transformedMatches.map(m => m.competition_id))];
      const standings = {};
      const teamForm = {};

      await Promise.all(
        leagueIds.map(async (leagueId) => {
          const { data: standingsData } = await supabase
            .from('standings')
            .select('*')
            .eq('league_id', leagueId)
            .order('position', { ascending: true });

          if (standingsData) {
            standings[leagueId] = standingsData;
            
            // Calculate team form from standings
            teamForm[leagueId] = standingsData.map(team => ({
              team_id: team.team_id,
              matches_played: team.played || 0,
              wins: team.won || 0,
              draws: team.drawn || 0,
              losses: team.lost || 0,
              form: team.form || ''
            }));
          }
        })
      );

      // Get top weighted matches
      const topMatches = getTopWeightedMatches(
        transformedMatches,
        standings,
        teamForm,
        LEAGUE_PRIORITIES,
        5 // Top 5 matches
      );

      return {
        matches: topMatches,
        dateRange: {
          start: this.formatDateForApi(dateRange.start),
          end: this.formatDateForApi(dateRange.end)
        },
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('[DatabaseMatchService] Error:', error);
      return { matches: [], dateRange: {}, lastUpdated: new Date().toISOString() };
    }
  }
}

export default DatabaseMatchService;