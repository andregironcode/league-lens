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

      // Get date from a week ago in YYYY-MM-DD format to ensure we have highlights available
      const date = new Date();
      date.setDate(date.getDate() - 7); // Go back 7 days
      const formattedDate = date.toISOString().split('T')[0];
      
      // Step 1: First fetch available leagues
      console.log('[Highlightly] Fetching available leagues...');
      const leaguesResponse = await highlightlyClient.getLeagues();

      // If we can't get leagues, try general highlights approach
      if (!leaguesResponse.data || !Array.isArray(leaguesResponse.data)) {
        console.log('[Highlightly] Could not fetch leagues, trying general highlights');
        return this.fetchGeneralHighlights(formattedDate);
      }

      console.log(`[Highlightly] Found ${leaguesResponse.data.length} leagues`); 
      
      // Step 2: Filter and sort leagues based on priority list
      const prioritizedLeagues = this.prioritizeLeagues(leaguesResponse.data, topLeagueNames);
      console.log(`[Highlightly] Top leagues: ${prioritizedLeagues.slice(0, 5).map(l => l.name).join(', ')}`);
      
      // Step 3: Fetch highlights for each top league
      const leaguesWithHighlights: League[] = [];
      
      for (const league of prioritizedLeagues.slice(0, 10)) { // Try top 10 leagues
        if (!league.id || !league.name) continue;
        
        try {
          console.log(`[Highlightly] Fetching highlights for ${league.name}`);
          const leagueHighlights = await this.fetchLeagueHighlights(league, formattedDate);
          
          if (leagueHighlights.length > 0) {
            leaguesWithHighlights.push({
              id: league.id,
              name: league.name,
              logo: league.logo || '/leagues/default.png',
              highlights: leagueHighlights
            });
            console.log(`[Highlightly] Added ${league.name} with ${leagueHighlights.length} highlights`);
          }
        } catch (error) {
          console.error(`[Highlightly] Error fetching highlights for ${league.name}:`, error);
        }
        
        // Stop after finding 5 leagues with highlights
        if (leaguesWithHighlights.length >= 5) break;
      }
      
      // Step 4: If we found leagues with highlights, return them
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
   * Helper method to prioritize leagues based on names
   */
  prioritizeLeagues(leagues: any[], topLeagueNames: string[]): any[] {
    return [...leagues].sort((a, b) => {
      const aName = a.name || '';
      const bName = b.name || '';
      
      // Find indexes in priority list (case-insensitive)
      const aIndex = topLeagueNames.findIndex(name => 
        aName.toLowerCase().includes(name.toLowerCase()));
      const bIndex = topLeagueNames.findIndex(name => 
        bName.toLowerCase().includes(name.toLowerCase()));
      
      // Sort by priority first
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      
      // Then alphabetically
      return aName.localeCompare(bName);
    });
  },
  
  /**
   * Helper method to fetch highlights for a specific league
   */
  async fetchLeagueHighlights(league: any, formattedDate: string): Promise<MatchHighlight[]> {
    const response = await highlightlyClient.getHighlights({
      date: formattedDate,
      league: league.id,
      limit: '10'
    });
    
    if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
      return [];
    }
    
    return response.data.map((highlight: any): MatchHighlight => {
      // Extract team names
      let homeTeamName = 'Unknown Team';
      let awayTeamName = 'Unknown Team';
      
      if (highlight.homeTeam && highlight.awayTeam) {
        homeTeamName = highlight.homeTeam.name || highlight.homeTeam;
        awayTeamName = highlight.awayTeam.name || highlight.awayTeam;
      } else {
        const titleParts = highlight.title.split(' vs ');
        if (titleParts.length >= 2) {
          homeTeamName = titleParts[0]?.trim();
          const awayPart = titleParts[1]?.trim();
          awayTeamName = awayPart.split(' - ')[0]?.trim() || awayPart;
        }
      }
      
      // Extract score
      let homeScore = 0;
      let awayScore = 0;
      
      if (highlight.score) {
        homeScore = parseInt(highlight.score.home || '0', 10);
        awayScore = parseInt(highlight.score.away || '0', 10);
      } else {
        const scoreMatch = highlight.title.match(/(\d+)\s*-\s*(\d+)/);
        if (scoreMatch) {
          homeScore = parseInt(scoreMatch[1], 10);
          awayScore = parseInt(scoreMatch[2], 10);
        }
      }
      
      // Ensure we have valid thumbnail URL
      let thumbnailUrl = 'https://via.placeholder.com/300x200?text=No+Thumbnail';
      if (highlight.thumbnail) {
        thumbnailUrl = highlight.thumbnail;
      } else if (highlight.thumbnailUrl) {
        thumbnailUrl = highlight.thumbnailUrl;
      } else if (highlight.image) {
        thumbnailUrl = highlight.image;
      }
      
      return {
        id: highlight.id || highlight.matchId || `highlight-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: highlight.title,
        date: highlight.date ? new Date(highlight.date).toISOString() : new Date().toISOString(),
        thumbnailUrl,
        videoUrl: highlight.url || highlight.embedUrl || highlight.video || '',
        duration: highlight.duration || '0:00',
        views: highlight.views || Math.floor(Math.random() * 10000),
        homeTeam: {
          id: highlight.homeTeamId || `team-${homeTeamName.toLowerCase().replace(/\s+/g, '-')}`,
          name: homeTeamName,
          logo: highlight.homeTeamLogo || '/teams/default.png'
        },
        awayTeam: {
          id: highlight.awayTeamId || `team-${awayTeamName.toLowerCase().replace(/\s+/g, '-')}`,
          name: awayTeamName,
          logo: highlight.awayTeamLogo || '/teams/default.png'
        },
        score: {
          home: homeScore,
          away: awayScore
        },
        competition: {
          id: league.id,
          name: league.name,
          logo: league.logo || highlight.leagueLogo || '/leagues/default.png'
        }
      };
    });
  },
  
  /**
   * Helper method to fetch general highlights when league-specific ones aren't available
   */
  async fetchGeneralHighlights(formattedDate: string): Promise<League[]> {
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
