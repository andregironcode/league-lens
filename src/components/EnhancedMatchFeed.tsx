import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Match, League } from '@/types';
import { Clock, Calendar, Trophy, MapPin, Play } from 'lucide-react';
import { formatDistanceToNow, format, isToday, isTomorrow, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LEAGUE_PRIORITIES } from '@/utils/leaguePriority';
import { useWebSocket, getWebSocketUrl } from '@/hooks/useWebSocket';
import { managedFetch } from '@/utils/apiRequestManager';
import { useSmartPolling } from '@/hooks/useSmartPolling';

interface FeedData {
  matches: Match[];
  leagues: Array<{
    id: number;
    name: string;
    tier: number;
  }>;
  dateRange: {
    start: string;
    end: string;
  };
  lastUpdated: string;
}

const EnhancedMatchFeed: React.FC = () => {
  const [feedData, setFeedData] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // WebSocket connection for real-time updates
  const { isConnected, subscribe, on } = useWebSocket(getWebSocketUrl());

  // Memoized fetch function to prevent recreating
  const fetchFeedData = useCallback(async () => {
    try {
      const response = await managedFetch('/api/feed/matches');
      
      if (!response.ok) {
        throw new Error('Failed to fetch feed data');
      }
      
      const data: FeedData = await response.json();
      setFeedData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching feed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load matches');
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    setLoading(true);
    fetchFeedData().finally(() => setLoading(false));
  }, []); // Only run once on mount

  // Smart polling with server update avoidance
  const hasLiveMatches = useMemo(() => {
    return feedData?.matches?.some(match => {
      const status = match.status?.toLowerCase() || '';
      return status.includes('live') || status.includes('half') || status.includes('1h') || status.includes('2h');
    }) || false;
  }, [feedData?.matches]);

  const refreshInterval = hasLiveMatches ? 10000 : 60000; // 10s for live, 60s otherwise

  useSmartPolling({
    enabled: !!feedData,
    interval: refreshInterval,
    onFetch: fetchFeedData,
    avoidServerUpdates: true
  });
  
  // Subscribe to WebSocket updates
  useEffect(() => {
    if (!isConnected) return;
    
    // Subscribe to live match updates
    subscribe(undefined, undefined, 'live');
    
    // Handle match updates
    const unsubscribeMatchUpdate = on('match:update', (message) => {
      console.log('[EnhancedMatchFeed] Received match update:', message.matchId);
      
      // Update the specific match in feedData
      setFeedData(prev => {
        if (!prev) return prev;
        
        const updatedMatches = prev.matches.map(match => 
          match.id === message.matchId ? { ...match, ...message.data } : match
        );
        
        return {
          ...prev,
          matches: updatedMatches,
          lastUpdated: new Date().toISOString()
        };
      });
    });
    
    // Handle new live matches
    const unsubscribeMatchLive = on('match:live', (message) => {
      console.log('[EnhancedMatchFeed] Match went live:', message.matchId);
      // Trigger a full refresh to get the latest data
      const fetchFeedData = async () => {
        try {
          const response = await fetch('/api/feed/matches');
          if (response.ok) {
            const data: FeedData = await response.json();
            setFeedData(data);
          }
        } catch (err) {
          console.error('[EnhancedMatchFeed] Error refreshing on live match:', err);
        }
      };
      fetchFeedData();
    });
    
    return () => {
      unsubscribeMatchUpdate();
      unsubscribeMatchLive();
    };
  }, [isConnected, subscribe, on]);

  const formatMatchDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      const now = new Date();
      
      // Check if the date is actually valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateString);
        return dateString;
      }
      
      if (isToday(date)) return 'Today';
      if (isTomorrow(date)) return 'Tomorrow';
      
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      
      if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
        return 'Yesterday';
      }
      
      // For dates far in the past or future, show full date
      return format(date, 'EEE, MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('live') || lowerStatus.includes('half')) return 'text-red-400';
    if (lowerStatus.includes('finished') || lowerStatus === 'ft') return 'text-green-400';
    return 'text-gray-400';
  };

  const getStatusIcon = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('live') || lowerStatus.includes('half')) {
      return <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />;
    }
    if (lowerStatus.includes('finished') || lowerStatus === 'ft') {
      return <Trophy className="w-4 h-4 text-green-400" />;
    }
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  const groupMatchesByDate = (matches: Match[]) => {
    const groups: Record<string, Match[]> = {};
    
    matches.forEach(match => {
      const date = formatMatchDate(match.utc_date || match.match_date || '');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(match);
    });
    
    return groups;
  };

  if (loading) {
    return (
      <div className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white">Match Feed</h2>
          <div className="animate-pulse bg-gray-700 h-4 w-32 rounded"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Card key={i} className="bg-gray-800 border-gray-700 p-6 animate-pulse">
              <div className="h-6 bg-gray-700 rounded w-32 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map(j => (
                  <div key={j} className="h-16 bg-gray-700 rounded"></div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !feedData) {
    return (
      <Card className="bg-gray-900 border-gray-800 p-8">
        <p className="text-gray-400 text-center">{error || 'Failed to load matches'}</p>
      </Card>
    );
  }

  // Memoize grouped matches to prevent recalculation
  const groupedMatches = useMemo(() => {
    if (!feedData?.matches) return {};
    return groupMatchesByDate(feedData.matches);
  }, [feedData?.matches]);
  
  const dateGroups = useMemo(() => Object.keys(groupedMatches), [groupedMatches]);

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Match Feed</h2>
          <p className="text-sm text-gray-400">
            Top {feedData.leagues.length} leagues with upcoming matches
          </p>
        </div>
        {feedData.lastUpdated && (
          <p className="text-sm text-gray-400">
            Updated {formatDistanceToNow(parseISO(feedData.lastUpdated))} ago
          </p>
        )}
      </div>

      {/* Active Leagues Display */}
      <div className="mb-6 flex flex-wrap gap-2">
        {feedData.leagues.map(league => (
          <Badge 
            key={league.id} 
            variant="outline" 
            className={`border-gray-700 ${
              league.tier === 1 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
              league.tier === 2 ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
              'bg-gray-700/50 text-gray-300'
            }`}
          >
            {league.name}
          </Badge>
        ))}
      </div>

      {dateGroups.length === 0 ? (
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-white mb-4">No Matches Available</h3>
          <p className="text-gray-400 text-lg max-w-md mx-auto">
            No matches scheduled in the selected date range. Check back soon for updates.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {dateGroups.map(dateGroup => (
            <Card key={dateGroup} className="bg-gray-900 border-gray-800 overflow-hidden">
              <div className="bg-gray-800 px-6 py-3 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#FFC30B]" />
                  {dateGroup}
                </h3>
              </div>
              
              <div className="divide-y divide-gray-800">
                {groupedMatches[dateGroup].map((match) => {
                  const leagueInfo = Object.values(LEAGUE_PRIORITIES).find(l => l.id === match.competition_id);
                  
                  return (
                    <Link
                      key={match.id}
                      to={`/match/${match.id}`}
                      className="group block"
                    >
                      <div className="flex items-center justify-between py-4 px-6 hover:bg-gray-800/50 transition-colors duration-200">
                        {/* Time and League */}
                        <div className="flex items-center space-x-4 min-w-0 flex-shrink-0">
                          <div className="text-sm text-gray-400 font-medium w-16">
                            {match.utc_date || match.match_date ? format(parseISO(match.utc_date || match.match_date), 'HH:mm') : 'TBD'}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="border-gray-700 text-xs">
                              {leagueInfo?.name || 'League'}
                            </Badge>
                          </div>
                        </div>

                        {/* Teams */}
                        <div className="flex items-center space-x-4 flex-1 min-w-0 mx-6">
                          <div className="flex items-center space-x-2 flex-1 justify-end">
                            <span className="text-white font-medium truncate">
                              {match.home_team?.name || match.homeTeam?.name || 'Home'}
                            </span>
                            <img
                              src={match.home_team?.logo || match.homeTeam?.logo || '/teams/default.png'}
                              alt=""
                              className="w-6 h-6 rounded object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/teams/default.png';
                              }}
                            />
                          </div>
                          
                          <div className="flex items-center space-x-2 px-4">
                            {match.status?.toLowerCase().includes('finished') || match.status === 'FT' ? (
                              <div className="flex items-center space-x-1 text-lg font-bold">
                                <span className="text-white">{match.home_score || 0}</span>
                                <span className="text-gray-500">-</span>
                                <span className="text-white">{match.away_score || 0}</span>
                              </div>
                            ) : (
                              <span className="text-gray-500 text-sm font-medium">vs</span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2 flex-1">
                            <img
                              src={match.away_team?.logo || match.awayTeam?.logo || '/teams/default.png'}
                              alt=""
                              className="w-6 h-6 rounded object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/teams/default.png';
                              }}
                            />
                            <span className="text-white font-medium truncate">
                              {match.away_team?.name || match.awayTeam?.name || 'Away'}
                            </span>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="flex items-center space-x-3 flex-shrink-0">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(match.status || 'Scheduled')}
                            <span className={`text-xs font-medium ${getStatusColor(match.status || 'Scheduled')}`}>
                              {match.status || 'Scheduled'}
                            </span>
                          </div>
                          
                          <Play className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EnhancedMatchFeed;