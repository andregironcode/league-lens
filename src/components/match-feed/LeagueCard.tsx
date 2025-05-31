import React, { useState } from 'react';
import type { LeagueWithMatches } from '@/types';
import MatchRow from './MatchRow';

interface LeagueCardProps {
  league: LeagueWithMatches;
  defaultExpanded?: boolean;
  onCountrySelect?: (countryCode: string | null) => void;
}

// League country mapping (same as in MatchFeedByLeague)
const LEAGUE_COUNTRY_MAPPING: Record<string, string> = {
  // UEFA Competitions
  '2486': 'EU', '2': 'EU', '3337': 'EU', '3': 'EU',
  
  // Major domestic leagues
  '39': 'GB', // Premier League
  '140': 'ES', // La Liga
  '135': 'IT', // Serie A
  '78': 'DE', // Bundesliga
  '61': 'FR', // Ligue 1
  '216087': 'US', '253': 'US', // MLS
  '94': 'PT', // Liga Portugal
  '307': 'SA', // Saudi Pro League
  '88': 'NL', // Eredivisie
  '71': 'BR', // Série A Brasil
  '128': 'AR', // Primera División Argentina
  '1': 'WORLD', // FIFA World Cup
};

// Country name mapping
const COUNTRY_NAMES: Record<string, string> = {
  'EU': 'Europe',
  'WORLD': 'International',
  'GB': 'England',
  'ES': 'Spain',
  'IT': 'Italy',
  'DE': 'Germany',
  'FR': 'France',
  'US': 'United States',
  'PT': 'Portugal',
  'SA': 'Saudi Arabia',
  'NL': 'Netherlands',
  'BR': 'Brazil',
  'AR': 'Argentina',
};

const LeagueCard: React.FC<LeagueCardProps> = ({ league, defaultExpanded = false, onCountrySelect }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Get country info for the league
  const getLeagueCountryInfo = () => {
    const countryCode = LEAGUE_COUNTRY_MAPPING[league.id];
    const countryName = countryCode ? COUNTRY_NAMES[countryCode] : null;
    
    return {
      code: countryCode,
      name: countryName
    };
  };

  // Enhanced country flag function - always returns a valid flag
  const getCountryFlagUrl = (countryCode?: string): string => {
    if (!countryCode) {
      return `data:image/svg+xml,${encodeURIComponent(`
        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" fill="#1f2937" rx="3"/>
          <text x="12" y="15" font-family="Arial, sans-serif" font-size="8" font-weight="bold" text-anchor="middle" fill="#9ca3af">
            ??
          </text>
        </svg>
      `)}`;
    }
    
    const code = countryCode.toUpperCase();
    
    // Handle special cases
    if (code === 'EU') return 'https://flagcdn.com/w40/eu.png';
    if (code === 'WORLD') return 'https://flagcdn.com/w40/un.png';
    if (code === 'GB' || code === 'EN' || code === 'UK') return 'https://flagcdn.com/w40/gb.png';
    
    // Standard country codes
    return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
  };

  // Helper function to get league logo with proper scoresite CDN fallbacks
  const getLeagueLogoUrl = (leagueLogo?: string, leagueId?: string): string => {
    if (leagueLogo && leagueLogo.length > 0) {
      return leagueLogo;
    }
    if (leagueId) {
      return `https://cdn.scoresite.com/logos/leagues/${leagueId}.png`;
    }
    return '/icons/default.svg';
  };

  // Calculate match statistics
  const liveMatches = league.matches.filter(m => 
    m.fixture?.status?.short === 'LIVE' || m.status === 'live'
  ).length;
  const upcomingMatches = league.matches.filter(m => 
    m.fixture?.status?.short === 'NS' || m.status === 'upcoming'
  ).length;
  const finishedMatches = league.matches.filter(m => 
    m.fixture?.status?.short === 'FT' || m.status === 'finished'
  ).length;

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleCountryClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent expanding/collapsing the league
    const countryInfo = getLeagueCountryInfo();
    if (countryInfo.code && onCountrySelect) {
      onCountrySelect(countryInfo.code);
    }
  };

  const countryInfo = getLeagueCountryInfo();

  return (
    <div className="bg-[#1a1a1a] rounded-lg overflow-hidden border border-gray-700/30">
      {/* League Header - Clickable to toggle */}
      <button
        onClick={toggleExpanded}
        className="w-full p-6 border-b border-gray-700/30 hover:bg-gray-800/30 transition-colors text-left"
      >
        <div className="flex items-center justify-between">
          {/* Country Flag + Country Name + League Name */}
          <div className="flex items-center gap-2 px-4 py-1">
            {countryInfo.code && (
              <button
                onClick={handleCountryClick}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                title={`Filter by ${countryInfo.name}`}
              >
                <img
                  src={getCountryFlagUrl(countryInfo.code)}
                  alt={`${countryInfo.name} flag`}
                  className="w-5 h-5 object-cover rounded-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://flagcdn.com/w40/un.png'; // Fallback to UN flag
                  }}
                />
                {countryInfo.name && (
                  <span className="text-gray-300 text-sm font-medium">{countryInfo.name}</span>
                )}
              </button>
            )}
            <span className="text-white text-sm font-semibold">— {league.name}</span>
            
            {/* Match status indicators */}
            <div className="flex items-center gap-2 ml-4">
              {liveMatches > 0 && (
                <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full font-bold">
                  {liveMatches} LIVE
                </span>
              )}
              {upcomingMatches > 0 && (
                <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                  {upcomingMatches} upcoming
                </span>
              )}
              {finishedMatches > 0 && (
                <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                  {finishedMatches} finished
                </span>
              )}
            </div>
          </div>
          
          {/* Match Count and Expand/Collapse Icon */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-white">
                {league.matches.length}
              </div>
            </div>
            
            {/* Expand/Collapse Icon */}
            <div className="text-gray-400">
              <svg 
                className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
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
};

export default LeagueCard; 