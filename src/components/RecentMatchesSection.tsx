import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import type { LeagueWithMatches, Match } from '@/types';

interface RecentMatchesSectionProps {
  leaguesWithMatches: LeagueWithMatches[];
  loading?: boolean;
}

const MatchCard: React.FC<{ match: Match }> = React.memo(({ match }) => {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = React.useState(false);
  const matchDate = new Date(match.date);
  const now = new Date();
  const isUpcoming = matchDate > now;
  const isFinished = match.status === 'finished';
  
  // Memoize the time display to prevent flashing - only update every minute
  const timeDisplay = useMemo(() => {
    return isUpcoming 
      ? `${formatDistanceToNow(matchDate, { addSuffix: true })}`
      : formatDistanceToNow(matchDate, { addSuffix: true });
  }, [matchDate.getTime(), Math.floor(now.getTime() / 60000)]); // Update every minute
  
  const handleMatchClick = async () => {
    if (!isNavigating) {
      try {
        setIsNavigating(true);
        console.log(`[MatchCard] Navigating to match details for ID: ${match.id}`);
        navigate(`/match/${match.id}`);
      } catch (error) {
        console.error('Navigation error:', error);
        setIsNavigating(false);
      }
    }
  };
  
  const getStatusBadge = () => {
    switch (match.status) {
      case 'live':
        return (
          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
            LIVE
          </span>
        );
      case 'finished':
        return (
          <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
            FT
          </span>
        );
      case 'upcoming':
        return (
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
            {match.time || 'TBD'}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className={`bg-gray-800/60 rounded-xl p-5 transition-all duration-200 border border-gray-700/50 shadow-lg ${
        isNavigating 
          ? 'bg-gray-700/60 border-yellow-500/50 cursor-wait opacity-75' 
          : 'hover:bg-gray-800/80 hover:border-gray-600/50 cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
      }`}
      onClick={handleMatchClick}
      title={
        isNavigating 
          ? 'Loading match details...' 
          : 'Click to view match details'
      }
    >
      {/* League and Status Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <img 
            src={match.competition.logo} 
            alt={match.competition.name}
            className="w-5 h-5 object-contain flex-shrink-0"
            onError={(e) => {
              e.currentTarget.src = '/leagues/default.png';
            }}
          />
          <span className="text-gray-300 text-sm font-medium truncate">{match.competition.name}</span>
        </div>
        {getStatusBadge()}
      </div>

      {/* Teams and Score */}
      <div className="space-y-4">
        {/* Home Team */}
        <div className="flex items-center space-x-3">
          <img 
            src={match.homeTeam.logo} 
            alt={match.homeTeam.name}
            className="w-8 h-8 object-contain flex-shrink-0"
            onError={(e) => {
              e.currentTarget.src = '/teams/default.png';
            }}
          />
          <span className="text-white font-semibold text-sm flex-1 truncate">
            {match.homeTeam.name}
          </span>
          {/* Home Score */}
          <div className="text-right min-w-[24px]">
            {match.score && match.status === 'finished' ? (
              <span className="text-white font-bold text-lg">
                {match.score.home}
              </span>
            ) : match.score && match.status === 'live' ? (
              <span className="text-white font-bold text-lg">
                {match.score.home}
              </span>
            ) : (
              <span className="text-gray-500 text-sm">-</span>
            )}
          </div>
        </div>

        {/* Away Team */}
        <div className="flex items-center space-x-3">
          <img 
            src={match.awayTeam.logo} 
            alt={match.awayTeam.name}
            className="w-8 h-8 object-contain flex-shrink-0"
            onError={(e) => {
              e.currentTarget.src = '/teams/default.png';
            }}
          />
          <span className="text-white font-semibold text-sm flex-1 truncate">
            {match.awayTeam.name}
          </span>
          {/* Away Score */}
          <div className="text-right min-w-[24px]">
            {match.score && match.status === 'finished' ? (
              <span className="text-white font-bold text-lg">
                {match.score.away}
              </span>
            ) : match.score && match.status === 'live' ? (
              <span className="text-white font-bold text-lg">
                {match.score.away}
              </span>
            ) : (
              <span className="text-gray-500 text-sm">-</span>
            )}
          </div>
        </div>
      </div>

      {/* Match Time/Date and Venue */}
      <div className="text-gray-400 text-xs mt-4 pt-3 border-t border-gray-700/50 text-center">
        <div>{timeDisplay}</div>
        {match.venue && (
          <div className="mt-1 text-gray-500">📍 {match.venue}</div>
        )}
        <div className="mt-2 text-gray-500 text-xs opacity-70">
          {isNavigating ? 'Loading...' : 'Click for details'}
        </div>
      </div>
    </div>
  );
});

const LeagueMatchesRow: React.FC<{ league: LeagueWithMatches }> = React.memo(({ league }) => {
  return (
    <div className="mb-10">
      <div className="flex items-center space-x-4 mb-6">
        <img 
          src={league.logo} 
          alt={league.name}
          className="w-10 h-10 object-contain flex-shrink-0"
          onError={(e) => {
            e.currentTarget.src = '/leagues/default.png';
          }}
        />
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white">{league.name}</h3>
          <span className="text-gray-400 text-sm">
            {league.matches.length} recent {league.matches.length === 1 ? 'match' : 'matches'}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {league.matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
});

const LoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-10">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-10 h-10 bg-gray-700 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-6 bg-gray-700 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-32"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((j) => (
              <div key={j} className="bg-gray-800/60 rounded-xl p-5 border border-gray-700/50">
                {/* Header skeleton */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-700 rounded w-20"></div>
                  </div>
                  <div className="w-12 h-6 bg-gray-700 rounded-full"></div>
                </div>
                
                {/* Teams skeleton */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-700 rounded flex-1"></div>
                    <div className="w-6 h-6 bg-gray-700 rounded"></div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-700 rounded flex-1"></div>
                    <div className="w-6 h-6 bg-gray-700 rounded"></div>
                  </div>
                </div>
                
                {/* Footer skeleton */}
                <div className="mt-4 pt-3 border-t border-gray-700/50">
                  <div className="h-3 bg-gray-700 rounded w-24 mx-auto"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const RecentMatchesSection: React.FC<RecentMatchesSectionProps> = ({ 
  leaguesWithMatches, 
  loading = false 
}) => {
  if (loading) {
    return (
      <section className="mb-16">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-white mb-8">Recent Matches</h2>
          <LoadingSkeleton />
        </div>
      </section>
    );
  }

  if (!leaguesWithMatches || leaguesWithMatches.length === 0) {
    return (
      <section className="mb-16">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-white mb-8">Recent Matches</h2>
          <div className="bg-gray-800/50 rounded-lg p-8 text-center">
            <p className="text-gray-400">No recent matches available at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-16">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl font-bold text-white mb-8">Recent Matches</h2>
        <div className="space-y-8">
          {leaguesWithMatches.map((league) => (
            <LeagueMatchesRow key={league.id} league={league} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentMatchesSection; 

