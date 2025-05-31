import React from 'react';
import type { LeagueWithMatches } from '@/types';
import MatchRow from './MatchRow';

interface LeagueCardProps {
  league: LeagueWithMatches;
}

const LeagueCard: React.FC<LeagueCardProps> = ({ league }) => {
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

  return (
    <div className="bg-[#1a1a1a] rounded-lg overflow-hidden border border-gray-700/30">
      {/* League Header */}
      <div className="p-6 border-b border-gray-700/30">
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
          </div>
          
          {/* Match Count */}
          <div className="text-right">
            <div className="text-sm font-medium text-white">
              {league.matches.length}
            </div>
            <div className="text-xs text-gray-400">
              {league.matches.length === 1 ? 'match' : 'matches'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Matches List */}
      <div className="divide-y divide-gray-700/30">
        {league.matches.map((match) => (
          <MatchRow key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
};

export default LeagueCard; 