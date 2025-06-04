import { MatchHighlight, LeagueWithMatches, TeamDetails } from '@/types';
import * as mockService from './highlightService';

// Highlightly API client instance
const highlightlyClient = {
  async getLeagues(params: { limit: string; offset: string }) {
    const url = `http://localhost:3001/api/highlightly/leagues?limit=${params.limit}&offset=${params.offset}`;
    const response = await fetch(url);
    return response.json();
  },

  async getMatches(params: { leagueId?: string; date?: string; limit?: string }) {
    let url = 'http://localhost:3001/api/highlightly/matches?';
    if (params.leagueId) url += `leagueId=${params.leagueId}&`;
    if (params.date) url += `date=${params.date}&`;
    if (params.limit) url += `limit=${params.limit}&`;
    const response = await fetch(url);
    return response.json();
  },

  async getLeagueById(leagueId: string) {
    const url = `http://localhost:3001/api/highlightly/leagues/${leagueId}`;
    const response = await fetch(url);
    return response.json();
  },

  async getMatchById(matchId: string) {
    const url = `http://localhost:3001/api/highlightly/matches/${matchId}`;
    const response = await fetch(url);
    return response.json();
  },

  async getHighlights(params: { date?: string; limit?: string }) {
    let url = 'http://localhost:3001/api/highlightly/highlights?';
    if (params.date) url += `date=${params.date}&`;
    if (params.limit) url += `limit=${params.limit}&`;
    const response = await fetch(url);
    return response.json();
  }
};

export const highlightlyService = {
  /**
   * Get recommended highlights - fallback to mock service
   */
  async getRecommendedHighlights(): Promise<MatchHighlight[]> {
    console.log('[Highlightly] Recommended highlights not implemented, falling back to mock service');
    return mockService.getRecommendedHighlights();
  },

  /**
   * Get recent matches for top priority leagues
   * Recent matches include: matches from last 7 days + today's matches
   */
  async getRecentMatchesForTopLeagues(): Promise<LeagueWithMatches[]> {
    console.log('[Highlightly] Starting getRecentMatchesForTopLeagues');
    
    try {
      const PRIORITY_LEAGUE_IDS = [
        '2486',   // UEFA Champions League
        '3337',   // UEFA Europa League  
        '4188',   // Euro Championship
        '5890',   // Africa Cup of Nations
        '11847',  // CONMEBOL Libertadores
        '13549',  // FIFA Club World Cup (excluded in filtering)
        '8443',   // Copa America
        '33973',  // Premier League
        '52695',  // Ligue 1
        '67162',  // Bundesliga
        '119924', // La Liga (Spain)
        '16102',  // AFC Cup
        '115669', // Serie A (Italy)
        '1635'    // FIFA World Cup
      ];
      
      // First, get all priority leagues by pagination
      let priorityLeaguesData: any[] = [];
      const limit = 100;
      let offset = 0;
      
      while (offset < 1000) {
        try {
          const response = await highlightlyClient.getLeagues({
            limit: limit.toString(),
            offset: offset.toString()
          });
          
          if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
            break;
          }
          
          // Find priority leagues in this batch
          const priorityLeaguesInBatch = response.data.filter((league: any) => 
            PRIORITY_LEAGUE_IDS.includes(league.id?.toString())
          );
          
          priorityLeaguesData.push(...priorityLeaguesInBatch);
          
          if (response.data.length < limit) break;
          offset += limit;
          
          // Early exit if we've found all priority leagues
          const foundIds = new Set(priorityLeaguesData.map(l => l.id.toString()));
          const missingIds = PRIORITY_LEAGUE_IDS.filter(id => !foundIds.has(id));
          if (missingIds.length === 0) {
            break;
          }
        } catch (error) {
          console.error(`[Highlightly] Error fetching leagues at offset ${offset}:`, error);
          break;
        }
      }
      
      // Exclude FIFA Club World Cup
      priorityLeaguesData = priorityLeaguesData.filter((league: any) => {
        const name = league.name?.toLowerCase() || '';
        if (name.includes('fifa club world cup') || name.includes('club world cup')) {
          return false;
        }
        return true;
      });
      
      console.log(`[Highlightly] Found ${priorityLeaguesData.length} priority leagues`);
      
      if (priorityLeaguesData.length === 0) {
        console.error('[Highlightly] No priority leagues found, returning empty array');
        return [];
      }
      
      // Calculate date range: last 7 days + today
      const today = new Date();
      const endDate = today; // Today
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 7); // 7 days ago
      
      console.log(`[Highlightly] Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
      
      // Get recent matches for each priority league
      const leaguesWithMatches: LeagueWithMatches[] = [];
      
      for (const league of priorityLeaguesData.slice(0, 8)) {
        try {
          // Collect all matches from the date range
          let allRecentMatches: any[] = [];
          
          // For each day in the range, fetch matches
          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            
            try {
              const matchesResponse = await highlightlyClient.getMatches({
                leagueId: league.id.toString(),
                date: dateStr,
                limit: '25'
              });
              
              if (matchesResponse.data && Array.isArray(matchesResponse.data)) {
                allRecentMatches.push(...matchesResponse.data);
              }
            } catch (dayError) {
              // Continue with other dates
            }
          }
          
          if (allRecentMatches.length === 0) {
            continue;
          }
          
          // Filter for relevant matches:
          // 1. Finished matches (last 7 days)
          // 2. Today's matches (any status)
          const todayStr = today.toISOString().split('T')[0];
          
          const relevantMatches = allRecentMatches.filter((match: any) => {
            const matchDate = match.date ? new Date(match.date).toISOString().split('T')[0] : '';
            const isToday = matchDate === todayStr;
            
            const isFinished = 
              match.state?.description === 'Finished' ||
              match.state?.description === 'Finished after penalties' ||
              match.state?.description === 'Finished after extra time';
            
            const hasScore = 
              (match.state?.score?.current && match.state.score.current.includes(' - '));
            
            // Include: finished matches from any day, OR any matches from today
            return (isFinished && hasScore) || isToday;
          });
          
          if (relevantMatches.length === 0) {
            continue;
          }
          
          // Sort by date (most recent first) and take top 10
          const sortedMatches = relevantMatches
            .sort((a: any, b: any) => {
              const dateA = new Date(a.date || 0).getTime();
              const dateB = new Date(b.date || 0).getTime();
              return dateB - dateA; // Most recent first
            })
            .slice(0, 10);
          
          // Transform matches to our format
          const transformedMatches = sortedMatches.map((match: any) => {
            const matchDate = new Date(match.date || new Date());
            
            // Extract score
            let homeScore = 0;
            let awayScore = 0;
            
            if (match.state?.score?.current) {
              const scoreMatch = match.state.score.current.match(/(\d+)\s*-\s*(\d+)/);
              if (scoreMatch) {
                homeScore = parseInt(scoreMatch[1], 10);
                awayScore = parseInt(scoreMatch[2], 10);
              }
            }
            
            const homeTeam = {
              id: (match.homeTeam?.id || `home-${Date.now()}`).toString(),
              name: match.homeTeam?.name || 'Home Team',
              logo: match.homeTeam?.logo || '/teams/default.png'
            };
            
            const awayTeam = {
              id: (match.awayTeam?.id || `away-${Date.now()}`).toString(),
              name: match.awayTeam?.name || 'Away Team',
              logo: match.awayTeam?.logo || '/teams/default.png'
            };
            
            const matchId = (match.id || `match-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`).toString();
            
            // Determine match status
            let status = 'scheduled';
            if (match.state?.description) {
              const desc = match.state.description.toLowerCase();
              if (desc.includes('finished')) {
                status = 'finished';
              } else if (desc.includes('live') || desc.includes('playing') || desc.includes('in progress')) {
                status = 'live';
              }
            }
            
            return {
              id: matchId,
              homeTeam,
              awayTeam,
              date: matchDate.toISOString(),
              time: matchDate.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              }),
              status,
              score: {
                home: homeScore,
                away: awayScore
              },
              competition: {
                id: league.id.toString(),
                name: league.name,
                logo: league.logo || `/leagues/${league.name.toLowerCase().replace(/\s+/g, '-')}.png`
              }
            };
          });
          
          if (transformedMatches.length > 0) {
            leaguesWithMatches.push({
              id: league.id.toString(),
              name: league.name,
              logo: league.logo || `/leagues/${league.name.toLowerCase().replace(/\s+/g, '-')}.png`,
              matches: transformedMatches
            });
            
            console.log(`[Highlightly] ✅ Added ${transformedMatches.length} matches for ${league.name}`);
          }
          
        } catch (error) {
          console.error(`[Highlightly] Error fetching matches for ${league.name}:`, error);
          continue;
        }
      }
      
      console.log(`[Highlightly] Final result: ${leaguesWithMatches.length} leagues with matches`);
      
      return leaguesWithMatches;
      
    } catch (error) {
      console.error('[Highlightly] Error in getRecentMatchesForTopLeagues:', error);
      return [];
    }
  },

  /**
   * Get match by ID - fetch from Highlightly API
   */
  async getMatchById(id: string): Promise<MatchHighlight | null> {
    console.log(`[Highlightly] Fetching match by ID: ${id}`);
    
    try {
      // Try to get the match by ID directly
      console.log(`[Highlightly] 🔍 Making API call to: http://localhost:3001/api/highlightly/matches/${id}`);
      const matchResponse = await highlightlyClient.getMatchById(id);
      
      console.log(`[Highlightly] 📡 API Response:`, {
        isArray: Array.isArray(matchResponse),
        hasData: !!matchResponse,
        length: Array.isArray(matchResponse) ? matchResponse.length : 'not array',
        firstItemKeys: Array.isArray(matchResponse) && matchResponse.length > 0 ? Object.keys(matchResponse[0]) : 'no items'
      });
      
      // The API returns an array with the match data directly
      let match = null;
      if (Array.isArray(matchResponse) && matchResponse.length > 0) {
        match = matchResponse[0]; // Take the first item from the array
      } else if (matchResponse && !Array.isArray(matchResponse)) {
        match = matchResponse; // Direct object response
      }
      
      if (match) {
        console.log(`[Highlightly] 📋 Match data found:`, {
          id: match.id,
          homeTeam: match.homeTeam?.name,
          awayTeam: match.awayTeam?.name,
          date: match.date,
          hasScore: !!match.state?.score || !!match.score || !!match.goals,
          state: match.state?.description,
          // DEBUG: Check for highlights and lineups data
          videoUrl: match.videoUrl,
          highlights: match.highlights,
          videoHighlights: match.videoHighlights,
          lineups: match.lineups,
          hasLineups: !!match.lineups,
          lineupsKeys: match.lineups ? Object.keys(match.lineups) : 'no lineups',
          // Check all top-level keys to see what data is available
          allKeys: Object.keys(match).slice(0, 20) // First 20 keys for debugging
        });
        
        // Extract score from various possible formats
        let homeScore = 0;
        let awayScore = 0;
        
        if (match.state?.score?.current) {
          const scoreMatch = match.state.score.current.match(/(\d+)\s*-\s*(\d+)/);
          if (scoreMatch) {
            homeScore = parseInt(scoreMatch[1], 10);
            awayScore = parseInt(scoreMatch[2], 10);
          }
        } else if (match.score) {
          homeScore = match.score.home || 0;
          awayScore = match.score.away || 0;
        } else if (match.goals) {
          homeScore = match.goals.home || 0;
          awayScore = match.goals.away || 0;
        }
        
        // Transform the API response to our MatchHighlight format
        const transformedMatch: MatchHighlight = {
          id: match.id?.toString() || id,
          title: `${match.homeTeam?.name || 'Home'} vs ${match.awayTeam?.name || 'Away'}`,
          date: match.date || new Date().toISOString(),
          thumbnailUrl: '',
          videoUrl: match.videoUrl || match.highlights?.url || '', // Try multiple possible video fields
          duration: '00:00',
          views: 0,
          homeTeam: {
            id: (match.homeTeam?.id || 'home').toString(),
            name: match.homeTeam?.name || 'Home Team',
            logo: match.homeTeam?.logo || '/teams/default.png'
          },
          awayTeam: {
            id: (match.awayTeam?.id || 'away').toString(),
            name: match.awayTeam?.name || 'Away Team', 
            logo: match.awayTeam?.logo || '/teams/default.png'
          },
          score: {
            home: homeScore,
            away: awayScore
          },
          competition: {
            id: (match.league?.id || match.competition?.id || 'unknown').toString(),
            name: match.league?.name || match.competition?.name || 'Unknown Competition',
            logo: match.league?.logo || match.competition?.logo || '/leagues/default.png'
          }
        };

        // If it's an EnhancedMatchHighlight, add additional properties
        const enhancedMatch = transformedMatch as any;
        enhancedMatch.events = match.events || [];
        enhancedMatch.statistics = match.statistics || [];
        
        // Create lineups from available data (many matches don't have full lineups available)
        enhancedMatch.lineups = null; // Most matches don't have detailed lineups in the API
        
        // Add rich match data from Highlightly API
        enhancedMatch.news = match.news || [];
        enhancedMatch.predictions = match.predictions || null;
        
        // Enhanced team data - topPlayers and shots are available
        if (match.homeTeam) {
          enhancedMatch.homeTeam.topPlayers = match.homeTeam.topPlayers || [];
          enhancedMatch.homeTeam.shots = match.homeTeam.shots || [];
        }
        if (match.awayTeam) {
          enhancedMatch.awayTeam.topPlayers = match.awayTeam.topPlayers || [];
          enhancedMatch.awayTeam.shots = match.awayTeam.shots || [];
        }
        
        // Additional match metadata
        enhancedMatch.round = match.round || null;
        enhancedMatch.country = match.country || null;
        enhancedMatch.state = match.state || null;
        enhancedMatch.venue = match.venue || null;
        enhancedMatch.referee = match.referee || null;
        
        // Video highlights - check multiple possible sources
        const possibleVideoSources = [
          match.videoUrl,
          match.highlights?.url,
          match.highlights?.video,
          match.video?.url,
          match.streams?.url
        ].filter(Boolean);
        
        if (possibleVideoSources.length > 0) {
          enhancedMatch.videoUrl = possibleVideoSources[0];
        }

        console.log(`[Highlightly] ✅ Enhanced match data:`, {
          hasEvents: enhancedMatch.events.length > 0,
          hasStatistics: enhancedMatch.statistics.length > 0,
          hasNews: enhancedMatch.news.length > 0,
          hasPredictions: !!enhancedMatch.predictions,
          hasTopPlayers: (enhancedMatch.homeTeam.topPlayers?.length || 0) + (enhancedMatch.awayTeam.topPlayers?.length || 0),
          hasShots: (enhancedMatch.homeTeam.shots?.length || 0) + (enhancedMatch.awayTeam.shots?.length || 0),
          hasVideoUrl: !!enhancedMatch.videoUrl,
          hasVenue: !!enhancedMatch.venue,
          round: enhancedMatch.round
        });

        console.log(`[Highlightly] ✅ Successfully fetched match: ${transformedMatch.homeTeam.name} vs ${transformedMatch.awayTeam.name} (${homeScore}-${awayScore})`);
        return transformedMatch;
      }
      
      console.log(`[Highlightly] ❌ No match data found for ID: ${id} - response was empty or missing data`);
      
    } catch (error) {
      console.error(`[Highlightly] 🚨 API Error fetching match ${id}:`, error);
      
      // If the error is a 404 or similar, it means the match doesn't exist in the API
      if (error && typeof error === 'object' && 'status' in error) {
        console.log(`[Highlightly] 📊 Error status: ${(error as any).status}`);
      }
    }
    
    // If direct match fetch fails, try searching through recent matches
    console.log(`[Highlightly] 🔄 Trying to find match ${id} in recent matches...`);
    try {
      const recentMatches = await this.getRecentMatchesForTopLeagues();
      
      // Search through all recent matches to find the one with matching ID
      for (const league of recentMatches) {
        for (const match of league.matches) {
          if (match.id === id) {
            console.log(`[Highlightly] ✅ Found match ${id} in recent matches for ${league.name}`);
            
            // Transform to MatchHighlight format
            const foundMatch: MatchHighlight = {
              id: match.id,
              title: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
              date: match.date,
              thumbnailUrl: '',
              videoUrl: '', // Recent matches might not have video URLs
              duration: '00:00',
              views: 0,
              homeTeam: match.homeTeam,
              awayTeam: match.awayTeam,
              score: match.score,
              competition: match.competition
            };
            
            // Add enhanced properties
            const enhancedFoundMatch = foundMatch as any;
            enhancedFoundMatch.events = [];
            enhancedFoundMatch.statistics = [];
            enhancedFoundMatch.lineups = null;
            
            return foundMatch;
          }
        }
      }
      
      console.log(`[Highlightly] ❌ Match ${id} not found in recent matches either`);
      console.log(`[Highlightly] 📊 Recent matches summary:`, {
        totalLeagues: recentMatches.length,
        totalMatches: recentMatches.reduce((sum, league) => sum + league.matches.length, 0),
        matchIds: recentMatches.flatMap(league => league.matches.map(m => m.id)).slice(0, 10) // First 10 IDs
      });
      
      return null;
      
    } catch (searchError) {
      console.error(`[Highlightly] Error searching for match ${id}:`, searchError);
      return null;
    }
  },

  /**
   * Get team highlights - simplified version
   */
  async getTeamHighlights(teamId: string): Promise<MatchHighlight[]> {
    console.log(`[Highlightly] getTeamHighlights not implemented for ${teamId}, falling back to mock service`);
    return mockService.getTeamHighlights(teamId);
  },

  /**
   * Get team details - fallback to mock service
   */
  async getTeamDetails(teamId: string): Promise<TeamDetails | null> {
    console.log(`[Highlightly] getTeamDetails not implemented for ${teamId}, falling back to mock service`);
    return mockService.getTeamDetails(teamId);
  },

  /**
   * Search highlights - simplified version
   */
  async searchHighlights(query: string): Promise<MatchHighlight[]> {
    console.log(`[Highlightly] searchHighlights not implemented for "${query}", falling back to mock service`);
    return mockService.searchHighlights(query);
  }
};
