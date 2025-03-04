import { leaguesData, matchHighlightsData, teamDetailsData } from "@/data/mock-data";
import { League, MatchHighlight, Team, TeamDetails } from "@/types";

export const getMatchHighlights = async (): Promise<MatchHighlight[]> => {
  // Simulate an API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(matchHighlightsData);
    }, 500);
  });
};

export const getLeagues = async (): Promise<League[]> => {
  // Simulate an API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(leaguesData);
    }, 500);
  });
};

export const getTeamDetails = async (teamId: string): Promise<TeamDetails | undefined> => {
  // Simulate an API call
  return new Promise((resolve) => {
    setTimeout(() => {
      const teamDetails = teamDetailsData.find((team) => team.team.id === teamId);
      resolve(teamDetails);
    }, 500);
  });
};

export const getMatchHighlightById = async (id: string): Promise<MatchHighlight | undefined> => {
  // Simulate an API call
  return new Promise((resolve) => {
    setTimeout(() => {
      const matchHighlight = matchHighlightsData.find((match) => match.id === id);
      resolve(matchHighlight);
    }, 500);
  });
};

export const getLeagueById = async (leagueId: string): Promise<League> => {
  // This would be an API call in a real app
  // For now, we'll just filter from our mock data
  const leagues = await getLeagues();
  const league = leagues.find(league => league.id === leagueId);
  
  if (!league) {
    throw new Error('League not found');
  }
  
  return league;
};

export const getTeamById = async (teamId: string): Promise<Team | undefined> => {
  // Simulate an API call
  return new Promise((resolve) => {
    setTimeout(() => {
      const teamDetail = teamDetailsData.find((team) => team.team.id === teamId);
      resolve(teamDetail?.team);
    }, 500);
  });
};
