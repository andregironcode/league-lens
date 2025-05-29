import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { LeagueWithMatches, Match } from '@/types';

interface RecentMatchesSectionProps {
  leaguesWithMatches: LeagueWithMatches[];
  loading?: boolean;
}

const MatchCard: React.FC<{ match: Match }> = ({ match }) => {
  const matchDate = new Date(match.date);
  const now = new Date();
  const isUpcoming = matchDate > now;
  
  const getStatusBadge = () => {
    switch (match.status) {
      case 'live':
        return (
          <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            LIVE
          </span>
        );
      case 'finished':
        return (
          <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            FT
          </span>
        );
      case 'upcoming':
        return (
          <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            {match.time || 'TBD'}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/70 transition-colors border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <img 
            src={match.competition.logo} 
            alt={match.competition.name}
            className="w-5 h-5 object-contain"
            onError={(e) => {
              e.currentTarget.src = '/leagues/default.png';
            }}
          />
          <span className="text-gray-400 text-sm">{match.competition.name}</span>
        </div>
        {getStatusBadge()}
      </div>

      <div className="flex items-center justify-between">
        {/* Home Team */}
        <div className="flex items-center space-x-3 flex-1">
          <img 
            src={match.homeTeam.logo} 
            alt={match.homeTeam.name}
            className="w-8 h-8 object-contain"
            onError={(e) => {
              e.currentTarget.src = '/teams/default.png';
            }}
          />
          <span className="text-white font-medium text-sm truncate">
            {match.homeTeam.name}
          </span>
        </div>

        {/* Score or VS */}
        <div className="px-4">
          {match.score && match.status === 'finished' ? (
            <div className="text-center">
              <div className="text-white font-bold text-lg">
                {match.score.home} - {match.score.away}
              </div>
            </div>
          ) : match.score && match.status === 'live' ? (
            <div className="text-center">
              <div className="text-white font-bold text-lg">
                {match.score.home} - {match.score.away}
              </div>
            </div>
          ) : (
            <div className="text-gray-400 text-sm font-medium">
              VS
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="flex items-center space-x-3 flex-1 justify-end">
          <span className="text-white font-medium text-sm truncate">
            {match.awayTeam.name}
          </span>
          <img 
            src={match.awayTeam.logo} 
            alt={match.awayTeam.name}
            className="w-8 h-8 object-contain"
            onError={(e) => {
              e.currentTarget.src = '/teams/default.png';
            }}
          />
        </div>
      </div>

      {/* Match Time/Date */}
      <div className="text-gray-400 text-xs mt-2 text-center">
        {isUpcoming 
          ? `${formatDistanceToNow(matchDate, { addSuffix: true })}`
          : formatDistanceToNow(matchDate, { addSuffix: true })
        }
        {match.venue && (
          <span className="ml-2">• {match.venue}</span>
        )}
      </div>
    </div>
  );
};

const LeagueMatchesRow: React.FC<{ league: LeagueWithMatches }> = ({ league }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center space-x-3 mb-4">
        <img 
          src={league.logo} 
          alt={league.name}
          className="w-8 h-8 object-contain"
          onError={(e) => {
            e.currentTarget.src = '/leagues/default.png';
          }}
        />
        <h3 className="text-xl font-bold text-white">{league.name}</h3>
        <span className="text-gray-400 text-sm">
          ({league.matches.length} matches)
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {league.matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
};

const LoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-8">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-700 rounded w-48"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((j) => (
              <div key={j} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-3"></div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-8 h-8 bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-700 rounded w-20"></div>
                  </div>
                  <div className="w-12 h-6 bg-gray-700 rounded"></div>
                  <div className="flex items-center space-x-3 flex-1 justify-end">
                    <div className="h-4 bg-gray-700 rounded w-20"></div>
                    <div className="w-8 h-8 bg-gray-700 rounded"></div>
                  </div>
                </div>
                <div className="h-3 bg-gray-700 rounded w-1/2 mt-2 mx-auto"></div>
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