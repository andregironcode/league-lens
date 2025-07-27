interface TeamRanking {
  teamId: number;
  leaguePosition?: number;
  isTopTeam?: boolean;
}

interface MatchWeight {
  matchId: number;
  totalWeight: number;
  breakdown: {
    leagueWeight: number;
    stageWeight: number;
    teamWeight: number;
    formWeight: number;
    timeWeight: number;
  };
}

// League weights based on tier
const LEAGUE_WEIGHTS = {
  1: 40,  // Top 5 leagues
  2: 35,  // European competitions
  3: 25,  // Secondary leagues
  4: 20,  // Other leagues
  default: 15
};

// Competition stage weights
const STAGE_WEIGHTS = {
  'final': 40,
  'semi-final': 35,
  'quarter-final': 30,
  'round-of-16': 25,
  'group-stage': 15,
  'regular': 10,
  'playoff': 30,
  'derby': 25,  // Local derbies get bonus
};

// Team quality weights
const TEAM_WEIGHTS = {
  bothTop6: 40,     // Both teams in top 6
  oneTop6: 30,      // One team in top 6
  bothTop10: 25,    // Both teams in top 10
  oneTop10: 20,     // One team in top 10
  midTable: 15,     // Mid-table clash
  relegation: 10,   // Relegation battle
  mixed: 12         // Mixed quality
};

// Form weights (based on recent results)
const FORM_WEIGHTS = {
  bothGood: 20,     // Both teams in good form (W-W-W)
  oneGood: 15,      // One team in good form
  tight: 18,        // Close match expected
  upset: 22,        // Potential upset
  normal: 10        // Normal form
};

// Time-based decay (how recent the match is)
const TIME_WEIGHTS = {
  today: 10,
  yesterday: 8,
  twoDaysAgo: 6,
  threeDaysAgo: 4,
  older: 2
};

export function calculateMatchWeight(
  match: any,
  leaguePriority: typeof import('./leaguePriority').LEAGUE_PRIORITIES[keyof typeof import('./leaguePriority').LEAGUE_PRIORITIES] | undefined,
  standings?: any[],
  teamForm?: any[]
): MatchWeight {
  const breakdown = {
    leagueWeight: 0,
    stageWeight: 0,
    teamWeight: 0,
    formWeight: 0,
    timeWeight: 0
  };
  
  // 1. League Weight
  if (leaguePriority) {
    breakdown.leagueWeight = LEAGUE_WEIGHTS[leaguePriority.tier] || LEAGUE_WEIGHTS.default;
  } else {
    breakdown.leagueWeight = LEAGUE_WEIGHTS.default;
  }
  
  // 2. Stage Weight
  const stage = match.stage?.toLowerCase() || 'regular';
  breakdown.stageWeight = STAGE_WEIGHTS[stage] || STAGE_WEIGHTS.regular;
  
  // Add derby bonus if applicable
  if (match.is_derby || match.rivalry_factor > 0.7) {
    breakdown.stageWeight += STAGE_WEIGHTS.derby;
  }
  
  // 3. Team Weight (based on standings)
  if (standings && standings.length > 0) {
    const homeTeamPos = standings.find(s => s.team_id === match.home_team_id)?.position;
    const awayTeamPos = standings.find(s => s.team_id === match.away_team_id)?.position;
    
    if (homeTeamPos && awayTeamPos) {
      const bothTop6 = homeTeamPos <= 6 && awayTeamPos <= 6;
      const oneTop6 = homeTeamPos <= 6 || awayTeamPos <= 6;
      const bothTop10 = homeTeamPos <= 10 && awayTeamPos <= 10;
      const oneTop10 = homeTeamPos <= 10 || awayTeamPos <= 10;
      const bothBottom5 = homeTeamPos >= standings.length - 5 && awayTeamPos >= standings.length - 5;
      
      if (bothTop6) breakdown.teamWeight = TEAM_WEIGHTS.bothTop6;
      else if (oneTop6) breakdown.teamWeight = TEAM_WEIGHTS.oneTop6;
      else if (bothTop10) breakdown.teamWeight = TEAM_WEIGHTS.bothTop10;
      else if (oneTop10) breakdown.teamWeight = TEAM_WEIGHTS.oneTop10;
      else if (bothBottom5) breakdown.teamWeight = TEAM_WEIGHTS.relegation;
      else breakdown.teamWeight = TEAM_WEIGHTS.midTable;
    } else {
      breakdown.teamWeight = TEAM_WEIGHTS.mixed;
    }
  }
  
  // 4. Form Weight
  if (teamForm && teamForm.length > 0) {
    const homeForm = teamForm.find(f => f.team_id === match.home_team_id);
    const awayForm = teamForm.find(f => f.team_id === match.away_team_id);
    
    if (homeForm && awayForm) {
      const homeWinRate = homeForm.wins / Math.max(homeForm.matches_played, 1);
      const awayWinRate = awayForm.wins / Math.max(awayForm.matches_played, 1);
      
      const bothGoodForm = homeWinRate > 0.6 && awayWinRate > 0.6;
      const oneGoodForm = homeWinRate > 0.6 || awayWinRate > 0.6;
      const closeMatch = Math.abs(homeWinRate - awayWinRate) < 0.2;
      const potentialUpset = Math.abs(homeWinRate - awayWinRate) > 0.5;
      
      if (bothGoodForm) breakdown.formWeight = FORM_WEIGHTS.bothGood;
      else if (potentialUpset) breakdown.formWeight = FORM_WEIGHTS.upset;
      else if (closeMatch) breakdown.formWeight = FORM_WEIGHTS.tight;
      else if (oneGoodForm) breakdown.formWeight = FORM_WEIGHTS.oneGood;
      else breakdown.formWeight = FORM_WEIGHTS.normal;
    }
  }
  
  // 5. Time Weight
  const matchDate = new Date(match.utc_date);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - matchDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 0) breakdown.timeWeight = TIME_WEIGHTS.today;
  else if (daysDiff === 1) breakdown.timeWeight = TIME_WEIGHTS.yesterday;
  else if (daysDiff === 2) breakdown.timeWeight = TIME_WEIGHTS.twoDaysAgo;
  else if (daysDiff === 3) breakdown.timeWeight = TIME_WEIGHTS.threeDaysAgo;
  else breakdown.timeWeight = TIME_WEIGHTS.older;
  
  // Calculate total weight
  const totalWeight = Object.values(breakdown).reduce((sum, weight) => sum + weight, 0);
  
  return {
    matchId: match.id,
    totalWeight,
    breakdown
  };
}

export function getTopWeightedMatches(
  matches: any[],
  standings: Record<number, any[]>,
  teamForm: Record<number, any[]>,
  leaguePriorities: typeof import('./leaguePriority').LEAGUE_PRIORITIES,
  limit: number = 5
): any[] {
  const weightedMatches = matches.map(match => {
    const leaguePriority = Object.values(leaguePriorities).find(
      l => l.id === match.competition_id
    );
    
    const matchStandings = standings[match.competition_id] || [];
    const matchTeamForm = teamForm[match.competition_id] || [];
    
    const weight = calculateMatchWeight(
      match,
      leaguePriority,
      matchStandings,
      matchTeamForm
    );
    
    return {
      ...match,
      weight: weight.totalWeight,
      weightBreakdown: weight.breakdown
    };
  });
  
  // Sort by weight and return top matches
  return weightedMatches
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit);
}