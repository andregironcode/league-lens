import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import type { LeagueWithMatches } from '@/types';
import LeagueCard from './LeagueCard';
import { getLeagueCountryInfo, getCountryFlagUrl, getLeagueLogo } from './utils';
import LeagueCountryFilter from './LeagueCountryFilter';

interface MatchFeedByLeagueProps {
  leaguesWithMatches: LeagueWithMatches[];
  loading?: boolean;
  selectedDate?: string;
  isToday?: boolean;
  selectedLeagueIds?: string[];
  onLeagueSelect?: (leagueIds: string[]) => void;
  selectedCountryCode?: string | null;
  onCountrySelect?: (countryCode: string | null) => void;
}

const LEAGUE_FILTERS = [
  {
    id: '39',
    name: 'Premier League',
    logoUrl: '/leagues/39.svg',
    countryCode: 'GB'
  },
  {
    id: '140',
    name: 'La Liga',
    logoUrl: '/leagues/140.svg',
    countryCode: 'ES'
  },
  {
    id: '135',
    name: 'Serie A',
    logoUrl: '/leagues/135.svg',
    countryCode: 'IT'
  },
  {
    id: '78',
    name: 'Bundesliga',
    logoUrl: '/leagues/78.svg',
    countryCode: 'DE'
  },
  {
    id: '61',
    name: 'Ligue 1',
    logoUrl: '/leagues/61.svg',
    countryCode: 'FR'
  },
  {
    id: '2',
    name: 'UEFA Champions League',
    logoUrl: '/leagues/2.svg',
    countryCode: 'EU'
  },
  {
    id: '3',
    name: 'UEFA Europa League',
    logoUrl: '/leagues/3.svg',
    countryCode: 'EU'
  },
  {
    id: '848',
    name: 'UEFA Europa Conference League',
    logoUrl: '/leagues/848.svg',
    countryCode: 'EU'
  }
];

const LeagueFilter: React.FC<{
  leaguesWithMatches: LeagueWithMatches[];
  selectedLeagueIds: string[];
  onLeagueSelect?: (leagueIds: string[]) => void;
}> = React.memo(({ leaguesWithMatches, selectedLeagueIds, onLeagueSelect }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

  // Save scroll position before any potential re-render
  const saveScrollPosition = () => {
    if (scrollRef.current) {
      scrollPositionRef.current = scrollRef.current.scrollTop;
    }
  };

  // Set up scroll listener and save position on mount
  useLayoutEffect(() => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', saveScrollPosition);
      // Save initial position
      saveScrollPosition();
      
      return () => {
        saveScrollPosition(); // Save on cleanup
        scrollContainer.removeEventListener('scroll', saveScrollPosition);
      };
    }
  }, []);

  // Restore scroll position after re-render
  useLayoutEffect(() => {
    if (scrollRef.current && scrollPositionRef.current > 0) {
      // Use requestAnimationFrame to ensure DOM has been updated
      requestAnimationFrame(() => {
        if (scrollRef.current && scrollPositionRef.current > 0) {
          scrollRef.current.scrollTop = scrollPositionRef.current;
        }
      });
    }
  });

  // Save scroll position when dependencies change
  useLayoutEffect(() => {
    saveScrollPosition();
  }, [selectedLeagueIds]);

  // Map league data to filter format
  const allTopLeagues = LEAGUE_FILTERS.map(filter => {
    const leagueData = leaguesWithMatches.find(l => l.id === filter.id);
    const matchCount = leagueData ? leagueData.matches.length : 0;
    const liveMatchCount = leagueData ? leagueData.matches.filter(m => 
      m.fixture?.status?.short === 'LIVE' || m.status === 'live'
    ).length : 0;
    
    return {
      id: filter.id,
      name: filter.name,
      logoUrl: filter.logoUrl,
      countryCode: filter.countryCode,
      matchCount: matchCount,
      liveMatchCount: liveMatchCount,
      hasLiveMatches: liveMatchCount > 0
    };
  });

  // Sort by priority: keep original LEAGUE_FILTERS order, then by live matches, then by match count
  const sortedLeagues = allTopLeagues.sort((a, b) => {
    // First: maintain original order from LEAGUE_FILTERS
    const aIndex = LEAGUE_FILTERS.findIndex(f => f.id === a.id);
    const bIndex = LEAGUE_FILTERS.findIndex(f => f.id === b.id);
    if (aIndex !== bIndex) return aIndex - bIndex;
    
    // Second: live matches (for leagues not in LEAGUE_FILTERS)
    if (a.hasLiveMatches && !b.hasLiveMatches) return -1;
    if (!a.hasLiveMatches && b.hasLiveMatches) return 1;
    
    // Third: match count (more matches first)
    return b.matchCount - a.matchCount;
  });

  const handleLeagueClick = (leagueId: string) => {
    if (!onLeagueSelect) return;
    
    // Toggle league selection (add if not selected, remove if selected)
    if (selectedLeagueIds.includes(leagueId)) {
      onLeagueSelect(selectedLeagueIds.filter(id => id !== leagueId));
    } else {
      onLeagueSelect([...selectedLeagueIds, leagueId]);
    }
  };

  return (
    <div className="sticky top-6">
      <div className="mb-4 text-center">
        <h3 className="text-lg font-semibold text-white mb-2">Top Leagues</h3>
      </div>
      
      <div className="space-y-2 max-h-96 overflow-y-auto" ref={scrollRef}>
        {sortedLeagues.length > 0 ? (
          sortedLeagues.map((league) => {
            const isSelected = selectedLeagueIds.includes(league.id);

            return (
              <button
                key={league.id}
                onClick={() => handleLeagueClick(league.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors focus:outline-none backdrop-blur-sm
                  ${isSelected 
                    ? 'bg-[#FFC30B] text-black' 
                    : 'hover:bg-white/10 text-gray-300 border border-white/10'
                  }
                `}
              >
                <img
                  src={league.logoUrl}
                  alt={league.name}
                  className="w-5 h-5 object-contain rounded-full bg-white p-0.5"
                  style={{ minWidth: '20px', minHeight: '20px' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{league.name}</div>
                  <div className="text-xs text-gray-400">
                    {league.hasLiveMatches && (
                      <span className="px-1.5 py-0.5 bg-yellow-500 text-black text-xs rounded font-bold">
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
    </div>
  );
});

const LoadingSkeleton: React.FC = () => (
  <div className="min-h-screen bg-[#111111] text-white">
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left sidebar - League filters */}
        <div className="lg:col-span-3 space-y-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-700 rounded w-1/2 mx-auto"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
          
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-700 rounded w-1/2 mx-auto"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Main content - Match cards */}
        <div className="lg:col-span-9">
          <div className="animate-pulse space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <div className="h-8 bg-gray-700 rounded w-1/4"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-48 bg-gray-700 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const formatSelectedDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Reset time parts for comparison
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);

  if (compareDate.getTime() === today.getTime()) {
    return 'Today';
  } else if (compareDate.getTime() === tomorrow.getTime()) {
    return 'Tomorrow';
  } else if (compareDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }

  // Format as "Mon, Jan 1" for other dates
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

const MatchFeedByLeague: React.FC<MatchFeedByLeagueProps> = ({
  leaguesWithMatches,
  loading = false,
  selectedDate,
  isToday = false,
  selectedLeagueIds = [],
  onLeagueSelect,
  selectedCountryCode = null,
  onCountrySelect
}) => {
  const [expandedLeagues, setExpandedLeagues] = useState<Set<string>>(new Set());

  // Group matches by league
  const matchesByLeague = useMemo(() => {
    const grouped = new Map<string, LeagueWithMatches>();
    
    leaguesWithMatches.forEach(league => {
      if (league.matches && league.matches.length > 0) {
        grouped.set(league.id, league);
      }
    });
    
    return grouped;
  }, [leaguesWithMatches]);

  // Filter leagues based on selection
  const filteredLeagues = useMemo(() => {
    if (selectedLeagueIds.length === 0) {
      return Array.from(matchesByLeague.values());
    }
    
    return Array.from(matchesByLeague.values()).filter(league => 
      selectedLeagueIds.includes(league.id)
    );
  }, [matchesByLeague, selectedLeagueIds]);

  // Sort leagues by priority: live matches first, then by match count
  const sortedLeagues = useMemo(() => {
    return filteredLeagues.sort((a, b) => {
      const aLiveCount = a.matches.filter(m => 
        m.fixture?.status?.short === 'LIVE' || m.status === 'live'
      ).length;
      const bLiveCount = b.matches.filter(m => 
        m.fixture?.status?.short === 'LIVE' || m.status === 'live'
      ).length;
      
      // First: live matches
      if (aLiveCount > 0 && bLiveCount === 0) return -1;
      if (aLiveCount === 0 && bLiveCount > 0) return 1;
      
      // Second: match count
      return b.matches.length - a.matches.length;
    });
  }, [filteredLeagues]);

  const toggleLeagueExpansion = (leagueId: string) => {
    const newExpanded = new Set(expandedLeagues);
    if (newExpanded.has(leagueId)) {
      newExpanded.delete(leagueId);
    } else {
      newExpanded.add(leagueId);
    }
    setExpandedLeagues(newExpanded);
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left sidebar - League filters */}
          <div className="lg:col-span-3 space-y-8">
            <LeagueCountryFilter
              leaguesWithMatches={leaguesWithMatches}
              selectedLeagueIds={selectedLeagueIds}
              onLeagueSelect={onLeagueSelect}
              selectedCountryCode={selectedCountryCode}
            />
          </div>
          
          {/* Main content - Match cards */}
          <div className="lg:col-span-9">
            {selectedDate && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white">
                  {formatSelectedDate(selectedDate)}
                  {isToday && (
                    <span className="ml-2 px-2 py-1 bg-yellow-500 text-black text-sm rounded-full">
                      Today
                    </span>
                  )}
                </h2>
              </div>
            )}
            
            <div className="space-y-8">
              {sortedLeagues.map((league) => {
                const isExpanded = expandedLeagues.has(league.id);
                const liveMatchCount = league.matches.filter(m => 
                  m.fixture?.status?.short === 'LIVE' || m.status === 'live'
                ).length;
                
                return (
                  <div key={league.id} className="space-y-4">
                    <button
                      onClick={() => toggleLeagueExpansion(league.id)}
                      className="flex items-center gap-4 group focus:outline-none w-full text-left"
                    >
                      <img
                        src={getLeagueLogo(league.id, league.name, league.logo)}
                        alt={league.name}
                        className="w-8 h-8 object-contain rounded-full bg-white p-1"
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white group-hover:text-yellow-500 transition-colors">
                          {league.name}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {league.matches.length} {league.matches.length === 1 ? 'match' : 'matches'}
                          {liveMatchCount > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 bg-yellow-500 text-black text-xs rounded font-bold">
                              {liveMatchCount} LIVE
                            </span>
                          )}
                        </p>
                      </div>
                      <div className={`w-6 h-6 transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                        <svg 
                          className="w-full h-full text-gray-400 group-hover:text-yellow-500 transition-colors"
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {liveMatchCount > 0 && (
                        <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0 animate-pulse"></div>
                      )}
                    </button>
                    
                    {isExpanded && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {league.matches.map((match) => (
                          <LeagueCard
                            key={match.id}
                            match={match}
                            leagueName={league.name}
                            leagueLogo={getLeagueLogo(league.id, league.name, league.logo)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {sortedLeagues.length === 0 && (
                <div className="text-center text-gray-500 py-12">
                  <p className="text-lg">No matches found</p>
                  <p className="text-sm mt-2">Try selecting different leagues or check back later</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchFeedByLeague; 