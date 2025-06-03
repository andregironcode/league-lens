import React, { useState, useRef, useLayoutEffect } from 'react';
import type { LeagueWithMatches } from '@/types';
import { getLeagueCountryInfo, getCountryFlagUrl, getLeagueLogo } from './utils';

interface LeagueCountryFilterProps {
  leaguesWithMatches: LeagueWithMatches[];
  selectedLeagueIds: string[];
  onLeagueSelect?: (leagueIds: string[]) => void;
  selectedCountryCode?: string | null;
}

const LeagueCountryFilter: React.FC<LeagueCountryFilterProps> = React.memo(({ 
  leaguesWithMatches, 
  selectedLeagueIds, 
  onLeagueSelect, 
  selectedCountryCode 
}) => {
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
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
  }, [selectedCountryCode, expandedCountries]);

  // Group leagues by country using the mapping
  const countriesMap = new Map();
  leaguesWithMatches.forEach(league => {
    if (league.matches && league.matches.length > 0) {
      const countryInfo = getLeagueCountryInfo(league.id);
      
      if (!countryInfo.code || !countryInfo.name) return;
      
      const liveMatchCount = league.matches.filter(m => 
        m.fixture?.status?.short === 'LIVE' || m.status === 'live'
      ).length;
      
      if (!countriesMap.has(countryInfo.code)) {
        countriesMap.set(countryInfo.code, {
          code: countryInfo.code,
          name: countryInfo.name,
          flagUrl: getCountryFlagUrl(countryInfo.code),
          leagues: [],
          totalMatches: 0,
          totalLiveMatches: 0,
          hasLiveMatches: false
        });
      }
      
      const country = countriesMap.get(countryInfo.code);
      country.leagues.push({
        id: league.id,
        name: league.name,
        logoUrl: getLeagueLogo(league.id, league.name, league.logo),
        matchCount: league.matches.length,
        liveMatchCount: liveMatchCount,
        hasLiveMatches: liveMatchCount > 0
      });
      country.totalMatches += league.matches.length;
      country.totalLiveMatches += liveMatchCount;
      country.hasLiveMatches = country.hasLiveMatches || liveMatchCount > 0;
    }
  });

  // Sort countries by priority: live matches first, then by total matches
  const sortedCountries = Array.from(countriesMap.values()).sort((a, b) => {
    if (a.hasLiveMatches && !b.hasLiveMatches) return -1;
    if (!a.hasLiveMatches && b.hasLiveMatches) return 1;
    return b.totalMatches - a.totalMatches;
  });

  const toggleCountryExpansion = (countryCode: string) => {
    // Save scroll position before the DOM changes
    saveScrollPosition();
    
    const newExpanded = new Set(expandedCountries);
    if (newExpanded.has(countryCode)) {
      newExpanded.delete(countryCode);
    } else {
      newExpanded.add(countryCode);
    }
    setExpandedCountries(newExpanded);
  };

  const handleLeagueClick = (leagueId: string) => {
    if (!onLeagueSelect) return;
    
    // If clicking the same league, reset the filter
    if (selectedLeagueIds.includes(leagueId)) {
      onLeagueSelect(selectedLeagueIds.filter(id => id !== leagueId));
    } else {
      onLeagueSelect([...selectedLeagueIds, leagueId]);
    }
  };

  return (
    <div className="sticky top-6">
      <div className="mb-4 text-center">
        <h3 className="text-lg font-semibold text-white mb-2">By Country</h3>
      </div>
      
      <div className="space-y-2 max-h-96 overflow-y-auto" ref={scrollRef}>
        {sortedCountries.length > 0 ? (
          sortedCountries.map((country) => {
            const isExpanded = expandedCountries.has(country.code);
            
            return (
              <div key={country.code} className="border border-gray-700/30 rounded-lg overflow-hidden">
                {/* Country Header - Clickable to expand/collapse */}
                <button
                  onClick={() => toggleCountryExpansion(country.code)}
                  className="w-full flex items-center gap-3 px-3 py-2 bg-black/30 hover:bg-white/10 backdrop-blur-sm transition-colors text-left focus:outline-none rounded-lg border border-white/10"
                >
                  <img
                    src={country.flagUrl}
                    alt={`${country.name} flag`}
                    className="w-5 h-5 object-cover rounded-full"
                    style={{ minWidth: '20px', minHeight: '20px' }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/icons/default-flag.svg'; // Fallback to local default flag
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{country.name}</div>
                    <div className="text-xs text-gray-400">
                      {country.totalMatches} {country.totalMatches === 1 ? 'match' : 'matches'}
                      {country.hasLiveMatches && (
                        <span className="ml-2 px-1.5 py-0.5 bg-yellow-500 text-black text-xs rounded font-bold">
                          {country.totalLiveMatches} LIVE
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                    <svg 
                      className="w-full h-full text-gray-400"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {country.hasLiveMatches && (
                    <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0 animate-pulse"></div>
                  )}
                </button>
                
                {/* Leagues List - Collapsible */}
                {isExpanded && (
                  <div className="divide-y divide-white/10 bg-black/20 backdrop-blur-sm rounded-lg mt-2 border border-white/10">
                    {country.leagues.map((league) => {
                      const isSelected = selectedLeagueIds.includes(league.id);
                      
                      return (
                        <button
                          key={league.id}
                          onClick={() => handleLeagueClick(league.id)}
                          className={`
                            w-full flex items-center gap-3 px-6 py-2 text-left transition-colors focus:outline-none backdrop-blur-sm
                            ${isSelected 
                              ? 'bg-[#FFC30B] text-black' 
                              : 'hover:bg-white/10 text-gray-300'
                            }
                          `}
                        >
                          <img
                            src={league.logoUrl}
                            alt={league.name}
                            className="w-4 h-4 object-contain rounded-full bg-white p-0.5"
                            style={{ minWidth: '16px', minHeight: '16px' }}
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
                    })}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center text-gray-500 py-4">
            <p className="text-sm">No countries available</p>
          </div>
        )}
      </div>
    </div>
  );
});

LeagueCountryFilter.displayName = 'LeagueCountryFilter';

export default LeagueCountryFilter; 