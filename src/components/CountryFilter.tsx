import React, { useState, useEffect } from 'react';
import { highlightlyClient } from '@/integrations/highlightly/client';

interface Country {
  code: string;
  name: string;
  flag?: string;
  leagueCount?: number;
}

interface League {
  id: string;
  name: string;
  logo?: string;
  season?: string;
}

interface CountryFilterProps {
  selectedCountryCode: string | null;
  onCountrySelect: (countryCode: string | null) => void;
  onCountriesLoaded?: (countries: Country[]) => void;
}

// Pre-defined list of major countries and their leagues for faster initial load
const MAJOR_COUNTRIES: Country[] = [
  { code: 'GB', name: 'England', leagueCount: 4 },
  { code: 'ES', name: 'Spain', leagueCount: 2 },
  { code: 'IT', name: 'Italy', leagueCount: 2 },
  { code: 'DE', name: 'Germany', leagueCount: 2 },
  { code: 'FR', name: 'France', leagueCount: 2 },
  { code: 'EU', name: 'UEFA', leagueCount: 3 },
  { code: 'US', name: 'United States', leagueCount: 1 },
  { code: 'BR', name: 'Brazil', leagueCount: 2 },
  { code: 'AR', name: 'Argentina', leagueCount: 2 },
  { code: 'PT', name: 'Portugal', leagueCount: 1 },
  { code: 'NL', name: 'Netherlands', leagueCount: 1 },
  { code: 'SA', name: 'Saudi Arabia', leagueCount: 1 },
];

// Pre-defined leagues for major countries for faster initial load
const MAJOR_LEAGUES: Record<string, League[]> = {
  'GB': [
    { id: '33973', name: 'Premier League' },
    { id: '40', name: 'Championship' },
    { id: '41', name: 'League One' },
    { id: '42', name: 'League Two' }
  ],
  'ES': [
    { id: '119924', name: 'La Liga' },
    { id: '141', name: 'Segunda División' }
  ],
  'IT': [
    { id: '115669', name: 'Serie A' },
    { id: '136', name: 'Serie B' }
  ],
  'DE': [
    { id: '67162', name: 'Bundesliga' },
    { id: '80', name: '2. Bundesliga' }
  ],
  'FR': [
    { id: '52695', name: 'Ligue 1' },
    { id: '62', name: 'Ligue 2' }
  ],
  'EU': [
    { id: '2486', name: 'UEFA Champions League' },
    { id: '3', name: 'UEFA Europa League' },
    { id: '848', name: 'UEFA Conference League' }
  ],
  'US': [
    { id: '253', name: 'Major League Soccer' }
  ],
  'BR': [
    { id: '71', name: 'Série A' },
    { id: '72', name: 'Série B' }
  ],
  'AR': [
    { id: '128', name: 'Primera División' },
    { id: '129', name: 'Primera B Nacional' }
  ],
  'PT': [
    { id: '94', name: 'Liga Portugal' }
  ],
  'NL': [
    { id: '88', name: 'Eredivisie' }
  ],
  'SA': [
    { id: '307', name: 'Saudi Pro League' }
  ]
};

const CountryFilter: React.FC<CountryFilterProps> = ({
  selectedCountryCode,
  onCountrySelect,
  onCountriesLoaded
}) => {
  const [countries, setCountries] = useState<Country[]>(MAJOR_COUNTRIES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [initialDisplayCount] = useState(10);
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
  const [countryLeagues, setCountryLeagues] = useState<Map<string, League[]>>(new Map(Object.entries(MAJOR_LEAGUES)));
  const [loadingLeagues, setLoadingLeagues] = useState<Set<string>>(new Set());

  // Filter countries based on search query
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Determine how many countries to show
  const displayedCountries = showAll ? filteredCountries : filteredCountries.slice(0, initialDisplayCount);
  const hasMoreCountries = filteredCountries.length > initialDisplayCount;

  // Load additional countries in the background
  useEffect(() => {
    let isMounted = true;
    
    const loadAdditionalCountries = async () => {
      try {
        setLoading(true);
        
        const response = await highlightlyClient.getLeagues({
          limit: '100'
        });
        
        if (!isMounted) return;
        
        let leaguesArray: any[] = [];
        if (Array.isArray(response)) {
          leaguesArray = response;
        } else if (response.data && Array.isArray(response.data)) {
          leaguesArray = response.data;
        }
        
        const countryMap = new Map<string, Country>();
        
        // Add pre-defined countries first
        MAJOR_COUNTRIES.forEach(country => {
          countryMap.set(country.code, country);
        });
        
        // Add additional countries from API
        leaguesArray.forEach((league: any) => {
          if (league.country && league.country.code && league.country.name) {
            const countryCode = league.country.code;
            
            if (!countryMap.has(countryCode)) {
              countryMap.set(countryCode, {
                code: countryCode,
                name: league.country.name,
                flag: league.country.logo,
                leagueCount: 1
              });
            }
          }
        });
        
        const allCountries = Array.from(countryMap.values())
          .sort((a, b) => {
            // Sort major countries first, then alphabetically
            const aIsMajor = MAJOR_COUNTRIES.some(c => c.code === a.code);
            const bIsMajor = MAJOR_COUNTRIES.some(c => c.code === b.code);
            if (aIsMajor && !bIsMajor) return -1;
            if (!aIsMajor && bIsMajor) return 1;
            return a.name.localeCompare(b.name);
          });
        
        setCountries(allCountries);
        
        if (onCountriesLoaded) {
          onCountriesLoaded(allCountries);
        }
        
      } catch (err) {
        console.error('[CountryFilter] Error loading additional countries:', err);
        setError('Failed to load all countries');
      } finally {
        setLoading(false);
      }
    };
    
    loadAdditionalCountries();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCountryClick = async (countryCode: string) => {
    const isExpanded = expandedCountries.has(countryCode);
    
    if (isExpanded) {
      // Collapse the country
      const newExpanded = new Set(expandedCountries);
      newExpanded.delete(countryCode);
      setExpandedCountries(newExpanded);
    } else {
      // Expand the country
      const newExpanded = new Set(expandedCountries);
      newExpanded.add(countryCode);
      setExpandedCountries(newExpanded);
      
      // Fetch additional leagues for this country if not in pre-defined list
      if (!MAJOR_LEAGUES[countryCode] && !countryLeagues.has(countryCode)) {
        await fetchLeaguesForCountry(countryCode);
      }
    }
  };

  const fetchLeaguesForCountry = async (countryCode: string) => {
    try {
      setLoadingLeagues(prev => new Set(prev).add(countryCode));
      
      const response = await highlightlyClient.getLeagues({
        countryCode: countryCode,
        limit: '50'
      });
      
      let leaguesArray: any[] = [];
      if (Array.isArray(response)) {
        leaguesArray = response;
      } else if (response.data && Array.isArray(response.data)) {
        leaguesArray = response.data;
      }
      
      const leagues: League[] = leaguesArray.map(league => ({
        id: league.id,
        name: league.name,
        logo: league.logo,
        season: league.season
      }));
      
      setCountryLeagues(prev => new Map(prev).set(countryCode, leagues));
      
    } catch (err) {
      console.error(`[CountryFilter] Error fetching leagues for ${countryCode}:`, err);
      setCountryLeagues(prev => new Map(prev).set(countryCode, []));
    } finally {
      setLoadingLeagues(prev => {
        const newSet = new Set(prev);
        newSet.delete(countryCode);
        return newSet;
      });
    }
  };

  const handleLeagueClick = (leagueId: string, leagueName: string) => {
    window.open(`/league/${leagueId}`, '_blank');
  };

  const handleClearFilter = () => {
    onCountrySelect(null);
    setExpandedCountries(new Set());
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowAll(false);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setShowAll(false);
  };

  const handleToggleShowAll = () => {
    setShowAll(!showAll);
  };

  const getCountryFlag = (country: Country): string => {
    if (country.flag) {
      return country.flag;
    }
    
    // Use a CDN for country flags
    return `https://flagcdn.com/${country.code.toLowerCase()}.svg`;
  };

  const renderFlag = (country: Country) => {
    return (
      <img
        src={getCountryFlag(country)}
        alt={`${country.name} flag`}
        className="w-6 h-6 rounded-full object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = "/icons/default-flag.svg";
        }}
      />
    );
  };

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/30">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-white font-semibold">Countries</span>
          </div>
        </div>
        
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-3"></div>
          <p className="text-gray-400">Finding countries with football leagues...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/30">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-white font-semibold">Countries</span>
          </div>
        </div>
        
        <div className="p-6 text-center">
          <p className="text-red-400">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/30">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-white font-semibold">Countries</span>
          <span className="text-gray-400 text-sm">({countries.length})</span>
        </div>
      </div>
      
      <div className="p-4">
        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search countries..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-10 py-2 bg-[#121212] border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Countries List */}
        {filteredCountries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No countries found matching "{searchQuery}"</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {displayedCountries.map((country) => {
                const isExpanded = expandedCountries.has(country.code);
                const leagues = countryLeagues.get(country.code) || [];
                const isLoadingLeagues = loadingLeagues.has(country.code);
                
                return (
                  <div key={country.code} className="space-y-1">
                    {/* Country Button */}
                    <button
                      onClick={() => handleCountryClick(country.code)}
                      className={`
                        w-full bg-[#121212] rounded-lg p-3 flex items-center gap-3
                        transition-all duration-200 hover:bg-[#1a1a1a] border
                        ${isExpanded 
                          ? 'border-yellow-400/50 ring-1 ring-yellow-400/30 text-white' 
                          : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600/50'
                        }
                      `}
                    >
                      {/* Country Flag */}
                      <div className="flex-shrink-0 flex items-center justify-center">
                        {renderFlag(country)}
                      </div>
                      
                      {/* Country Info */}
                      <div className="flex-1 text-left min-w-0">
                        <div className={`
                          font-medium leading-tight truncate
                          ${isExpanded ? 'text-white' : 'text-gray-300'}
                        `}>
                          {country.name}
                        </div>
                        
                        {country.leagueCount && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {country.leagueCount} league{country.leagueCount !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                      
                      {/* Expand/Collapse Indicator */}
                      <div className="flex-shrink-0 flex items-center gap-2">
                        {isLoadingLeagues && (
                          <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-600 border-t-yellow-400"></div>
                        )}
                        <svg 
                          className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {/* Leagues Dropdown */}
                    {isExpanded && (
                      <div className="ml-4 space-y-1 overflow-hidden">
                        <div className={`transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                          {isLoadingLeagues ? (
                            <div className="bg-[#0a0a0a] rounded-lg p-3 text-center">
                              <div className="flex items-center justify-center gap-2 text-gray-400">
                                <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-600 border-t-yellow-400"></div>
                                <span className="text-sm">Loading leagues...</span>
                              </div>
                            </div>
                          ) : leagues.length === 0 ? (
                            <div className="bg-[#0a0a0a] rounded-lg p-3 text-center">
                              <p className="text-gray-500 text-sm">No leagues found for this country</p>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {leagues.map((league) => (
                                <button
                                  key={league.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleLeagueClick(league.id, league.name);
                                  }}
                                  className="w-full bg-[#0a0a0a] rounded-lg p-3 flex items-center gap-3 transition-all duration-200 hover:bg-[#151515] border border-transparent hover:border-gray-700/50 text-gray-300 hover:text-white group"
                                >
                                  {/* League Logo */}
                                  <div className="flex-shrink-0 flex items-center justify-center">
                                    {league.logo ? (
                                      <img 
                                        src={league.logo} 
                                        alt={`${league.name} logo`}
                                        className="w-6 h-6 object-contain rounded"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center">
                                        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* League Info */}
                                  <div className="flex-1 text-left min-w-0">
                                    <div className="font-medium leading-tight truncate group-hover:text-white">
                                      {league.name}
                                    </div>
                                    {league.season && (
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        Season: {league.season}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Navigation Arrow */}
                                  <div className="flex-shrink-0">
                                    <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* See More Button */}
            {hasMoreCountries && !searchQuery && (
              <div className="mt-4 pt-3 border-t border-gray-700/30">
                <button
                  onClick={handleToggleShowAll}
                  className="w-full bg-[#121212] rounded-lg p-3 flex items-center justify-center gap-2 transition-all duration-200 hover:bg-[#1a1a1a] border border-transparent hover:border-gray-600/50 text-gray-400 hover:text-white"
                >
                  <span className="font-medium">
                    {showAll ? 'Show Less' : `See ${filteredCountries.length - initialDisplayCount} More Countries`}
                  </span>
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${showAll ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            )}

            {/* Search Results Summary */}
            {searchQuery && (
              <div className="mt-3 pt-3 border-t border-gray-700/30 text-center">
                <p className="text-xs text-gray-500">
                  {filteredCountries.length} of {countries.length} countries match "{searchQuery}"
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CountryFilter; 