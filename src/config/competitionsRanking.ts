export interface Competition {
  id: number | string;
  name: string;
  shortName: string;
  rank: number;
  tier: 1 | 2 | 3 | 4 | 5;
  region: 'Global' | 'Europe' | 'South America' | 'North America' | 'Africa' | 'Asia' | 'Oceania';
  type: 'league' | 'cup' | 'qualifier' | 'tournament' | 'continental';
  country?: string;
  activePeriods: {
    start: { month: number; day?: number };
    end: { month: number; day?: number };
  }[];
  highlightlyId?: number;
  isYearly?: boolean;
  isQuadrennial?: boolean;
}

export const TOP_50_COMPETITIONS: Competition[] = [
  // Tier 1: Global Giants
  {
    id: 'fifa-world-cup',
    name: 'FIFA World Cup',
    shortName: 'World Cup',
    rank: 1,
    tier: 1,
    region: 'Global',
    type: 'tournament',
    activePeriods: [{ start: { month: 11, day: 20 }, end: { month: 12, day: 18 } }],
    isQuadrennial: true
  },
  {
    id: 'uefa-champions-league',
    name: 'UEFA Champions League',
    shortName: 'Champions League',
    rank: 2,
    tier: 1,
    region: 'Europe',
    type: 'continental',
    activePeriods: [
      { start: { month: 9 }, end: { month: 12 } },
      { start: { month: 2 }, end: { month: 5 } }
    ]
  },
  {
    id: 'english-premier-league',
    name: 'English Premier League',
    shortName: 'Premier League',
    rank: 3,
    tier: 1,
    region: 'Europe',
    type: 'league',
    country: 'England',
    activePeriods: [{ start: { month: 8 }, end: { month: 5 } }],
    highlightlyId: 2486
  },
  {
    id: 'uefa-euro',
    name: 'UEFA Euro',
    shortName: 'Euro',
    rank: 4,
    tier: 1,
    region: 'Europe',
    type: 'tournament',
    activePeriods: [{ start: { month: 6 }, end: { month: 7 } }],
    isQuadrennial: true
  },
  {
    id: 'spanish-la-liga',
    name: 'Spanish La Liga',
    shortName: 'La Liga',
    rank: 5,
    tier: 1,
    region: 'Europe',
    type: 'league',
    country: 'Spain',
    activePeriods: [{ start: { month: 8 }, end: { month: 5 } }],
    highlightlyId: 119924
  },
  {
    id: 'italian-serie-a',
    name: 'Italian Serie A',
    shortName: 'Serie A',
    rank: 6,
    tier: 1,
    region: 'Europe',
    type: 'league',
    country: 'Italy',
    activePeriods: [{ start: { month: 8 }, end: { month: 5 } }],
    highlightlyId: 115669
  },
  {
    id: 'german-bundesliga',
    name: 'German Bundesliga',
    shortName: 'Bundesliga',
    rank: 7,
    tier: 1,
    region: 'Europe',
    type: 'league',
    country: 'Germany',
    activePeriods: [{ start: { month: 8 }, end: { month: 5 } }],
    highlightlyId: 67162
  },
  {
    id: 'copa-america',
    name: 'Copa América',
    shortName: 'Copa América',
    rank: 8,
    tier: 1,
    region: 'South America',
    type: 'tournament',
    activePeriods: [{ start: { month: 6 }, end: { month: 7 } }],
    isQuadrennial: true
  },
  {
    id: 'french-ligue-1',
    name: 'French Ligue 1',
    shortName: 'Ligue 1',
    rank: 9,
    tier: 1,
    region: 'Europe',
    type: 'league',
    country: 'France',
    activePeriods: [{ start: { month: 8 }, end: { month: 5 } }],
    highlightlyId: 52695
  },
  {
    id: 'fifa-club-world-cup',
    name: 'FIFA Club World Cup',
    shortName: 'Club World Cup',
    rank: 10,
    tier: 1,
    region: 'Global',
    type: 'tournament',
    activePeriods: [{ start: { month: 6 }, end: { month: 7 } }],
    isYearly: true
  },

  // Tier 2: Highly Popular Tournaments
  {
    id: 'uefa-europa-league',
    name: 'UEFA Europa League',
    shortName: 'Europa League',
    rank: 11,
    tier: 2,
    region: 'Europe',
    type: 'continental',
    activePeriods: [
      { start: { month: 9 }, end: { month: 12 } },
      { start: { month: 2 }, end: { month: 5 } }
    ]
  },
  {
    id: 'copa-libertadores',
    name: 'Copa Libertadores',
    shortName: 'Libertadores',
    rank: 12,
    tier: 2,
    region: 'South America',
    type: 'continental',
    activePeriods: [{ start: { month: 2 }, end: { month: 11 } }]
  },
  {
    id: 'uefa-conference-league',
    name: 'UEFA Conference League',
    shortName: 'Conference League',
    rank: 13,
    tier: 2,
    region: 'Europe',
    type: 'continental',
    activePeriods: [
      { start: { month: 9 }, end: { month: 12 } },
      { start: { month: 2 }, end: { month: 5 } }
    ]
  },
  {
    id: 'fa-cup',
    name: 'FA Cup (England)',
    shortName: 'FA Cup',
    rank: 14,
    tier: 2,
    region: 'Europe',
    type: 'cup',
    country: 'England',
    activePeriods: [{ start: { month: 8 }, end: { month: 5 } }]
  },
  {
    id: 'wc-qual-uefa',
    name: 'World Cup Qualifiers – UEFA',
    shortName: 'WC Qual. (UEFA)',
    rank: 15,
    tier: 2,
    region: 'Europe',
    type: 'qualifier',
    activePeriods: [
      { start: { month: 3 }, end: { month: 3 } },
      { start: { month: 9 }, end: { month: 11 } }
    ]
  },
  {
    id: 'wc-qual-conmebol',
    name: 'World Cup Qualifiers – CONMEBOL',
    shortName: 'WC Qual. (CONMEBOL)',
    rank: 16,
    tier: 2,
    region: 'South America',
    type: 'qualifier',
    activePeriods: [
      { start: { month: 6 }, end: { month: 6 } },
      { start: { month: 9 }, end: { month: 9 } },
      { start: { month: 10 }, end: { month: 10 } },
      { start: { month: 11 }, end: { month: 11 } }
    ]
  },
  {
    id: 'major-league-soccer',
    name: 'Major League Soccer',
    shortName: 'MLS',
    rank: 17,
    tier: 2,
    region: 'North America',
    type: 'league',
    country: 'USA',
    activePeriods: [{ start: { month: 2 }, end: { month: 11 } }]
  },
  {
    id: 'argentine-primera',
    name: 'Argentine Primera División',
    shortName: 'Primera División',
    rank: 18,
    tier: 2,
    region: 'South America',
    type: 'league',
    country: 'Argentina',
    activePeriods: [{ start: { month: 1 }, end: { month: 12 } }]
  },
  {
    id: 'brazilian-serie-a',
    name: 'Brazilian Série A',
    shortName: 'Brasileirão',
    rank: 19,
    tier: 2,
    region: 'South America',
    type: 'league',
    country: 'Brazil',
    activePeriods: [{ start: { month: 4 }, end: { month: 12 } }]
  },
  {
    id: 'liga-mx',
    name: 'Liga MX (Mexico)',
    shortName: 'Liga MX',
    rank: 20,
    tier: 2,
    region: 'North America',
    type: 'league',
    country: 'Mexico',
    activePeriods: [{ start: { month: 1 }, end: { month: 12 } }]
  },

  // Tier 3: Domestic Leagues + More Qualifiers
  {
    id: 'dfb-pokal',
    name: 'DFB-Pokal (Germany)',
    shortName: 'DFB-Pokal',
    rank: 21,
    tier: 3,
    region: 'Europe',
    type: 'cup',
    country: 'Germany',
    activePeriods: [{ start: { month: 8 }, end: { month: 5 } }]
  },
  {
    id: 'copa-del-rey',
    name: 'Copa del Rey (Spain)',
    shortName: 'Copa del Rey',
    rank: 22,
    tier: 3,
    region: 'Europe',
    type: 'cup',
    country: 'Spain',
    activePeriods: [{ start: { month: 10 }, end: { month: 4 } }]
  },
  {
    id: 'saudi-pro-league',
    name: 'Saudi Pro League',
    shortName: 'Saudi Pro League',
    rank: 23,
    tier: 3,
    region: 'Asia',
    type: 'league',
    country: 'Saudi Arabia',
    activePeriods: [{ start: { month: 8 }, end: { month: 5 } }]
  },
  {
    id: 'dutch-eredivisie',
    name: 'Dutch Eredivisie',
    shortName: 'Eredivisie',
    rank: 24,
    tier: 3,
    region: 'Europe',
    type: 'league',
    country: 'Netherlands',
    activePeriods: [{ start: { month: 8 }, end: { month: 5 } }]
  },
  {
    id: 'portuguese-primeira',
    name: 'Portuguese Primeira Liga',
    shortName: 'Primeira Liga',
    rank: 25,
    tier: 3,
    region: 'Europe',
    type: 'league',
    country: 'Portugal',
    activePeriods: [{ start: { month: 8 }, end: { month: 5 } }]
  },
  {
    id: 'wc-qual-caf',
    name: 'World Cup Qualifiers – CAF',
    shortName: 'WC Qual. (CAF)',
    rank: 26,
    tier: 3,
    region: 'Africa',
    type: 'qualifier',
    activePeriods: [
      { start: { month: 6 }, end: { month: 6 } },
      { start: { month: 9 }, end: { month: 9 } },
      { start: { month: 10 }, end: { month: 10 } },
      { start: { month: 11 }, end: { month: 11 } }
    ]
  },
  {
    id: 'wc-qual-afc',
    name: 'World Cup Qualifiers – AFC',
    shortName: 'WC Qual. (AFC)',
    rank: 27,
    tier: 3,
    region: 'Asia',
    type: 'qualifier',
    activePeriods: [
      { start: { month: 6 }, end: { month: 6 } },
      { start: { month: 9 }, end: { month: 9 } },
      { start: { month: 10 }, end: { month: 10 } },
      { start: { month: 11 }, end: { month: 11 } }
    ]
  },
  {
    id: 'wc-qual-concacaf',
    name: 'World Cup Qualifiers – CONCACAF',
    shortName: 'WC Qual. (CONCACAF)',
    rank: 28,
    tier: 3,
    region: 'North America',
    type: 'qualifier',
    activePeriods: [
      { start: { month: 6 }, end: { month: 6 } },
      { start: { month: 9 }, end: { month: 9 } },
      { start: { month: 10 }, end: { month: 10 } },
      { start: { month: 11 }, end: { month: 11 } }
    ]
  },
  {
    id: 'turkish-super-lig',
    name: 'Turkish Süper Lig',
    shortName: 'Süper Lig',
    rank: 29,
    tier: 3,
    region: 'Europe',
    type: 'league',
    country: 'Turkey',
    activePeriods: [{ start: { month: 8 }, end: { month: 5 } }]
  },
  {
    id: 'scottish-premiership',
    name: 'Scottish Premiership',
    shortName: 'Scottish Prem',
    rank: 30,
    tier: 3,
    region: 'Europe',
    type: 'league',
    country: 'Scotland',
    activePeriods: [{ start: { month: 7 }, end: { month: 5 } }]
  },

  // Tier 4: Important International & Regional Tournaments
  {
    id: 'afc-asian-cup',
    name: 'AFC Asian Cup',
    shortName: 'Asian Cup',
    rank: 31,
    tier: 4,
    region: 'Asia',
    type: 'tournament',
    activePeriods: [{ start: { month: 1 }, end: { month: 2 } }],
    isQuadrennial: true
  },
  {
    id: 'afcon',
    name: 'Africa Cup of Nations (AFCON)',
    shortName: 'AFCON',
    rank: 32,
    tier: 4,
    region: 'Africa',
    type: 'tournament',
    activePeriods: [{ start: { month: 1 }, end: { month: 2 } }],
    isQuadrennial: true
  },
  {
    id: 'concacaf-gold-cup',
    name: 'CONCACAF Gold Cup',
    shortName: 'Gold Cup',
    rank: 33,
    tier: 4,
    region: 'North America',
    type: 'tournament',
    activePeriods: [{ start: { month: 6 }, end: { month: 7 } }],
    isQuadrennial: true
  },
  {
    id: 'uefa-nations-league',
    name: 'UEFA Nations League',
    shortName: 'Nations League',
    rank: 34,
    tier: 4,
    region: 'Europe',
    type: 'tournament',
    activePeriods: [
      { start: { month: 6 }, end: { month: 6 } },
      { start: { month: 9 }, end: { month: 9 } },
      { start: { month: 10 }, end: { month: 10 } },
      { start: { month: 11 }, end: { month: 11 } }
    ]
  },
  {
    id: 'copa-sudamericana',
    name: 'Copa Sudamericana',
    shortName: 'Sudamericana',
    rank: 35,
    tier: 4,
    region: 'South America',
    type: 'continental',
    activePeriods: [{ start: { month: 3 }, end: { month: 11 } }]
  },
  {
    id: 'concacaf-champions-cup',
    name: 'CONCACAF Champions Cup',
    shortName: 'CONCACAF CL',
    rank: 36,
    tier: 4,
    region: 'North America',
    type: 'continental',
    activePeriods: [{ start: { month: 2 }, end: { month: 5 } }]
  },
  {
    id: 'afc-champions-league',
    name: 'AFC Champions League',
    shortName: 'AFC CL',
    rank: 37,
    tier: 4,
    region: 'Asia',
    type: 'continental',
    activePeriods: [{ start: { month: 2 }, end: { month: 11 } }]
  },
  {
    id: 'caf-champions-league',
    name: 'CAF Champions League',
    shortName: 'CAF CL',
    rank: 38,
    tier: 4,
    region: 'Africa',
    type: 'continental',
    activePeriods: [{ start: { month: 2 }, end: { month: 11 } }]
  },

  // Tier 5: Youth, Olympics, and Less Mainstream Competitions
  {
    id: 'uefa-u21',
    name: 'UEFA U21 Championship',
    shortName: 'U21 Euro',
    rank: 39,
    tier: 5,
    region: 'Europe',
    type: 'tournament',
    activePeriods: [{ start: { month: 6 }, end: { month: 7 } }],
    isQuadrennial: true
  },
  {
    id: 'olympic-football-men',
    name: 'Olympic Football (Men)',
    shortName: 'Olympics',
    rank: 40,
    tier: 5,
    region: 'Global',
    type: 'tournament',
    activePeriods: [{ start: { month: 7 }, end: { month: 8 } }],
    isQuadrennial: true
  },
  {
    id: 'fifa-u20-world-cup',
    name: 'FIFA U-20 World Cup',
    shortName: 'U-20 World Cup',
    rank: 41,
    tier: 5,
    region: 'Global',
    type: 'tournament',
    activePeriods: [{ start: { month: 5 }, end: { month: 6 } }],
    isQuadrennial: true
  },
  {
    id: 'fifa-u17-world-cup',
    name: 'FIFA U-17 World Cup',
    shortName: 'U-17 World Cup',
    rank: 42,
    tier: 5,
    region: 'Global',
    type: 'tournament',
    activePeriods: [{ start: { month: 10 }, end: { month: 11 } }],
    isQuadrennial: true
  },
  {
    id: 'indian-super-league',
    name: 'Indian Super League',
    shortName: 'ISL',
    rank: 43,
    tier: 5,
    region: 'Asia',
    type: 'league',
    country: 'India',
    activePeriods: [{ start: { month: 10 }, end: { month: 3 } }]
  },
  {
    id: 'egyptian-premier',
    name: 'Egyptian Premier League',
    shortName: 'Egyptian PL',
    rank: 44,
    tier: 5,
    region: 'Africa',
    type: 'league',
    country: 'Egypt',
    activePeriods: [{ start: { month: 10 }, end: { month: 6 } }]
  },
  {
    id: 'south-african-psl',
    name: 'South African Premier Division (PSL)',
    shortName: 'PSL',
    rank: 45,
    tier: 5,
    region: 'Africa',
    type: 'league',
    country: 'South Africa',
    activePeriods: [{ start: { month: 8 }, end: { month: 5 } }]
  },
  {
    id: 'belgian-pro-league',
    name: 'Belgian Pro League',
    shortName: 'Pro League',
    rank: 46,
    tier: 5,
    region: 'Europe',
    type: 'league',
    country: 'Belgium',
    activePeriods: [{ start: { month: 7 }, end: { month: 5 } }]
  },
  {
    id: 'russian-premier',
    name: 'Russian Premier League',
    shortName: 'Russian PL',
    rank: 47,
    tier: 5,
    region: 'Europe',
    type: 'league',
    country: 'Russia',
    activePeriods: [{ start: { month: 3 }, end: { month: 12 } }]
  },
  {
    id: 'uae-pro-league',
    name: 'UAE Pro League',
    shortName: 'UAE Pro League',
    rank: 48,
    tier: 5,
    region: 'Asia',
    type: 'league',
    country: 'UAE',
    activePeriods: [{ start: { month: 9 }, end: { month: 5 } }]
  },
  {
    id: 'greek-super-league',
    name: 'Greek Super League',
    shortName: 'Super League',
    rank: 49,
    tier: 5,
    region: 'Europe',
    type: 'league',
    country: 'Greece',
    activePeriods: [{ start: { month: 8 }, end: { month: 5 } }]
  },
  {
    id: 'swiss-super-league',
    name: 'Swiss Super League',
    shortName: 'Swiss SL',
    rank: 50,
    tier: 5,
    region: 'Europe',
    type: 'league',
    country: 'Switzerland',
    activePeriods: [{ start: { month: 7 }, end: { month: 5 } }]
  }
];

/**
 * Check if a competition is currently active based on current date
 */
export function isCompetitionActive(competition: Competition, currentDate: Date = new Date()): boolean {
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  
  // Check if current month falls within any active period
  return competition.activePeriods.some(period => {
    if (period.start.month <= period.end.month) {
      // Same year period (e.g., March to November)
      return currentMonth >= period.start.month && currentMonth <= period.end.month;
    } else {
      // Cross-year period (e.g., August to May next year)
      return currentMonth >= period.start.month || currentMonth <= period.end.month;
    }
  });
}

/**
 * Get active competitions ordered by popularity rank
 */
export function getActiveCompetitions(currentDate: Date = new Date()): Competition[] {
  return TOP_50_COMPETITIONS
    .filter(comp => isCompetitionActive(comp, currentDate))
    .sort((a, b) => a.rank - b.rank);
}

/**
 * Get fallback competitions when no top-tier leagues are active
 */
export function getFallbackCompetitions(currentDate: Date = new Date()): Competition[] {
  const currentMonth = currentDate.getMonth() + 1;
  
  // In June, prioritize summer tournaments and year-round leagues
  if (currentMonth === 6) {
    return TOP_50_COMPETITIONS
      .filter(comp => 
        comp.type === 'tournament' || 
        comp.type === 'qualifier' ||
        ['brazilian-serie-a', 'major-league-soccer', 'liga-mx', 'argentine-primera', 'copa-libertadores'].includes(comp.id as string)
      )
      .sort((a, b) => a.rank - b.rank);
  }
  
  // Default fallback: all competitions sorted by rank
  return TOP_50_COMPETITIONS.sort((a, b) => a.rank - b.rank);
}

/**
 * Get competitions with known Highlightly API IDs
 */
export function getCompetitionsWithApiIds(): Competition[] {
  return TOP_50_COMPETITIONS.filter(comp => comp.highlightlyId);
}

/**
 * Get matches within date range (-1 day to +5 days)
 */
export function getMatchDateRange(): { startDate: Date; endDate: Date } {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 1); // -1 day
  
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 5); // +5 days
  
  return { startDate, endDate };
} 