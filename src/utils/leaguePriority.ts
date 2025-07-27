export const LEAGUE_PRIORITIES = {
  // Tier 1 - Top Priority (using actual IDs from database)
  1: { id: 33973, name: "Premier League", tier: 1 },
  2: { id: 119924, name: "La Liga", tier: 1 },
  3: { id: 115669, name: "Serie A", tier: 1 },  // Using UEFA Conference League ID temporarily
  4: { id: 67162, name: "Bundesliga", tier: 1 },
  5: { id: 52695, name: "Ligue 1", tier: 1 },
  
  // Tier 2 - European Competitions
  6: { id: 2486, name: "UEFA Champions League", tier: 2 },
  7: { id: 3337, name: "UEFA Europa League", tier: 2 },
  8: { id: 115669, name: "UEFA Conference League", tier: 2 },
  
  // Tier 3 - Secondary European Leagues  
  9: { id: 34824, name: "Championship", tier: 3 },
  10: { id: 80778, name: "Liga Portugal", tier: 3 },
  11: { id: 75672, name: "Eredivisie", tier: 3 },
  12: { id: 11847, name: "Copa Libertadores", tier: 3 },
  
  // Tier 4 - Other Notable Leagues
  13: { id: 109712, name: "Liga Profesional Argentina", tier: 4 },
  14: { id: 223746, name: "Liga MX", tier: 4 },
  15: { id: 173537, name: "Turkish Süper Lig", tier: 4 },
  16: { id: 216087, name: "MLS", tier: 4 },
  
  // Additional leagues can be added here
} as const;

export function getTopLeaguesWithUpcomingGames(
  matches: any[],
  dateRange: { start: Date; end: Date }
): number[] {
  // Group matches by league
  const leagueMatches = matches.reduce((acc, match) => {
    if (!acc[match.competition_id]) {
      acc[match.competition_id] = [];
    }
    acc[match.competition_id].push(match);
    return acc;
  }, {} as Record<number, any[]>);
  
  // Get leagues with upcoming matches in date range
  const leaguesWithGames = Object.keys(leagueMatches)
    .map(Number)
    .filter(leagueId => {
      return leagueMatches[leagueId].some(match => {
        const matchDate = new Date(match.utc_date);
        return matchDate >= dateRange.start && matchDate <= dateRange.end;
      });
    });
  
  // Sort leagues by priority
  const prioritizedLeagues = leaguesWithGames.sort((a, b) => {
    const priorityA = Object.values(LEAGUE_PRIORITIES).findIndex(l => l.id === a);
    const priorityB = Object.values(LEAGUE_PRIORITIES).findIndex(l => l.id === b);
    
    if (priorityA === -1 && priorityB === -1) return 0;
    if (priorityA === -1) return 1;
    if (priorityB === -1) return -1;
    
    return priorityA - priorityB;
  });
  
  // Return top 8 leagues
  return prioritizedLeagues.slice(0, 8);
}