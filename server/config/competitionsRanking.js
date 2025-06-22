// Top 50 Football Competitions Ranking with API IDs
// Based on global popularity, viewership, and prestige

export const TOP_50_COMPETITIONS = [
  // Tier 1: Global Giants
  {
    id: 'fifa-world-cup',
    rank: 1,
    name: 'FIFA World Cup',
    type: 'tournament',
    region: 'Global',
    highlightlyId: null, // Not currently active
    activePeriods: [
      { start: { month: 11, day: 20 }, end: { month: 12, day: 18 } } // World Cup years only
    ]
  },
  {
    id: 'uefa-champions-league',
    rank: 2,
    name: 'UEFA Champions League',
    type: 'continental',
    region: 'Europe',
    highlightlyId: 2486,
    activePeriods: [
      { start: { month: 9 }, end: { month: 5, day: 31 } }
    ]
  },
  {
    id: 'premier-league',
    rank: 3,
    name: 'English Premier League',
    type: 'league',
    region: 'Europe',
    highlightlyId: 2486,
    activePeriods: [
      { start: { month: 8 }, end: { month: 5, day: 31 } }
    ]
  },
  {
    id: 'uefa-euro',
    rank: 4,
    name: 'UEFA European Championship',
    type: 'tournament',
    region: 'Europe',
    highlightlyId: 119924, // Using La Liga ID as placeholder for Euro
    activePeriods: [
      { start: { month: 6, day: 14 }, end: { month: 7, day: 14 } } // Euro years only
    ]
  },
  {
    id: 'la-liga',
    rank: 5,
    name: 'Spanish La Liga',
    type: 'league',
    region: 'Europe',
    highlightlyId: 119924,
    activePeriods: [
      { start: { month: 8 }, end: { month: 5, day: 31 } }
    ]
  },
  {
    id: 'serie-a',
    rank: 6,
    name: 'Italian Serie A',
    type: 'league',
    region: 'Europe',
    highlightlyId: 115669,
    activePeriods: [
      { start: { month: 8 }, end: { month: 5, day: 31 } }
    ]
  },
  {
    id: 'bundesliga',
    rank: 7,
    name: 'German Bundesliga',
    type: 'league',
    region: 'Europe',
    highlightlyId: 67162,
    activePeriods: [
      { start: { month: 8 }, end: { month: 5, day: 31 } }
    ]
  },
  {
    id: 'copa-america',
    rank: 8,
    name: 'Copa América',
    type: 'tournament',
    region: 'South America',
    highlightlyId: 52695, // Using Ligue 1 ID as placeholder for Copa América
    activePeriods: [
      { start: { month: 6, day: 20 }, end: { month: 7, day: 14 } } // Copa América years
    ]
  },
  {
    id: 'ligue-1',
    rank: 9,
    name: 'French Ligue 1',
    type: 'league',
    region: 'Europe',
    highlightlyId: 52695,
    activePeriods: [
      { start: { month: 8 }, end: { month: 5, day: 31 } }
    ]
  },
  {
    id: 'fifa-club-world-cup',
    rank: 10,
    name: 'FIFA Club World Cup',
    type: 'tournament',
    region: 'Global',
    highlightlyId: 115669, // Using Serie A ID as placeholder
    activePeriods: [
      { start: { month: 6, day: 15 }, end: { month: 7, day: 13 } } // Summer Club World Cup
    ]
  },

  // Tier 2: Highly Popular Tournaments
  {
    id: 'uefa-europa-league',
    rank: 11,
    name: 'UEFA Europa League',
    type: 'continental',
    region: 'Europe',
    highlightlyId: 67162, // Using Bundesliga ID as placeholder
    activePeriods: [
      { start: { month: 9 }, end: { month: 5, day: 31 } }
    ]
  },
  {
    id: 'copa-libertadores',
    rank: 12,
    name: 'Copa Libertadores',
    type: 'continental',
    region: 'South America',
    highlightlyId: 2486, // Using Premier League ID as placeholder
    activePeriods: [
      { start: { month: 2 }, end: { month: 11 } }
    ]
  },
  {
    id: 'uefa-conference-league',
    rank: 13,
    name: 'UEFA Conference League',
    type: 'continental',
    region: 'Europe',
    highlightlyId: null,
    activePeriods: [
      { start: { month: 9 }, end: { month: 5, day: 31 } }
    ]
  },
  {
    id: 'fa-cup',
    rank: 14,
    name: 'FA Cup',
    type: 'cup',
    region: 'Europe',
    highlightlyId: null,
    activePeriods: [
      { start: { month: 8 }, end: { month: 5, day: 31 } }
    ]
  },
  {
    id: 'wc-qualifiers-uefa',
    rank: 15,
    name: 'World Cup Qualifiers – UEFA',
    type: 'qualifier',
    region: 'Europe',
    highlightlyId: null,
    activePeriods: [
      { start: { month: 3 }, end: { month: 11 } }
    ]
  },
  {
    id: 'wc-qualifiers-conmebol',
    rank: 16,
    name: 'World Cup Qualifiers – CONMEBOL',
    type: 'qualifier',
    region: 'South America',
    highlightlyId: null,
    activePeriods: [
      { start: { month: 3 }, end: { month: 11 } }
    ]
  },
  {
    id: 'mls',
    rank: 17,
    name: 'Major League Soccer',
    type: 'league',
    region: 'North America',
    highlightlyId: 119924, // Using La Liga ID as placeholder for MLS
    activePeriods: [
      { start: { month: 2 }, end: { month: 11 } }
    ]
  },
  {
    id: 'argentina-primera',
    rank: 18,
    name: 'Argentine Primera División',
    type: 'league',
    region: 'South America',
    highlightlyId: null,
    activePeriods: [
      { start: { month: 1 }, end: { month: 12 } }
    ]
  },
  {
    id: 'brazil-serie-a',
    rank: 19,
    name: 'Brazilian Série A',
    type: 'league',
    region: 'South America',
    highlightlyId: null,
    activePeriods: [
      { start: { month: 4 }, end: { month: 12 } }
    ]
  },
  {
    id: 'liga-mx',
    rank: 20,
    name: 'Liga MX',
    type: 'league',
    region: 'North America',
    highlightlyId: null,
    activePeriods: [
      { start: { month: 1 }, end: { month: 12 } }
    ]
  }

  // Add more competitions as needed...
];

// Helper functions
export function isCompetitionActive(competition, currentDate = new Date()) {
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const currentDay = currentDate.getDate();

  for (const period of competition.activePeriods) {
    const startMonth = period.start.month;
    const startDay = period.start.day || 1;
    const endMonth = period.end.month;
    const endDay = period.end.day || 31;

    if (startMonth <= endMonth) {
      // Same year period
      if (currentMonth > startMonth || (currentMonth === startMonth && currentDay >= startDay)) {
        if (currentMonth < endMonth || (currentMonth === endMonth && currentDay <= endDay)) {
          return true;
        }
      }
    } else {
      // Cross-year period (e.g., Aug to May)
      if (currentMonth >= startMonth || currentMonth <= endMonth) {
        if (currentMonth === startMonth && currentDay < startDay) continue;
        if (currentMonth === endMonth && currentDay > endDay) continue;
        return true;
      }
    }
  }
  return false;
}

export function getActiveCompetitions(currentDate = new Date()) {
  return TOP_50_COMPETITIONS.filter(comp => isCompetitionActive(comp, currentDate));
}

export function getFallbackCompetitions(currentDate = new Date()) {
  // Always-available competitions or year-round leagues
  const fallbacks = TOP_50_COMPETITIONS.filter(comp => 
    comp.id === 'mls' || 
    comp.id === 'copa-libertadores' ||
    comp.id === 'argentina-primera' ||
    comp.id === 'brazil-serie-a' ||
    comp.id === 'liga-mx' ||
    comp.type === 'qualifier'
  );
  
  return fallbacks.slice(0, 10);
}

export function getCompetitionsWithApiIds() {
  return TOP_50_COMPETITIONS.filter(comp => comp.highlightlyId);
}

export function getMatchDateRange() {
  const now = new Date();
  const startDate = new Date(now.getTime() - 24*60*60*1000); // Yesterday
  const endDate = new Date(now.getTime() + 5*24*60*60*1000);   // +5 days
  
  return { startDate, endDate };
} 