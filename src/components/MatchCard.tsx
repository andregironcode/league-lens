import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Match } from '@/types';

// This helper should be moved to a more appropriate location if used elsewhere
const getMatchScore = (match: any) => {
  if (match.state?.score?.current) {
    const [home, away] = match.state.score.current.split('-').map((s: string) => parseInt(s.trim(), 10));
    return { home: isNaN(home) ? 0 : home, away: isNaN(away) ? 0 : away };
  }
  if (match.score && typeof match.score === 'object') {
    if (match.score.fulltime) {
      const [home, away] = match.score.fulltime.split('-').map((s: string) => parseInt(s.trim(), 10));
      return { home: isNaN(home) ? 0 : home, away: isNaN(away) ? 0 : away };
    }
    if (typeof match.score.home === 'number' && typeof match.score.away === 'number') {
      return { home: match.score.home || 0, away: match.score.away || 0 };
    }
  }
  return { home: 0, away: 0 };
};

interface MatchCardProps {
  match: Match;
  showDate?: boolean;
  datePosition?: 'top' | 'bottom';
}

const MatchCard: React.FC<MatchCardProps> = ({ match, showDate = true, datePosition = 'top' }) => {
  const navigate = useNavigate();
  const getStatusString = (status: any): string => {
    if (typeof status === 'string') return status.toLowerCase();
    if (typeof status === 'object' && status !== null) return status.long?.toLowerCase() || status.short?.toLowerCase() || '';
    return '';
  };

  const statusString = getStatusString(match.status);
  // Get status description from state object (Highlightly API format)
  let stateDescription = '';
  
  // Check for state.description (latest API format)
  if (match.state?.description) {
    stateDescription = match.state.description.toLowerCase();
  }
  // Fallback to older formats if needed
  else if (match.status && typeof match.status === 'object' && 'description' in match.status) {
    stateDescription = (match.status.description as string)?.toLowerCase() || '';
  }
  
  const isFinished = 
    stateDescription.includes('finished') || 
    stateDescription.includes('full time') || 
    stateDescription.includes('ft') || 
    statusString.includes('finished') || 
    statusString.includes('ft') || 
    (match.state?.clock && match.state.clock >= 90);

  const formatMatchTime = (dateString: string) => format(new Date(dateString), 'HH:mm');
  const formatMatchDate = (dateString: string) => format(new Date(dateString), 'MMM dd');
  const scoreData = getMatchScore(match);

  return (
    <Link 
      to={`/match/${match.id}`} 
      className="block bg-gray-900/50 rounded-md p-4 hover:bg-gray-800/50 transition-colors"
    >
      {showDate && datePosition === 'top' && (
        <div className="text-xs text-gray-400 mb-2">
          {formatMatchDate(match.date)} • {formatMatchTime(match.date)}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          {match.homeTeam?.id ? (
            <div 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(`/team/${match.homeTeam.id}`);
              }} 
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <img 
                src={match.homeTeam?.logo || '/placeholder-team.png'} 
                alt={match.homeTeam?.name} 
                className="w-8 h-8 object-contain"
              />
              <span className="text-white text-sm font-medium truncate">
                {match.homeTeam?.name}
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <img 
                src={match.homeTeam?.logo || '/placeholder-team.png'} 
                alt={match.homeTeam?.name} 
                className="w-8 h-8 object-contain"
              />
              <span className="text-white text-sm font-medium truncate">
                {match.homeTeam?.name}
              </span>
            </div>
          )}
        </div>
        
        <div className="text-center px-4">
          {isFinished ? (
            <div className="text-yellow-400 font-bold text-lg">
              {scoreData.home} - {scoreData.away}
            </div>
          ) : (
            <div className="text-gray-400 text-sm">
              {formatMatchTime(match.date)}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3 flex-1 justify-end">
          {match.awayTeam?.id ? (
            <div 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(`/team/${match.awayTeam.id}`);
              }} 
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <span className="text-white text-sm font-medium truncate text-right">
                {match.awayTeam?.name}
              </span>
              <img 
                src={match.awayTeam?.logo || '/placeholder-team.png'} 
                alt={match.awayTeam?.name} 
                className="w-8 h-8 object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <span className="text-white text-sm font-medium truncate text-right">
                {match.awayTeam?.name}
              </span>
              <img 
                src={match.awayTeam?.logo || '/placeholder-team.png'} 
                alt={match.awayTeam?.name} 
                className="w-8 h-8 object-contain"
              />
            </div>
          )}
        </div>
      </div>
      
      {showDate && datePosition === 'bottom' && (
        <div className="text-xs text-gray-400 mt-2 text-center">
          {formatMatchDate(match.date)} • {formatMatchTime(match.date)}
        </div>
      )}
      
      {!isFinished && (
        <div className="mt-2 text-center">
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
            Upcoming
          </span>
        </div>
      )}
    </Link>
  );
};

export default MatchCard; 