import axios from 'axios';
import { getFromCache, setInCache } from '../cache.js';
import { LEAGUE_PRIORITIES, getTopLeaguesWithUpcomingGames } from '../utils/leaguePriority.js';
import { calculateMatchWeight, getTopWeightedMatches } from '../utils/matchWeighing.js';

const HIGHLIGHTLY_API_URL = 'https://soccer.highlightly.net';
const HIGHLIGHTLY_API_KEY = process.env.HIGHLIGHTLY_API_KEY;

// Highlightly league ID mapping
const HIGHLIGHTLY_LEAGUE_IDS = {
  2021: '33973',   // Premier League
  2014: '119924',  // La Liga
  2019: '115669',  // Serie A
  2002: '67162',   // Bundesliga
  2015: '52695',   // Ligue 1
  2001: '2486',    // UEFA Champions League
  2018: '12829',   // UEFA Europa League
  2152: '155375',  // UEFA Europa Conference League
  2016: '30387',   // Championship
  2017: '102887',  // Primeira Liga
  2003: '35425',   // Eredivisie
  2013: '17401',   // Brazilian Serie A
  2022: '4088',    // Argentine Primera Division
  2024: '83462',   // Mexican Liga MX
  2029: '131823',  // Super Lig
  2023: '82653',   // MLS
};

class MatchService {
  constructor() {
    this.apiHeaders = {
      'x-api-key': HIGHLIGHTLY_API_KEY,
      'x-rapidapi-key': HIGHLIGHTLY_API_KEY,
    };
  }

  async callHighlightlyApi(path) {
    const requestUrl = `${HIGHLIGHTLY_API_URL}/${path}`;
    try {
      console.log(`[MatchService] Calling: ${requestUrl}`);
      const response = await axios.get(requestUrl, {
        headers: this.apiHeaders,
        timeout: 30000,
      });
      return response.data;
    } catch (error) {
      console.error(`[MatchService] Error fetching ${requestUrl}:`, error.message);
      return null;
    }
  }

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

  async fetchMatchesForDateRange(leagueId, dateRange) {
    const matches = [];
    const currentDate = new Date(dateRange.start);
    const season = new Date().getFullYear().toString();
    
    while (currentDate <= dateRange.end) {
      const dateStr = this.formatDateForApi(currentDate);
      const cacheKey = `/matches/${leagueId}/${dateStr}`;
      
      // Check cache first
      let dayMatches = await getFromCache(cacheKey);
      
      if (!dayMatches) {
        const highlightlyId = HIGHLIGHTLY_LEAGUE_IDS[leagueId];
        if (highlightlyId) {
          const data = await this.callHighlightlyApi(
            `matches?leagueId=${highlightlyId}&date=${dateStr}&season=${season}`
          );
          
          if (data && data.data) {
            dayMatches = data.data.map(match => ({
              ...match,
              competition_id: leagueId // Use our internal league ID
            }));
            
            // Cache for 5 minutes for today's matches, 1 hour for others
            const ttl = dateStr === this.formatDateForApi(new Date()) ? 300 : 3600;
            await setInCache(cacheKey, dayMatches, ttl);
          }
        }
      }
      
      if (dayMatches && dayMatches.length > 0) {
        matches.push(...dayMatches);
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return matches;
  }

  async getTopLeaguesMatches() {
    const dateRange = this.getDateRange(1, 5); // -1 to +5 days
    const allMatches = [];
    
    // Fetch matches for all priority leagues
    const leagueIds = Object.values(LEAGUE_PRIORITIES).map(league => league.id);
    
    // Batch fetch matches
    await Promise.all(
      leagueIds.map(async (leagueId) => {
        const matches = await this.fetchMatchesForDateRange(leagueId, dateRange);
        allMatches.push(...matches);
      })
    );
    
    // Get top 8 leagues with upcoming games
    const topLeagueIds = getTopLeaguesWithUpcomingGames(allMatches, {
      start: new Date(),
      end: dateRange.end
    });
    
    // Filter matches to only include top 8 leagues
    const filteredMatches = allMatches.filter(match => 
      topLeagueIds.includes(match.competition_id)
    );
    
    // Sort by date
    filteredMatches.sort((a, b) => 
      new Date(a.utc_date).getTime() - new Date(b.utc_date).getTime()
    );
    
    return {
      matches: filteredMatches,
      leagues: topLeagueIds.map(id => {
        const league = Object.values(LEAGUE_PRIORITIES).find(l => l.id === id);
        return {
          id,
          name: league?.name || 'Unknown League',
          tier: league?.tier || 4
        };
      }),
      dateRange: {
        start: this.formatDateForApi(dateRange.start),
        end: this.formatDateForApi(dateRange.end)
      },
      lastUpdated: new Date().toISOString()
    };
  }

  async getForYouMatches() {
    const dateRange = this.getDateRange(7, 0); // Last 7 days
    const allMatches = [];
    const standings = {};
    const teamForm = {};
    
    // Fetch matches, standings, and team form for all leagues
    await Promise.all(
      Object.values(LEAGUE_PRIORITIES).map(async (league) => {
        // Fetch matches
        const matches = await this.fetchMatchesForDateRange(league.id, dateRange);
        allMatches.push(...matches);
        
        // Fetch standings
        const standingsCacheKey = `/standings/${league.id}`;
        let leagueStandings = await getFromCache(standingsCacheKey);
        
        if (!leagueStandings) {
          const highlightlyId = HIGHLIGHTLY_LEAGUE_IDS[league.id];
          if (highlightlyId) {
            const season = new Date().getFullYear().toString();
            const data = await this.callHighlightlyApi(
              `standings?leagueId=${highlightlyId}&season=${season}`
            );
            
            if (data && data.data) {
              leagueStandings = data.data;
              await setInCache(standingsCacheKey, leagueStandings, 1800); // 30 minutes
            }
          }
        }
        
        if (leagueStandings) {
          standings[league.id] = leagueStandings;
        }
        
        // Fetch team form
        const formCacheKey = `/team-form/${league.id}`;
        let leagueTeamForm = await getFromCache(formCacheKey);
        
        if (!leagueTeamForm && leagueStandings) {
          // Calculate form from standings data
          leagueTeamForm = leagueStandings.map(team => ({
            team_id: team.team_id,
            matches_played: team.played,
            wins: team.won,
            draws: team.drawn,
            losses: team.lost,
            goals_for: team.goals_for,
            goals_against: team.goals_against,
            form: team.form || ''
          }));
          
          await setInCache(formCacheKey, leagueTeamForm, 1800); // 30 minutes
        }
        
        if (leagueTeamForm) {
          teamForm[league.id] = leagueTeamForm;
        }
      })
    );
    
    // Get top weighted matches
    const topMatches = getTopWeightedMatches(
      allMatches,
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
  }

  async scanPreMatchLineups() {
    console.log('[MatchService] Scanning for matches starting in ~55 minutes...');
    
    const now = new Date();
    const targetTime = new Date(now.getTime() + 55 * 60 * 1000); // 55 minutes from now
    const window = 5 * 60 * 1000; // 5 minute window
    
    const matches = await this.getTopLeaguesMatches();
    const upcomingMatches = matches.matches.filter(match => {
      const matchTime = new Date(match.utc_date);
      const timeDiff = matchTime.getTime() - targetTime.getTime();
      return Math.abs(timeDiff) <= window;
    });
    
    console.log(`[MatchService] Found ${upcomingMatches.length} matches starting soon`);
    
    // Fetch lineups for each match
    await Promise.all(
      upcomingMatches.map(async (match) => {
        const cacheKey = `/lineups/${match.id}`;
        const existing = await getFromCache(cacheKey);
        
        if (!existing) {
          const data = await this.callHighlightlyApi(`matches/${match.id}/lineups`);
          if (data) {
            await setInCache(cacheKey, data, 7200); // Cache for 2 hours
            console.log(`[MatchService] Fetched lineups for match ${match.id}`);
          }
        }
      })
    );
  }

  async updateLiveMatches() {
    console.log('[MatchService] Updating live matches...');
    
    const matches = await this.getTopLeaguesMatches();
    const liveMatches = matches.matches.filter(match => 
      match.status === 'LIVE' || 
      match.status === 'IN_PLAY' ||
      match.status === 'HALF_TIME'
    );
    
    console.log(`[MatchService] Found ${liveMatches.length} live matches`);
    
    // Update each live match
    await Promise.all(
      liveMatches.map(async (match) => {
        const data = await this.callHighlightlyApi(`matches/${match.id}`);
        if (data) {
          const cacheKey = `/live-match/${match.id}`;
          await setInCache(cacheKey, data, 60); // Cache for 1 minute
          console.log(`[MatchService] Updated live match ${match.id}`);
        }
      })
    );
  }

  async scanForHighlights() {
    console.log('[MatchService] Scanning for new highlights...');
    
    const dateRange = this.getDateRange(2, 0); // Last 2 days
    const matches = await this.getTopLeaguesMatches();
    
    const finishedMatches = matches.matches.filter(match => {
      const matchDate = new Date(match.utc_date);
      return (
        matchDate >= dateRange.start &&
        matchDate <= dateRange.end &&
        (match.status === 'FINISHED' || match.status === 'FT')
      );
    });
    
    console.log(`[MatchService] Checking ${finishedMatches.length} finished matches for highlights`);
    
    let newHighlights = 0;
    
    await Promise.all(
      finishedMatches.map(async (match) => {
        const cacheKey = `/highlights/${match.id}`;
        const existing = await getFromCache(cacheKey);
        
        if (!existing || !existing.hasHighlights) {
          const data = await this.callHighlightlyApi(`matches/${match.id}/highlights`);
          
          if (data && data.data && data.data.length > 0) {
            await setInCache(cacheKey, {
              hasHighlights: true,
              highlights: data.data,
              lastChecked: new Date().toISOString()
            }, 86400); // Cache for 24 hours once found
            
            newHighlights++;
            console.log(`[MatchService] Found highlights for match ${match.id}`);
          } else {
            // Cache the "no highlights" state for a shorter time
            await setInCache(cacheKey, {
              hasHighlights: false,
              lastChecked: new Date().toISOString()
            }, 1800); // Check again in 30 minutes
          }
        }
      })
    );
    
    console.log(`[MatchService] Found ${newHighlights} new highlights`);
  }
}

export default MatchService;