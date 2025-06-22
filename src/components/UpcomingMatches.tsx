import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Trophy, MapPin, Play, Users } from 'lucide-react';
import { formatDistanceToNow, format, isToday, isTomorrow, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { 
  getActiveCompetitions, 
  getFallbackCompetitions, 
  getMatchDateRange,
  type Competition 
} from '../config/competitionsRanking';

interface Team {
  id: number;
  name: string;
  logo: string;
}

interface UpcomingMatch {
  id: number;
  homeTeam: Team;
  awayTeam: Team;
  date: string;
  time: string;
  status: string;
  venue?: string;
  isLive: boolean;
  competition: {
    id: number | string;
    name: string;
    logo: string;
  };
  dateTime: Date;
}

const UpcomingMatches: React.FC = () => {
  const [matches, setMatches] = useState<UpcomingMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeCompetitions, setActiveCompetitions] = useState<Competition[]>([]);

  const fetchUpcomingMatchesFromDatabase = async () => {
    try {
      setLoading(true);
      console.log('[UpcomingMatches] Fetching matches from database...');
      
      const { startDate, endDate } = getMatchDateRange(); // -1 day to +5 days
      const startDateString = format(startDate, 'yyyy-MM-dd');
      const endDateString = format(endDate, 'yyyy-MM-dd');
      
      console.log(`[UpcomingMatches] Date range: ${startDateString} to ${endDateString}`);
      
      // Get active competitions for current date
      const now = new Date();
      const activeComps = getActiveCompetitions(now);
      const fallbackComps = getFallbackCompetitions(now);
      const targetCompetitions = activeComps.length > 0 ? activeComps : fallbackComps;
      
      console.log(`[UpcomingMatches] Found ${targetCompetitions.length} target competitions`);
      setActiveCompetitions(targetCompetitions);
      
      // Fetch matches from database with team joins
      const { data: matchesData, error } = await supabase
        .from('matches')
        .select(`
          id,
          match_date,
          home_team_id,
          away_team_id,
          home_score,
          away_score,
          status,
          venue,
          league_id,
          api_data,
          leagues!inner (
            id,
            name,
            country_name,
            logo
          ),
          home_team:teams!home_team_id (
            id,
            name,
            logo
          ),
          away_team:teams!away_team_id (
            id,
            name,
            logo
          )
        `)
        .gte('match_date', startDateString)
        .lte('match_date', endDateString)
        .order('match_date', { ascending: true });

      if (error) {
        console.error('[UpcomingMatches] Database error:', error);
        return;
      }

      if (!matchesData || matchesData.length === 0) {
        console.log('[UpcomingMatches] No matches found in database for date range');
        setMatches([]);
        return;
      }

      console.log(`[UpcomingMatches] Found ${matchesData.length} matches in database`);

      // Process matches
      const processedMatches: UpcomingMatch[] = [];
      
      matchesData.forEach(match => {
        const leagueInfo = Array.isArray(match.leagues) ? match.leagues[0] : match.leagues;
        
        // Extract team info from joined data or api_data fallback
        const getTeamInfo = (teamData: any, apiTeamData: any, defaultName: string) => {
          if (teamData && teamData.name) {
            return {
              id: parseInt(teamData.id) || 0,
              name: teamData.name,
              logo: teamData.logo || '/teams/default.png'
            };
          }
          
          // Fallback to api_data if join failed
          if (apiTeamData && apiTeamData.name) {
            return {
              id: parseInt(apiTeamData.id) || 0,
              name: apiTeamData.name,
              logo: apiTeamData.logo || '/teams/default.png'
            };
          }
          
          return {
            id: 0,
            name: defaultName,
            logo: '/teams/default.png'
          };
        };

        const apiData = match.api_data || {};
        const matchDateTime = apiData.date ? parseISO(apiData.date) : parseISO(match.match_date);
        
        processedMatches.push({
          id: match.id,
          homeTeam: getTeamInfo(
            match.home_team, 
            apiData.homeTeam, 
            'Home Team'
          ),
          awayTeam: getTeamInfo(
            match.away_team, 
            apiData.awayTeam, 
            'Away Team'
          ),
          date: match.match_date,
          time: apiData.date ? format(parseISO(apiData.date), 'HH:mm') : '',
          status: match.status || 'Scheduled',
          venue: match.venue,
          isLive: ['live', 'first half', 'second half', 'half time'].includes((match.status || '').toLowerCase()),
          competition: {
            id: match.league_id.toString(),
            name: leagueInfo.name,
            logo: leagueInfo.logo || '/leagues/default.png'
          },
          dateTime: matchDateTime
        });
      });

      // Sort all matches by date and time
      processedMatches.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

      setMatches(processedMatches);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('[UpcomingMatches] Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpcomingMatchesFromDatabase();
    
    // Set up auto-refresh every hour
    const interval = setInterval(fetchUpcomingMatchesFromDatabase, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const formatMatchDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (isToday(date)) return 'Today';
      if (isTomorrow(date)) return 'Tomorrow';
      
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      
      if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
        return 'Yesterday';
      }
      
      return format(date, 'EEE, MMM d');
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string, isLive: boolean) => {
    if (isLive) return 'text-red-400';
    if (status.toLowerCase() === 'finished') return 'text-green-400';
    return 'text-gray-400';
  };

  const getStatusIcon = (status: string, isLive: boolean) => {
    if (isLive) return <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />;
    if (status.toLowerCase() === 'finished') return <Trophy className="w-4 h-4 text-green-400" />;
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  if (loading) {
    return (
      <div className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white">Matches</h2>
          <div className="animate-pulse bg-gray-700 h-4 w-32 rounded"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="bg-gray-800 rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-32 mb-4"></div>
              <div className="space-y-3">
                <div className="h-8 bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-700 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white">Matches</h2>
          {lastUpdated && (
            <p className="text-sm text-gray-400">
              Updated {formatDistanceToNow(lastUpdated)} ago
            </p>
          )}
        </div>
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-12 text-center border border-gray-700">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-white mb-4">No Matches Scheduled</h3>
          <p className="text-gray-400 text-lg max-w-md mx-auto">
            {activeCompetitions.length === 0 
              ? "Major leagues are currently in off-season. Check back during the season for live matches."
              : "No matches scheduled in the next few days. Check back soon for updates."
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-white">Matches</h2>
        {lastUpdated && (
          <p className="text-sm text-gray-400">
            Updated {formatDistanceToNow(lastUpdated)} ago
          </p>
        )}
      </div>

      <div className="space-y-1">
        {matches.map((match) => (
          <Link
            key={match.id}
            to={`/match/${match.id}`}
            className="group block"
          >
            <div className="flex items-center justify-between py-4 px-6 hover:bg-gray-800/50 transition-colors duration-200 rounded-lg border-l-4 border-transparent hover:border-blue-500">
              {/* Left side: Date/Time */}
              <div className="flex items-center space-x-4 min-w-0 flex-1">
                <div className="text-sm text-gray-400 font-medium min-w-[120px]">
                  <div className="flex items-center space-x-2">
                    <span>{formatMatchDate(match.date)}</span>
                    <span className="text-gray-500">•</span>
                    <span>{match.time || 'TBD'}</span>
                  </div>
                </div>

                {/* League */}
                <div className="flex items-center space-x-2 min-w-[180px]">
                  <img
                    src={match.competition.logo}
                    alt={match.competition.name}
                    className="w-6 h-6 rounded object-cover flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/leagues/default.png';
                    }}
                  />
                  <span className="text-sm text-gray-300 font-medium truncate">
                    {match.competition.name}
                  </span>
                </div>

                {/* Teams */}
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <img
                      src={match.homeTeam.logo}
                      alt={match.homeTeam.name}
                      className="w-6 h-6 rounded object-cover flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/teams/default.png';
                      }}
                    />
                    <span className="text-white font-semibold text-sm truncate">
                      {match.homeTeam.name}
                    </span>
                  </div>
                  
                  <span className="text-gray-500 text-xs font-medium px-2 flex-shrink-0">
                    vs
                  </span>
                  
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <img
                      src={match.awayTeam.logo}
                      alt={match.awayTeam.name}
                      className="w-6 h-6 rounded object-cover flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/teams/default.png';
                      }}
                    />
                    <span className="text-white font-semibold text-sm truncate">
                      {match.awayTeam.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right side: Status */}
              <div className="flex items-center space-x-3 ml-4">
                {match.venue && (
                  <div className="hidden md:flex items-center space-x-1 text-xs text-gray-400">
                    <MapPin className="w-3 h-3" />
                    <span className="max-w-[120px] truncate">{match.venue}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  {getStatusIcon(match.status, match.isLive)}
                  <span className={`text-xs font-medium ${getStatusColor(match.status, match.isLive)}`}>
                    {match.isLive ? 'LIVE' : match.status}
                  </span>
                </div>
                
                <Play className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {activeCompetitions.length === 0 && (
        <div className="mt-8 p-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl">
          <div className="flex items-center space-x-3 mb-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <p className="text-yellow-400 font-bold text-lg">Off-Season Period</p>
          </div>
          <p className="text-gray-300 leading-relaxed">
            Major leagues are currently in off-season. Showing recent and upcoming matches from available competitions.
          </p>
        </div>
      )}
    </div>
  );
};

export default UpcomingMatches; 