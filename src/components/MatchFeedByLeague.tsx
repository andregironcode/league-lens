import React from 'react';
import { LeagueWithMatches, Match } from '@/types';

interface MatchFeedByLeagueProps {
  leaguesWithMatches: LeagueWithMatches[];
  selectedLeagueId?: string | null;
}

const MatchFeedByLeague: React.FC<MatchFeedByLeagueProps> = ({
  leaguesWithMatches,
  selectedLeagueId
}) => {
  // Filter leagues based on selected league ID
  let filteredLeagues = leaguesWithMatches;
  if (selectedLeagueId) {
    filteredLeagues = leaguesWithMatches.filter(league => league.id === selectedLeagueId);
  }

  // Format match time
  const formatMatchTime = (match: Match): string => {
    if (match.time) {
      return match.time;
    }
    
    if (match.date) {
      const date = new Date(match.date);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
    
    return '--:--';
  };

  // Get match status
  const getMatchStatus = (match: Match): { text: string; className: string } => {
    const status = match.status?.toLowerCase() || match.fixture?.status?.short?.toLowerCase() || '';
    
    if (status === 'live' || status === '1h' || status === '2h' || status === 'ht') {
      return {
        text: 'LIVE',
        className: 'bg-yellow-400 text-black'
      };
    }
    
    if (status === 'finished' || status === 'ft' || status === 'aet' || status === 'pen') {
      return {
        text: 'FT',
        className: 'bg-blue-600 text-white'
      };
    }
    
    return {
      text: 'KO',
      className: 'bg-blue-600 text-white'
    };
  };

  // Get score or VS text
  const getScoreDisplay = (match: Match): string => {
    if (match.score && (match.status === 'finished' || match.status === 'live')) {
      return `${match.score.home} - ${match.score.away}`;
    }
    return 'VS';
  };

  // Truncate team name for mobile
  const truncateTeamName = (name: string, maxLength: number = 12): string => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength - 1) + '…';
  };

  if (filteredLeagues.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No matches found</h3>
        <p className="text-gray-400">
          No matches available for the selected criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {filteredLeagues.map((league) => (
        <div key={league.id} className="bg-[#1a1a1a] rounded-lg sm:rounded-xl overflow-hidden">
          {/* League Header */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-700/30">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              {/* Country Flag */}
              {league.country?.code && (
                <img
                  src={`https://flagsapi.com/${league.country.code}/flat/24.png`}
                  alt={league.country.name || 'Country flag'}
                  className="w-5 h-5 sm:w-6 sm:h-6 object-contain rounded-sm flex-shrink-0"
                  onError={(e) => e.currentTarget.src = '/icons/default-flag.svg'}
                />
              )}
              
              {/* Country Name - Hidden on mobile */}
              {league.country?.name && (
                <span className="text-gray-300 text-xs sm:text-sm font-medium hidden sm:inline">
                  {league.country.name}
                </span>
              )}
              
              {/* League Name */}
              <span className="text-white text-sm sm:text-lg font-semibold truncate">
                {league.name}
              </span>
            </div>
            
            {/* Match Count */}
            <div className="text-gray-400 text-xs sm:text-sm flex-shrink-0">
              {league.matches.length} {league.matches.length === 1 ? 'match' : 'matches'}
            </div>
          </div>
          
          {/* Match List */}
          <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
            {league.matches.map((match) => {
              const status = getMatchStatus(match);
              const scoreDisplay = getScoreDisplay(match);
              
              return (
                <div 
                  key={match.id}
                  className="bg-[#121212] rounded-md px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm hover:bg-[#1a1a1a] transition-colors cursor-pointer touch-manipulation"
                >
                  {/* Mobile Layout */}
                  <div className="sm:hidden">
                    {/* Top Row - Time and Status */}
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-400">
                        {formatMatchTime(match)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${status.className}`}>
                        {status.text}
                      </span>
                    </div>
                    
                    {/* Middle Row - Teams and Score */}
                    <div className="flex items-center justify-between">
                      {/* Home Team */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <img 
                          src={match.homeTeam.logo} 
                          alt={match.homeTeam.name}
                          className="w-5 h-5 object-contain flex-shrink-0"
                          onError={(e) => e.currentTarget.src = '/icons/default.svg'}
                        />
                        <span className="text-xs text-white font-medium truncate">
                          {truncateTeamName(match.homeTeam.name, 10)}
                        </span>
                      </div>
                      
                      {/* Score */}
                      <div className="text-white text-sm font-bold px-3">
                        {scoreDisplay}
                      </div>
                      
                      {/* Away Team */}
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className="text-xs text-white font-medium truncate">
                          {truncateTeamName(match.awayTeam.name, 10)}
                        </span>
                        <img 
                          src={match.awayTeam.logo} 
                          alt={match.awayTeam.name}
                          className="w-5 h-5 object-contain flex-shrink-0"
                          onError={(e) => e.currentTarget.src = '/icons/default.svg'}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:flex justify-between items-center">
                    {/* Left Side - Time and Home Team */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-sm text-gray-400 min-w-[50px]">
                        {formatMatchTime(match)}
                      </span>
                      <img 
                        src={match.homeTeam.logo} 
                        alt={match.homeTeam.name}
                        className="w-6 h-6 object-contain flex-shrink-0"
                        onError={(e) => e.currentTarget.src = '/icons/default.svg'}
                      />
                      <span className="text-sm text-white font-medium truncate">
                        {match.homeTeam.name}
                      </span>
                    </div>
                    
                    {/* Center - Score or VS */}
                    <div className="text-white text-lg font-bold px-4">
                      {scoreDisplay}
                    </div>
                    
                    {/* Right Side - Away Team and Status */}
                    <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
                      <span className="text-sm text-white font-medium truncate">
                        {match.awayTeam.name}
                      </span>
                      <img 
                        src={match.awayTeam.logo} 
                        alt={match.awayTeam.name}
                        className="w-6 h-6 object-contain flex-shrink-0"
                        onError={(e) => e.currentTarget.src = '/icons/default.svg'}
                      />
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${status.className}`}>
                        {status.text}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MatchFeedByLeague; 