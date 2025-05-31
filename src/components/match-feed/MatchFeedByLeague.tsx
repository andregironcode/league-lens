import React from 'react';
import type { LeagueWithMatches } from '@/types';
import LeagueCard from './LeagueCard';

interface MatchFeedByLeagueProps {
  leaguesWithMatches: LeagueWithMatches[];
  loading?: boolean;
  selectedDate?: string;
  isToday?: boolean;
}

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-6">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-[#1a1a1a] rounded-lg overflow-hidden animate-pulse">
        {/* Header skeleton */}
        <div className="p-6 border-b border-gray-700/30">
          <div className="flex items-center space-x-4">
            <div className="w-6 h-6 bg-gray-700 rounded"></div>
            <div className="w-6 h-6 bg-gray-700 rounded"></div>
            <div className="flex-1">
              <div className="h-5 bg-gray-700 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-600 rounded w-24"></div>
            </div>
            <div className="text-right">
              <div className="h-4 bg-gray-700 rounded w-8 mb-1"></div>
              <div className="h-3 bg-gray-600 rounded w-12"></div>
            </div>
          </div>
        </div>
        
        {/* Matches skeleton */}
        <div className="divide-y divide-gray-700/30">
          {[1, 2, 3].map((j) => (
            <div key={j} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="h-4 bg-gray-700 rounded w-12"></div>
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
                <div className="h-6 bg-gray-700 rounded w-12"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

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

const MatchFeedByLeague: React.FC<MatchFeedByLeagueProps> = ({ 
  leaguesWithMatches, 
  loading = false,
  selectedDate,
  isToday = false
}) => {
  const dateLabel = selectedDate ? formatSelectedDate(selectedDate) : 'Matches';
  
  if (loading) {
    return (
      <section className="mb-16">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">
              {dateLabel} Matches
            </h2>
          </div>
          <LoadingSkeleton />
        </div>
      </section>
    );
  }

  // Only show leagues that have matches (never render empty leagues)
  const leaguesWithActualMatches = leaguesWithMatches.filter(league => 
    league.matches && league.matches.length > 0
  );

  if (leaguesWithActualMatches.length === 0) {
    return (
      <section className="mb-16">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">
              {dateLabel} Matches
            </h2>
          </div>
          <div className="bg-[#1a1a1a] rounded-lg p-12 text-center border border-gray-700/30">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No matches found</h3>
            <p className="text-gray-400">
              No matches scheduled for {dateLabel.toLowerCase()}.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Calculate statistics for display
  const totalMatches = leaguesWithActualMatches.reduce((total, league) => total + league.matches.length, 0);
  const liveMatches = leaguesWithActualMatches.reduce((total, league) => 
    total + league.matches.filter(m => 
      m.fixture?.status?.short === 'LIVE' || m.status === 'live'
    ).length, 0);

  return (
    <section className="mb-16">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white">
            {dateLabel} Matches
            {isToday && liveMatches > 0 && (
              <span className="ml-3 px-3 py-1 bg-yellow-500 text-black text-sm rounded-full font-bold">
                {liveMatches} LIVE
              </span>
            )}
          </h2>
          <div className="text-right">
            <div className="text-lg font-semibold text-white">
              {totalMatches} {totalMatches === 1 ? 'match' : 'matches'}
            </div>
            <div className="text-sm text-gray-400">
              across {leaguesWithActualMatches.length} {leaguesWithActualMatches.length === 1 ? 'league' : 'leagues'}
            </div>
          </div>
        </div>
        
        {/* League Cards */}
        <div className="space-y-6">
          {leaguesWithActualMatches.map((league) => (
            <LeagueCard key={league.id} league={league} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default MatchFeedByLeague; 