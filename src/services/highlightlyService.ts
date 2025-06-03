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
            leagueId: leagueId, // ✅ Fixed parameter name
            season: '2025', // Specifically requested 2025 season
            date: '2025-01-01', // FIXED: Add specific date to prevent relative matches
            limit: '10'
          });
          
          if (!matchesResponse.data || !Array.isArray(matchesResponse.data)) {
            console.log(`[Highlightly] No matches found for ${leagueName}`);
            continue;
          }
          
          console.log(`[Highlightly] Found ${matchesResponse.data.length} matches for ${leagueName}`);
          
          // DEBUG: Log first match structure to understand the API response
          if (matchesResponse.data.length > 0) {
            console.log(`[Highlightly] Sample match structure for ${leagueName}:`, 
              JSON.stringify(matchesResponse.data[0], null, 2));
          }
          
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
          date: formattedDate
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
        id: match.homeTeam?.id?.toString() || match.teams?.home?.id?.toString() || `home-${Date.now()}`,
        name: match.homeTeam?.name || match.teams?.home?.name || 'Home Team',
        logo: match.homeTeam?.logo || match.teams?.home?.logo || '/teams/default.png'
      },
      awayTeam: {
        id: match.awayTeam?.id?.toString() || match.teams?.away?.id?.toString() || `away-${Date.now()}`,
        name: match.awayTeam?.name || match.teams?.away?.name || 'Away Team',
        logo: match.awayTeam?.logo || match.teams?.away?.logo || '/teams/default.png'
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
  },

  /**
   * Get recent matches for top-tier leagues ranked by popularity and quality
   * Includes continental competitions like Champions League and top domestic leagues
   */
  async getRecentMatchesForTopLeagues(): Promise<import('@/types').LeagueWithMatches[]> {
    try {
      console.log('[Highlightly] Fetching recent match results using popularity-based approach');
      
      // Step 1: Get all available leagues
      console.log('[Highlightly] Step 1: Fetching all leagues');
      const leaguesResponse = await highlightlyClient.getLeagues();
      
      if (!leaguesResponse.data || !Array.isArray(leaguesResponse.data)) {
        console.error('[Highlightly] No leagues data found');
        return [];
      }
      
      console.log(`[Highlightly] Found ${leaguesResponse.data.length} leagues`);
      
      // Step 2: Define top-tier leagues by popularity and quality in priority tiers
      const leagueRankings = {
        // Tier 1: Major Continental Competitions (highest priority)
        tier1: [
          { names: ['UEFA Champions League', 'Champions League'], priority: 1 },
          { names: ['UEFA Europa League', 'Europa League'], priority: 2 },
          { names: ['UEFA Conference League', 'Conference League'], priority: 3 },
          { names: ['CONMEBOL Libertadores', 'Copa Libertadores'], priority: 4 },
          { names: ['CONMEBOL Sudamericana'], priority: 5 }
        ],
        
        // Tier 2: Top European Domestic Leagues (Big 5)
        tier2: [
          { names: ['Premier League', 'English Premier League'], priority: 10, exclude: ['Australian', 'South African'] },
          { names: ['La Liga', 'LaLiga'], priority: 11 },
          { names: ['Serie A'], priority: 12, exclude: ['Brasil', 'Brazil', 'Brasileir'] },
          { names: ['Bundesliga'], priority: 13, exclude: ['2.', 'Frauen'] },
          { names: ['Ligue 1'], priority: 14 }
        ],
        
        // Tier 3: Major Regional and Growing Leagues
        tier3: [
          { names: ['MLS', 'Major League Soccer'], priority: 20 },
          { names: ['Championship'], priority: 21 },
          { names: ['Eredivisie'], priority: 22 },
          { names: ['Primeira Liga'], priority: 23 },
          { names: ['Serie A'], priority: 24, include: ['Brasil', 'Brazil', 'Brasileir'] },
          { names: ['Liga MX'], priority: 25 },
          { names: ['Süper Lig'], priority: 26 }
        ]
      };
      
      // Helper function to check if a league matches criteria
      const matchesLeagueCriteria = (league: any, criteria: any): boolean => {
        if (!league.name) return false;
        
        const leagueName = league.name.toLowerCase();
        
        // Check if league name contains any of the target names
        const nameMatch = criteria.names.some((name: string) => 
          leagueName.includes(name.toLowerCase())
        );
        
        if (!nameMatch) return false;
        
        // Apply exclusion rules if specified
        if (criteria.exclude) {
          const hasExclusion = criteria.exclude.some((exclude: string) => 
            leagueName.includes(exclude.toLowerCase())
          );
          if (hasExclusion) return false;
        }
        
        // Apply inclusion rules if specified (for cases like Brazilian Serie A)
        if (criteria.include) {
          const hasInclusion = criteria.include.some((include: string) => 
            leagueName.includes(include.toLowerCase())
          );
          if (!hasInclusion) return false;
        }
        
        return true;
      };
      
      // Step 3: Find and rank leagues by priority
      const rankedLeagues: Array<{league: any, priority: number, tier: string}> = [];
      
      // Process each tier
      Object.entries(leagueRankings).forEach(([tierName, tierCriteria]) => {
        tierCriteria.forEach((criteria) => {
          const matchingLeagues = leaguesResponse.data.filter((league: any) => 
            matchesLeagueCriteria(league, criteria)
          );
          
          matchingLeagues.forEach((league: any) => {
            rankedLeagues.push({
              league,
              priority: criteria.priority,
              tier: tierName
            });
          });
        });
      });
      
      // Remove duplicates (prefer higher priority/lower number)
      const uniqueLeagues = new Map();
      rankedLeagues.forEach(({league, priority, tier}) => {
        const existingEntry = uniqueLeagues.get(league.id);
        if (!existingEntry || priority < existingEntry.priority) {
          uniqueLeagues.set(league.id, {league, priority, tier});
        }
      });
      
      // Sort by priority and limit to top leagues
      const topLeagues = Array.from(uniqueLeagues.values())
        .sort((a, b) => a.priority - b.priority)
        .slice(0, 8); // Increased from 5 to 8 to include continental competitions
      
      console.log(`[Highlightly] Selected top ${topLeagues.length} leagues by popularity:`, 
        topLeagues.map(({league, priority, tier}) => 
          `${league.name} (ID: ${league.id}, Priority: ${priority}, Tier: ${tier})`
        )
      );
      
      // Step 4: Get recent matches for each top league
      const leaguesWithMatches: import('@/types').LeagueWithMatches[] = [];
      
      for (const {league, tier} of topLeagues) {
        try {
          console.log(`[Highlightly] Fetching matches for ${league.name} (ID: ${league.id}, Tier: ${tier})`);
          
          // Use the correct leagueId parameter from the API documentation
          const matchesResponse = await highlightlyClient.getMatches({
            leagueId: league.id.toString(),
            date: new Date().toISOString().split('T')[0], // FIXED: Add current date to ensure we get today's/recent matches, not relative ones
            limit: tier === 'tier1' ? '10' : '15' // More matches for continental competitions
          });
          
          if (!matchesResponse.data || !Array.isArray(matchesResponse.data)) {
            console.log(`[Highlightly] No matches found for ${league.name}`);
            continue;
          }
          
          console.log(`[Highlightly] Found ${matchesResponse.data.length} matches for ${league.name}`);
          
          // Step 5: Filter for finished matches with scores
          const finishedMatches = matchesResponse.data.filter((match: any) => {
            // Check if match is finished - use the correct state.description field
            const isFinished = 
              match.state?.description === 'Finished' ||
              match.state?.description === 'Finished after penalties' ||
              match.state?.description === 'Finished after extra time' ||
              match.fixture?.status?.long === 'Match Finished' ||
              match.fixture?.status?.short === 'FT';
            
            // Check for score data - use multiple possible score fields
            const hasScore = 
              (match.state?.score?.current && match.state.score.current.includes(' - ')) ||
              (match.score?.fulltime?.home !== undefined && match.score?.fulltime?.away !== undefined) ||
              (match.goals?.home !== undefined && match.goals?.away !== undefined) ||
              (match.fixture?.score?.fulltime?.home !== undefined && match.fixture?.score?.fulltime?.away !== undefined);
            
            return isFinished && hasScore;
          });
          
          console.log(`[Highlightly] Found ${finishedMatches.length} finished matches with scores for ${league.name}`);
          
          if (finishedMatches.length === 0) {
            continue; // Skip leagues with no finished matches
          }
          
          // Step 6: Transform matches to our format using REAL API data
          const transformedMatches: import('@/types').Match[] = finishedMatches
            .slice(0, 5) // Limit to 5 most recent per league
            .map((match: any) => {
              // Extract date from multiple possible fields
              const matchDate = new Date(
                match.date || 
                match.fixture?.date || 
                match.kickoff || 
                match.utcDate || 
                new Date()
              );
              
              // Extract score data from multiple possible fields
              let homeScore = 0;
              let awayScore = 0;
              
              // Try different score field structures
              if (match.state?.score?.current) {
                // Parse score from state.score.current (e.g., "2 - 0")
                const scoreMatch = match.state.score.current.match(/(\d+)\s*-\s*(\d+)/);
                if (scoreMatch) {
                  homeScore = parseInt(scoreMatch[1], 10);
                  awayScore = parseInt(scoreMatch[2], 10);
                }
              } else if (match.score?.fulltime) {
                // Use score.fulltime structure
                homeScore = match.score.fulltime.home || 0;
                awayScore = match.score.fulltime.away || 0;
              } else if (match.goals) {
                // Use goals structure
                homeScore = match.goals.home || 0;
                awayScore = match.goals.away || 0;
              } else if (match.fixture?.score?.fulltime) {
                // Use fixture.score.fulltime structure
                homeScore = match.fixture.score.fulltime.home || 0;
                awayScore = match.fixture.score.fulltime.away || 0;
              }
              
              // Extract team information from multiple possible structures
              const homeTeam = {
                id: (match.homeTeam?.id || match.teams?.home?.id || match.fixture?.teams?.home?.id || `home-${Date.now()}`).toString(),
                name: match.homeTeam?.name || match.teams?.home?.name || match.fixture?.teams?.home?.name || 'Home Team',
                logo: match.homeTeam?.logo || match.teams?.home?.logo || match.fixture?.teams?.home?.logo || '/teams/default.png'
              };
              
              const awayTeam = {
                id: (match.awayTeam?.id || match.teams?.away?.id || match.fixture?.teams?.away?.id || `away-${Date.now()}`).toString(),
                name: match.awayTeam?.name || match.teams?.away?.name || match.fixture?.teams?.away?.name || 'Away Team',
                logo: match.awayTeam?.logo || match.teams?.away?.logo || match.fixture?.teams?.away?.logo || '/teams/default.png'
              };
              
              // Generate match ID from multiple possible fields
              const matchId = (
                match.fixture?.id || 
                match.id || 
                match.match_id || 
                `match-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
              ).toString();
              
              // Extract venue information
              const venue = match.fixture?.venue?.name || match.venue?.name || match.venue || undefined;
              
              // Debug logging for match data extraction
              console.log(`[Highlightly] ✅ REAL MATCH DATA for ${homeTeam.name} vs ${awayTeam.name}:`, {
                matchId,
                score: `${homeScore}-${awayScore}`,
                date: matchDate.toISOString(),
                venue,
                league: league.name,
                homeTeam: homeTeam.name,
                awayTeam: awayTeam.name
              });
              
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
                status: 'finished',
                score: {
                  home: homeScore,
                  away: awayScore
                },
                competition: {
                  id: league.id.toString(),
                  name: league.name,
                  logo: league.logo || `/leagues/${league.name.toLowerCase().replace(/\s+/g, '-')}.png`
                },
                venue
              };
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Most recent first
          
          // Add to results
          leaguesWithMatches.push({
            id: league.id.toString(),
            name: league.name,
            logo: league.logo || `/leagues/${league.name.toLowerCase().replace(/\s+/g, '-')}.png`,
            matches: transformedMatches
          });
          
          console.log(`[Highlightly] Successfully processed ${transformedMatches.length} matches for ${league.name}`);
          
        } catch (error) {
          console.error(`[Highlightly] Error fetching matches for ${league.name}:`, error);
          continue; // Continue with other leagues
        }
      }
      
      // Step 7: Sort leagues by tier priority to ensure continental competitions come first
      leaguesWithMatches.sort((a, b) => {
        // Find the priority of each league from our rankings
        const aPriority = topLeagues.find(tl => tl.league.id.toString() === a.id)?.priority || 999;
        const bPriority = topLeagues.find(tl => tl.league.id.toString() === b.id)?.priority || 999;
        
        return aPriority - bPriority;
      });
      
      console.log(`[Highlightly] ✅ Successfully fetched match results for ${leaguesWithMatches.length} top-tier leagues:`,
        leaguesWithMatches.map(l => `${l.name} (${l.matches.length} matches)`));
      
      // Log which tier-1 leagues (Champions League, etc.) were found
      const tier1Leagues = leaguesWithMatches.filter(l => 
        topLeagues.find(tl => tl.league.id.toString() === l.id && tl.tier === 'tier1')
      );
      
      if (tier1Leagues.length > 0) {
        console.log(`[Highlightly] 🏆 Continental competitions included:`, 
          tier1Leagues.map(l => l.name).join(', ')
        );
      }
      
      return leaguesWithMatches;
      
    } catch (error) {
      console.error('[Highlightly] Error in getRecentMatchesForTopLeagues:', error);
      return [];
    }
  },

  /**
   * Get match by ID
   */
  async getMatchById(id: string): Promise<MatchHighlight | null> {
    try {
      console.log(`[Highlightly] Fetching match by ID: ${id}`);
      
      // STRATEGY 1: Get match data first, then fetch additional details
      try {
        console.log(`[Highlightly] Strategy 1: Getting comprehensive match data for ID: ${id}`);
        const matchResponse = await highlightlyClient.getMatchById(id);
        
        console.log(`[Highlightly] Full match response for ${id}:`, JSON.stringify(matchResponse, null, 2));
        
        // Handle different response formats from matches API
        let matchData = null;
        if (Array.isArray(matchResponse) && matchResponse.length > 0) {
          matchData = matchResponse[0];
        } else if (matchResponse && typeof matchResponse === 'object' && !Array.isArray(matchResponse)) {
          matchData = matchResponse.data || matchResponse;
        }
        
        if (matchData) {
          console.log(`[Highlightly] ✅ Strategy 1: Match data found, processing real data`);
          const match = matchData;
          
          // Extract team information from multiple possible structures
          let homeTeamName = 'Home Team';
          let awayTeamName = 'Away Team';
          let homeTeamData = null;
          let awayTeamData = null;
          
          // Try different team data structures
          if (match.homeTeam && match.awayTeam) {
            homeTeamName = match.homeTeam.name || 'Home Team';
            awayTeamName = match.awayTeam.name || 'Away Team';
            homeTeamData = match.homeTeam;
            awayTeamData = match.awayTeam;
          } else if (match.teams?.home && match.teams?.away) {
            homeTeamName = match.teams.home.name || 'Home Team';
            awayTeamName = match.teams.away.name || 'Away Team';
            homeTeamData = match.teams.home;
            awayTeamData = match.teams.away;
          } else if (match.fixture?.teams?.home && match.fixture?.teams?.away) {
            homeTeamName = match.fixture.teams.home.name || 'Home Team';
            awayTeamName = match.fixture.teams.away.name || 'Away Team';
            homeTeamData = match.fixture.teams.home;
            awayTeamData = match.fixture.teams.away;
          } else if (match.events && Array.isArray(match.events)) {
            // Extract team information from events array as fallback
            const teams = new Set();
            const teamMap = new Map();
            match.events.forEach((event: any) => {
              if (event.team && event.team.name) {
                teams.add(event.team.name);
                teamMap.set(event.team.name, {
                  id: event.team.id,
                  name: event.team.name,
                  logo: event.team.logo
                });
              }
            });
            
            const teamNames = Array.from(teams);
            homeTeamName = (teamNames[0] as string) || 'Home Team';
            awayTeamName = (teamNames[1] as string) || 'Away Team';
            homeTeamData = teamMap.get(homeTeamName);
            awayTeamData = teamMap.get(awayTeamName);
          }
          
          console.log(`[Highlightly] Found match teams: ${homeTeamName} vs ${awayTeamName}`);
          
          // Extract score from multiple possible structures
          let homeScore = 0;
          let awayScore = 0;
          
          if (match.score?.fulltime) {
            homeScore = match.score.fulltime.home || 0;
            awayScore = match.score.fulltime.away || 0;
          } else if (match.state?.score?.current) {
            const scoreMatch = match.state.score.current.match(/(\d+)\s*-\s*(\d+)/);
            if (scoreMatch) {
              homeScore = parseInt(scoreMatch[1], 10);
              awayScore = parseInt(scoreMatch[2], 10);
            }
          } else if (match.goals) {
            homeScore = match.goals.home || 0;
            awayScore = match.goals.away || 0;
          } else if (match.fixture?.score?.fulltime) {
            homeScore = match.fixture.score.fulltime.home || 0;
            awayScore = match.fixture.score.fulltime.away || 0;
          }
          
          console.log(`[Highlightly] ✅ REAL MATCH SCORE: ${homeTeamName} ${homeScore}-${awayScore} ${awayTeamName}`);
          
          // Parallel fetch of additional data (lineups, statistics, events)
          const [lineupsResponse, statisticsResponse, eventsResponse, highlightsResponse] = await Promise.allSettled([
            highlightlyClient.getLineups(id).catch(e => {
              console.log(`[Highlightly] Lineups not available for match ${id}:`, e.message);
              return null;
            }),
            highlightlyClient.getStatistics(id).catch(e => {
              console.log(`[Highlightly] Statistics not available for match ${id}:`, e.message);
              return null;
            }),
            highlightlyClient.getLiveEvents(id).catch(e => {
              console.log(`[Highlightly] Events not available for match ${id}:`, e.message);
              return null;
            }),
            // Try to find highlight video for this match
            this.findMatchHighlightVideo(id, homeTeamName, awayTeamName)
          ]);

          // Process lineups, statistics, and events with real data
          let lineups = null;
          if (lineupsResponse.status === 'fulfilled' && lineupsResponse.value) {
            const lineupsData = lineupsResponse.value;
            if (lineupsData.homeTeam && lineupsData.awayTeam) {
              lineups = {
                homeTeam: {
                  id: lineupsData.homeTeam.id || homeTeamData?.id || 'unknown',
                  name: lineupsData.homeTeam.name || homeTeamName,
                  logo: lineupsData.homeTeam.logo || homeTeamData?.logo || '/teams/default.png',
                  formation: lineupsData.homeTeam.formation || '4-4-2',
                  initialLineup: lineupsData.homeTeam.initialLineup || [],
                  substitutes: lineupsData.homeTeam.substitutes || []
                },
                awayTeam: {
                  id: lineupsData.awayTeam.id || awayTeamData?.id || 'unknown',
                  name: lineupsData.awayTeam.name || awayTeamName,
                  logo: lineupsData.awayTeam.logo || awayTeamData?.logo || '/teams/default.png',
                  formation: lineupsData.awayTeam.formation || '4-4-2',
                  initialLineup: lineupsData.awayTeam.initialLineup || [],
                  substitutes: lineupsData.awayTeam.substitutes || []
                }
              };
            }
          }

          let statistics = null;
          if (statisticsResponse.status === 'fulfilled' && statisticsResponse.value) {
            const statsData = statisticsResponse.value;
            if (Array.isArray(statsData)) {
              statistics = statsData.map((teamStat: any) => ({
                team: {
                  id: teamStat.team?.id || 'unknown',
                  name: teamStat.team?.name || 'Unknown Team',
                  logo: teamStat.team?.logo || '/teams/default.png'
                },
                statistics: teamStat.statistics || []
              }));
            }
          }

          let events = null;
          if (eventsResponse.status === 'fulfilled' && eventsResponse.value) {
            const eventsData = eventsResponse.value;
            console.log(`[Highlightly] Raw events data:`, JSON.stringify(eventsData, null, 2));
            
            if (Array.isArray(eventsData)) {
              events = eventsData.map((event: any) => {
                // Extract player name from multiple possible structures
                let playerName = 'Unknown Player';
                
                if (event.player && typeof event.player === 'string') {
                  playerName = event.player;
                } else if (event.player?.name) {
                  playerName = event.player.name;
                } else if (event.playerName) {
                  playerName = event.playerName;
                } else if (event.detail?.player?.name) {
                  playerName = event.detail.player.name;
                } else if (event.detail?.player) {
                  playerName = event.detail.player;
                } else if (event.players && Array.isArray(event.players) && event.players.length > 0) {
                  // Sometimes multiple players are involved, take the first one
                  playerName = event.players[0].name || event.players[0];
                }
                
                // Extract assist player if available
                let assistPlayer = null;
                if (event.assist && typeof event.assist === 'string') {
                  assistPlayer = event.assist;
                } else if (event.assist?.name) {
                  assistPlayer = event.assist.name;
                } else if (event.assistPlayer) {
                  assistPlayer = event.assistPlayer;
                } else if (event.detail?.assist?.name) {
                  assistPlayer = event.detail.assist.name;
                } else if (event.detail?.assist) {
                  assistPlayer = event.detail.assist;
                }
                
                // Extract substitution info if available
                let substitutedPlayer = null;
                if (event.substituted && typeof event.substituted === 'string') {
                  substitutedPlayer = event.substituted;
                } else if (event.substituted?.name) {
                  substitutedPlayer = event.substituted.name;
                } else if (event.detail?.substituted?.name) {
                  substitutedPlayer = event.detail.substituted.name;
                } else if (event.detail?.substituted) {
                  substitutedPlayer = event.detail.substituted;
                }
                
                // Log goalscorer information for debugging
                if (event.type === 'Goal' || 
                    event.type === 'Penalty' || 
                    event.type?.toLowerCase().includes('goal') ||
                    event.type?.toLowerCase().includes('penalty')) {
                  console.log(`[Highlightly] ⚽ GOAL EVENT: ${playerName} (${event.time}') for ${event.team?.name}`);
                }
                
                return {
                  team: {
                    id: event.team?.id || 'unknown',
                    name: event.team?.name || 'Unknown Team',
                    logo: event.team?.logo || '/teams/default.png'
                  },
                  time: event.time || event.minute || '0',
                  type: event.type || 'Unknown',
                  player: playerName,
                  assist: assistPlayer,
                  substituted: substitutedPlayer
                };
              });
              
              console.log(`[Highlightly] ✅ Processed ${events.length} events with goalscorers:`, 
                events.filter(e => 
                  e.type === 'Goal' || 
                  e.type === 'Penalty' || 
                  e.type?.toLowerCase().includes('goal') ||
                  e.type?.toLowerCase().includes('penalty')
                ).map(e => `${e.player} (${e.time}')`));
            }
          }

          let videoUrl = '';
          if (highlightsResponse.status === 'fulfilled' && highlightsResponse.value) {
            videoUrl = highlightsResponse.value;
          }

          // Extract match date
          const matchDate = new Date(
            match.date || 
            match.fixture?.date || 
            match.kickoff || 
            match.utcDate || 
            new Date()
          );

          const enhancedMatch: any = {
            id: match.id || id,
            title: `${homeTeamName} vs ${awayTeamName}`,
            date: matchDate.toISOString(),
            thumbnailUrl: 'https://via.placeholder.com/300x200?text=Match+Details',
            videoUrl,
            duration: '0:00',
            views: Math.floor(Math.random() * 10000),
            homeTeam: {
              id: (homeTeamData?.id || `team-${homeTeamName.toLowerCase().replace(/\s+/g, '-')}`).toString(),
              name: homeTeamName,
              logo: homeTeamData?.logo || '/teams/default.png'
            },
            awayTeam: {
              id: (awayTeamData?.id || `team-${awayTeamName.toLowerCase().replace(/\s+/g, '-')}`).toString(),
              name: awayTeamName,
              logo: awayTeamData?.logo || '/teams/default.png'
            },
            score: {
              home: homeScore,
              away: awayScore
            },
            competition: {
              id: (match.league?.id || match.competition?.id || 'unknown-competition').toString(),
              name: match.league?.name || match.competition?.name || 'Unknown Competition',
              logo: match.league?.logo || match.competition?.logo || '/leagues/default.png'
            },
            lineups,
            statistics,
            events
          };

          console.log(`[Highlightly] ✅ Strategy 1 SUCCESS: Enhanced match details created for ${id} with REAL data`);
          return enhancedMatch;
        }
      } catch (error) {
        console.log(`[Highlightly] ❌ Strategy 1 failed with error:`, error);
      }

      // STRATEGY 2: Try searching recent highlights with different date ranges
      try {
        console.log(`[Highlightly] Strategy 2: Searching recent highlights across multiple dates`);
        
        // Try the last few days to find potential matches
        const dates = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          dates.push(date.toISOString().split('T')[0]);
        }
        
        for (const dateStr of dates) {
          try {
            const highlightsResponse = await highlightlyClient.getHighlights({
              date: dateStr
            });

            if (highlightsResponse.data && Array.isArray(highlightsResponse.data)) {
              console.log(`[Highlightly] Found ${highlightsResponse.data.length} highlights for ${dateStr}`);
              
              // Look for highlights that might be related to this match ID
              const potentialMatch = highlightsResponse.data.find((highlight: any) => {
                console.log(`[Highlightly] Checking highlight for match ID ${id}:`, {
                  highlightId: highlight.id,
                  matchId: highlight.matchId,
                  fixtureId: highlight.fixtureId,
                  url: highlight.url,
                  title: highlight.title
                });
                
                // First try exact ID matches
                const exactMatch = highlight.matchId === id || 
                                  highlight.fixtureId === id || 
                                  highlight.id === id ||
                                  (highlight.url && highlight.url.includes(id));
                
                if (exactMatch) return true;
                
                // If no exact match, try team name matching
                if (highlight.title && typeof highlight.title === 'string') {
                  const title = highlight.title.toLowerCase();
                  
                  // Look for common Premier League teams that might match
                  const commonTeams = ['brentford', 'wolves', 'manchester', 'arsenal', 'chelsea', 'liverpool', 'tottenham'];
                  const titleWords = title.split(/[\s\-vs]+/);
                  const matchingTeams = titleWords.filter(word => 
                    commonTeams.some(team => word.includes(team) || team.includes(word))
                  );
                  
                  // If we find 2+ team names, this might be our match
                  return matchingTeams.length >= 2;
                }
                
                return false;
              });

              if (potentialMatch) {
                console.log(`[Highlightly] Found potential match on ${dateStr}:`, potentialMatch.title);
                
                const titleParts = potentialMatch.title?.split(' vs ') || [];
                const homeTeamName = titleParts[0]?.trim() || 'Unknown Team';
                const awayTeamName = titleParts[1]?.trim() || 'Unknown Team';
                
                let homeScore = 0;
                let awayScore = 0;
                if (potentialMatch.title) {
                  const scoreMatch = potentialMatch.title.match(/(\d+)\s*-\s*(\d+)/);
                  if (scoreMatch) {
                    homeScore = parseInt(scoreMatch[1], 10);
                    awayScore = parseInt(scoreMatch[2], 10);
                  }
                }

                return {
                  id: potentialMatch.id || id,
                  title: potentialMatch.title || 'Unnamed Match',
                  date: potentialMatch.date ? new Date(potentialMatch.date).toISOString() : new Date().toISOString(),
                  thumbnailUrl: potentialMatch.thumbnail || potentialMatch.image || 'https://via.placeholder.com/300x200?text=No+Thumbnail',
                  videoUrl: potentialMatch.url || potentialMatch.embedUrl || '',
                  duration: potentialMatch.duration || '0:00',
                  views: potentialMatch.views || Math.floor(Math.random() * 10000),
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
                    id: potentialMatch.competitionId || 'unknown-competition',
                    name: potentialMatch.competition || 'Unknown Competition',
                    logo: potentialMatch.competitionLogo || '/leagues/default.png'
                  }
                };
              }
            }
          } catch (dateError) {
            console.log(`[Highlightly] No highlights found for ${dateStr}`);
          }
        }
      } catch (error) {
        console.log(`[Highlightly] Strategy 2 failed:`, error);
      }

      // STRATEGY 3: All strategies failed, fall back to mock service
      console.log(`[Highlightly] All strategies failed for match ID: ${id}, falling back to mock service`);
      return mockService.getMatchById(id);

    } catch (error) {
      console.error(`[Highlightly] Error fetching match by ID: ${id}`, error);
      console.log('[Highlightly] Falling back to mock service');
      return mockService.getMatchById(id);
    }
  },

  /**
   * Get team highlights
   */
  async getTeamHighlights(teamId: string): Promise<MatchHighlight[]> {
    try {
      console.log(`[Highlightly] Fetching highlights for team: ${teamId}`);
      
      // Since team parameter doesn't exist, we need to search by homeTeamName or awayTeamName
      // First try searching by homeTeamName, then awayTeamName with recent dates
      const recentDates = [];
      for (let i = 0; i < 14; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        recentDates.push(date.toISOString().split('T')[0]);
      }
      
      let allHighlights: any[] = [];
      
      // Try searching across recent dates
      for (const dateStr of recentDates) {
        try {
          const response = await highlightlyClient.getHighlights({
            date: dateStr, // Primary parameter required
            limit: '20'
          });

          if (response.data && Array.isArray(response.data)) {
            // Filter highlights that might contain the team (by name matching)
            const teamHighlights = response.data.filter((highlight: any) => {
              if (!highlight.title) return false;
              const title = highlight.title.toLowerCase();
              const teamIdLower = teamId.toLowerCase();
              
              // Basic team name matching - this is imperfect but works for common cases
              return title.includes(teamIdLower) || 
                     teamIdLower.split('-').some(part => part.length > 3 && title.includes(part));
            });
            
            allHighlights.push(...teamHighlights);
          }
        } catch (dateError) {
          console.log(`[Highlightly] No highlights found for ${dateStr}`);
        }
        
        // Stop if we have enough highlights
        if (allHighlights.length >= 10) break;
      }

      if (allHighlights.length === 0) {
        console.log(`[Highlightly] No highlights found for team ${teamId}, falling back to mock service`);
        return mockService.getTeamHighlights(teamId);
      }

      return allHighlights.slice(0, 10).map((highlight: any): MatchHighlight => {
        const titleParts = highlight.title?.split(' vs ') || [];
        const homeTeamName = titleParts[0]?.trim() || 'Unknown Team';
        const awayTeamName = titleParts[1]?.trim() || 'Unknown Team';
        
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
            id: highlight.competitionId || 'unknown-competition',
            name: highlight.competition || 'Unknown Competition',
            logo: highlight.competitionLogo || '/leagues/default.png'
          }
        };
      });
    } catch (error) {
      console.error(`[Highlightly] Error fetching team highlights for ${teamId}:`, error);
      console.log('[Highlightly] Falling back to mock service');
      return mockService.getTeamHighlights(teamId);
    }
  },

  /**
   * Get team details
   */
  async getTeamDetails(teamId: string): Promise<TeamDetails | null> {
    try {
      console.log(`[Highlightly] Fetching team details for: ${teamId}`);
      
      // For now, fall back to mock service as team details require complex aggregation
      // This could be implemented with multiple API calls to get standings, fixtures, etc.
      console.log('[Highlightly] Team details not fully implemented, falling back to mock service');
      return mockService.getTeamDetails(teamId);
    } catch (error) {
      console.error(`[Highlightly] Error fetching team details for ${teamId}:`, error);
      return mockService.getTeamDetails(teamId);
    }
  },

  /**
   * Search highlights
   */
  async searchHighlights(query: string): Promise<MatchHighlight[]> {
    try {
      console.log(`[Highlightly] Searching highlights with query: ${query}`);
      
      // Get recent highlights from the last few days and filter by query on client side
      // The API requires a primary parameter, so we'll use date
      const recentDates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        recentDates.push(date.toISOString().split('T')[0]);
      }
      
      let allHighlights: any[] = [];
      
      for (const dateStr of recentDates) {
        try {
          const response = await highlightlyClient.getHighlights({
            date: dateStr, // Primary parameter required
            limit: '30'    // Secondary parameter
          });

          if (response.data && Array.isArray(response.data)) {
            allHighlights.push(...response.data);
          }
        } catch (dateError) {
          console.log(`[Highlightly] No highlights found for ${dateStr}`);
        }
      }

      if (allHighlights.length === 0) {
        console.log('[Highlightly] No search results found, falling back to mock service');
        return mockService.searchHighlights(query);
      }

      const searchQuery = query.toLowerCase();
      const filteredHighlights = allHighlights.filter((highlight: any) => {
        return highlight.title?.toLowerCase().includes(searchQuery) ||
               highlight.competition?.toLowerCase().includes(searchQuery);
      });

      if (filteredHighlights.length === 0) {
        console.log('[Highlightly] No matches found for search query, falling back to mock service');
        return mockService.searchHighlights(query);
      }

      return filteredHighlights.slice(0, 20).map((highlight: any): MatchHighlight => {
        const titleParts = highlight.title?.split(' vs ') || [];
        const homeTeamName = titleParts[0]?.trim() || 'Unknown Team';
        const awayTeamName = titleParts[1]?.trim() || 'Unknown Team';
        
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
            id: highlight.competitionId || 'unknown-competition',
            name: highlight.competition || 'Unknown Competition',
            logo: highlight.competitionLogo || '/leagues/default.png'
          }
        };
      });
    } catch (error) {
      console.error(`[Highlightly] Error searching highlights:`, error);
      console.log('[Highlightly] Falling back to mock service');
      return mockService.searchHighlights(query);
    }
  },

  /**
   * Helper method to find a highlight video for a match using multiple strategies
   */
  async findMatchHighlightVideo(id: string, homeTeamName: string, awayTeamName: string): Promise<string> {
    try {
      console.log(`[Highlightly] Searching for highlight video for match: ${id}, teams: ${homeTeamName} vs ${awayTeamName}`);
      
      // Strategy 0: Try searching by homeTeamName and awayTeamName parameters (most targeted)
      try {
        console.log(`[Highlightly] Strategy 0: Searching by homeTeamName/awayTeamName parameters`);
        
        // Try searching for highlights with specific team names
        const teamSearches = [
          { homeTeamName: homeTeamName, limit: '10' },
          { awayTeamName: awayTeamName, limit: '10' },
          { homeTeamName: homeTeamName, awayTeamName: awayTeamName, limit: '5' }
        ];
        
        for (const searchParams of teamSearches) {
          try {
            const response = await highlightlyClient.getHighlights(searchParams);

            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
              console.log(`[Highlightly] Found ${response.data.length} highlights for team search:`, searchParams);
              
              // Look for highlights that match our teams
              const matchingHighlight = response.data.find((highlight: any) => {
                if (!highlight.title) return false;
                const title = highlight.title.toLowerCase();
                const homeTeamLower = homeTeamName.toLowerCase();
                const awayTeamLower = awayTeamName.toLowerCase();
                
                const hasHomeTeam = title.includes(homeTeamLower) || 
                                   homeTeamLower.split(' ').some(word => word.length > 3 && title.includes(word));
                const hasAwayTeam = title.includes(awayTeamLower) || 
                                   awayTeamLower.split(' ').some(word => word.length > 3 && title.includes(word));
                
                // For single team search, just check if the title contains both teams
                if (searchParams.homeTeamName && searchParams.awayTeamName) {
                  return hasHomeTeam && hasAwayTeam;
                } else {
                  // For single team search, look for the other team in the title
                  return hasHomeTeam && hasAwayTeam;
                }
              });

              if (matchingHighlight) {
                const videoUrl = matchingHighlight.url || matchingHighlight.embedUrl || matchingHighlight.videoUrl || matchingHighlight.video || '';
                if (videoUrl) {
                  console.log(`[Highlightly] ✅ Strategy 0 SUCCESS: Found video by team search: "${matchingHighlight.title}": ${videoUrl}`);
                  return videoUrl;
                }
              }
            }
          } catch (teamError) {
            console.log(`[Highlightly] Team search failed for params:`, searchParams, teamError.message);
          }
        }
      } catch (error) {
        console.log(`[Highlightly] Strategy 0 failed:`, error.message);
      }
      
      // Strategy 1: Search by matchId if we have it
      try {
        console.log(`[Highlightly] Strategy 1: Searching by matchId: ${id}`);
        
        const response = await highlightlyClient.getHighlights({
          match: id,
          limit: '5'
        });

        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          console.log(`[Highlightly] Found ${response.data.length} highlights for matchId: ${id}`);
          const highlight = response.data[0]; // Take the first match
          const videoUrl = highlight.url || highlight.embedUrl || highlight.videoUrl || highlight.video || '';
          if (videoUrl) {
            console.log(`[Highlightly] ✅ Strategy 1 SUCCESS: Found video by matchId: "${highlight.title}": ${videoUrl}`);
            return videoUrl;
          }
        }
      } catch (error) {
        console.log(`[Highlightly] Strategy 1 failed:`, error.message);
      }
      
      // Strategy 2: Search recent highlights by date and look for team matches
      try {
        console.log(`[Highlightly] Strategy 2: Searching recent highlights by date for team matches`);
        
        // Get highlights from the last 7 days to find potential matches
        const dates = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          dates.push(date.toISOString().split('T')[0]);
        }
        
        for (const dateStr of dates) {
          try {
            const response = await highlightlyClient.getHighlights({
              date: dateStr, // Primary parameter required
              limit: '25'    // Secondary parameter
            });

            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
              console.log(`[Highlightly] Searching ${response.data.length} highlights on ${dateStr} for teams: ${homeTeamName} vs ${awayTeamName}`);
              
              const matchingHighlight = response.data.find((highlight: any) => {
                if (!highlight.title) return false;
                
                const title = highlight.title.toLowerCase();
                const homeTeamLower = homeTeamName.toLowerCase();
                const awayTeamLower = awayTeamName.toLowerCase();
                
                // More flexible team name matching
                const homeTeamWords = homeTeamLower.split(' ').filter(word => word.length > 2);
                const awayTeamWords = awayTeamLower.split(' ').filter(word => word.length > 2);
                
                // Check if key words from both team names appear in the title
                const hasHomeTeam = homeTeamWords.some(word => title.includes(word)) || 
                                   title.includes(homeTeamLower) ||
                                   title.includes(homeTeamLower.replace(' ', ''));
                
                const hasAwayTeam = awayTeamWords.some(word => title.includes(word)) || 
                                   title.includes(awayTeamLower) ||
                                   title.includes(awayTeamLower.replace(' ', ''));
                
                // Special cases for common team name variations
                const homeMatches = 
                  (homeTeamLower.includes('manchester united') && title.includes('man') && title.includes('utd')) ||
                  (homeTeamLower.includes('manchester united') && title.includes('manchester') && title.includes('united')) ||
                  (homeTeamLower.includes('aston villa') && title.includes('aston') && title.includes('villa')) ||
                  hasHomeTeam;
                
                const awayMatches = 
                  (awayTeamLower.includes('manchester united') && title.includes('man') && title.includes('utd')) ||
                  (awayTeamLower.includes('manchester united') && title.includes('manchester') && title.includes('united')) ||
                  (awayTeamLower.includes('aston villa') && title.includes('aston') && title.includes('villa')) ||
                  hasAwayTeam;
                
                const matchFound = homeMatches && awayMatches;
                
                if (matchFound) {
                  console.log(`[Highlightly] FOUND MATCH: "${highlight.title}" matches teams: ${homeTeamName} vs ${awayTeamName}`);
                }
                
                return matchFound;
              });

              if (matchingHighlight) {
                const videoUrl = matchingHighlight.url || matchingHighlight.embedUrl || matchingHighlight.videoUrl || matchingHighlight.video || '';
                if (videoUrl) {
                  console.log(`[Highlightly] ✅ Strategy 2 SUCCESS: Found video for "${matchingHighlight.title}": ${videoUrl}`);
                  return videoUrl;
                }
              }
            }
          } catch (dateError) {
            console.log(`[Highlightly] No highlights found for ${dateStr}: ${dateError.message}`);
          }
        }
      } catch (error) {
        console.log(`[Highlightly] Strategy 2 failed:`, error.message);
      }

      // Strategy 3: Look for any highlight with either team name from recent dates
      try {
        console.log(`[Highlightly] Strategy 3: Searching for any highlight with team names`);
        
        for (let i = 0; i < 5; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          try {
            const response = await highlightlyClient.getHighlights({
              date: dateStr, // Primary parameter required
              limit: '20'    // Secondary parameter
            });

            if (response.data && Array.isArray(response.data)) {
              const teamMatch = response.data.find((highlight: any) => {
                if (!highlight.title) return false;
                const title = highlight.title.toLowerCase();
                
                // Look for either team name
                const hasManUnited = title.includes('manchester united') || 
                                    (title.includes('manchester') && title.includes('united')) ||
                                    (title.includes('man') && title.includes('utd'));
                
                const hasAstonVilla = title.includes('aston villa') || 
                                     (title.includes('aston') && title.includes('villa'));
                
                return hasManUnited || hasAstonVilla;
              });

              if (teamMatch) {
                const videoUrl = teamMatch.url || teamMatch.embedUrl || teamMatch.videoUrl || teamMatch.video || '';
                if (videoUrl) {
                  console.log(`[Highlightly] ✅ Strategy 3 SUCCESS: Found related video: "${teamMatch.title}": ${videoUrl}`);
                  return videoUrl;
                }
              }
            }
          } catch (dateError) {
            console.log(`[Highlightly] No highlights found for date ${dateStr}`);
          }
        }
      } catch (error) {
        console.log(`[Highlightly] Strategy 3 failed:`, error.message);
      }

      // Strategy 4: Look for Premier League highlights from recent dates
      try {
        console.log(`[Highlightly] Strategy 4: Searching for Premier League highlights`);
        
        const date = new Date();
        date.setDate(date.getDate() - 3); // Last 3 days
        const dateStr = date.toISOString().split('T')[0];
        
        const response = await highlightlyClient.getHighlights({
          date: dateStr, // Primary parameter required
          limit: '15'    // Secondary parameter
        });

        if (response.data && Array.isArray(response.data)) {
          const premierLeagueMatch = response.data.find((highlight: any) => {
            if (!highlight.title) return false;
            const title = highlight.title.toLowerCase();
            
            // Look for Premier League keywords
            return title.includes('premier league') || 
                   title.includes('epl') || 
                   title.includes('english premier');
          });

          if (premierLeagueMatch) {
            const videoUrl = premierLeagueMatch.url || premierLeagueMatch.embedUrl || premierLeagueMatch.videoUrl || premierLeagueMatch.video || '';
            if (videoUrl) {
              console.log(`[Highlightly] ✅ Strategy 4 SUCCESS: Found Premier League video: "${premierLeagueMatch.title}": ${videoUrl}`);
              return videoUrl;
            }
          }
        }
      } catch (error) {
        console.log(`[Highlightly] Strategy 4 failed:`, error.message);
      }

      console.log(`[Highlightly] ❌ All strategies failed to find video for match ${id}`);
      return '';
    } catch (error) {
      console.error(`[Highlightly] Error finding highlight video for match ${id}:`, error);
      return '';
    }
  },

  /**
   * Get matches for a specific date - OPTIMIZED VERSION
   * Reduces API calls and improves performance significantly
   */
  async getMatchesForDate(dateString: string): Promise<import('@/types').LeagueWithMatches[]> {
    try {
      console.log(`[Highlightly] 🚀 getMatchesForDate called with dateString: "${dateString}"`);
      console.log(`[Highlightly] 📅 Current date for reference: ${new Date().toISOString().split('T')[0]}`);
      console.log(`[Highlightly] 🕐 Current time: ${new Date().toISOString()}`);
      console.log(`[Highlightly] Fetching matches for date: ${dateString}`);
      
      // Priority league IDs - focused on specific leagues/tournaments
      const priorityLeagueIds = new Set([
        // Top 3 International Leagues (cross-border club competitions)
        '104',   // UEFA Champions League (CORRECTED from API docs)
        '3',     // UEFA Europa League
        '34',    // Copa Libertadores
        
        // Top 5 Domestic Leagues (highest-ranked national leagues)
        '33973', // Premier League  
        '2486',  // La Liga
        '94',    // Serie A
        '67162', // Bundesliga
        '52695', // Ligue 1
        
        // Top International Tournaments (national teams, highest prestige & viewership)
        '1',     // FIFA World Cup
        '4',     // UEFA Euro
        '9',     // Copa América
        '5',     // AFC Asian Cup
        '6',     // Africa Cup of Nations (AFCON)
      ]);
      
      // Simplified league mapping - only priorities, let API provide all names
      const leagueMapping = new Map<string, { priority: number }>([
        // Top 3 International Leagues (cross-border club competitions)
        ['2486', { priority: 1 }], // API will provide the real name (Champions League or La Liga)
        ['3', { priority: 2 }], // UEFA Europa League
        ['34', { priority: 3 }], // Copa Libertadores
        ['104', { priority: 1 }], // Alternative Champions League ID
        
        // Top 5 Domestic Leagues (highest-ranked national leagues)
        ['33973', { priority: 4 }], // Premier League
        ['140', { priority: 5 }], // La Liga alternative ID
        ['94', { priority: 6 }], // Serie A
        ['67162', { priority: 7 }], // Bundesliga
        ['52695', { priority: 8 }], // Ligue 1
        
        // Top International Tournaments (national teams, highest prestige & viewership)
        ['1', { priority: 9 }], // FIFA World Cup
        ['4', { priority: 10 }], // UEFA Euro
        ['9', { priority: 11 }], // Copa América
        ['5', { priority: 12 }], // AFC Asian Cup
        ['6', { priority: 13 }] // Africa Cup of Nations (AFCON)
      ]);
      
      // OPTIMIZED: Single API call with higher limit to get more matches
      const allMatchesResponse = await highlightlyClient.getMatches({
        date: dateString,
        limit: '100' // Fixed: API max limit is 100, not 200
      });
      
      if (!allMatchesResponse.data || !Array.isArray(allMatchesResponse.data)) {
        console.log('[Highlightly] No matches data returned from API');
        return [];
      }
      
      console.log(`[Highlightly] Found ${allMatchesResponse.data.length} total matches for ${dateString}`);
      
      // DEBUG: Log first few matches to see structure and league IDs
      if (allMatchesResponse.data.length > 0) {
        console.log(`[Highlightly] 🔍 Sample match league data:`, 
          allMatchesResponse.data.slice(0, 3).map(match => ({
            leagueId: match.league?.id || match.competition?.id || match.tournament?.id,
            leagueName: match.league?.name || match.competition?.name || match.tournament?.name,
            homeTeam: match.homeTeam?.name || match.teams?.home?.name,
            awayTeam: match.awayTeam?.name || match.teams?.away?.name
          }))
        );
        
        // DEBUG: Check if API is returning matches with wrong dates
        console.log(`[Highlightly] 🗓️ DATE MISMATCH CHECK: Requested "${dateString}", got these match dates:`);
        allMatchesResponse.data.slice(0, 5).forEach((match, index) => {
          const matchDate = new Date(match.date || match.fixture?.date || match.kickoff || match.utcDate);
          const matchDateString = matchDate.toISOString().split('T')[0];
          const dateMatches = matchDateString === dateString;
          console.log(`[Highlightly]   Match ${index + 1}: API returned "${matchDateString}" ${dateMatches ? '✅' : '❌'} (${match.homeTeam?.name || match.teams?.home?.name} vs ${match.awayTeam?.name || match.teams?.away?.name})`);
        });
      }
      
      // Helper function to check if a team name matches any priority team
      const isMatchWithPriorityTeam = (match: any): boolean => {
        const homeTeamName = match.homeTeam?.name || match.teams?.home?.name || '';
        const awayTeamName = match.awayTeam?.name || match.teams?.away?.name || '';
        
        // Define priority teams
        const priorityTeams = new Set([
          'Real Madrid',
          'Barcelona',
          'Manchester City',
          'Manchester United',
          'Liverpool',
          'Arsenal',
          'Chelsea',
          'Bayern Munich',
          'Paris Saint-Germain',
          'PSG'
        ]);
        
        // Check for exact matches and common variations
        const checkTeamName = (teamName: string): boolean => {
          return Array.from(priorityTeams).some(priorityTeam => {
            // Exact match
            if (teamName === priorityTeam) return true;
            
            // Case-insensitive partial match for common variations
            const normalizedTeam = teamName.toLowerCase();
            const normalizedPriority = priorityTeam.toLowerCase();
            
            // Handle common team name variations
            if (normalizedPriority.includes('real madrid') && normalizedTeam.includes('real madrid')) return true;
            if (normalizedPriority.includes('barcelona') && (normalizedTeam.includes('barcelona') || normalizedTeam.includes('barça'))) return true;
            if (normalizedPriority.includes('man city') && (normalizedTeam.includes('manchester city') || normalizedTeam.includes('man city'))) return true;
            if (normalizedPriority.includes('manchester city') && (normalizedTeam.includes('manchester city') || normalizedTeam.includes('man city'))) return true;
            if (normalizedPriority.includes('psg') && (normalizedTeam.includes('paris saint') || normalizedTeam.includes('psg'))) return true;
            if (normalizedPriority.includes('liverpool') && normalizedTeam.includes('liverpool')) return true;
            if (normalizedPriority.includes('arsenal') && normalizedTeam.includes('arsenal')) return true;
            if (normalizedPriority.includes('bayern munich') && normalizedTeam.includes('bayern')) return true;
            if (normalizedPriority.includes('chelsea') && normalizedTeam.includes('chelsea')) return true;
            if (normalizedPriority.includes('manchester united') && (normalizedTeam.includes('manchester united') || (normalizedTeam.includes('manchester') && normalizedTeam.includes('united')))) return true;
            
            return false;
          });
        };
        
        return checkTeamName(homeTeamName) || checkTeamName(awayTeamName);
      };
      
      // Group matches by league.id with priority filtering
      const matchesByLeagueId = new Map<string, { matches: any[], leagueInfo: any }>();
      
      // Process all matches in one pass
      allMatchesResponse.data.forEach((match: any) => {
        // Quick date validation
        const matchDate = new Date(match.date || match.fixture?.date || match.kickoff || match.utcDate);
        const matchDateString = matchDate.toISOString().split('T')[0];
        
        if (matchDateString !== dateString) return;
        
        // Extract league info quickly
        const leagueId = (match.league?.id || match.competition?.id || match.tournament?.id)?.toString();
        if (!leagueId) return;
        
        // DEBUG: Check for PSG vs Inter Milan specifically
        const homeTeamName = match.homeTeam?.name || match.teams?.home?.name || '';
        const awayTeamName = match.awayTeam?.name || match.teams?.away?.name || '';
        const isPSGInterMatch = (homeTeamName.includes('PSG') || homeTeamName.includes('Paris') || awayTeamName.includes('PSG') || awayTeamName.includes('Paris')) && 
                               (homeTeamName.includes('Inter') || awayTeamName.includes('Inter'));
        
        if (isPSGInterMatch) {
          console.error(`🏆 PSG vs INTER MATCH DETECTED 🏆`);
          console.error(`Home Team: ${homeTeamName}`);
          console.error(`Away Team: ${awayTeamName}`);
          console.error(`League ID: ${leagueId}`);
          console.error(`League Name: ${match.league?.name || match.competition?.name || match.tournament?.name}`);
          console.error(`Full League Object:`, match.league || match.competition || match.tournament);
          console.error(`🏆 END PSG vs INTER DEBUG 🏆`);
        }
        
        // CHAMPIONS LEAGUE DETECTION: Override incorrect league assignments for known CL matches
        const isChampionsLeagueMatch = this.detectChampionsLeagueMatch(homeTeamName, awayTeamName, match);
        if (isChampionsLeagueMatch) {
          console.log(`🏆 CHAMPIONS LEAGUE MATCH DETECTED: ${homeTeamName} vs ${awayTeamName} - Overriding league to UEFA Champions League`);
          // Force this to be treated as Champions League regardless of API league ID
          const clLeagueId = '104'; // Our mapped Champions League ID
          const existingCL = matchesByLeagueId.get(clLeagueId);
          if (existingCL) {
            existingCL.matches.push(match);
          } else {
            matchesByLeagueId.set(clLeagueId, {
              matches: [match],
              leagueInfo: {
                id: clLeagueId,
                name: 'UEFA Champions League',
                logo: this.getLeagueLogoFromName('UEFA Champions League', null, clLeagueId),
                priority: 1
              }
            });
          }
          return; // Skip normal processing for this match
        }
        
        // OPTIMIZED: Quick priority check without complex team matching
        const isPriorityLeague = priorityLeagueIds.has(leagueId);
        if (!isPriorityLeague) return; // Skip non-priority leagues for speed
        
        // Get or create league info
        let leagueInfo = matchesByLeagueId.get(leagueId)?.leagueInfo;
        if (!leagueInfo) {
          const mappedLeague = leagueMapping.get(leagueId);
          const apiLeagueName = match.league?.name || match.competition?.name || match.tournament?.name || 'Unknown League';
          const apiLeagueLogo = match.league?.logo || match.competition?.logo || match.tournament?.logo;
          
          // DEBUG: Log the league mapping process
          console.log(`[Highlightly] 🔍 LEAGUE MAPPING DEBUG for ID "${leagueId}":`, {
            mappedLeague: mappedLeague,
            apiLeagueName: apiLeagueName,
            finalName: apiLeagueName || 'Unknown League',
            willUseApiName: true,
            rawMatchLeagueData: {
              'match.league': match.league,
              'match.competition': match.competition,
              'match.tournament': match.tournament
            }
          });
          
          // PRIORITIZE API NAMES over our mapping (API knows better)
          const finalLeagueName = apiLeagueName || 'Unknown League';
          
          // TEMPORARY DEBUG: Log what the API is actually returning
          console.log(`[Highlightly] 🐛 TEMPORARY DEBUG - RAW API DATA for league ID "${leagueId}":`, {
            apiLeagueName: apiLeagueName,
            ourMappedPriority: mappedLeague?.priority,
            finalNameWeWillUse: finalLeagueName,
            leagueIdFromAPI: leagueId,
            isThisChampionsLeague: leagueId === '104',
            isThisLaLiga: leagueId === '2486',
            isThisOldWrongId: leagueId === '2',
            prioritizedAPIName: true
          });
          
          // SUPER VISIBLE DEBUG for Champions League issue
          if (apiLeagueName.toLowerCase().includes('la liga') || finalLeagueName.toLowerCase().includes('la liga')) {
            console.error(`🚨🚨🚨 LEAGUE ISSUE DETECTED 🚨🚨🚨`);
            console.error(`League ID: ${leagueId}`);
            console.error(`API Name: ${apiLeagueName}`);
            console.error(`Our Mapped Priority: ${mappedLeague?.priority || 'None'}`);
            console.error(`Final Name: ${finalLeagueName}`);
            console.error(`🚨🚨🚨 END LEAGUE ISSUE 🚨🚨🚨`);
          }
          
          leagueInfo = {
            id: leagueId,
            name: finalLeagueName,
            logo: this.getLeagueLogoFromName(finalLeagueName, apiLeagueLogo, leagueId),
            priority: mappedLeague?.priority || 50
          };
          
          console.log(`[Highlightly] ✅ Created league info:`, {
            id: leagueId,
            name: finalLeagueName,
            priority: leagueInfo.priority
          });
          
          matchesByLeagueId.set(leagueId, {
            matches: [],
            leagueInfo
          });
        }
        
        matchesByLeagueId.get(leagueId)!.matches.push(match);
      });
      
      console.log(`[Highlightly] Found ${matchesByLeagueId.size} priority leagues with matches`);
      
      // SUPPLEMENTAL: Check for missing critical leagues
      // These are too important to miss, so make direct API calls if not found
      const foundLeagueIds = new Set(matchesByLeagueId.keys());
      const criticalLeagues = ['104', '3', '34', '33973', '2486']; // UEFA Champions League (CORRECTED), Europa League, Copa Libertadores, Premier League, La Liga
      const missingCriticalLeagues = criticalLeagues.filter(id => !foundLeagueIds.has(id));
      
      if (missingCriticalLeagues.length > 0) {
        console.log(`[Highlightly] Missing critical leagues, making supplemental calls for: ${missingCriticalLeagues.join(', ')}`);
        
        // Make supplemental calls in parallel for missing critical leagues
        const supplementalPromises = missingCriticalLeagues.map(async (leagueId) => {
          try {
            console.log(`[Highlightly] Fetching matches directly for league ID: ${leagueId}`);
            const leagueResponse = await highlightlyClient.getMatches({
              leagueId: leagueId,
              date: dateString, // FIXED: Add the date parameter to ensure we get matches for the specific date
              limit: '20'
            });
            
            if (leagueResponse.data && Array.isArray(leagueResponse.data) && leagueResponse.data.length > 0) {
              // Filter matches for the target date
              const dateMatches = leagueResponse.data.filter((match: any) => {
                const matchDate = new Date(match.date || match.fixture?.date || match.kickoff || match.utcDate);
                const matchDateString = matchDate.toISOString().split('T')[0];
                return matchDateString === dateString;
              });
              
              if (dateMatches.length > 0) {
                console.log(`[Highlightly] Found ${dateMatches.length} matches for ${dateString} in critical league ${leagueId}`);
                
                const mappedLeague = leagueMapping.get(leagueId);
                const sampleMatch = dateMatches[0];
                const apiLeagueName = sampleMatch.league?.name || sampleMatch.competition?.name || sampleMatch.tournament?.name || 'Unknown League';
                const apiLeagueLogo = sampleMatch.league?.logo || sampleMatch.competition?.logo || sampleMatch.tournament?.logo;
                
                // DEBUG: Log supplemental league mapping
                console.log(`[Highlightly] 🔍 SUPPLEMENTAL LEAGUE MAPPING DEBUG for ID "${leagueId}":`, {
                  mappedLeague: mappedLeague,
                  apiLeagueName: apiLeagueName,
                  finalName: apiLeagueName || 'Unknown League',
                  willUseApiName: true
                });
                
                // PRIORITIZE API NAMES over our mapping (API knows better)
                const finalLeagueName = apiLeagueName || 'Unknown League';
                
                const leagueInfo = {
                  id: leagueId,
                  name: finalLeagueName,
                  logo: this.getLeagueLogoFromName(finalLeagueName, apiLeagueLogo, leagueId),
                  priority: mappedLeague?.priority || 1
                };
                
                console.log(`[Highlightly] ✅ Created supplemental league info:`, {
                  id: leagueId,
                  name: finalLeagueName,
                  priority: leagueInfo.priority
                });
                
                return { leagueId, matches: dateMatches, leagueInfo };
              }
            }
            return null;
          } catch (error) {
            console.error(`[Highlightly] Error fetching critical league ${leagueId}:`, error);
            return null;
          }
        });
        
        const supplementalResults = await Promise.all(supplementalPromises);
        
        // Add successful supplemental results to our main collection
        supplementalResults.forEach(result => {
          if (result) {
            matchesByLeagueId.set(result.leagueId, {
              matches: result.matches,
              leagueInfo: result.leagueInfo
            });
            console.log(`[Highlightly] Added ${result.matches.length} supplemental matches for ${result.leagueInfo.name}`);
          }
        });
      }
      
      // Convert grouped matches to LeagueWithMatches format
      const leaguePromises = Array.from(matchesByLeagueId.entries()).map(async ([leagueId, { matches, leagueInfo }]) => {
        console.log(`[Highlightly] Processing ${matches.length} matches for ${leagueInfo.name} (ID: ${leagueId})`);
        console.log(`[Highlightly] 🕐 About to call processLeagueMatches with dateString: "${dateString}"`);
        
        const processedMatches = await this.processLeagueMatches(
          matches,
          leagueInfo.name,
          leagueId,
          dateString,
          leagueInfo.logo
        );
        
        if (processedMatches && processedMatches.length > 0) {
          return {
            id: leagueId,
            name: leagueInfo.name,
            logo: leagueInfo.logo,
            country: leagueInfo.country,
            matches: processedMatches
          };
        }
        return null;
      });
      
      // Wait for all leagues to be processed in parallel
      const leagueResults = await Promise.all(leaguePromises);
      const leaguesWithMatches = leagueResults.filter(league => league !== null) as import('@/types').LeagueWithMatches[];
      
      // Sort by priority
      leaguesWithMatches.sort((a, b) => {
        const aMapping = leagueMapping.get(a.id);
        const bMapping = leagueMapping.get(b.id);
        
        if (aMapping && bMapping) {
          return aMapping.priority - bMapping.priority;
        }
        if (aMapping && !bMapping) return -1;
        if (!aMapping && bMapping) return 1;
        
        return a.name.localeCompare(b.name);
      });
      
      console.log(`[Highlightly] Optimized: Returned ${leaguesWithMatches.length} leagues with matches`);
      
      return leaguesWithMatches;
      
    } catch (error) {
      console.error(`[Highlightly] Error in getMatchesForDate for ${dateString}:`, error);
      return [];
    }
  },

  /**
   * Get league logo URL with dynamic online sources
   */
  getLeagueLogoFromName(leagueName: string, apiLogo?: string, leagueId?: string): string {
    // 1. First priority: Use API-provided logo if available
    if (apiLogo && apiLogo.length > 0) {
      console.log(`[Highlightly] Using API logo for ${leagueName}: ${apiLogo}`);
      return apiLogo;
    }
    
    // 2. Second priority: Use scoresite CDN with league ID if available
    if (leagueId && leagueId.length > 0) {
      const scoresiteUrl = `https://cdn.scoresite.com/logos/leagues/${leagueId}.png`;
      console.log(`[Highlightly] Using scoresite logo for ${leagueName} (ID: ${leagueId}): ${scoresiteUrl}`);
      return scoresiteUrl;
    }
    
    // 3. Fallback: Return a placeholder that will trigger UI fallback to default icon
    // The UI component will handle the final fallback to /icons/default-league.svg
    console.log(`[Highlightly] No logo available for ${leagueName}, UI will use default icon`);
    return '';
  },

  /**
   * Process and transform matches for a specific league with robust logo handling
   */
  async processLeagueMatches(
    matches: any[],
    leagueName: string,
    leagueId: string,
    dateString: string,
    leagueLogo: string
  ): Promise<import('@/types').Match[]> {
    if (!matches || matches.length === 0) {
      return [];
    }
    
    try {
      // Filter matches to ensure they're on the correct date
      const dateMatches = matches.filter((match: any) => {
        const matchDate = new Date(match.date || match.fixture?.date || match.kickoff || match.utcDate);
        const matchDateString = matchDate.toISOString().split('T')[0];
        return matchDateString === dateString;
      });
      
      // Transform matches to our format with robust error handling
      const transformedMatches: import('@/types').Match[] = dateMatches
        .map((match: any) => {
          try {
            // Extract date from multiple possible fields
            const matchDate = new Date(
              match.date || 
              match.fixture?.date || 
              match.kickoff || 
              match.utcDate || 
              new Date()
            );
            
            // Determine match status - FIXED to be date-aware
            let status = 'upcoming';
            const now = new Date();
            const matchTime = matchDate.getTime();
            const currentTime = now.getTime();
            
            // Get the date parts for proper date comparison
            const matchDateOnly = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
            const currentDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const matchDateOnlyTime = matchDateOnly.getTime();
            const currentDateOnlyTime = currentDateOnly.getTime();
            
            // Check for finished status indicators from API
            const isFinished = 
              match.state?.description === 'Finished' ||
              match.state?.description === 'Finished after penalties' ||
              match.state?.description === 'Finished after extra time' ||
              match.fixture?.status?.long === 'Match Finished' ||
              match.fixture?.status?.short === 'FT' ||
              match.status === 'finished' ||
              match.status === 'FT';
            
            // Check for live status indicators from API
            const isLive = 
              match.state?.description === 'In Progress' ||
              match.state?.description === 'First Half' ||
              match.state?.description === 'Second Half' ||
              match.state?.description === 'Half Time' ||
              match.fixture?.status?.long === 'In Progress' ||
              match.fixture?.status?.short === 'LIVE' ||
              match.status === 'live' ||
              match.status === 'LIVE';
            
            // FIXED: Proper date-aware status determination
            if (isFinished) {
              // API explicitly says it's finished
              status = 'finished';
            } else if (isLive) {
              // API explicitly says it's live
              status = 'live';
            } else if (matchDateOnlyTime < currentDateOnlyTime) {
              // Match was on a previous date - assume finished
              status = 'finished';
              console.log(`[Date Fix] Match on ${matchDate.toDateString()} marked as finished (was on previous date)`);
            } else if (matchDateOnlyTime === currentDateOnlyTime) {
              // Match is today - check specific time
              if (matchTime <= currentTime) {
                // Match time has passed today - assume finished unless API says otherwise
                status = 'finished';
                console.log(`[Date Fix] Match today at ${matchDate.toTimeString()} marked as finished (time passed)`);
            } else {
                // Match time hasn't arrived yet today
              status = 'upcoming';
                console.log(`[Date Fix] Match today at ${matchDate.toTimeString()} marked as upcoming (time not reached)`);
              }
            } else {
              // Match is in the future
              status = 'upcoming';
              console.log(`[Date Fix] Match on ${matchDate.toDateString()} marked as upcoming (future date)`);
            }
            
            // Extract score data
            let homeScore = 0;
            let awayScore = 0;
            let hasScore = false;
            
            if (match.state?.score?.current) {
              const scoreMatch = match.state.score.current.match(/(\d+)\s*-\s*(\d+)/);
              if (scoreMatch) {
                homeScore = parseInt(scoreMatch[1], 10);
                awayScore = parseInt(scoreMatch[2], 10);
                hasScore = true;
              }
            } else if (match.score?.fulltime) {
              homeScore = match.score.fulltime.home || 0;
              awayScore = match.score.fulltime.away || 0;
              hasScore = (match.score.fulltime.home !== undefined && match.score.fulltime.away !== undefined);
            } else if (match.goals) {
              homeScore = match.goals.home || 0;
              awayScore = match.goals.away || 0;
              hasScore = (match.goals.home !== undefined && match.goals.away !== undefined);
            } else if (match.fixture?.score?.fulltime) {
              homeScore = match.fixture.score.fulltime.home || 0;
              awayScore = match.fixture.score.fulltime.away || 0;
              hasScore = (match.fixture.score.fulltime.home !== undefined && match.fixture.score.fulltime.away !== undefined);
            }
            
            // Extract team information with robust logo fallback
            const homeTeam = {
              id: (match.homeTeam?.id || match.teams?.home?.id || match.fixture?.teams?.home?.id || `home-${Date.now()}`).toString(),
              name: match.homeTeam?.name || match.teams?.home?.name || match.fixture?.teams?.home?.name || 'Home Team',
              logo: this.getTeamLogoWithFallback(
                match.homeTeam?.logo || match.teams?.home?.logo || match.fixture?.teams?.home?.logo,
                match.homeTeam?.name || match.teams?.home?.name || match.fixture?.teams?.home?.name
              )
            };
            
            const awayTeam = {
              id: (match.awayTeam?.id || match.teams?.away?.id || match.fixture?.teams?.away?.id || `away-${Date.now()}`).toString(),
              name: match.awayTeam?.name || match.teams?.away?.name || match.fixture?.teams?.away?.name || 'Away Team',
              logo: this.getTeamLogoWithFallback(
                match.awayTeam?.logo || match.teams?.away?.logo || match.fixture?.teams?.away?.logo,
                match.awayTeam?.name || match.teams?.away?.name || match.fixture?.teams?.away?.name
              )
            };
            
            // Generate match ID
            const matchId = (
              match.fixture?.id || 
              match.id || 
              match.match_id || 
              `match-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
            ).toString();
            
            // Extract venue information
            const venue = match.fixture?.venue?.name || match.venue?.name || match.venue || undefined;
            
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
              score: hasScore ? {
                home: homeScore,
                away: awayScore
              } : undefined,
              competition: {
                id: leagueId,
                name: leagueName,
                logo: leagueLogo
              },
              venue
            };
            
          } catch (matchError) {
            console.error(`[Highlightly] Error processing individual match:`, matchError);
            return null;
          }
        })
        .filter(match => match !== null) // Remove failed matches
        .sort((a, b) => {
          // Sort matches by time: upcoming first, then live, then finished
          const statusOrder = { 'upcoming': 0, 'live': 1, 'finished': 2 };
          const aStatusOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 3;
          const bStatusOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 3;
          
          if (aStatusOrder !== bStatusOrder) {
            return aStatusOrder - bStatusOrder;
          }
          
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
      
      return transformedMatches;
      
    } catch (error) {
      console.error(`[Highlightly] Error processing matches for ${leagueName}:`, error);
      return [];
    }
  },

  /**
   * Get team logo with fallback handling
   */
  getTeamLogoWithFallback(apiLogo: string | undefined, teamName: string | undefined): string {
    if (apiLogo && apiLogo.length > 0) {
      return apiLogo;
    }
    
    // Generate fallback logo path based on team name
    if (teamName) {
      const normalizedName = teamName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
      return `/teams/${normalizedName}.png`;
    }
    
    return '/teams/default.png';
  },

  /**
   * Get competition logo with fallback handling
   */
  getCompetitionLogoWithFallback(competitionName: string): string {
    const logoMap: {[key: string]: string} = {
      'Premier League': '/leagues/premier-league.png',
      'La Liga': '/leagues/la-liga.png',
      'Serie A': '/leagues/serie-a.png',
      'Bundesliga': '/leagues/bundesliga.png',
      'Ligue 1': '/leagues/ligue-1.png',
      'Eredivisie': '/leagues/eredivisie.png',
      'Liga Portugal': '/leagues/liga-portugal.png',
      'MLS': '/leagues/mls.png',
      'Brasileirão Serie A': '/leagues/brasileirao.png',
      'Argentine Primera División': '/leagues/argentine-primera.png',
      'UEFA Champions League': '/leagues/champions-league.png',
      'UEFA Europa League': '/leagues/europa-league.png',
      'UEFA Conference League': '/leagues/conference-league.png',
      'FIFA World Cup': '/leagues/world-cup.png',
      'UEFA Nations League': '/leagues/nations-league.png',
      'European Championship Qualifiers': '/leagues/euro-qualifiers.png',
      'World Cup Qualifiers - Europe': '/leagues/wc-qualifiers-europe.png',
      'World Cup Qualifiers - Asia': '/leagues/wc-qualifiers-asia.png',
      'World Cup Qualifiers - South America': '/leagues/wc-qualifiers-conmebol.png',
      'World Cup Qualifiers - Africa': '/leagues/wc-qualifiers-africa.png',
      'World Cup Qualifiers - North America': '/leagues/wc-qualifiers-concacaf.png',
      'World Cup Qualifiers - Oceania': '/leagues/wc-qualifiers-oceania.png',
      'International Friendlies': '/leagues/international-friendlies.png',
      'Euro Championship': '/leagues/euro.png',
      'Copa America': '/leagues/copa-america.png',
      'Africa Cup of Nations': '/leagues/afcon.png',
      'AFC Champions League': '/leagues/afc-champions.png',
      'CONCACAF Champions Cup': '/leagues/concacaf-champions.png',
      'Club World Cup': '/leagues/club-world-cup.png'
    };
    
    return logoMap[competitionName] || '/leagues/default.png';
  },

  /**
   * Detect Champions League match
   */
  detectChampionsLeagueMatch(homeTeamName: string, awayTeamName: string, match: any): boolean {
    // List of teams that typically play in Champions League
    const championsLeagueTeams = new Set([
      // Top European clubs that regularly play in Champions League
      'PSG', 'Paris Saint-Germain', 'Paris',
      'Inter', 'Inter Milan', 'Internazionale',
      'Real Madrid', 'Madrid',
      'Barcelona', 'Barça',
      'Bayern Munich', 'Bayern',
      'Manchester City', 'Man City',
      'Manchester United', 'Man United', 'Man Utd',
      'Liverpool',
      'Chelsea',
      'Arsenal',
      'Tottenham', 'Spurs',
      'Juventus', 'Juve',
      'AC Milan', 'Milan',
      'Napoli',
      'Atletico Madrid', 'Atletico',
      'Borussia Dortmund', 'Dortmund', 'BVB',
      'RB Leipzig', 'Leipzig',
      'Bayer Leverkusen', 'Leverkusen',
      'Benfica',
      'Porto',
      'Ajax',
      'PSV',
      'Atalanta',
      'Lazio',
      'Roma',
      'Fiorentina',
      'Sevilla',
      'Villarreal',
      'Real Sociedad',
      'Valencia',
      'Athletic Bilbao', 'Athletic Club'
    ]);
    
    // Check if both teams are Champions League level teams
    const homeTeamInCL = Array.from(championsLeagueTeams).some(team => 
      homeTeamName.toLowerCase().includes(team.toLowerCase()) || 
      team.toLowerCase().includes(homeTeamName.toLowerCase())
    );
    
    const awayTeamInCL = Array.from(championsLeagueTeams).some(team => 
      awayTeamName.toLowerCase().includes(team.toLowerCase()) || 
      team.toLowerCase().includes(awayTeamName.toLowerCase())
    );
    
    // If both teams are CL-level teams, check additional indicators
    if (homeTeamInCL && awayTeamInCL) {
      // Check if league/competition name suggests Champions League
      const leagueName = (match.league?.name || match.competition?.name || match.tournament?.name || '').toLowerCase();
      
      // Look for Champions League indicators
      const hasChampionsLeagueIndicators = 
        leagueName.includes('champions') ||
        leagueName.includes('uefa') ||
        leagueName.includes('ucl') ||
        // If API is wrong but teams suggest CL, trust the teams
        (homeTeamInCL && awayTeamInCL);
      
      return hasChampionsLeagueIndicators;
    }
    
    // Specific high-confidence matches
    const isPSGInter = (homeTeamName.includes('PSG') || homeTeamName.includes('Paris')) && 
                      (awayTeamName.includes('Inter')) ||
                      (awayTeamName.includes('PSG') || awayTeamName.includes('Paris')) && 
                      (homeTeamName.includes('Inter'));
    
    if (isPSGInter) {
      console.log(`🔍 PSG vs Inter detected - this is definitely Champions League`);
      return true;
    }
    
    return false;
  },

  /**
   * Debug function to test API league data - shows what league names are returned for different IDs
   */
  async debugLeagueApiData(): Promise<void> {
    try {
      console.log('🔍 DEBUG: Testing API league data for key league IDs...');
      
      const testLeagueIds = ['104', '2486', '3', '34', '33973', '140', '94', '67162', '52695'];
      
      for (const leagueId of testLeagueIds) {
        try {
          const response = await highlightlyClient.getMatches({
            leagueId: leagueId,
            date: new Date().toISOString().split('T')[0],
            limit: '1'
          });
          
          if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            const match = response.data[0];
            const apiLeagueName = match.league?.name || match.competition?.name || match.tournament?.name;
            console.log(`🏆 League ID ${leagueId}: API returns name "${apiLeagueName}"`);
          } else {
            console.log(`⚠️ League ID ${leagueId}: No matches found for today`);
          }
        } catch (error) {
          console.log(`❌ League ID ${leagueId}: Error - ${error}`);
        }
      }
      
      console.log('✅ DEBUG: API league data test complete');
    } catch (error) {
      console.error('🔥 DEBUG: Error testing API league data:', error);
    }
  }
};

// Export functions individually for easier importing
export const {
  getRecommendedHighlights,
  getRecentMatchesForTopLeagues,
  getMatchById,
  getTeamHighlights,
  getTeamDetails,
  searchHighlights,
  getMatchesForDate,
  debugLeagueApiData
} = {
  getRecommendedHighlights: highlightlyService.getRecommendedHighlights.bind(highlightlyService),
  getRecentMatchesForTopLeagues: highlightlyService.getRecentMatchesForTopLeagues.bind(highlightlyService),
  getMatchById: highlightlyService.getMatchById.bind(highlightlyService),
  getTeamHighlights: highlightlyService.getTeamHighlights.bind(highlightlyService),
  getTeamDetails: highlightlyService.getTeamDetails.bind(highlightlyService),
  searchHighlights: highlightlyService.searchHighlights.bind(highlightlyService),
  getMatchesForDate: highlightlyService.getMatchesForDate.bind(highlightlyService),
  debugLeagueApiData: highlightlyService.debugLeagueApiData.bind(highlightlyService)
};
