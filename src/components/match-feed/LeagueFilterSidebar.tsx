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

// Helper function to get league priority for sorting
const getLeaguePriority = (league: any): number => {
  const name = league.name.toLowerCase();
  
  // International competitions (highest priority)
  if (name.includes('champions league')) return 1;
  if (name.includes('europa league')) return 2;
  if (name.includes('world cup')) return 3;
  if (name.includes('european championship') || name.includes('euro')) return 4;
  if (name.includes('libertadores')) return 5;
  
  // Major domestic leagues
  if (name.includes('premier league') && !name.includes('australian')) return 10;
  if (name.includes('la liga') || name.includes('laliga')) return 11;
  if (name.includes('serie a') && !name.includes('brasil')) return 12;
  if (name.includes('bundesliga') && !name.includes('2.')) return 13;
  if (name.includes('ligue 1')) return 14;
  if (name.includes('liga portugal') || name.includes('primeira liga')) return 15;
  if (name.includes('major league soccer') || name.includes('mls')) return 16;
  if (name.includes('eredivisie')) return 17;
  if (name.includes('série a') && name.includes('brasil')) return 18;
  if (name.includes('primera división') && name.includes('argen')) return 19;
  if (name.includes('pro league') && name.includes('saudi')) return 20;
  
  // Default priority
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

  // Fetch top leagues from API
  useEffect(() => {
    const fetchTopLeagues = async () => {
      try {
        setLoading(true);
        console.log('[LeagueFilterSidebar] Fetching leagues from API...');
        
        const response = await highlightlyClient.getLeagues({
          limit: '30' // Get more leagues to filter from
        });
        
        if (response.data && Array.isArray(response.data)) {
          console.log(`[LeagueFilterSidebar] Found ${response.data.length} leagues from API`);
          
          // Transform API leagues to our format and prioritize them
          const transformedLeagues: LeagueFilter[] = response.data
            .map((league: any) => ({
              id: league.id.toString(),
              name: league.name,
              logoUrl: league.logo || `/leagues/${league.id}.svg`,
              hasMatches: availableLeagueIdsSet.has(league.id.toString()),
              matchCount: 0 // Will be updated by parent component if needed
            }))
            .sort((a, b) => getLeaguePriority(a) - getLeaguePriority(b))
            .slice(0, 16); // Limit to top 16 leagues
          
          setLeagues(transformedLeagues);
          console.log('[LeagueFilterSidebar] Processed leagues:', transformedLeagues.map(l => l.name));
        } else {
          console.warn('[LeagueFilterSidebar] No leagues data found in API response');
          setLeagues([]);
        }
      } catch (error) {
        console.error('[LeagueFilterSidebar] Error fetching leagues:', error);
        // Fallback to minimal hardcoded list if API fails
        setLeagues([
          { id: '2', name: 'UEFA Champions League', logoUrl: '/leagues/2.svg' },
          { id: '33973', name: 'Premier League', logoUrl: '/leagues/33973.svg' },
          { id: '140', name: 'La Liga', logoUrl: '/leagues/140.svg' },
          { id: '135', name: 'Serie A', logoUrl: '/leagues/135.svg' },
          { id: '78', name: 'Bundesliga', logoUrl: '/leagues/78.svg' },
          { id: '61', name: 'Ligue 1', logoUrl: '/leagues/61.svg' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopLeagues();
  }, []);

  // Update hasMatches status when availableLeagueIds changes
  useEffect(() => {
    if (leagues.length > 0) {
      setLeagues(prevLeagues => 
        prevLeagues.map(league => ({
          ...league,
          hasMatches: availableLeagueIdsSet.has(league.id)
        }))
      );
    }
  }, [availableLeagueIds]);

  const handleLeagueClick = (leagueId: string) => {
    console.log(`[LeagueFilterSidebar] League clicked: ${leagueId}`);
    
    if (onLeagueSelect) {
      // Toggle selection: if already selected, deselect (null), otherwise select the league
      onLeagueSelect(selectedLeagueId === leagueId ? null : leagueId);
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-[#121212] border-r border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-white text-lg font-semibold">Loading Leagues...</h3>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-[#1a1a1a] rounded-lg p-3 animate-pulse">
                <div className="h-4 bg-gray-600 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#121212] border-r border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-white text-lg font-semibold">Top Leagues</h3>
        <p className="text-gray-400 text-sm mt-1">Select a league to filter matches</p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="w-full px-4 py-2">
          <h6 className="text-white text-xs font-semibold uppercase mb-2">
            Available Leagues ({leagues.length})
          </h6>
          <ul className="space-y-1">
            {leagues.map((league) => {
              const isSelected = selectedLeagueId === league.id;
              const hasMatchesForLeague = league.hasMatches || availableLeagueIdsSet.has(league.id);
              const isDisabled = hasMatches && !hasMatchesForLeague;
              
              return (
                <li
                  key={league.id}
                  onClick={() => !isDisabled && handleLeagueClick(league.id)}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded cursor-pointer transition-colors
                    ${isSelected 
                      ? 'bg-[#2a2a2a] border-l-2 border-yellow-400 text-white' 
                      : isDisabled 
                        ? 'opacity-50 cursor-not-allowed text-gray-500' 
                        : 'hover:bg-[#1f1f1f] text-gray-300 hover:text-white'
                    }
                  `}
                  title={isDisabled ? 'No matches available for this league' : `Filter by ${league.name}`}
                >
                  <img
                    src={league.logoUrl}
                    alt={`${league.name} logo`}
                    className={`w-6 h-6 object-contain rounded-full flex-shrink-0 ${isDisabled ? 'grayscale' : ''}`}
                    onError={(e) => {
                      const target = e.currentTarget;
                      // Fallback to default icon if logo fails to load
                      target.src = '/icons/default.svg';
                    }}
                  />
                  <span className="text-sm font-medium truncate">
                    {league.name}
                  </span>
                  {/* Match count indicator */}
                  {hasMatchesForLeague && (
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        
        {/* Help text when no matches */}
        {hasMatches && availableLeagueIds.length === 0 && (
          <div className="px-4 py-8 text-center">
            <div className="text-gray-400 text-sm">
              No matches available for today
            </div>
            <div className="text-gray-500 text-xs mt-1">
              Try selecting a different date
            </div>
          </div>
        )}
        
        {/* Footer info */}
        {!hasMatches && (
          <div className="px-4 py-4 border-t border-gray-700 mt-auto">
            <p className="text-xs text-gray-500 text-center">
              Showing top leagues from the Highlightly API
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeagueFilterSidebar; 