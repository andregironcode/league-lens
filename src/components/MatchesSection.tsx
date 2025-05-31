import React from 'react';
import type { LeagueWithMatches } from '@/types';

interface MatchesSectionProps {
  leaguesWithMatches: LeagueWithMatches[];
  loading?: boolean;
  selectedDate?: string;
  isToday?: boolean;
}

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-8">
    {[1, 2, 3].map((i) => (
      <div key={i} className="animate-pulse">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-10 h-10 bg-gray-700 rounded"></div>
          <div className="flex-1">
            <div className="h-6 bg-gray-700 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-600 rounded w-32"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((j) => (
            <div key={j} className="bg-gray-800 rounded-lg p-4">
              <div className="h-4 bg-gray-700 rounded w-24 mb-3"></div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-700 rounded w-20"></div>
                </div>
                <div className="h-6 bg-gray-700 rounded w-16"></div>
                <div className="flex items-center space-x-2">
                  <div className="h-4 bg-gray-700 rounded w-20"></div>
                  <div className="w-6 h-6 bg-gray-700 rounded"></div>
                </div>
              </div>
              <div className="h-3 bg-gray-700 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const getMatchStatusColor = (status: string) => {
  switch (status) {
    case 'live':
      return 'text-red-500 bg-red-500/10 border-red-500/20';
    case 'finished':
      return 'text-green-500 bg-green-500/10 border-green-500/20';
    case 'upcoming':
      return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    default:
      return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
  }
};

const getMatchStatusText = (status: string, time?: string) => {
  switch (status) {
    case 'live':
      return 'LIVE';
    case 'finished':
      return 'FT';
    case 'upcoming':
      return time || 'TBD';
    default:
      return status?.toUpperCase() || 'TBD';
  }
};

const formatSelectedDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  
  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  if (isTomorrow) return 'Tomorrow';
  
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
};

const MatchCard: React.FC<{ match: any }> = ({ match }) => {
  const statusColor = getMatchStatusColor(match.status);
  const statusText = getMatchStatusText(match.status, match.time);
  
  return (
    <div className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/70 transition-colors cursor-pointer border border-gray-700/50">
      {/* Match Status */}
      <div className="flex justify-between items-center mb-3">
        <span className={`px-2 py-1 rounded text-xs font-medium border ${statusColor}`}>
          {statusText}
        </span>
        {match.status === 'live' && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-500 text-xs font-medium">LIVE</span>
          </div>
        )}
      </div>
      
      {/* Teams and Score */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center space-x-2 flex-1">
          <img 
            src={match.homeTeam.logo} 
            alt={match.homeTeam.name}
            className="w-6 h-6 object-contain"
            onError={(e) => {
              e.currentTarget.src = '/teams/default.png';
            }}
          />
          <span className="text-white text-sm font-medium truncate">
            {match.homeTeam.name}
          </span>
        </div>
        
        {match.score ? (
          <div className="px-3 py-1 bg-gray-700 rounded text-white font-bold text-sm">
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
              e.currentTarget.src = '/teams/default.png';
            }}
          />
        </div>
      </div>
      
      {/* Additional Info */}
      <div className="flex justify-between items-center text-xs text-gray-400">
        <span>{match.competition.name}</span>
        {match.venue && <span>{match.venue}</span>}
      </div>
    </div>
  );
};

const LeagueMatchesRow: React.FC<{ league: LeagueWithMatches }> = React.memo(({ league }) => {
  const liveMatches = league.matches.filter(m => m.status === 'live').length;
  const upcomingMatches = league.matches.filter(m => m.status === 'upcoming').length;
  const finishedMatches = league.matches.filter(m => m.status === 'finished').length;
  
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
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <span>{league.matches.length} {league.matches.length === 1 ? 'match' : 'matches'}</span>
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {league.matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
});

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
              There are no matches scheduled for {dateLabel.toLowerCase()}.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Filter out leagues with no matches
  const leaguesWithAnyMatches = leaguesWithMatches.filter(league => league.matches.length > 0);
  
  if (leaguesWithAnyMatches.length === 0) {
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
            <h3 className="text-lg font-semibold text-white mb-2">No matches available</h3>
            <p className="text-gray-400">
              No matches found in the top leagues for {dateLabel.toLowerCase()}.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const totalMatches = leaguesWithAnyMatches.reduce((total, league) => total + league.matches.length, 0);
  const liveMatches = leaguesWithAnyMatches.reduce((total, league) => 
    total + league.matches.filter(m => m.status === 'live').length, 0);

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
          <div className="text-sm text-gray-400">
            {totalMatches} {totalMatches === 1 ? 'match' : 'matches'}
            {liveMatches > 0 && (
              <span className="ml-2 text-red-500 font-medium">
                • {liveMatches} live
              </span>
            )}
          </div>
        </div>
        
        <div className="space-y-8">
          {leaguesWithAnyMatches.map((league) => (
            <LeagueMatchesRow key={league.id} league={league} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default MatchesSection; 