import { supabase } from '@/integrations/supabase/client';
import type { 
  Team, TeamInsert,
  Competition, CompetitionInsert,
  MatchHighlight, MatchHighlightInsert,
  LeagueTable, LeagueTableInsert,
  Fixture, FixtureInsert,
  TeamCompetition, TeamCompetitionInsert
} from '@/integrations/supabase/types';
import type { TeamDetails } from '@/types';

/**
 * Supabase service for handling all database operations
 */
export const supabaseService = {
  // TEAMS
  async getTeams(): Promise<Team[]> {
    const { data, error } = await supabase
      .from('teams')
      .select('*');
    
    if (error) {
      console.error('Error fetching teams:', error);
      return [];
    }
    
    return data;
  },

  async getTeamById(id: string): Promise<Team | null> {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error fetching team with id ${id}:`, error);
      return null;
    }
    
    return data;
  },

  async createTeam(team: TeamInsert): Promise<Team | null> {
    const { data, error } = await supabase
      .from('teams')
      .insert(team)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating team:', error);
      return null;
    }
    
    return data;
  },

  // COMPETITIONS
  async getCompetitions(): Promise<Competition[]> {
    const { data, error } = await supabase
      .from('competitions')
      .select('*');
    
    if (error) {
      console.error('Error fetching competitions:', error);
      return [];
    }
    
    return data;
  },

  async getCompetitionById(id: string): Promise<Competition | null> {
    const { data, error } = await supabase
      .from('competitions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error fetching competition with id ${id}:`, error);
      return null;
    }
    
    return data;
  },

  async createCompetition(competition: CompetitionInsert): Promise<Competition | null> {
    const { data, error } = await supabase
      .from('competitions')
      .insert(competition)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating competition:', error);
      return null;
    }
    
    return data;
  },

  // MATCH HIGHLIGHTS
  async getMatchHighlights(): Promise<MatchHighlight[]> {
    const { data, error } = await supabase
      .from('match_highlights')
      .select('*');
    
    if (error) {
      console.error('Error fetching match highlights:', error);
      return [];
    }
    
    return data;
  },

  async getMatchHighlightById(id: string): Promise<MatchHighlight | null> {
    const { data, error } = await supabase
      .from('match_highlights')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error fetching match highlight with id ${id}:`, error);
      return null;
    }
    
    return data;
  },

  async createMatchHighlight(highlight: MatchHighlightInsert): Promise<MatchHighlight | null> {
    const { data, error } = await supabase
      .from('match_highlights')
      .insert(highlight)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating match highlight:', error);
      return null;
    }
    
    return data;
  },

  async getMatchHighlightsByCompetition(competitionId: string): Promise<MatchHighlight[]> {
    const { data, error } = await supabase
      .from('match_highlights')
      .select('*')
      .eq('competition_id', competitionId);
    
    if (error) {
      console.error(`Error fetching match highlights for competition ${competitionId}:`, error);
      return [];
    }
    
    return data;
  },

  async getMatchHighlightsByTeam(teamId: string): Promise<MatchHighlight[]> {
    const { data, error } = await supabase
      .from('match_highlights')
      .select('*')
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`);
    
    if (error) {
      console.error(`Error fetching match highlights for team ${teamId}:`, error);
      return [];
    }
    
    return data;
  },

  // LEAGUE TABLES
  async getLeagueTable(competitionId: string): Promise<LeagueTable[]> {
    const { data, error } = await supabase
      .from('league_tables')
      .select('*')
      .eq('competition_id', competitionId)
      .order('position', { ascending: true });
    
    if (error) {
      console.error(`Error fetching league table for competition ${competitionId}:`, error);
      return [];
    }
    
    return data;
  },

  async getTeamStanding(teamId: string, competitionId: string): Promise<LeagueTable | null> {
    const { data, error } = await supabase
      .from('league_tables')
      .select('*')
      .eq('team_id', teamId)
      .eq('competition_id', competitionId)
      .single();
    
    if (error) {
      console.error(`Error fetching team standing for team ${teamId} in competition ${competitionId}:`, error);
      return null;
    }
    
    return data;
  },

  async updateLeagueTable(leagueTable: LeagueTableInsert): Promise<LeagueTable | null> {
    const { data, error } = await supabase
      .from('league_tables')
      .upsert(leagueTable)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating league table:', error);
      return null;
    }
    
    return data;
  },

  // FIXTURES
  async getFixtures(): Promise<Fixture[]> {
    const { data, error } = await supabase
      .from('fixtures')
      .select('*')
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Error fetching fixtures:', error);
      return [];
    }
    
    return data;
  },

  async getFixturesByTeam(teamId: string): Promise<Fixture[]> {
    const { data, error } = await supabase
      .from('fixtures')
      .select('*')
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .order('date', { ascending: true });
    
    if (error) {
      console.error(`Error fetching fixtures for team ${teamId}:`, error);
      return [];
    }
    
    return data;
  },

  async createFixture(fixture: FixtureInsert): Promise<Fixture | null> {
    const { data, error } = await supabase
      .from('fixtures')
      .insert(fixture)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating fixture:', error);
      return null;
    }
    
    return data;
  },

  // TEAM COMPETITIONS
  async getTeamCompetitions(teamId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('team_competitions')
      .select('competition_id')
      .eq('team_id', teamId);
    
    if (error) {
      console.error(`Error fetching competitions for team ${teamId}:`, error);
      return [];
    }
    
    return data.map(tc => tc.competition_id);
  },

  async addTeamToCompetition(teamCompetition: TeamCompetitionInsert): Promise<TeamCompetition | null> {
    const { data, error } = await supabase
      .from('team_competitions')
      .insert(teamCompetition)
      .select()
      .single();
    
    if (error) {
      console.error('Error adding team to competition:', error);
      return null;
    }
    
    return data;
  },

  // COMPLEX QUERIES
  async getRecommendedHighlights(): Promise<any[]> {
    // This would typically involve a more complex query, possibly including joins
    // For now, we'll just get the latest highlights
    const { data, error } = await supabase
      .from('match_highlights')
      .select(`
        *,
        competitions(*),
        home_team:teams!match_highlights_home_team_id_fkey(*),
        away_team:teams!match_highlights_away_team_id_fkey(*)
      `)
      .order('date', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('Error fetching recommended highlights:', error);
      return [];
    }
    
    // Transform to match the expected format
    return data.map(highlight => ({
      id: highlight.id,
      title: highlight.title,
      date: highlight.date,
      thumbnailUrl: highlight.thumbnail_url,
      videoUrl: highlight.video_url,
      duration: highlight.duration,
      views: highlight.views,
      homeTeam: highlight.home_team,
      awayTeam: highlight.away_team,
      score: {
        home: highlight.home_score,
        away: highlight.away_score
      },
      competition: {
        id: highlight.competitions.id,
        name: highlight.competitions.name,
        logo: highlight.competitions.logo
      }
    }));
  },

  async getLeagueHighlights(): Promise<any[]> {
    // Get all competitions
    const { data: competitions, error: competitionsError } = await supabase
      .from('competitions')
      .select('*');
    
    if (competitionsError) {
      console.error('Error fetching competitions:', competitionsError);
      return [];
    }
    
    // For each competition, get their highlights
    const result = await Promise.all(competitions.map(async competition => {
      const { data: highlights, error: highlightsError } = await supabase
        .from('match_highlights')
        .select(`
          *,
          home_team:teams!match_highlights_home_team_id_fkey(*),
          away_team:teams!match_highlights_away_team_id_fkey(*)
        `)
        .eq('competition_id', competition.id)
        .order('date', { ascending: false });
      
      if (highlightsError) {
        console.error(`Error fetching highlights for competition ${competition.id}:`, highlightsError);
        return {
          id: competition.id,
          name: competition.name,
          logo: competition.logo,
          highlights: []
        };
      }
      
      // Transform to match the expected format
      return {
        id: competition.id,
        name: competition.name,
        logo: competition.logo,
        highlights: highlights.map(highlight => ({
          id: highlight.id,
          title: highlight.title,
          date: highlight.date,
          thumbnailUrl: highlight.thumbnail_url,
          videoUrl: highlight.video_url,
          duration: highlight.duration,
          views: highlight.views,
          homeTeam: highlight.home_team,
          awayTeam: highlight.away_team,
          score: {
            home: highlight.home_score,
            away: highlight.away_score
          },
          competition: {
            id: competition.id,
            name: competition.name,
            logo: competition.logo
          }
        }))
      };
    }));
    
    return result;
  },

  async getTeamDetails(teamId: string): Promise<TeamDetails | null> {
    // Get the team
    const team = await this.getTeamById(teamId);
    if (!team) return null;
    
    // Get the competitions this team participates in
    const competitionIds = await this.getTeamCompetitions(teamId);
    if (competitionIds.length === 0) return null;
    
    // Assuming the first competition is the league and the second (if any) is European
    const leagueId = competitionIds[0];
    const europeanId = competitionIds.length > 1 ? competitionIds[1] : null;
    
    // Get the competitions details
    const league = await this.getCompetitionById(leagueId);
    const european = europeanId ? await this.getCompetitionById(europeanId) : null;
    
    // Get the league table
    const leagueTable = await this.getLeagueTable(leagueId);
    const europeanTable = europeanId ? await this.getLeagueTable(europeanId) : [];
    
    // Get the team's standing in the league
    const leagueStanding = await this.getTeamStanding(teamId, leagueId);
    const europeanStanding = europeanId ? await this.getTeamStanding(teamId, europeanId) : null;
    
    // Get the fixtures
    const fixtures = await this.getFixturesByTeam(teamId);
    
    // Transform the data to match the expected format
    const teamDetails: TeamDetails = {
      team: {
        id: team.id,
        name: team.name,
        logo: team.logo
      },
      leagueStanding: leagueStanding ? 
        `${this.getOrdinalSuffix(leagueStanding.position)} in ${league?.name}` : 
        'Not available',
      europeanCompetition: european?.name || null,
      europeanStanding: europeanStanding ? 
        `${this.getOrdinalSuffix(europeanStanding.position)} in ${european?.name}` : 
        null,
      leagueTable: leagueTable,
      europeanTable: europeanTable,
      fixtures: fixtures
    };
    
    return teamDetails;
  },

  async searchHighlights(query: string): Promise<any[]> {
    if (!query.trim()) return [];
    
    const normalizedQuery = query.toLowerCase().trim();
    
    // Search in match_highlights including team and competition information
    const { data, error } = await supabase
      .from('match_highlights')
      .select(`
        *,
        competitions(*),
        home_team:teams!match_highlights_home_team_id_fkey(*),
        away_team:teams!match_highlights_away_team_id_fkey(*)
      `)
      .or(`
        title.ilike.%${normalizedQuery}%,
        home_team.name.ilike.%${normalizedQuery}%,
        away_team.name.ilike.%${normalizedQuery}%,
        competitions.name.ilike.%${normalizedQuery}%
      `)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error searching highlights:', error);
      return [];
    }
    
    // Transform to match the expected format
    return data.map(highlight => ({
      id: highlight.id,
      title: highlight.title,
      date: highlight.date,
      thumbnailUrl: highlight.thumbnail_url,
      videoUrl: highlight.video_url,
      duration: highlight.duration,
      views: highlight.views,
      homeTeam: highlight.home_team,
      awayTeam: highlight.away_team,
      score: {
        home: highlight.home_score,
        away: highlight.away_score
      },
      competition: {
        id: highlight.competitions.id,
        name: highlight.competitions.name,
        logo: highlight.competitions.logo
      }
    }));
  },

  // HELPER METHODS
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

  // Removed transformTableRows and transformFixtures - trust API responses directly
};

// Import real-time methods from supabaseDataService
import { supabaseDataService } from './supabaseDataService';

// Export functions individually for easier importing
export const {
  getRecommendedHighlights,
  getLeagueHighlights,
  getMatchById,
  getTeamHighlights,
  getTeamDetails,
  searchHighlights,
  // Add real-time methods
  subscribeToMatch,
  subscribeToLiveMatches,
  subscribeToMatchEvents,
  unsubscribe,
  unsubscribeAll
} = {
  // Map the functions to match the original service signatures
  getRecommendedHighlights: supabaseService.getRecommendedHighlights.bind(supabaseService),
  getLeagueHighlights: supabaseService.getLeagueHighlights.bind(supabaseService),
  getMatchById: (id: string) => supabaseService.getMatchHighlightById(id),
  getTeamHighlights: (teamId: string) => supabaseService.getMatchHighlightsByTeam(teamId),
  // Real-time methods from supabaseDataService
  subscribeToMatch: supabaseDataService.subscribeToMatch.bind(supabaseDataService),
  subscribeToLiveMatches: supabaseDataService.subscribeToLiveMatches.bind(supabaseDataService),
  subscribeToMatchEvents: supabaseDataService.subscribeToMatchEvents.bind(supabaseDataService),
  unsubscribe: supabaseDataService.unsubscribe.bind(supabaseDataService),
  unsubscribeAll: supabaseDataService.unsubscribeAll.bind(supabaseDataService),
  getTeamDetails: (teamId: string) => supabaseService.getTeamDetails(teamId),
  searchHighlights: (query: string) => supabaseService.searchHighlights(query)
};
