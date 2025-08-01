import axios from 'axios';
import { getFromCache, setInCache } from '../cache.js';
import { LEAGUE_PRIORITIES, getTopLeaguesWithUpcomingGames } from '../utils/leaguePriority.js';
import { calculateMatchWeight, getTopWeightedMatches } from '../utils/matchWeighing.js';

// Use database API endpoint instead of direct Highlightly API
const DATABASE_API_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}/api/database-matches`
  : 'http://localhost:3000/api/database-matches';

class DatabaseMatchServiceNew {
  getDateRange(daysBack = 1, daysForward = 5) {
    const now = new Date();
    // Force use 2024 if system shows 2025
    if (now.getFullYear() === 2025) {
      now.setFullYear(2024);
    }
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

  async fetchFromDatabase(params) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `${DATABASE_API_URL}?${queryString}`;
      
      console.log(`[DatabaseMatchServiceNew] Fetching from: ${url}`);
      const response = await axios.get(url, { timeout: 30000 });
      
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('[DatabaseMatchServiceNew] Error fetching from database:', error.message);
      return [];
    }
  }

  async getTopLeaguesMatches() {
    const dateRange = this.getDateRange(1, 5); // -1 to +5 days
    const cacheKey = `/database/top-leagues/${this.formatDateForApi(dateRange.start)}/${this.formatDateForApi(dateRange.end)}`;
    
    // Check cache first
    const cached = await getFromCache(cacheKey);
    if (cached) {
      console.log('[DatabaseMatchServiceNew] Returning cached top leagues matches');
      return cached;
    }
    
    try {
      // Fetch matches from database for date range
      const matches = await this.fetchFromDatabase({
        startDate: this.formatDateForApi(dateRange.start),
        endDate: this.formatDateForApi(dateRange.end),
        limit: 500
      });
      
      console.log(`[DatabaseMatchServiceNew] Fetched ${matches.length} matches from database`);
      
      // Transform matches to expected format
      const transformedMatches = matches.map(match => {
        // Ensure we have a valid date
        const matchDate = match.date || match.match_date;
        const dateObj = matchDate ? new Date(matchDate) : null;
        
        // Create ISO date string with time if available
        let utcDate = matchDate;
        if (dateObj && match.time) {
          const [hours, minutes] = match.time.split(':');
          dateObj.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0);
          utcDate = dateObj.toISOString();
        }
        
        return {
          id: match.id,
          competition_id: match.league?.id || match.league_id,
          home_team: match.homeTeam || { id: match.home_team_id, name: 'Unknown', logo: '' },
          away_team: match.awayTeam || { id: match.away_team_id, name: 'Unknown', logo: '' },
          home_score: match.score?.home || match.home_score || 0,
          away_score: match.score?.away || match.away_score || 0,
          utc_date: utcDate,
          match_date: matchDate,
          date: utcDate,
          status: match.status?.long || match.status?.description || match.status || 'Scheduled',
          venue: match.venue,
          league: match.league || match.competition
        };
      });
      
      // Get top 8 leagues with upcoming games
      const topLeagueIds = getTopLeaguesWithUpcomingGames(transformedMatches, {
        start: dateRange.start,
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
      
      const result = {
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
      
      // Cache for 5 minutes
      await setInCache(cacheKey, result, 300);
      
      return result;
    } catch (error) {
      console.error('[DatabaseMatchServiceNew] Error in getTopLeaguesMatches:', error);
      return { matches: [], leagues: [], dateRange: {}, lastUpdated: new Date().toISOString() };
    }
  }

  async getForYouMatches() {
    const dateRange = this.getDateRange(7, 0); // Last 7 days
    const cacheKey = `/database/for-you/${this.formatDateForApi(dateRange.start)}/${this.formatDateForApi(dateRange.end)}`;
    
    // Check cache first
    const cached = await getFromCache(cacheKey);
    if (cached) {
      console.log('[DatabaseMatchServiceNew] Returning cached for-you matches');
      return cached;
    }
    
    try {
      // Fetch matches from database
      const matches = await this.fetchFromDatabase({
        startDate: this.formatDateForApi(dateRange.start),
        endDate: this.formatDateForApi(dateRange.end),
        limit: 200
      });
      
      // Transform matches
      const transformedMatches = matches.map(match => {
        const matchDate = match.date || match.match_date;
        const dateObj = matchDate ? new Date(matchDate) : null;
        
        let utcDate = matchDate;
        if (dateObj && match.time) {
          const [hours, minutes] = match.time.split(':');
          dateObj.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0);
          utcDate = dateObj.toISOString();
        }
        
        return {
          id: match.id,
          competition_id: match.league?.id || match.league_id,
          home_team_id: match.homeTeam?.id || match.home_team_id,
          away_team_id: match.awayTeam?.id || match.away_team_id,
          home_team: match.homeTeam || { id: match.home_team_id, name: 'Unknown', logo: '' },
          away_team: match.awayTeam || { id: match.away_team_id, name: 'Unknown', logo: '' },
          home_score: match.score?.home || match.home_score || 0,
          away_score: match.score?.away || match.away_score || 0,
          utc_date: utcDate,
          match_date: matchDate,
          date: utcDate,
          status: match.status?.long || match.status?.description || match.status || 'Scheduled',
          venue: match.venue,
          stage: match.round,
          league: match.league || match.competition
        };
      });
      
      // For now, return top 5 matches sorted by date
      // In the future, we can add more sophisticated logic here
      const topMatches = transformedMatches
        .sort((a, b) => new Date(b.utc_date).getTime() - new Date(a.utc_date).getTime())
        .slice(0, 5);
      
      const result = {
        matches: topMatches,
        dateRange: {
          start: this.formatDateForApi(dateRange.start),
          end: this.formatDateForApi(dateRange.end)
        },
        lastUpdated: new Date().toISOString()
      };
      
      // Cache for 10 minutes
      await setInCache(cacheKey, result, 600);
      
      return result;
    } catch (error) {
      console.error('[DatabaseMatchServiceNew] Error in getForYouMatches:', error);
      return { matches: [], dateRange: {}, lastUpdated: new Date().toISOString() };
    }
  }

  async scanPreMatchLineups() {
    console.log('[DatabaseMatchServiceNew] Lineup scanning should be handled by cron job');
  }

  async updateLiveMatches() {
    console.log('[DatabaseMatchServiceNew] Live match updates should be handled by cron job');
  }

  async scanForHighlights() {
    console.log('[DatabaseMatchServiceNew] Highlight scanning should be handled by cron job');
  }
}

export default DatabaseMatchServiceNew;