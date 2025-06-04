import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import type { LeagueWithMatches } from '@/types';
import MatchRow from './MatchRow';
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
}

// Priority league IDs as specified by the user
const PRIORITY_LEAGUE_IDS = [
  '2486', '3337', '4188', '5890', '11847', '13549', 
  '8443', '33973', '52695', '67162', '119924', '16102',
  '115669', // Serie A (Italy)
  '1635' // FIFA World Cup
];

// Helper function to get league priority based on exact ID matching
const getLeagueFilterPriority = (league: LeagueWithMatches): number => {
  const leagueId = league.id?.toString();
  
  // Use exact ID matching for priority leagues
  const priorityIndex = PRIORITY_LEAGUE_IDS.indexOf(leagueId);
  if (priorityIndex !== -1) {
    // Return priority based on position in array (lower index = higher priority)
    return priorityIndex + 1;
  }
  
  // Secondary priority for popular leagues not in our priority list
  const name = league.name.toLowerCase();
  if (name.includes('champions league')) return 100;
  if (name.includes('europa league')) return 101;
  if (name.includes('conference league')) return 102;
  if (name.includes('libertadores')) return 103;
  if (name.includes('premier league') && !name.includes('australian')) return 110;
  if (name.includes('la liga') || name.includes('laliga')) return 111;
  if (name.includes('serie a') && !name.includes('brasil')) return 112;
  if (name.includes('bundesliga') && !name.includes('2.')) return 113;
  if (name.includes('ligue 1')) return 114;
  if (name.includes('world cup')) return 120;
  if (name.includes('euro')) return 121;
  if (name.includes('copa américa') || name.includes('copa america')) return 122;
  
  // Default priority for other leagues
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

  // Transform leagues data for filter with priority-based sorting
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
          priority: getLeagueFilterPriority(league),
          isPriorityLeague: PRIORITY_LEAGUE_IDS.includes(league.id)
        };
      })
      .sort((a, b) => {
        // First: maintain priority order (Featured leagues first, then popular ones)
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
    
    const newSelectedIds = selectedLeagueIds.includes(leagueId)
      ? selectedLeagueIds.filter(id => id !== leagueId)
      : [...selectedLeagueIds, leagueId];
    
    onLeagueSelect(newSelectedIds);
  };

  const handleShowAll = () => {
    onLeagueSelect?.([]);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <h3 className="text-white font-semibold">Filter by League</h3>
          <span className="text-gray-400 text-sm">({filterLeagues.length})</span>
        </div>
        
        {selectedLeagueIds.length > 0 && (
          <button
            onClick={handleShowAll}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Show All
          </button>
        )}
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
        style={{ scrollbarWidth: 'thin' }}
      >
        {filterLeagues.map((league) => {
          const isSelected = selectedLeagueIds.includes(league.id);
          
          return (
            <button
              key={league.id}
              data-league-id={league.id}
              onClick={() => handleLeagueClick(league.id)}
              className={`
                flex-shrink-0 bg-[#1a1a1a] rounded-lg p-3 flex items-center gap-3 min-w-[200px]
                transition-all duration-200 hover:bg-[#252525] border
                ${isSelected
                  ? 'border-blue-400/50 ring-1 ring-blue-400/30 text-white' 
                  : 'border-gray-600/30 text-gray-400 hover:text-white hover:border-gray-500/50'
                }
                ${league.isPriorityLeague ? 'ring-1 ring-yellow-500/20 border-yellow-500/30' : ''}
              `}
            >
              {/* League Logo */}
              <div className="flex-shrink-0">
                <div className="w-8 h-8 flex-shrink-0">
                  <img 
                    src={league.logoUrl} 
                    alt={`${league.name} logo`}
                    className="w-full h-full object-contain rounded"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  {/* Fallback initials icon (hidden by default) */}
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-700 rounded-full flex items-center justify-center hidden">
                    <span className="text-white text-xs font-bold">
                      {league.name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* League Info */}
              <div className="flex-1 text-left min-w-0">
                <div className={`
                  font-medium leading-tight truncate flex items-center gap-2
                  ${isSelected ? 'text-white' : 'text-gray-300'}
                `}>
                  {league.name}
                  {league.isPriorityLeague && (
                    <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded font-bold">
                      FEATURED
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 truncate flex items-center gap-2">
                  {league.hasLiveMatches && (
                    <span className="text-red-400 font-bold">LIVE</span>
                  )}
                  <span>{league.matchCount} matches</span>
                  {league.countryCode !== 'WW' && (
                    <>
                      <span>•</span>
                      <img 
                        src={getCountryFlagUrl(league.countryCode)} 
                        alt={`${league.countryCode} flag`}
                        className="w-3 h-2 object-cover rounded-sm"
                      />
                    </>
                  )}
                </div>
              </div>
              
              {/* Live indicator */}
              {league.hasLiveMatches && (
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Selected leagues summary */}
      {selectedLeagueIds.length > 0 && (
        <div className="mt-3 p-3 bg-[#121212] rounded-lg border border-blue-500/20">
          <div className="text-sm text-gray-300">
            <span className="text-blue-400 font-medium">Filtered by:</span>
            {' '}
            {filterLeagues
              .filter(league => selectedLeagueIds.includes(league.id))
              .map(league => league.name)
              .join(', ')
            }
          </div>
        </div>
      )}
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
}) => {
  const [expandedLeagues, setExpandedLeagues] = useState<string[]>([]);

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

  // Sort leagues by priority: featured leagues first, then live matches, then by match count
  const sortedLeagues = useMemo(() => {
    return filteredLeagues.sort((a, b) => {
      // First: prioritize by exact ID matching
      const aPriority = getLeagueFilterPriority(a);
      const bPriority = getLeagueFilterPriority(b);
      if (aPriority !== bPriority) return aPriority - bPriority;
      
      // Second: live matches
      const aLiveCount = a.matches.filter(m => 
        m.fixture?.status?.short === 'LIVE' || m.status === 'live'
      ).length;
      const bLiveCount = b.matches.filter(m => 
        m.fixture?.status?.short === 'LIVE' || m.status === 'live'
      ).length;
      
      if (aLiveCount > 0 && bLiveCount === 0) return -1;
      if (aLiveCount === 0 && bLiveCount > 0) return 1;
      
      // Third: match count
      return b.matches.length - a.matches.length;
    });
  }, [filteredLeagues]);

  const toggleLeagueExpansion = (leagueId: string) => {
    const newExpanded = expandedLeagues.includes(leagueId) ? expandedLeagues.filter(id => id !== leagueId) : [...expandedLeagues, leagueId];
    setExpandedLeagues(newExpanded);
  };

  // Auto-expand leagues with live matches
  useEffect(() => {
    const leaguesWithLiveMatches = sortedLeagues
      .filter(league => 
        league.matches.some(match => 
          match.fixture?.status?.short === 'LIVE' || match.status === 'live'
        )
      )
      .map(league => league.id);
    
    if (leaguesWithLiveMatches.length > 0) {
      setExpandedLeagues(prev => {
        const newExpanded = [...prev, ...leaguesWithLiveMatches];
        return newExpanded;
      });
    }
  }, [sortedLeagues]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (sortedLeagues.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-4">
          <svg className="w-16 h-16 text-gray-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-300 mb-2">No matches found</h3>
        <p className="text-gray-500">
          {selectedLeagueIds.length > 0 
            ? 'No matches found for the selected leagues and filters.' 
            : selectedDate
              ? `No matches found for ${selectedDate}.`
              : 'No matches available.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* League Filter */}
      <LeagueFilter
        leaguesWithMatches={leaguesWithMatches}
        selectedLeagueIds={selectedLeagueIds}
        onLeagueSelect={onLeagueSelect}
      />

      {/* Country Filter */}
      <LeagueCountryFilter
        leaguesWithMatches={leaguesWithMatches}
        selectedLeagueIds={selectedLeagueIds}
        onLeagueSelect={onLeagueSelect}
        selectedCountryCode={selectedCountryCode}
      />

      {/* Leagues */}
      <div className="space-y-4">
        {sortedLeagues.map((league) => {
          const isPriorityLeague = PRIORITY_LEAGUE_IDS.includes(league.id);
          const isExpanded = expandedLeagues.includes(league.id);
          const liveMatchCount = league.matches.filter(m => 
            m.fixture?.status?.short === 'LIVE' || m.status === 'live'
          ).length;
          
          return (
            <div
              key={league.id}
              className={`
                bg-[#1a1a1a] rounded-lg border overflow-hidden
                ${isPriorityLeague ? 'border-yellow-500/30 ring-1 ring-yellow-500/20' : 'border-gray-700/30'}
              `}
            >
              {/* League Header */}
              <button
                onClick={() => toggleLeagueExpansion(league.id)}
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-[#252525] transition-colors border-b border-gray-700/30"
              >
                {/* League Logo */}
                <div className="flex-shrink-0">
                  <img 
                    src={getLeagueLogo(league.id, league.name, league.logo)}
                    alt={`${league.name} logo`}
                    className="w-8 h-8 object-contain rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  {/* Fallback initials icon */}
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-700 rounded-full flex items-center justify-center hidden">
                    <span className="text-white text-xs font-bold">
                      {league.name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                </div>
                
                {/* League Info */}
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-semibold truncate">{league.name}</h3>
                    {isPriorityLeague && (
                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded font-bold">
                        FEATURED
                      </span>
                    )}
                    {liveMatchCount > 0 && (
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded font-bold animate-pulse">
                        {liveMatchCount} LIVE
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    {league.matches.length} matches
                    {selectedDate && ` • ${formatSelectedDate(selectedDate)}`}
                  </div>
                </div>
                
                {/* Expand/Collapse Icon */}
                <div className="flex-shrink-0">
                  <svg 
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Matches List - Collapsible */}
              {isExpanded && (
                <div className="divide-y divide-gray-700/30">
                  {league.matches.map((match) => (
                    <MatchRow key={match.id} match={match} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MatchFeedByLeague; 