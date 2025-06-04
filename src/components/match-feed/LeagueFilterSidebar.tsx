import React, { useState, useEffect } from 'react';
import { highlightlyClient } from '@/integrations/highlightly/client';

interface LeagueFilter {
  id: string;
  name: string;
  logoUrl: string;
  hasMatches?: boolean;
  matchCount?: number;
}

interface LeagueFilterSidebarProps {
  selectedLeagueId?: string | null;
  onLeagueSelect?: (leagueId: string | null) => void;
  availableLeagueIds?: string[];
  hasMatches?: boolean;
}

// Priority league IDs as specified by the user
const PRIORITY_LEAGUE_IDS = [
  '2486', '3337', '4188', '5890', '11847', '13549', 
  '8443', '33973', '52695', '67162', '119924', '16102',
  '115669', // Serie A (Italy)
  '1635' // FIFA World Cup
];

// Helper function to get league priority based on exact ID matching
const getLeaguePriority = (league: any): number => {
  const leagueId = league.id?.toString();
  
  // Use exact ID matching for priority leagues
  const priorityIndex = PRIORITY_LEAGUE_IDS.indexOf(leagueId);
  if (priorityIndex !== -1) {
    // Return priority based on position in array (lower index = higher priority)
    return priorityIndex + 1;
  }
  
  // Default priority for non-priority leagues
  return 999;
};

const LeagueFilterSidebar: React.FC<LeagueFilterSidebarProps> = ({
  selectedLeagueId,
  onLeagueSelect,
  availableLeagueIds = [],
  hasMatches = false
}) => {
  const [leagues, setLeagues] = useState<LeagueFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const availableLeagueIdsSet = new Set(availableLeagueIds);

  // Fetch priority leagues from API
  useEffect(() => {
    const fetchPriorityLeagues = async () => {
      try {
        setLoading(true);
        console.log('[LeagueFilterSidebar] Fetching priority leagues from API...');
        console.log('[LeagueFilterSidebar] Priority league IDs:', PRIORITY_LEAGUE_IDS);
        
        const response = await highlightlyClient.getLeagues({
          limit: '100' // Get more leagues to ensure we capture all priority ones
        });
        
        if (response.data && Array.isArray(response.data)) {
          console.log(`[LeagueFilterSidebar] Found ${response.data.length} leagues from API`);
          
          // Filter to prioritize the specified league IDs
          const priorityLeagues = response.data.filter((league: any) => {
            const leagueId = league.id?.toString();
            return PRIORITY_LEAGUE_IDS.includes(leagueId);
          });
          
          // Add popular leagues for completeness if we have fewer than 16 priority leagues
          const additionalLeagues = response.data.filter((league: any) => {
            const leagueId = league.id?.toString();
            const name = league.name?.toLowerCase() || '';
            return !PRIORITY_LEAGUE_IDS.includes(leagueId) && (
              name.includes('champions league') ||
              name.includes('europa league') ||
              name.includes('premier league') ||
              name.includes('la liga') ||
              name.includes('serie a') ||
              name.includes('bundesliga') ||
              name.includes('ligue 1') ||
              name.includes('libertadores')
            );
          }).slice(0, Math.max(0, 16 - priorityLeagues.length)); // Add additional leagues up to 16 total
          
          const allSelectedLeagues = [...priorityLeagues, ...additionalLeagues];
          
          // Transform API leagues to our format and prioritize them
          const transformedLeagues: LeagueFilter[] = allSelectedLeagues
            .map((league: any) => ({
              id: league.id.toString(),
              name: league.name,
              logoUrl: league.logo || `/leagues/${league.id}.svg`,
              hasMatches: availableLeagueIdsSet.has(league.id.toString()),
              matchCount: 0 // Will be updated by parent component if needed
            }))
            .sort((a, b) => {
              // First sort by priority
              const aPriority = getLeaguePriority(a);
              const bPriority = getLeaguePriority(b);
              if (aPriority !== bPriority) return aPriority - bPriority;
              
              // If matches are available, prioritize leagues with matches
              if (hasMatches) {
                if (a.hasMatches && !b.hasMatches) return -1;
                if (!a.hasMatches && b.hasMatches) return 1;
              }
              
              // Finally sort alphabetically
              return a.name.localeCompare(b.name);
            });
          
          setLeagues(transformedLeagues);
          console.log('[LeagueFilterSidebar] Processed priority leagues:', transformedLeagues.map(l => ({
            id: l.id,
            name: l.name,
            priority: getLeaguePriority(l),
            isPriorityLeague: PRIORITY_LEAGUE_IDS.includes(l.id),
            hasMatches: l.hasMatches
          })));
        } else {
          console.warn('[LeagueFilterSidebar] No leagues data found in API response');
          setLeagues([]);
        }
      } catch (error) {
        console.error('[LeagueFilterSidebar] Error fetching priority leagues:', error);
        setLeagues([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPriorityLeagues();
  }, [availableLeagueIds, hasMatches]);

  const handleLeagueSelect = (leagueId: string) => {
    const newSelectedId = selectedLeagueId === leagueId ? null : leagueId;
    onLeagueSelect?.(newSelectedId);
  };

  const handleShowAll = () => {
    onLeagueSelect?.(null);
  };

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/30">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-white font-semibold">Loading Featured Leagues...</span>
          </div>
        </div>
        <div className="p-4">
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-[#121212] rounded-lg p-3 animate-pulse">
                <div className="h-4 bg-gray-600 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/30">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="text-white font-semibold">Featured Leagues</span>
          <span className="text-gray-400 text-sm">({leagues.length})</span>
        </div>
      </div>

      <div className="p-4">
        {/* Show All Button */}
        <div className="mb-4">
          <button
            onClick={handleShowAll}
            className={`
              w-full bg-gradient-to-r rounded-lg p-3 flex items-center gap-3
              transition-all duration-200 border
              ${!selectedLeagueId
                ? 'from-blue-600 to-purple-600 border-blue-500/50 text-white shadow-lg shadow-blue-500/25' 
                : 'from-[#0a0a0a] to-[#121212] border-gray-600/50 text-gray-400 hover:text-white hover:border-gray-500/50'
              }
            `}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="font-medium">All Leagues</span>
            <div className="ml-auto">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        {/* League List */}
        <div className="space-y-2">
          {leagues.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">No featured leagues available</div>
              <div className="text-gray-500 text-sm">Unable to load priority leagues from API</div>
            </div>
          ) : (
            leagues.map((league) => {
              const isPriorityLeague = PRIORITY_LEAGUE_IDS.includes(league.id);
              const isSelected = selectedLeagueId === league.id;
              
              return (
                <button
                  key={league.id}
                  onClick={() => handleLeagueSelect(league.id)}
                  className={`
                    w-full bg-[#0a0a0a] rounded-lg p-3 flex items-center gap-3
                    transition-all duration-200 hover:bg-[#121212] border
                    ${isSelected
                      ? 'border-blue-400/50 ring-1 ring-blue-400/30 text-white' 
                      : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600/50'
                    }
                    ${isPriorityLeague ? 'ring-1 ring-yellow-500/20 border-yellow-500/30' : ''}
                  `}
                  disabled={hasMatches && !league.hasMatches}
                >
                  {/* League Logo */}
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 flex-shrink-0">
                      {league.logoUrl && league.logoUrl !== `/leagues/${league.id}.svg` ? (
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
                      ) : null}
                      {/* Fallback initials icon */}
                      <div className={`w-6 h-6 bg-gradient-to-br from-gray-500 to-gray-700 rounded-full flex items-center justify-center ${league.logoUrl && league.logoUrl !== `/leagues/${league.id}.svg` ? 'hidden' : ''}`}>
                        <span className="text-white text-xs font-bold">
                          {league.name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* League Name and Status */}
                  <div className="flex-1 text-left min-w-0">
                    <div className={`
                      font-medium leading-tight truncate flex items-center gap-2
                      ${isSelected ? 'text-white' : 'text-gray-300'}
                      ${hasMatches && !league.hasMatches ? 'opacity-50' : ''}
                    `}>
                      {league.name}
                      {isPriorityLeague && (
                        <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded font-bold">
                          FEATURED
                        </span>
                      )}
                    </div>
                    {hasMatches && (
                      <div className="text-xs text-gray-500 truncate">
                        {league.hasMatches ? 
                          `${league.matchCount || 0} matches` : 
                          'No matches'
                        }
                      </div>
                    )}
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="flex-shrink-0">
                    {hasMatches && league.hasMatches && (
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-6 pt-4 border-t border-gray-700/30">
          <p className="text-xs text-gray-500 text-center">
            Featured leagues and tournaments. Select a league to filter matches.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LeagueFilterSidebar; 