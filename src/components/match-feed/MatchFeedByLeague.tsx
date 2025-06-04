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

// Helper function to get league priority for sorting in the filter
const getLeagueFilterPriority = (league: LeagueWithMatches): number => {
  const name = league.name.toLowerCase();
  
  // International competitions (highest priority)
  if (name.includes('champions league')) return 1;
  if (name.includes('europa league')) return 2;
  if (name.includes('conference league')) return 3;
  if (name.includes('libertadores')) return 4;
  
  // Major domestic leagues
  if (name.includes('premier league') && !name.includes('australian')) return 10;
  if (name.includes('la liga') || name.includes('laliga')) return 11;
  if (name.includes('serie a') && !name.includes('brasil')) return 12;
  if (name.includes('bundesliga') && !name.includes('2.')) return 13;
  if (name.includes('ligue 1')) return 14;
  
  // International tournaments
  if (name.includes('world cup')) return 20;
  if (name.includes('euro')) return 21;
  if (name.includes('copa américa') || name.includes('copa america')) return 22;
  
  // Default priority
  return 999;
};

const LeagueFilter: React.FC<{
  leaguesWithMatches: LeagueWithMatches[];
  selectedLeagueIds: string[];
  onLeagueSelect?: (leagueIds: string[]) => void;
}> = React.memo(({ leaguesWithMatches, selectedLeagueIds, onLeagueSelect }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to show selected leagues
  useLayoutEffect(() => {
    if (scrollRef.current && selectedLeagueIds.length > 0) {
      const firstSelectedId = selectedLeagueIds[0];
      const selectedElement = scrollRef.current.querySelector(`[data-league-id="${firstSelectedId}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [selectedLeagueIds]);

  // Transform leagues data for filter with proper prioritization
  const filterLeagues = useMemo(() => {
    return leaguesWithMatches
      .map(league => {
        const liveMatchCount = league.matches.filter(m => 
          m.fixture?.status?.short === 'LIVE' || m.status === 'live'
        ).length;
        
        return {
          id: league.id,
          name: league.name,
          logoUrl: getLeagueLogo(league.id, league.name, league.logo), // Use utility function that prioritizes API logo
          countryCode: getLeagueCountryInfo(league.id).code || 'WW',
          matchCount: league.matches.length,
          liveMatchCount: liveMatchCount,
          hasLiveMatches: liveMatchCount > 0,
          priority: getLeagueFilterPriority(league)
        };
      })
      .sort((a, b) => {
        // First: maintain priority order (Champions League, etc. first)
        if (a.priority !== b.priority) return a.priority - b.priority;
        
        // Second: live matches (for leagues with same priority)
        if (a.hasLiveMatches && !b.hasLiveMatches) return -1;
        if (!a.hasLiveMatches && b.hasLiveMatches) return 1;
        
        // Third: match count (more matches first)
        return b.matchCount - a.matchCount;
      });
  }, [leaguesWithMatches]);

  const handleLeagueClick = (leagueId: string) => {
    if (!onLeagueSelect) return;
    
    // Toggle league selection (add if not selected, remove if selected)
    if (selectedLeagueIds.includes(leagueId)) {
      onLeagueSelect(selectedLeagueIds.filter(id => id !== leagueId));
    } else {
      onLeagueSelect([...selectedLeagueIds, leagueId]);
    }
  };

  const handleSelectAll = () => {
    if (!onLeagueSelect) return;
    
    if (selectedLeagueIds.length === filterLeagues.length) {
      // Deselect all
      onLeagueSelect([]);
    } else {
      // Select all
      onLeagueSelect(filterLeagues.map(league => league.id));
    }
  };

  if (filterLeagues.length === 0) {
    return (
      <div className="text-center py-4 text-gray-400">
        <p className="text-sm">No leagues with matches available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-300">
          League Filter ({filterLeagues.length} available)
        </h4>
        <button
          onClick={handleSelectAll}
          className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
        >
          {selectedLeagueIds.length === filterLeagues.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      {/* League Pills */}
      <div 
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2"
        style={{ 
          scrollbarWidth: 'thin',
          scrollbarColor: '#374151 transparent'
        }}
      >
        {filterLeagues.map((league) => {
          const isSelected = selectedLeagueIds.includes(league.id);
          
          return (
            <button
              key={league.id}
              data-league-id={league.id}
              onClick={() => handleLeagueClick(league.id)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium 
                whitespace-nowrap transition-all duration-200 flex-shrink-0
                ${isSelected
                  ? 'bg-yellow-400 text-black shadow-lg'
                  : 'bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a] hover:text-white border border-gray-600'
                }
              `}
            >
              <img
                src={league.logoUrl}
                alt={`${league.name} logo`}
                className="w-4 h-4 object-contain rounded-full"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.src = '/icons/default.svg';
                }}
              />
              <span>{league.name}</span>
              
              {/* Match count */}
              <span className={`
                text-xs px-1.5 py-0.5 rounded-full font-bold
                ${isSelected 
                  ? 'bg-black/20 text-black' 
                  : 'bg-gray-600 text-gray-300'
                }
              `}>
                {league.matchCount}
              </span>
              
              {/* Live indicator */}
              {league.hasLiveMatches && (
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  isSelected ? 'bg-red-600' : 'bg-red-400'
                }`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Selection Summary */}
      {selectedLeagueIds.length > 0 && (
        <div className="text-xs text-gray-400">
          Showing {selectedLeagueIds.length} of {filterLeagues.length} leagues
          {selectedLeagueIds.length > 1 && (
            <button
              onClick={() => onLeagueSelect && onLeagueSelect([])}
              className="ml-2 text-yellow-400 hover:text-yellow-300"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
});

LeagueFilter.displayName = 'LeagueFilter';

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