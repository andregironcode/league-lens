import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { highlightlyClient } from '@/integrations/highlightly/client';

interface League {
  id: string;
  name: string;
  logo?: string;
  country?: {
    code: string;
    name: string;
    logo?: string;
  };
  category: 'international-club' | 'domestic' | 'international-tournament';
}

interface TopLeaguesFilterProps {
  selectedLeagueId?: string | null;
  onLeagueSelect?: (leagueId: string | null) => void;
}

// Priority league IDs as specified by the user
const PRIORITY_LEAGUE_IDS = [
  '2486', '3337', '4188', '5890', '11847', '13549', 
  '8443', '33973', '52695', '67162', '119924', '16102',
  '115669', // Serie A (Italy)
  '1635' // FIFA World Cup
];

// Helper function to get category display name
const getCategoryDisplayName = (category: string): string => {
  switch (category) {
    case 'international-club':
      return 'International Club';
    case 'domestic':
      return 'Big 5 European Leagues';
    case 'international-tournament':
      return 'International Tournaments';
    default:
      return 'Other';
  }
};

// Helper function to get category icon
const getCategoryIcon = (category: string): JSX.Element => {
  switch (category) {
    case 'international-club':
      return (
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'domestic':
      return (
        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    case 'international-tournament':
      return (
        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      );
  }
};

// Helper function to categorize leagues based on their names and attributes
const categorizeLeague = (league: any): 'international-club' | 'domestic' | 'international-tournament' => {
  const name = league.name.toLowerCase();
  const leagueId = league.id?.toString();
  
  // International club competitions (only the big 3)
  if (name.includes('uefa champions league') || 
      name.includes('champions league') || 
      leagueId === '2486' || // UEFA Champions League specific ID
      name.includes('uefa europa league') || 
      name.includes('europa league') || 
      name.includes('conmebol libertadores') ||
      name.includes('copa libertadores') ||
      name.includes('libertadores')) {
    return 'international-club';
  }
  
  // International tournaments (major national team competitions + AFC Cup)
  if (leagueId === '1635' || // FIFA World Cup specifically by ID
      (name.includes('world cup') && !name.includes('club') && !name.includes('fifa club')) || // FIFA World Cup by name (excluding club versions)
      name.includes('euro championship') ||
      name.includes('european championship') ||
      name.includes('uefa euro') ||
      (name.includes('euro') && name.includes('202')) || // Euro 2020, 2024, etc.
      name.includes('africa cup of nations') ||
      name.includes('afcon') ||
      name.includes('copa américa') ||
      name.includes('copa america') ||
      name.includes('afc cup') || // AFC Cup moved here
      name.includes('asian cup')) {
    return 'international-tournament';
  }
  
  // Top domestic leagues (Big 5 European leagues + specific IDs)
  if ((name.includes('premier league') && !name.includes('australian') && !name.includes('south african')) ||
      leagueId === '33973' || // Premier League specific ID
      name.includes('la liga') || 
      name.includes('laliga') ||
      leagueId === '119924' || // La Liga alternative ID
      (name.includes('serie a') && (leagueId === '115669' || name.includes('italy') || name.includes('italia'))) || // Serie A Italy specifically
      (name.includes('bundesliga') && !name.includes('2.') && !name.includes('frauen')) ||
      leagueId === '67162' || // Bundesliga specific ID
      name.includes('ligue 1') ||
      leagueId === '52695') {
    return 'domestic';
  }
  
  // Everything else defaults to 'domestic' but will be less prioritized
  return 'domestic';
};

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

const TopLeaguesFilter: React.FC<TopLeaguesFilterProps> = ({
  selectedLeagueId,
  onLeagueSelect
}) => {
  const navigate = useNavigate();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['international-club', 'domestic']) // Default expanded categories
  );

  // Fetch leagues from API with focus on priority IDs
  useEffect(() => {
    const fetchTopLeagues = async () => {
      try {
        setLoading(true);
        console.log('[TopLeaguesFilter] Fetching ONLY priority leagues from API...');
        console.log('[TopLeaguesFilter] Target priority league IDs:', PRIORITY_LEAGUE_IDS);
        
        // OPTIMIZED: Direct API calls for specific leagues using getLeagueById
        // This is much more efficient than fetching 600+ leagues
        const priorityLeagues: any[] = [];
        
        console.log('[TopLeaguesFilter] Fetching leagues by specific IDs...');
        
        // Fetch each priority league directly by ID
        const leaguePromises = PRIORITY_LEAGUE_IDS.map(async (leagueId) => {
          try {
            console.log(`[TopLeaguesFilter] Fetching league ID: ${leagueId}`);
            const response = await highlightlyClient.getLeagueById(leagueId);
            
            if (response && response.data) {
              // Handle different response formats
              let leagueData = null;
              if (Array.isArray(response.data)) {
                leagueData = response.data[0];
              } else {
                leagueData = response.data;
              }
              
              if (leagueData && leagueData.id) {
                console.log(`[TopLeaguesFilter] ✅ Found: ${leagueData.name} (ID: ${leagueData.id})`);
                return { ...leagueData, id: leagueData.id.toString() };
              }
            } else if (response && !response.data && response.id) {
              // Direct response format
              console.log(`[TopLeaguesFilter] ✅ Found: ${response.name} (ID: ${response.id})`);
              return { ...response, id: response.id.toString() };
            }
            
            console.log(`[TopLeaguesFilter] ❌ League ${leagueId} not found or invalid response`);
            return null;
          } catch (error) {
            console.log(`[TopLeaguesFilter] ❌ Error fetching league ${leagueId}:`, error.message);
            return null;
          }
        });
        
        // Wait for all leagues to be fetched
        const leagueResults = await Promise.allSettled(leaguePromises);
        
        // Process results
        leagueResults.forEach((result, index) => {
          const leagueId = PRIORITY_LEAGUE_IDS[index];
          if (result.status === 'fulfilled' && result.value) {
            priorityLeagues.push(result.value);
          } else {
            console.log(`[TopLeaguesFilter] Failed to fetch league ${leagueId}:`, 
              result.status === 'rejected' ? result.reason : 'No data');
          }
        });
        
        console.log(`[TopLeaguesFilter] Successfully fetched ${priorityLeagues.length}/${PRIORITY_LEAGUE_IDS.length} priority leagues`);
        
        if (priorityLeagues.length === 0) {
          console.warn('[TopLeaguesFilter] No priority leagues found, falling back to pagination method');
          
          // Fallback: Use the original pagination method if direct fetching fails
          let allLeagues: any[] = [];
          let offset = 0;
          const limit = 100;
          
          while (offset < 600) {
            try {
              const response = await highlightlyClient.getLeagues({
                limit: limit.toString(),
                offset: offset.toString()
              });
              
              if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
                break;
              }
              
              allLeagues.push(...response.data);
              if (response.data.length < limit) break;
              offset += limit;
            } catch (error) {
              console.error(`[TopLeaguesFilter] Pagination error at offset ${offset}:`, error);
              break;
            }
          }
          
          // Filter to only priority leagues
          priorityLeagues.push(...allLeagues.filter((league: any) => 
            PRIORITY_LEAGUE_IDS.includes(league.id?.toString())
          ));
        }
        
        // EXPLICITLY EXCLUDE unwanted leagues (like FIFA Club World Cup)
        const filteredLeagues = priorityLeagues.filter((league: any) => {
          const name = league.name?.toLowerCase() || '';
          
          // EXPLICITLY EXCLUDE FIFA Club World Cup by name
          if (name.includes('fifa club world cup') || 
              name.includes('club world cup') ||
              (name.includes('club') && name.includes('world cup'))) {
            console.log(`[TopLeaguesFilter] EXCLUDING Club World Cup: ${league.name} (ID: ${league.id})`);
            return false;
          }
          
          return true;
        });
        
        // Transform API leagues to our format with categorization
        const transformedLeagues: League[] = filteredLeagues
          .map((league: any) => ({
            id: league.id.toString(),
            name: league.name,
            logo: league.logo,
            country: league.country,
            category: categorizeLeague(league)
          }))
          .sort((a, b) => getLeaguePriority(a) - getLeaguePriority(b));
        
        setLeagues(transformedLeagues);
        console.log('[TopLeaguesFilter] Processed priority leagues:', transformedLeagues.map(l => ({
          id: l.id,
          name: l.name,
          priority: getLeaguePriority(l),
          isPriorityLeague: PRIORITY_LEAGUE_IDS.includes(l.id)
        })));
      } catch (error) {
        console.error('[TopLeaguesFilter] Error fetching leagues:', error);
        setLeagues([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopLeagues();
  }, []);

  // Group leagues by category
  const groupedLeagues = leagues.reduce((acc, league) => {
    if (!acc[league.category]) {
      acc[league.category] = [];
    }
    acc[league.category].push(league);
    return acc;
  }, {} as Record<string, League[]>);

  const handleLeagueClick = (leagueId: string) => {
    console.log(`[TopLeaguesFilter] League clicked: ${leagueId}`);
    
    // Notify parent component if callback provided
    if (onLeagueSelect) {
      onLeagueSelect(leagueId);
    }
    
    // Navigate to league page
    navigate(`/league/${leagueId}`);
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getLeagueIcon = (league: League): JSX.Element => {
    // If we have a logo URL from the API, use it
    if (league.logo) {
      return (
        <div className="w-6 h-6 flex-shrink-0">
          <img 
            src={league.logo} 
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
          <div className="w-6 h-6 bg-gradient-to-br from-gray-500 to-gray-700 rounded-full flex items-center justify-center hidden">
            <span className="text-white text-xs font-bold">
              {league.name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()}
            </span>
          </div>
        </div>
      );
    }

    // Fallback to initials if no logo available
    const initials = league.name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
    
    return (
      <div className="w-6 h-6 bg-gradient-to-br from-gray-500 to-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-white text-xs font-bold">{initials}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/30">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-white font-semibold">Loading Priority Leagues...</span>
          </div>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
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
          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          <span className="text-white font-semibold">Featured Leagues</span>
          <span className="text-gray-400 text-sm">({leagues.length})</span>
        </div>
      </div>
      
      <div className="p-4">
        {leagues.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">No featured leagues available</div>
            <div className="text-gray-500 text-sm">Unable to load priority leagues from API</div>
          </div>
        ) : (
          /* Categories */
          <div className="space-y-3">
            {Object.entries(groupedLeagues).map(([category, categoryLeagues]) => {
              const isExpanded = expandedCategories.has(category);
              const categoryName = getCategoryDisplayName(category);
              const categoryIcon = getCategoryIcon(category);
              
              return (
                <div key={category} className="space-y-2">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-[#121212] rounded-lg hover:bg-[#1a1a1a] transition-colors border border-gray-700/30"
                  >
                    {categoryIcon}
                    <span className="text-gray-300 font-medium flex-1 text-left">{categoryName}</span>
                    <span className="text-gray-500 text-sm">({categoryLeagues.length})</span>
                    <svg 
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Leagues in Category */}
                  {isExpanded && (
                    <div className="ml-4 space-y-1">
                      {categoryLeagues.map((league) => {
                        const isPriorityLeague = PRIORITY_LEAGUE_IDS.includes(league.id);
                        
                        return (
                          <button
                            key={league.id}
                            onClick={() => handleLeagueClick(league.id)}
                            className={`
                              w-full bg-[#0a0a0a] rounded-lg p-3 flex items-center gap-3
                              transition-all duration-200 hover:bg-[#121212] border
                              ${selectedLeagueId === league.id
                                ? 'border-yellow-400/50 ring-1 ring-yellow-400/30 text-white' 
                                : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600/50'
                              }
                              ${isPriorityLeague ? 'ring-1 ring-blue-500/20 border-blue-500/30' : ''}
                            `}
                          >
                            {/* League Icon */}
                            <div className="flex-shrink-0">
                              {getLeagueIcon(league)}
                            </div>
                            
                            {/* League Info */}
                            <div className="flex-1 text-left min-w-0">
                              <div className={`
                                font-medium leading-tight truncate flex items-center gap-2
                                ${selectedLeagueId === league.id ? 'text-white' : 'text-gray-300'}
                              `}>
                                {league.name}
                                {isPriorityLeague && (
                                  <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded font-bold">
                                    FEATURED
                                  </span>
                                )}
                              </div>
                              {league.country && (
                                <div className="text-xs text-gray-500 truncate">
                                  {league.country.name}
                                </div>
                              )}
                            </div>
                            
                            {/* Arrow Icon */}
                            <div className="flex-shrink-0">
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-6 pt-4 border-t border-gray-700/30">
          <p className="text-xs text-gray-500 text-center">
            Showcasing featured leagues and tournaments. Click any league to view detailed information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TopLeaguesFilter; 