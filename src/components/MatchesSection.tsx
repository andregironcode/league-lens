import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LeagueWithMatches } from '@/types';

interface MatchesSectionProps {
  leaguesWithMatches: LeagueWithMatches[];
  loading?: boolean;
  selectedDate?: string;
  isToday?: boolean;
}

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-6">
    {[1, 2, 3].map((i) => (
      <div key={i} className="border border-gray-700/50 rounded-lg overflow-hidden bg-gray-800/30 animate-pulse">
        <div className="p-5">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-6 h-6 bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-700 rounded w-48"></div>
          </div>
        </div>
        <div className="px-5 pb-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((j) => (
              <div key={j} className="h-32 bg-gray-700/50 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    ))}
  </div>
);

const getMatchStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'live':
    case '1h':
    case '2h':
    case 'ht':
      return 'text-red-400 bg-red-500/10 border-red-500/20';
    case 'finished':
    case 'ft':
    case 'aet':
    case 'pen':
      return 'text-green-400 bg-green-500/10 border-green-500/20';
    default:
      return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
  }
};

const getMatchStatusText = (status: string, time?: string): string => {
  switch (status?.toLowerCase()) {
    case 'live':
    case '1h':
    case '2h':
    case 'ht':
      return 'LIVE';
    case 'finished':
    case 'ft':
    case 'aet':
    case 'pen':
      return 'FT';
    default:
      return time || 'KO';
  }
};

const formatSelectedDate = (dateString: string): string => {
  const date = new Date(dateString + 'T00:00:00');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  const dateOnly = (d: Date) => d.toDateString();
  
  if (dateOnly(date) === dateOnly(today)) {
    return "Today's";
  } else if (dateOnly(date) === dateOnly(yesterday)) {
    return "Yesterday's";
  } else if (dateOnly(date) === dateOnly(tomorrow)) {
    return "Tomorrow's";
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric'
    }) + "'s";
  }
};

const MatchCard: React.FC<{ match: any }> = ({ match }) => {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);
  
  const statusColor = getMatchStatusColor(match.status);
  const statusText = getMatchStatusText(match.status, match.time);
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';
  
  // Handle match click
  const handleMatchClick = async () => {
    if (!isNavigating) {
      try {
        setIsNavigating(true);
        console.log(`[MatchCard] Navigating to match details for ID: ${match.id}`);
        
        // Route finished matches to Full-time Summary page
        if (isFinished) {
          navigate(`/match/${match.id}`);
        } else {
          navigate(`/match/${match.id}`);
        }
      } catch (error) {
        console.error('Navigation error:', error);
        setIsNavigating(false);
      }
    }
  };

  const canClick = true; // All matches are now clickable
  
  return (
    <div 
      className={`bg-gray-800/50 rounded-lg p-4 transition-colors border ${
        isLive ? 'border-red-500/50 bg-red-900/10' : 'border-gray-700/50'
      } ${
        canClick 
          ? isNavigating 
            ? 'cursor-wait opacity-75' 
            : 'hover:bg-gray-800/70 cursor-pointer hover:scale-[1.01] active:scale-[0.99]'
          : 'hover:bg-gray-800/70'
      }`}
      onClick={handleMatchClick}
      title={
        canClick 
          ? isNavigating 
            ? 'Loading match details...' 
            : 'Click to view match details'
          : undefined
      }
    >
      {/* Match Status with Enhanced LIVE Badge */}
      <div className="flex justify-between items-center mb-3">
        <span className={`px-2 py-1 rounded text-xs font-medium border ${statusColor}`}>
          {statusText}
        </span>
        {isLive && (
          <div className="flex items-center space-x-2 bg-red-600 px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-white text-xs font-bold tracking-wide">LIVE</span>
          </div>
        )}
      </div>
      
      {/* Teams and Score */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2 flex-1">
          <img 
            src={match.homeTeam.logo} 
            alt={match.homeTeam.name}
            className="w-6 h-6 object-contain"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.includes('/teams/default.png')) {
                target.src = '/teams/default.png';
              }
            }}
          />
          <span className="text-white text-sm font-medium truncate">
            {match.homeTeam.name}
          </span>
        </div>
        
        {match.score ? (
          <div className={`px-3 py-1 rounded text-white font-bold text-sm ${
            isLive ? 'bg-red-600' : 'bg-gray-700'
          }`}>
            {match.score.home} - {match.score.away}
          </div>
        ) : (
          <div className="px-3 py-1 text-gray-400 text-sm">
            vs
          </div>
        )}
        
        <div className="flex items-center space-x-2 flex-1 justify-end">
          <span className="text-white text-sm font-medium truncate text-right">
            {match.awayTeam.name}
          </span>
          <img 
            src={match.awayTeam.logo} 
            alt={match.awayTeam.name}
            className="w-6 h-6 object-contain"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.includes('/teams/default.png')) {
                target.src = '/teams/default.png';
              }
            }}
          />
        </div>
      </div>
      
      {/* Additional Info */}
      <div className="flex justify-between items-center text-xs text-gray-400">
        <span>{match.competition.name}</span>
        {match.venue && <span>{match.venue}</span>}
      </div>
      
      {/* Live Match Indicator Bar */}
      {isLive && (
        <div className="mt-3 h-1 bg-red-600/20 rounded-full overflow-hidden">
          <div className="h-full bg-red-500 rounded-full animate-pulse"></div>
        </div>
      )}
      
      {/* Click indicator for interactive matches */}
      {canClick && (
        <div className="mt-2 text-center text-xs text-gray-500 opacity-70">
          {isNavigating ? 'Loading...' : 'Click for details'}
        </div>
      )}
    </div>
  );
};

interface CollapsibleLeagueProps {
  league: LeagueWithMatches;
  defaultExpanded?: boolean;
}

const CollapsibleLeague: React.FC<CollapsibleLeagueProps> = ({ league, defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  const liveMatches = league.matches.filter(m => m.status === 'live').length;
  const upcomingMatches = league.matches.filter(m => m.status === 'upcoming').length;
  const finishedMatches = league.matches.filter(m => m.status === 'finished').length;
  
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div className="border border-gray-700/50 rounded-lg overflow-hidden bg-gray-800/30">
      {/* League Header - Clickable to toggle */}
      <button
        onClick={toggleExpanded}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-700/30 transition-colors text-left"
      >
        <div className="flex items-center space-x-4">
          <img
            src={league.logo || `https://cdn.scoresite.com/logos/leagues/${league.id}.png`}
            alt={league.name}
            loading="lazy"
            onError={(e) => {
              const target = e.currentTarget;
              // If this is the first fallback attempt, try scoresite URL
              if (target.src !== `https://cdn.scoresite.com/logos/leagues/${league.id}.png`) {
                target.src = `https://cdn.scoresite.com/logos/leagues/${league.id}.png`;
              } else {
                // Final fallback to default icon
                target.src = '/icons/default-league.svg';
              }
            }}
            className="w-6 h-6 object-contain"
          />
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white">{league.name}</h3>
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-gray-400">
                {league.matches.length} {league.matches.length === 1 ? 'match' : 'matches'}
              </span>
              {liveMatches > 0 && (
                <span className="text-red-500 font-medium">
                  {liveMatches} live
                </span>
              )}
              {upcomingMatches > 0 && (
                <span className="text-blue-500">
                  {upcomingMatches} upcoming
                </span>
              )}
              {finishedMatches > 0 && (
                <span className="text-green-500">
                  {finishedMatches} finished
                </span>
              )}
            </div>
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
      </button>
      
      {/* League Matches - Collapsible */}
      {isExpanded && (
        <div className="px-5 pb-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {league.matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MatchesSection: React.FC<MatchesSectionProps> = ({ 
  leaguesWithMatches, 
  loading = false,
  selectedDate,
  isToday = false
}) => {
  const dateLabel = selectedDate ? formatSelectedDate(selectedDate) : 'Matches';
  
  if (loading) {
    return (
      <section className="mb-16">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-white mb-8">
            {dateLabel} Matches
            {isToday && (
              <span className="ml-2 px-2 py-1 bg-yellow-500 text-black text-sm rounded font-medium">
                LIVE
              </span>
            )}
          </h2>
          <LoadingSkeleton />
        </div>
      </section>
    );
  }

  if (!leaguesWithMatches || leaguesWithMatches.length === 0) {
    return (
      <section className="mb-16">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-white mb-8">
            {dateLabel} Matches
            {isToday && (
              <span className="ml-2 px-2 py-1 bg-yellow-500 text-black text-sm rounded font-medium">
                LIVE
              </span>
            )}
          </h2>
          <div className="bg-gray-800/50 rounded-lg p-8 text-center border border-gray-700/50">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No matches found</h3>
            <p className="text-gray-400">
              No matches scheduled for {dateLabel.toLowerCase()}.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Calculate statistics - all leagues returned have matches
  const totalMatches = leaguesWithMatches.reduce((total, league) => total + league.matches.length, 0);
  const liveMatches = leaguesWithMatches.reduce((total, league) => 
    total + league.matches.filter(m => m.status === 'live').length, 0);
  const totalLeagues = leaguesWithMatches.length;

  return (
    <section className="mb-16">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">
            {dateLabel} Matches
            {isToday && (
              <span className="ml-2 px-2 py-1 bg-yellow-500 text-black text-sm rounded font-medium">
                LIVE
              </span>
            )}
          </h2>
          <div className="text-sm text-gray-400 text-right">
            <div>
              {totalMatches} {totalMatches === 1 ? 'match' : 'matches'} across {totalLeagues} {totalLeagues === 1 ? 'league' : 'leagues'}
            </div>
            {liveMatches > 0 && (
              <div className="text-red-500 font-medium">
                {liveMatches} live {liveMatches === 1 ? 'match' : 'matches'}
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-6">
          {leaguesWithMatches.map((league) => (
            <CollapsibleLeague 
              key={league.id} 
              league={league} 
              defaultExpanded={league.matches.some(m => m.status === 'live')}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default MatchesSection; 