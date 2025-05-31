import React from 'react';
import type { Match } from '@/types';
import LiveBadge from './LiveBadge';

interface MatchRowProps {
  match: Match;
}

const MatchRow: React.FC<MatchRowProps> = ({ match }) => {
  // Determine match status from fixture status or fallback to match status
  const fixtureStatus = match.fixture?.status?.short;
  const isLive = fixtureStatus === 'LIVE' || match.status === 'live';
  const isFinished = fixtureStatus === 'FT' || match.status === 'finished';
  const isUpcoming = !isLive && !isFinished;

  // Format kickoff time from fixture date or match date
  const formatKickoffTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      });
    } catch {
      return 'TBD';
    }
  };

  const kickoffTime = formatKickoffTime(match.fixture?.date || match.date);

  // Get match status display
  const getStatusDisplay = () => {
    if (isLive) return 'LIVE';
    if (isFinished) return 'FT';
    return 'KO';
  };

  return (
    <div className="flex items-center justify-between p-4 hover:bg-gray-700/30 transition-colors rounded-lg">
      {/* Kickoff Time */}
      <div className="flex items-center space-x-4 min-w-0 flex-1">
        <div className="text-gray-400 text-sm font-medium min-w-[3rem]">
          {kickoffTime}
        </div>

        {/* Home Team */}
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <img 
            src={match.homeTeam.logo} 
            alt={match.homeTeam.name}
            className="w-6 h-6 object-contain flex-shrink-0"
            loading="lazy"
            onError={(e) => e.currentTarget.src = '/icons/default.svg'}
          />
          <span className="text-white text-sm font-medium truncate">
            {match.homeTeam.name}
          </span>
        </div>

        {/* Score or VS */}
        <div className="flex items-center space-x-2">
          {match.score ? (
            <div className={`px-3 py-1 rounded text-white font-bold text-sm ${
              isLive ? 'bg-red-600' : 'bg-gray-700'
            }`}>
              {match.score.home} - {match.score.away}
            </div>
          ) : (
            <div className="px-3 py-1 text-gray-400 text-sm font-medium">
              vs
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="flex items-center space-x-2 min-w-0 flex-1 justify-end">
          <span className="text-white text-sm font-medium truncate text-right">
            {match.awayTeam.name}
          </span>
          <img 
            src={match.awayTeam.logo} 
            alt={match.awayTeam.name}
            className="w-6 h-6 object-contain flex-shrink-0"
            loading="lazy"
            onError={(e) => e.currentTarget.src = '/icons/default.svg'}
          />
        </div>
      </div>

      {/* Status and Live Badge */}
      <div className="flex items-center space-x-2 ml-4">
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          isLive 
            ? 'text-red-400 bg-red-500/10 border border-red-500/20'
            : isFinished 
            ? 'text-green-400 bg-green-500/10 border border-green-500/20'
            : 'text-blue-400 bg-blue-500/10 border border-blue-500/20'
        }`}>
          {getStatusDisplay()}
        </span>
        {isLive && <LiveBadge />}
      </div>
    </div>
  );
};

export default MatchRow; 