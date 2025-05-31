import React from 'react';
import type { LeagueWithMatches } from '@/types';
import MatchRow from './MatchRow';

interface LeagueCardProps {
  league: LeagueWithMatches;
}

const LeagueCard: React.FC<LeagueCardProps> = ({ league }) => {
  // Helper function to get country flag URL
  const getCountryFlagUrl = (countryCode?: string): string => {
    if (!countryCode) return '/icons/default.svg';
    return `https://flagsapi.com/${countryCode}/flat/24.png`;
  };

  // Helper function to get league logo with fallbacks
  const getLeagueLogoUrl = (leagueLogo?: string, leagueId?: string): string => {
    if (leagueLogo && leagueLogo.length > 0) {
      return leagueLogo;
    }
    if (leagueId) {
      return `https://cdn.site.com/leagues/${leagueId}.png`;
    }
    return '/icons/default.svg';
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg overflow-hidden border border-gray-700/30">
      {/* League Header */}
      <div className="p-6 border-b border-gray-700/30">
        <div className="flex items-center space-x-4">
          {/* Country Flag */}
          <img 
            src={getCountryFlagUrl(league.country?.code)}
            alt={league.country?.name || 'Country'}
            className="w-6 h-6 object-contain flex-shrink-0"
            loading="lazy"
            onError={(e) => e.currentTarget.src = '/icons/default.svg'}
          />
          
          {/* League Logo */}
          <img 
            src={getLeagueLogoUrl(league.logo, league.id)}
            alt={league.name}
            className="w-6 h-6 object-contain flex-shrink-0"
            loading="lazy"
            onError={(e) => {
              const target = e.currentTarget;
              // Try fallback URL if not already using it
              if (target.src !== `https://cdn.site.com/leagues/${league.id}.png`) {
                target.src = `https://cdn.site.com/leagues/${league.id}.png`;
              } else {
                target.src = '/icons/default.svg';
              }
            }}
          />
          
          {/* League Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate">
              {league.name}
            </h3>
            {league.country?.name && (
              <p className="text-sm text-gray-400 truncate">
                {league.country.name}
              </p>
            )}
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