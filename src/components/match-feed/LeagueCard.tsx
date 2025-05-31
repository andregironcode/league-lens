import React, { useState } from 'react';
import type { LeagueWithMatches } from '@/types';
import MatchRow from './MatchRow';

interface LeagueCardProps {
  league: LeagueWithMatches;
  defaultExpanded?: boolean;
}

const LeagueCard: React.FC<LeagueCardProps> = ({ league, defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Enhanced country flag function - always returns a valid flag
  const getCountryFlagUrl = (countryCode?: string, countryName?: string): string => {
    if (!countryCode) {
      // Generate a text-based flag if no country code
      const initials = countryName ? countryName.slice(0, 2).toUpperCase() : '??';
      return `data:image/svg+xml,${encodeURIComponent(`
        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" fill="#1f2937" rx="3"/>
          <text x="12" y="15" font-family="Arial, sans-serif" font-size="8" font-weight="bold" text-anchor="middle" fill="#9ca3af">
            ${initials}
          </text>
        </svg>
      `)}`;
    }
    // Use reliable flag API
    return `https://flagsapi.com/${countryCode.toUpperCase()}/flat/24.png`;
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
            <img
              src={getCountryFlagUrl(league.country?.code, league.country?.name)}
              alt={league.country?.name || 'Country flag'}
              className="w-5 h-5 object-contain rounded-sm"
            />
            {league.country?.name && (
              <span className="text-gray-300 text-sm font-medium">{league.country.name}</span>
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
              <div className="text-xs text-gray-400">
                {league.matches.length === 1 ? 'match' : 'matches'}
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