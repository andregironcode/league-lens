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

// Helper function to get category display name
const getCategoryDisplayName = (category: string): string => {
  switch (category) {
    case 'international-club':
      return 'International Club';
    case 'domestic':
      return 'Top Domestic Leagues';
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
  
  // International club competitions
  if (name.includes('champions league') || 
      name.includes('europa league') || 
      name.includes('libertadores') ||
      name.includes('copa libertadores') ||
      name.includes('conference league')) {
    return 'international-club';
  }
  
  // International tournaments (national teams)
  if (name.includes('world cup') || 
      name.includes('euro') ||
      name.includes('copa américa') ||
      name.includes('copa america') ||
      name.includes('asian cup') ||
      name.includes('afcon') ||
      name.includes('africa cup')) {
    return 'international-tournament';
  }
  
  // Default to domestic leagues
  return 'domestic';
};

// Helper function to get league priority for sorting
const getLeaguePriority = (league: any): number => {
  const name = league.name.toLowerCase();
  
  // International competitions (highest priority)
  if (name.includes('champions league')) return 1;
  if (name.includes('europa league')) return 2;
  if (name.includes('libertadores')) return 3;
  
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

  // Fetch top leagues from API
  useEffect(() => {
    const fetchTopLeagues = async () => {
      try {
        setLoading(true);
        console.log('[TopLeaguesFilter] Fetching leagues from API...');
        
        const response = await highlightlyClient.getLeagues({
          limit: '50' // Get more leagues to filter from
        });
        
        if (response.data && Array.isArray(response.data)) {
          console.log(`[TopLeaguesFilter] Found ${response.data.length} leagues from API`);
          
          // Transform API leagues to our format with categorization
          const transformedLeagues: League[] = response.data
            .map((league: any) => ({
              id: league.id.toString(),
              name: league.name,
              logo: league.logo,
              country: league.country,
              category: categorizeLeague(league)
            }))
            .sort((a, b) => getLeaguePriority(a) - getLeaguePriority(b))
            .slice(0, 15); // Limit to top 15 leagues
          
          setLeagues(transformedLeagues);
          console.log('[TopLeaguesFilter] Processed leagues:', transformedLeagues.map(l => l.name));
        } else {
          console.warn('[TopLeaguesFilter] No leagues data found in API response');
          setLeagues([]);
        }
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
            <span className="text-white font-semibold">Loading Leagues...</span>
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
          <span className="text-white font-semibold">Top Leagues</span>
          <span className="text-gray-400 text-sm">({leagues.length})</span>
        </div>
      </div>
      
      <div className="p-4">
        {leagues.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">No leagues available</div>
            <div className="text-gray-500 text-sm">Unable to load leagues from API</div>
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
                      {categoryLeagues.map((league) => (
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
                          `}
                        >
                          {/* League Icon */}
                          <div className="flex-shrink-0">
                            {getLeagueIcon(league)}
                          </div>
                          
                          {/* League Info */}
                          <div className="flex-1 text-left min-w-0">
                            <div className={`
                              font-medium leading-tight truncate
                              ${selectedLeagueId === league.id ? 'text-white' : 'text-gray-300'}
                            `}>
                              {league.name}
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
                      ))}
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
            Click any league to view detailed information, standings, and recent matches
          </p>
        </div>
      </div>
    </div>
  );
};

export default TopLeaguesFilter; 