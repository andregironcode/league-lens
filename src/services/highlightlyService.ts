import { highlightlyClient } from '@/integrations/highlightly/client';
import type { MatchHighlight, League, Team, TeamDetails, Fixture, TableRow } from '@/types';

// Import mock service for fallback
import * as mockService from './highlightService';

/**
 * Service layer for Highlightly API integration
 * This service transforms Highlightly API data to match the application's data models
 */
export const highlightlyService = {
  /**
   * Get recommended highlights
   */
  async getRecommendedHighlights(): Promise<MatchHighlight[]> {
    try {
      // Get date from a week ago in YYYY-MM-DD format to ensure we have highlights available
      const date = new Date();
      date.setDate(date.getDate() - 7); // Go back 7 days
      const formattedDate = date.toISOString().split('T')[0];
      
      // Get highlights from the API with required parameters
      const response = await highlightlyClient.getHighlights({
        date: formattedDate, // Required primary parameter
        limit: '10', // Secondary parameter
        offset: '0' // Secondary parameter
      });

      if (!response.data || !Array.isArray(response.data)) {
        console.error('Invalid highlights response format:', response);
        console.log('[Highlightly] Falling back to mock data for recommended highlights');
        return mockService.getRecommendedHighlights();
      }

      // Transform API data to match our application model
      return response.data.map((highlight: any): MatchHighlight => {
        // Extract teams from the title
        const titleParts = highlight.title.split(' vs ');
        const homeTeamName = titleParts[0]?.trim() || 'Unknown Team';
        const awayTeamName = titleParts[1]?.trim() || 'Unknown Team';
        
        // Extract score if available in the title
        let homeScore = 0;
        let awayScore = 0;
        const scoreMatch = highlight.title.match(/(\d+)\s*-\s*(\d+)/);
        if (scoreMatch) {
          homeScore = parseInt(scoreMatch[1], 10);
          awayScore = parseInt(scoreMatch[2], 10);
        }

        // Format date
        const date = highlight.date ? new Date(highlight.date).toISOString() : new Date().toISOString();

        return {
          id: highlight.id || `highlight-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          title: highlight.title || 'Unnamed Highlight',
          date,
          thumbnailUrl: highlight.thumbnail || highlight.thumbnailUrl || 'https://via.placeholder.com/300x200?text=No+Thumbnail',
          videoUrl: highlight.url || highlight.embedUrl || '',
          duration: highlight.duration || '0:00',
          views: highlight.views || Math.floor(Math.random() * 10000),
          homeTeam: {
            id: `team-${homeTeamName.toLowerCase().replace(/\s+/g, '-')}`,
            name: homeTeamName,
            logo: highlight.competitionLogo || 'https://via.placeholder.com/50x50?text=Team'
          },
          awayTeam: {
            id: `team-${awayTeamName.toLowerCase().replace(/\s+/g, '-')}`,
            name: awayTeamName,
            logo: highlight.competitionLogo || 'https://via.placeholder.com/50x50?text=Team'
          },
          score: {
            home: homeScore,
            away: awayScore
          },
          competition: {
            id: highlight.competitionId || `comp-${Date.now()}`,
            name: highlight.competition || 'Unknown Competition',
            logo: highlight.competitionLogo || '/leagues/default.png'
          }
        };
      });
    } catch (error) {
      console.error('Error fetching recommended highlights:', error);
      console.log('[Highlightly] Falling back to mock data for recommended highlights');
      return mockService.getRecommendedHighlights();
    }
  },

  /**
   * Get league highlights organized by top leagues
   */
  /**
   * New implementation: Get matches for the 2025 season grouped by leagues
   * This uses the matches endpoint instead of leagues, as requested
   */
  async getMatchesBySeason(): Promise<League[]> {
    try {
      console.log('[Highlightly] Fetching matches for 2025 season');
      
      // Define major league IDs based on the API documentation
      const majorLeagues = {
        'Premier League': '33973',    // England
        'LaLiga': '2486',            // Spain
        'Serie A': '61205',          // Brazil
        'Italian Serie A': '94',     // Italy
        'Bundesliga': '67162',       // Germany
        'Ligue 1': '52695',          // France
        'Champions League': '2',     // UEFA
      };
      
      // Create league objects to store matches
      const leagueObjects: {[id: string]: League} = {};
      
      // Initialize league objects
      Object.entries(majorLeagues).forEach(([name, id]) => {
        leagueObjects[id] = {
          id,
          name,
          logo: `/leagues/${name.toLowerCase().replace(' ', '-')}.png`,
          highlights: []
        };
      });
      
      // First get available matches for 2025 season for each league
      console.log('[Highlightly] Getting matches for each league in the 2025 season');
      
      for (const [leagueName, leagueId] of Object.entries(majorLeagues)) {
        try {
          console.log(`[Highlightly] Fetching matches for ${leagueName} (ID: ${leagueId})`);
          
          // Get matches for this league for the 2025 season
          const matchesResponse = await highlightlyClient.getMatches({
            league: leagueId,
            season: '2025', // Specifically requested 2025 season
            limit: '10'
          });
          
          if (!matchesResponse.data || !Array.isArray(matchesResponse.data)) {
            console.log(`[Highlightly] No matches found for ${leagueName}`);
            continue;
          }
          
          console.log(`[Highlightly] Found ${matchesResponse.data.length} matches for ${leagueName}`);
          
          // For each match, fetch the associated highlights
          for (const match of matchesResponse.data) {
            if (match.id) {
              try {
                // Get highlights for this specific match
                const highlightsResponse = await highlightlyClient.getHighlights({
                  match: match.id.toString(),
                  limit: '5'
                });
                
                if (highlightsResponse.data && Array.isArray(highlightsResponse.data) && 
                    highlightsResponse.data.length > 0) {
                  
                  // Convert highlights to our format
                  const matchHighlights: MatchHighlight[] = highlightsResponse.data.map((h: any) => ({
                    id: h.id,
                    title: h.title || `${match.teams?.home?.name || 'Home'} vs ${match.teams?.away?.name || 'Away'}`,
                    description: h.description || '',
                    date: h.date || new Date().toISOString(),
                    thumbnailUrl: h.imgUrl || '',
                    videoUrl: h.url || '',
                    embedUrl: h.embedUrl || '',
                    competition: leagueName,
                    teams: {
                      home: {
                        name: match.teams?.home?.name || 'Home Team',
                        logo: match.teams?.home?.logo || ''
                      },
                      away: {
                        name: match.teams?.away?.name || 'Away Team',
                        logo: match.teams?.away?.logo || ''
                      }
                    },
                    score: match.score ? {
                      home: match.score.fulltime?.home || 0,
                      away: match.score.fulltime?.away || 0
                    } : undefined
                  }));
                  
                  // Add highlights to the league
                  leagueObjects[leagueId].highlights.push(...matchHighlights);
                  console.log(`[Highlightly] Added ${matchHighlights.length} highlights for match ${match.id}`);
                }
              } catch (error) {
                console.error(`[Highlightly] Error fetching highlights for match ${match.id}:`, error);
              }
            }
          }
          
        } catch (error) {
          console.error(`[Highlightly] Error fetching matches for league ${leagueName}:`, error);
        }
      }
      
      // Filter out leagues with no highlights
      const leaguesWithHighlights = Object.values(leagueObjects)
        .filter(league => league.highlights.length > 0);
      
      if (leaguesWithHighlights.length > 0) {
        console.log(`[Highlightly] Returning ${leaguesWithHighlights.length} leagues with highlights from matches for 2025 season`);
        return leaguesWithHighlights;
      }
      
      // Fallback to mock data if no highlights found
      console.log('[Highlightly] No matches with highlights found for 2025 season, falling back to mock data');
      return mockService.getLeagueHighlights();
      
    } catch (error) {
      console.error('[Highlightly] Error fetching matches by season:', error);
      console.log('[Highlightly] Falling back to mock data');
      return mockService.getLeagueHighlights();
    }
  },
  
  /**
   * Original implementation using leagues endpoint
   */
  async getLeagueHighlights(): Promise<League[]> {
    try {
      // Define top leagues to prioritize in specific order
      const topLeagueNames = [
        'Premier League', // England
        'LaLiga',        // Spain
        'La Liga',       // Alternative name
        'Serie A',       // Italy
        'Bundesliga',    // Germany
        'Ligue 1',       // France
        'Champions League',
        'UEFA Champions League'
      ];
      
      // Define exact league IDs for major leagues
      const topLeagueIds = {
        'Premier League': 33973,    // England
        'LaLiga': 2486,            // Spain
        'Serie A': 61205,          // Italy
        'Bundesliga': 67162,       // Germany
        'Ligue 1': 52695,          // France
        'Champions League': 2,     // UEFA Champions League
      };

      // Get date from a week ago in YYYY-MM-DD format to ensure we have highlights available
      const date = new Date();
      date.setDate(date.getDate() - 7); // Go back 7 days
      const formattedDate = date.toISOString().split('T')[0];
      
      // Step 1: Get all leagues
      console.log(`[Highlightly] Fetching available leagues...`);
      const leaguesResponse = await highlightlyClient.getLeagues();
      
      if (!leaguesResponse.data || !Array.isArray(leaguesResponse.data)) {
        console.error('Invalid leagues response format:', leaguesResponse);
        console.log('[Highlightly] Falling back to mock data for league highlights');
        return mockService.getLeagueHighlights();
      }
      
      // Log a sample of the first league to understand structure
      if (leaguesResponse.data.length > 0) {
        console.log(`[Highlightly] League data sample:`, JSON.stringify(leaguesResponse.data[0]).substring(0, 200) + '...');
      }
      
      console.log(`[Highlightly] Found ${leaguesResponse.data.length} leagues`);
      
      // Step 2: Prioritize top leagues
      const prioritizedLeagues = this.prioritizeLeagues(leaguesResponse.data, topLeagueNames, topLeagueIds);
      const topLeagues = prioritizedLeagues.slice(0, 6); // Get top 6 leagues to include LaLiga
      console.log(`[Highlightly] Top leagues: ${topLeagues.map(league => league.name).join(', ')}`);
      
      // Step 3: Fetch highlights for each top league
      const leaguesWithHighlights: League[] = [];
      
      // Step 3a: First fetch all highlights for the date
      console.log(`[Highlightly] Fetching all highlights for date: ${formattedDate}`);
      const allHighlightsResponse = await highlightlyClient.getHighlights({
        date: formattedDate,
        limit: '40' // Maximum allowed by the Highlightly API
      });
      
      if (!allHighlightsResponse.data || !Array.isArray(allHighlightsResponse.data)) {
        console.log('[Highlightly] No highlights found, falling back to mock data');
        return mockService.getLeagueHighlights();
      }
      
      // Log a sample highlight to understand structure
      if (allHighlightsResponse.data.length > 0) {
        console.log(`[Highlightly] Highlight sample structure:`, 
          JSON.stringify(allHighlightsResponse.data[0]).substring(0, 300) + '...');
      }
      
      // Step 3b: Process each league to find matches
      for (const league of topLeagues) {
        console.log(`[Highlightly] Processing league: ${league.name} (ID: ${league.id})`);
        
        // Filter highlights for this league
        const leagueHighlights = await this.fetchLeagueHighlights(league, formattedDate, allHighlightsResponse.data);
        
        if (leagueHighlights.length > 0) {
          leaguesWithHighlights.push({
            id: league.id,
            name: league.name,
            logo: league.logo || '/leagues/default.png',
            highlights: leagueHighlights
          });
          console.log(`[Highlightly] Added ${leagueHighlights.length} highlights for ${league.name}`);
        }
      }
      
      // Step 4: Return leagues with highlights
      if (leaguesWithHighlights.length > 0) {
        console.log(`[Highlightly] Returning ${leaguesWithHighlights.length} leagues with highlights`);
        return leaguesWithHighlights;
      }
      
      // Step 5: Fallback to general highlights if no league-specific highlights found
      console.log('[Highlightly] No league highlights found, trying general highlights');
      return this.fetchGeneralHighlights(formattedDate);
    } catch (error) {
      console.error('Error fetching league highlights:', error);
      console.log('[Highlightly] Falling back to mock data for league highlights');
      return mockService.getLeagueHighlights();
    }
  },

  /**
   * Helper function to prioritize leagues based on the predefined order
   */
  prioritizeLeagues(leagues: any[], priorityNames: string[], topLeagueIds: {[key: string]: number}): any[] {
    
    // Clone leagues to avoid modifying the original array
    const result = [...leagues];
    
    // Sort based on priority list
    result.sort((a, b) => {
      const aName = a.name?.toLowerCase() || '';
      const bName = b.name?.toLowerCase() || '';
      const aId = a.id?.toString();
      const bId = b.id?.toString();
      
      // Check if league ID matches any of our known top league IDs
      const aIsTopLeague = Object.values(topLeagueIds).some(id => id.toString() === aId);
      const bIsTopLeague = Object.values(topLeagueIds).some(id => id.toString() === bId);
      
      // If one is a top league and the other isn't, prioritize the top league
      if (aIsTopLeague && !bIsTopLeague) return -1;
      if (!aIsTopLeague && bIsTopLeague) return 1;
      
      // Find index in priority list (or Infinity if not found)
      const aIndex = priorityNames.findIndex(name => 
        aName.includes(name.toLowerCase()));
      const bIndex = priorityNames.findIndex(name => 
        bName.includes(name.toLowerCase()));
      
      // Sort by priority index (lower index means higher priority)
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1; // a is in priority list, b is not
      if (bIndex !== -1) return 1;  // b is in priority list, a is not
      
      // If neither is in priority list, sort alphabetically
      return aName.localeCompare(bName);
    });
    
    return result;
  },

  /**
   * Helper method to fetch highlights for a specific league
   * @param league The league object
   * @param formattedDate Formatted date string
   * @param highlightsData Optional pre-fetched highlights data
   */
  async fetchLeagueHighlights(
    league: any, 
    formattedDate: string, 
    highlightsData?: any[]
  ): Promise<MatchHighlight[]> {
    try {
      let highlights: any[] = [];
      
      // If highlights data was provided, use it, otherwise fetch it
      if (Array.isArray(highlightsData)) {
        console.log(`[Highlightly] Using pre-fetched highlights for ${league.name}`);
        highlights = highlightsData;
      } else {
        console.log(`[Highlightly] Fetching highlights for ${league.name}`);
        const response = await highlightlyClient.getHighlights({
          date: formattedDate,
          limit: '25'
        });

        if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
          return [];
        }
        
        highlights = response.data;
      }
      
      // Log the highlight structure to help debug
      if (highlights.length > 0) {
        console.log(`[Highlightly] Highlight structure sample:`, 
          JSON.stringify(highlights[0]).substring(0, 200) + '...');
      }

      // Define league name variations map for common leagues
      const leagueVariations: {[key: string]: string[]} = {
        // Premier League variations (England ID: 33973)
        '33973': ['premier league', 'epl', 'english premier league'],
        // LaLiga variations (Spain ID: 2486)
        '2486': ['laliga', 'la liga', 'spanish league', 'primera division'],
        // Serie A variations (Italy/Brazil - clarify with specific ID check)
        '61205': ['serie a', 'brazilian serie a', 'brasileirão', 'brasileirao'],
        // Italian Serie A should be a different ID - using the one from logs
        '94': ['serie a', 'italian serie a', 'seria a', 'calcio'],
        // Bundesliga variations 
        '67162': ['bundesliga', 'german bundesliga'],
        // Ligue 1 variations
        '52695': ['ligue 1', 'french ligue 1'],
        // Champions League variations (ID 2 from our research)
        '2': ['champions league', 'ucl', 'uefa champions league'],
      };
      
      // Get variations for this specific league
      const currentLeagueVariations = leagueVariations[league.id.toString()] || [];
      currentLeagueVariations.push(league.name.toLowerCase());
      
      console.log(`[Highlightly] Looking for league: ${league.name} with ID: ${league.id}`);
      console.log(`[Highlightly] Using name variations: ${currentLeagueVariations.join(', ')}`);

      // Filter highlights by league using multiple possible paths
      const leagueHighlights = highlights.filter((highlight: any) => {
        // 1. BEST: Exact league ID match (most reliable)
        if (highlight.match?.league?.id && 
            highlight.match.league.id.toString() === league.id.toString()) {
          console.log(`[Highlightly] Found highlight with exact league ID match for: ${league.name}`);
          return true;
        }
        
        // 2. League name match in match.league.name
        if (highlight.match?.league?.name && typeof highlight.match.league.name === 'string') {
          const highlightLeagueName = highlight.match.league.name.toLowerCase();
          if (currentLeagueVariations.some(variation => highlightLeagueName.includes(variation))) {
            return true;
          }
        }
        
        // 3. Check in competition field
        if (highlight.competition && typeof highlight.competition === 'string') {
          const competitionName = highlight.competition.toLowerCase();
          if (currentLeagueVariations.some(variation => competitionName.includes(variation))) {
            return true;
          }
        }
        
        // 4. Last resort: Check in title field
        if (highlight.title && typeof highlight.title === 'string') {
          const highlightTitle = highlight.title.toLowerCase();
          if (currentLeagueVariations.some(variation => highlightTitle.includes(variation))) {
            return true;
          }
        }
        
        return false;
      });
      
      if (leagueHighlights.length === 0) {
        console.log(`[Highlightly] No highlights found for league: ${league.name}`);
        return [];
      }
      
      console.log(`[Highlightly] Found ${leagueHighlights.length} highlights for ${league.name}`);
      
      return leagueHighlights.map((highlight: any): MatchHighlight => {
        // Extract team names
        let homeTeamName = 'Unknown Team';
        let awayTeamName = 'Unknown Team';
        
        if (highlight.title) {
          const titleParts = highlight.title.split(' vs ');
          homeTeamName = titleParts[0]?.trim() || 'Unknown Team';
          awayTeamName = titleParts[1]?.trim() || 'Unknown Team';
        }
        
        // Extract score if available in the title
        let homeScore = 0;
        let awayScore = 0;
        if (highlight.title) {
          const scoreMatch = highlight.title.match(/(\d+)\s*-\s*(\d+)/);
          if (scoreMatch) {
            homeScore = parseInt(scoreMatch[1], 10);
            awayScore = parseInt(scoreMatch[2], 10);
          }
        }
        
        return {
          id: highlight.id || `highlight-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          title: highlight.title || 'Unnamed Highlight',
          date: highlight.date ? new Date(highlight.date).toISOString() : new Date().toISOString(),
          thumbnailUrl: highlight.thumbnail || highlight.image || 'https://via.placeholder.com/300x200?text=No+Thumbnail',
          videoUrl: highlight.url || highlight.embedUrl || '',
          duration: highlight.duration || '0:00',
          views: highlight.views || Math.floor(Math.random() * 10000),
          homeTeam: {
            id: `team-${homeTeamName.toLowerCase().replace(/\s+/g, '-')}`,
            name: homeTeamName,
            logo: '/teams/default.png'
          },
          awayTeam: {
            id: `team-${awayTeamName.toLowerCase().replace(/\s+/g, '-')}`,
            name: awayTeamName,
            logo: '/teams/default.png'
          },
          score: {
            home: homeScore,
            away: awayScore
          },
          competition: {
            id: league.id || 'unknown-league',
            name: league.name || 'Unknown League',
            logo: league.logo || '/leagues/default.png'
          }
        };
      });
    } catch (error) {
      console.error(`[Highlightly] Error fetching highlights for ${league.name}:`, error);
      return [];
    }
  },

  /**
   * Helper method to fetch general highlights when league-specific ones aren't available
   */
  async fetchGeneralHighlights(formattedDate: string): Promise<League[]> {
    try {
      const response = await highlightlyClient.getHighlights({
        date: formattedDate,
        limit: '25'
    
    // Log the highlight structure to help debug
    if (highlights.length > 0) {
      console.log(`[Highlightly] Highlight structure sample:`, 
        JSON.stringify(highlights[0]).substring(0, 200) + '...');
    }

    // Define league name variations map for common leagues
    const leagueVariations: {[key: string]: string[]} = {
      // Premier League variations (England ID: 33973)
      '33973': ['premier league', 'epl', 'english premier league'],
      // LaLiga variations (Spain ID: 2486)
      '2486': ['laliga', 'la liga', 'spanish league', 'primera division'],
      // Serie A variations (Italy/Brazil - clarify with specific ID check)
      '61205': ['serie a', 'brazilian serie a', 'brasileirão', 'brasileirao'],
      // Italian Serie A should be a different ID - using the one from logs
      '94': ['serie a', 'italian serie a', 'seria a', 'calcio'],
      // Bundesliga variations 
      '67162': ['bundesliga', 'german bundesliga'],
      // Ligue 1 variations
      '52695': ['ligue 1', 'french ligue 1'],
      // Champions League variations (ID 2 from our research)
      '2': ['champions league', 'ucl', 'uefa champions league'],
    };
    
    // Get variations for this specific league
    const currentLeagueVariations = leagueVariations[league.id.toString()] || [];
    currentLeagueVariations.push(league.name.toLowerCase());
    
    console.log(`[Highlightly] Looking for league: ${league.name} with ID: ${league.id}`);
    console.log(`[Highlightly] Using name variations: ${currentLeagueVariations.join(', ')}`);

    // Filter highlights by league using multiple possible paths
    const leagueHighlights = highlights.filter((highlight: any) => {
      // 1. BEST: Exact league ID match (most reliable)
      if (highlight.match?.league?.id && 
          highlight.match.league.id.toString() === league.id.toString()) {
        console.log(`[Highlightly] Found highlight with exact league ID match for: ${league.name}`);
        return true;
      }
      
      // 2. League name match in match.league.name
      if (highlight.match?.league?.name && typeof highlight.match.league.name === 'string') {
        const highlightLeagueName = highlight.match.league.name.toLowerCase();
        if (currentLeagueVariations.some(variation => highlightLeagueName.includes(variation))) {
          return true;
        }
      }
      
      // 3. Check in competition field
      if (highlight.competition && typeof highlight.competition === 'string') {
        const competitionName = highlight.competition.toLowerCase();
        if (currentLeagueVariations.some(variation => competitionName.includes(variation))) {
          return true;
        }
      }
      
      // 4. Last resort: Check in title field
      if (highlight.title && typeof highlight.title === 'string') {
        const highlightTitle = highlight.title.toLowerCase();
        if (currentLeagueVariations.some(variation => highlightTitle.includes(variation))) {
          return true;
        }
      }
      
      return false;
    });
    
    if (leagueHighlights.length === 0) {
      console.log(`[Highlightly] No highlights found for league: ${league.name}`);
      return [];
    }
    
    console.log(`[Highlightly] Found ${leagueHighlights.length} highlights for ${league.name}`);
    
    return leagueHighlights.map((highlight: any): MatchHighlight => {
      // Extract team names
      let homeTeamName = 'Unknown Team';
      let awayTeamName = 'Unknown Team';
      
      if (highlight.title) {
        const titleParts = highlight.title.split(' vs ');
        homeTeamName = titleParts[0]?.trim() || 'Unknown Team';
        awayTeamName = titleParts[1]?.trim() || 'Unknown Team';
      }
      
      // Extract score if available in the title
      let homeScore = 0;
      let awayScore = 0;
      if (highlight.title) {
        const scoreMatch = highlight.title.match(/(\d+)\s*-\s*(\d+)/);
        if (scoreMatch) {
          homeScore = parseInt(scoreMatch[1], 10);
          awayScore = parseInt(scoreMatch[2], 10);
        }
      }
      
      return {
        id: highlight.id || `highlight-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: highlight.title || 'Unnamed Highlight',
        date: highlight.date ? new Date(highlight.date).toISOString() : new Date().toISOString(),
        thumbnailUrl: highlight.thumbnail || highlight.image || 'https://via.placeholder.com/300x200?text=No+Thumbnail',
        videoUrl: highlight.url || highlight.embedUrl || '',
        duration: highlight.duration || '0:00',
        views: highlight.views || Math.floor(Math.random() * 10000),
        homeTeam: {
          id: `team-${homeTeamName.toLowerCase().replace(/\s+/g, '-')}`,
          name: homeTeamName,
          logo: '/teams/default.png'
        },
        awayTeam: {
          id: `team-${awayTeamName.toLowerCase().replace(/\s+/g, '-')}`,
          name: awayTeamName,
          logo: '/teams/default.png'
        },
        score: {
          home: homeScore,
          away: awayScore
        },
        competition: {
          id: league.id || 'unknown-league',
          name: league.name || 'Unknown League',
          logo: league.logo || '/leagues/default.png'
        }
      };
    });
    
    return leagueHighlights;
    
  } catch (error) {
    console.error(`[Highlightly] Error fetching highlights for ${league.name}:`, error);
    return [];
  }
},

/**
 * Helper method to fetch general highlights when league-specific ones aren't available
 */
async fetchGeneralHighlights(formattedDate: string): Promise<League[]> {
  try {
    const response = await highlightlyClient.getHighlights({
      date: formattedDate,
      limit: '25'
    });
    
    if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
      console.log('[Highlightly] No general highlights found, falling back to mock data');
      return mockService.getLeagueHighlights();
    }
    
    const highlights: MatchHighlight[] = [];
    
    response.data.forEach((highlight: any) => {
      if (!highlight.title) return;
      
      // Extract team names
      const titleParts = highlight.title.split(' vs ');
      const homeTeamName = titleParts[0]?.trim() || 'Unknown Team';
      const awayTeamName = titleParts[1]?.trim() || 'Unknown Team';
      
      // Extract score
      let homeScore = 0;
      let awayScore = 0;
      const scoreMatch = highlight.title.match(/(\d+)\s*-\s*(\d+)/);
      if (scoreMatch) {
        homeScore = parseInt(scoreMatch[1], 10);
        awayScore = parseInt(scoreMatch[2], 10);
      }
      
      highlights.push({
        id: highlight.id || `highlight-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: highlight.title,
        date: highlight.date ? new Date(highlight.date).toISOString() : new Date().toISOString(),
        thumbnailUrl: highlight.thumbnail || highlight.image || 'https://via.placeholder.com/300x200?text=No+Thumbnail',
        videoUrl: highlight.url || highlight.embedUrl || highlight.video || '',
        duration: highlight.duration || '0:00',
        views: highlight.views || Math.floor(Math.random() * 10000),
        homeTeam: {
          id: `team-${homeTeamName.toLowerCase().replace(/\s+/g, '-')}`,
          name: homeTeamName,
          logo: '/teams/default.png'
        },
        awayTeam: {
          id: `team-${awayTeamName.toLowerCase().replace(/\s+/g, '-')}`,
          name: awayTeamName,
          logo: '/teams/default.png'
        },
        score: {
          home: homeScore,
          away: awayScore
        },
        competition: {
          id: 'popular-highlights',
          name: 'Popular Highlights',
          logo: '/leagues/default.png'
        }
      });
    });
    
    return [{
      id: 'popular-highlights',
      name: 'Popular Highlights',
      logo: '/leagues/default.png',
      highlights
    }];
    } catch (error) {
      console.error('Error fetching general highlights:', error);
      console.log('[Highlightly] Falling back to mock data for general highlights');
      return mockService.getLeagueHighlights();
    }
  },

  /**
   * Transform standings data to TableRow format
   */
  transformStandingsToTableRows(standings: any[]): TableRow[] {
    return standings.map((standing: any, index: number): TableRow => {
      return {
        position: standing.rank || index + 1,
        team: {
          id: standing.team?.id || `team-${standing.team?.name?.toLowerCase().replace(/\s+/g, '-') || index}`,
          name: standing.team?.name || 'Unknown Team',
          logo: standing.team?.logo || 'https://via.placeholder.com/50x50?text=Team'
        },
        played: standing.all?.played || 0,
        won: standing.all?.win || 0,
        drawn: standing.all?.draw || 0,
        lost: standing.all?.lose || 0,
        goalsFor: standing.all?.goals?.for || 0,
        goalsAgainst: standing.all?.goals?.against || 0,
        goalDifference: (standing.all?.goals?.for || 0) - (standing.all?.goals?.against || 0),
        points: standing.points || 0
      };
    });
  },

  /**
   * Transform match data to Fixture format
   */
  transformMatchToFixture(match: any): Fixture {
    return {
      id: match.id || `fixture-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      homeTeam: {
        id: match.teams?.home?.id || 'home-team',
        name: match.teams?.home?.name || 'Home Team',
        logo: match.teams?.home?.logo || 'https://via.placeholder.com/50x50?text=Team'
      },
      awayTeam: {
        id: match.teams?.away?.id || 'away-team',
        name: match.teams?.away?.name || 'Away Team',
        logo: match.teams?.away?.logo || 'https://via.placeholder.com/50x50?text=Team'
      },
      date: match.fixture?.date || new Date().toISOString(),
      competition: match.league?.name || 'Unknown League',
      venue: match.fixture?.venue?.name || 'Unknown Venue'
    };
  },

  /**
   * Get ordinal suffix for numbers
   */
  getOrdinalSuffix(i: number): string {
    const j = i % 10;
    const k = i % 100;
    
    if (j === 1 && k !== 11) {
      return i + "st";
    }
    if (j === 2 && k !== 12) {
      return i + "nd";
    }
    if (j === 3 && k !== 13) {
      return i + "rd";
    }
    
    return i + "th";
  }
};

// Export functions individually for easier importing
export const {
  getRecommendedHighlights,
  getLeagueHighlights
} = {
  getRecommendedHighlights: highlightlyService.getRecommendedHighlights.bind(highlightlyService),
  getLeagueHighlights: highlightlyService.getLeagueHighlights.bind(highlightlyService)
};
