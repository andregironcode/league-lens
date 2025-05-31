import React from 'react';
import type { LeagueWithMatches } from '@/types';
import LeagueCard from './LeagueCard';

interface MatchFeedByLeagueProps {
  leaguesWithMatches: LeagueWithMatches[];
  loading?: boolean;
  selectedDate?: string;
  isToday?: boolean;
  selectedLeagueId?: string | null;
  onLeagueSelect?: (leagueId: string | null) => void;
}

// Enhanced logo mapping function - prioritizes multiple external sources for best reliability
const getLeagueLogo = (leagueId: string, leagueName: string, apiLogo?: string): string => {
  // Priority 1: Use API logo if it exists and looks valid
  if (apiLogo && apiLogo.trim() && !apiLogo.includes('placeholder') && !apiLogo.includes('default')) {
    return apiLogo;
  }

  // Priority 2: Use reliable external CDN sources for major leagues
  const externalLogos: Record<string, string> = {
    // UEFA Competitions
    '2486': 'https://media.api-sports.io/football/leagues/2.png', // Champions League
    '2': 'https://media.api-sports.io/football/leagues/2.png', // Champions League
    '3337': 'https://media.api-sports.io/football/leagues/3.png', // Europa League
    '3': 'https://media.api-sports.io/football/leagues/3.png', // Europa League
    '1': 'https://media.api-sports.io/football/leagues/1.png', // World Cup
    
    // Top European Leagues
    '39': 'https://media.api-sports.io/football/leagues/39.png', // Premier League
    '140': 'https://media.api-sports.io/football/leagues/140.png', // La Liga
    '135': 'https://media.api-sports.io/football/leagues/135.png', // Serie A
    '78': 'https://media.api-sports.io/football/leagues/78.png', // Bundesliga
    '61': 'https://media.api-sports.io/football/leagues/61.png', // Ligue 1
    
    // Other Major Leagues
    '216087': 'https://media.api-sports.io/football/leagues/253.png', // MLS
    '94': 'https://media.api-sports.io/football/leagues/94.png', // Liga Portugal
    '307': 'https://media.api-sports.io/football/leagues/307.png', // Saudi Pro League
  };

  // Priority 2: Use external logo if available
  if (externalLogos[leagueId]) {
    return externalLogos[leagueId];
  }

  // Priority 3: Try API-Sports generic league endpoint
  if (leagueId && leagueId.match(/^\d+$/)) {
    return `https://media.api-sports.io/football/leagues/${leagueId}.png`;
  }

  // Priority 4: Try alternative sources based on league name
  const nameBasedLogos: Record<string, string> = {
    'champions league': 'https://media.api-sports.io/football/leagues/2.png',
    'europa league': 'https://media.api-sports.io/football/leagues/3.png',
    'premier league': 'https://media.api-sports.io/football/leagues/39.png',
    'la liga': 'https://media.api-sports.io/football/leagues/140.png',
    'serie a': 'https://media.api-sports.io/football/leagues/135.png',
    'bundesliga': 'https://media.api-sports.io/football/leagues/78.png',
    'ligue 1': 'https://media.api-sports.io/football/leagues/61.png',
    'major league soccer': 'https://media.api-sports.io/football/leagues/253.png',
    'mls': 'https://media.api-sports.io/football/leagues/253.png',
  };

  const normalizedName = leagueName.toLowerCase();
  for (const [key, logo] of Object.entries(nameBasedLogos)) {
    if (normalizedName.includes(key)) {
      return logo;
    }
  }

  // Priority 5: Generate a professional text-based logo as final fallback
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1f2937;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#374151;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" fill="url(#bg)" rx="8"/>
      <rect width="36" height="36" x="2" y="2" fill="none" rx="6" stroke="#4b5563" stroke-width="1"/>
      <text x="20" y="26" font-family="Arial, sans-serif" font-size="11" font-weight="bold" text-anchor="middle" fill="#ffffff">
        ${leagueName.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase()}
      </text>
    </svg>
  `)}`;
};

// League filters data for the integrated filter
const LEAGUE_FILTERS = [
  // Top competitions and tournaments
  { id: '2486', name: 'UEFA Champions League', logoUrl: 'https://media.api-sports.io/football/leagues/2.png' },
  { id: '1', name: 'FIFA World Cup', logoUrl: 'https://media.api-sports.io/football/leagues/1.png' },
  { id: '3337', name: 'UEFA Europa League', logoUrl: 'https://media.api-sports.io/football/leagues/3.png' },
  
  // Top domestic leagues
  { id: '39', name: 'Premier League', logoUrl: 'https://media.api-sports.io/football/leagues/39.png' },
  { id: '140', name: 'La Liga', logoUrl: 'https://media.api-sports.io/football/leagues/140.png' },
  { id: '135', name: 'Serie A', logoUrl: 'https://media.api-sports.io/football/leagues/135.png' },
  { id: '78', name: 'Bundesliga', logoUrl: 'https://media.api-sports.io/football/leagues/78.png' },
  { id: '61', name: 'Ligue 1', logoUrl: 'https://media.api-sports.io/football/leagues/61.png' },
  { id: '216087', name: 'Major League Soccer', logoUrl: 'https://media.api-sports.io/football/leagues/253.png' },
  { id: '94', name: 'Liga Portugal', logoUrl: 'https://media.api-sports.io/football/leagues/94.png' },
  { id: '307', name: 'Saudi Pro League', logoUrl: 'https://media.api-sports.io/football/leagues/307.png' }
];

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-6">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-[#1a1a1a] rounded-lg overflow-hidden animate-pulse">
        {/* Header skeleton */}
        <div className="p-6 border-b border-gray-700/30">
          <div className="flex items-center space-x-4">
            <div className="w-6 h-6 bg-gray-700 rounded"></div>
            <div className="w-6 h-6 bg-gray-700 rounded"></div>
            <div className="flex-1">
              <div className="h-5 bg-gray-700 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-600 rounded w-24"></div>
            </div>
            <div className="text-right">
              <div className="h-4 bg-gray-700 rounded w-8 mb-1"></div>
              <div className="h-3 bg-gray-600 rounded w-12"></div>
            </div>
          </div>
        </div>
        
        {/* Matches skeleton */}
        <div className="divide-y divide-gray-700/30">
          {[1, 2, 3].map((j) => (
            <div key={j} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="h-4 bg-gray-700 rounded w-12"></div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-700 rounded w-20"></div>
                  </div>
                  <div className="h-6 bg-gray-700 rounded w-16"></div>
                  <div className="flex items-center space-x-2">
                    <div className="h-4 bg-gray-700 rounded w-20"></div>
                    <div className="w-6 h-6 bg-gray-700 rounded"></div>
                  </div>
                </div>
                <div className="h-6 bg-gray-700 rounded w-12"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const formatSelectedDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  
  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  if (isTomorrow) return 'Tomorrow';
  
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
};

const MatchFeedByLeague: React.FC<MatchFeedByLeagueProps> = ({ 
  leaguesWithMatches, 
  loading = false,
  selectedDate,
  isToday = false,
  selectedLeagueId = null,
  onLeagueSelect
}) => {
  const dateLabel = selectedDate ? formatSelectedDate(selectedDate) : 'Matches';
  
  if (loading) {
    return (
      <section className="mb-16">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">
              {dateLabel} Matches
            </h2>
          </div>
          <LoadingSkeleton />
        </div>
      </section>
    );
  }

  // Filter leagues based on selected league ID
  let filteredLeagues = leaguesWithMatches.filter(league => 
    league.matches && league.matches.length > 0
  );

  if (selectedLeagueId) {
    filteredLeagues = filteredLeagues.filter(league => league.id === selectedLeagueId);
  }

  // Handle edge case: selected league has no matches
  if (selectedLeagueId && filteredLeagues.length === 0) {
    // Find the league name for better UX
    const selectedLeague = leaguesWithMatches.find(league => league.id === selectedLeagueId);
    const leagueName = selectedLeague?.name || 'this league';
    
    return (
      <section className="mb-16">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">
              {dateLabel} Matches
            </h2>
          </div>
          <div className="bg-[#1a1a1a] rounded-lg p-12 text-center border border-gray-700/30">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No matches for {leagueName} today</h3>
            <p className="text-gray-400">
              Try selecting a different league or date to see more matches.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Handle case: no leagues at all
  if (filteredLeagues.length === 0) {
    return (
      <section className="mb-16">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">
              {dateLabel} Matches
            </h2>
          </div>
          <div className="bg-[#1a1a1a] rounded-lg p-12 text-center border border-gray-700/30">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No matches found</h3>
            <p className="text-gray-400">
              No matches scheduled for {dateLabel.toLowerCase()}.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Calculate statistics for display
  const totalMatches = filteredLeagues.reduce((total, league) => total + league.matches.length, 0);
  const liveMatches = filteredLeagues.reduce((total, league) => 
    total + league.matches.filter(m => 
      m.fixture?.status?.short === 'LIVE' || m.status === 'live'
    ).length, 0);

  // Create filter component
  const LeagueFilter: React.FC = () => {
    // Create a map of available leagues with their data
    const availableLeaguesMap = new Map();
    leaguesWithMatches.forEach(league => {
      if (league.matches && league.matches.length > 0) {
        const liveMatchCount = league.matches.filter(m => 
          m.fixture?.status?.short === 'LIVE' || m.status === 'live'
        ).length;
        
        availableLeaguesMap.set(league.id, {
          id: league.id,
          name: league.name,
          logoUrl: getLeagueLogo(league.id, league.name, league.logo),
          matchCount: league.matches.length,
          liveMatchCount: liveMatchCount,
          hasLiveMatches: liveMatchCount > 0
        });
      }
    });

    // Get dynamic league list based on available matches, sorted by priority
    const dynamicLeagues = Array.from(availableLeaguesMap.values()).sort((a, b) => {
      // First sort by live matches (live matches first)
      if (a.hasLiveMatches && !b.hasLiveMatches) return -1;
      if (!a.hasLiveMatches && b.hasLiveMatches) return 1;
      
      // Then sort by predefined priority from LEAGUE_FILTERS
      const aFilter = LEAGUE_FILTERS.find(f => f.id === a.id);
      const bFilter = LEAGUE_FILTERS.find(f => f.id === b.id);
      
      const aPriority = aFilter ? LEAGUE_FILTERS.indexOf(aFilter) : 999;
      const bPriority = bFilter ? LEAGUE_FILTERS.indexOf(bFilter) : 999;
      
      if (aPriority !== bPriority) return aPriority - bPriority;
      
      // Finally sort by match count (more matches first)
      return b.matchCount - a.matchCount;
    });

    const handleLeagueClick = (leagueId: string) => {
      if (!onLeagueSelect) return;
      
      // If clicking the same league, reset the filter
      if (selectedLeagueId === leagueId) {
        onLeagueSelect(null);
      } else {
        onLeagueSelect(leagueId);
      }
    };

    return (
      <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-700/30 sticky top-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">Filter by League</h3>
          <p className="text-sm text-gray-400">Click a league to filter matches</p>
          {selectedLeagueId && (
            <button
              onClick={() => onLeagueSelect?.(null)}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Clear filter
            </button>
          )}
        </div>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {dynamicLeagues.length > 0 ? (
            dynamicLeagues.map((league) => {
              const isSelected = selectedLeagueId === league.id;
              
              return (
                <button
                  key={league.id}
                  onClick={() => handleLeagueClick(league.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors
                    ${isSelected 
                      ? 'bg-blue-600 text-white' 
                      : 'hover:bg-[#2a2a2a] text-gray-300'
                    }
                  `}
                >
                  <img
                    src={league.logoUrl}
                    alt={league.name}
                    className="w-5 h-5 object-contain rounded-sm"
                    style={{ minWidth: '20px', minHeight: '20px' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{league.name}</div>
                    <div className="text-xs text-gray-400">
                      {league.matchCount} {league.matchCount === 1 ? 'match' : 'matches'}
                      {league.hasLiveMatches && (
                        <span className="ml-2 px-1.5 py-0.5 bg-yellow-500 text-black text-xs rounded font-bold">
                          {league.liveMatchCount} LIVE
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
                  )}
                  {league.hasLiveMatches && !isSelected && (
                    <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0 animate-pulse"></div>
                  )}
                </button>
              );
            })
          ) : (
            <div className="text-center text-gray-500 py-4">
              <p className="text-sm">No leagues available</p>
            </div>
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-700/30">
          <div className="text-xs text-gray-500">
            {dynamicLeagues.length} {dynamicLeagues.length === 1 ? 'league' : 'leagues'} with matches
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="mb-16">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white">
            {dateLabel} Matches
            {isToday && liveMatches > 0 && (
              <span className="ml-3 px-3 py-1 bg-yellow-500 text-black text-sm rounded-full font-bold">
                {liveMatches} LIVE
              </span>
            )}
            {selectedLeagueId && (
              <span className="ml-3 px-3 py-1 bg-blue-600 text-white text-sm rounded-full font-medium">
                Filtered
              </span>
            )}
          </h2>
          <div className="text-right">
            <div className="text-lg font-semibold text-white">
              {totalMatches} {totalMatches === 1 ? 'match' : 'matches'}
            </div>
            <div className="text-sm text-gray-400">
              {filteredLeagues.length} {filteredLeagues.length === 1 ? 'league' : 'leagues'}
            </div>
          </div>
        </div>

        {/* Main content with filter */}
        <div className="flex gap-8">
          {/* Matches content - made smaller to accommodate filter */}
          <div className="flex-1 min-w-0">
            <div className="space-y-6">
              {filteredLeagues.map((league) => (
                <LeagueCard 
                  key={league.id} 
                  league={league}
                />
              ))}
            </div>
          </div>

          {/* Filter sidebar */}
          <div className="w-80 flex-shrink-0 hidden lg:block">
            <LeagueFilter />
          </div>
        </div>

        {/* Mobile filter - show as expandable section */}
        <div className="lg:hidden mt-6">
          <details className="bg-[#1a1a1a] rounded-lg border border-gray-700/30">
            <summary className="px-6 py-4 cursor-pointer font-medium text-white hover:bg-[#2a2a2a] transition-colors">
              <div className="flex items-center justify-between">
                <span>Filter by League</span>
                <svg className="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </summary>
            <div className="px-6 pb-6">
              <LeagueFilter />
            </div>
          </details>
        </div>
      </div>
    </section>
  );
};

export default MatchFeedByLeague; 