import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Eye, Share2, Shirt, BarChart4, MapPin, Bell, Target, RefreshCw, Square, Goal, User, UserX, AlertTriangle } from 'lucide-react';
import Header from '@/components/Header';
import { getMatchById, getActiveService } from '@/services/serviceAdapter';
import { highlightlyClient } from '@/integrations/highlightly/client';
import { MatchHighlight, EnhancedMatchHighlight, Player, Match } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { notificationService } from '@/services/notificationService';

// Add match actions type and mock data
interface MatchAction {
  id: string;
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'own_goal' | 'penalty' | 'var';
  team: 'home' | 'away';
  player: string;
  playerOut?: string; // For substitutions
  description: string;
}

// Mock match actions data
const getMatchActions = (homeTeam: string, awayTeam: string): MatchAction[] => {
  return [
    {
      id: '1',
      minute: 12,
      type: 'goal' as const,
      team: 'home' as const,
      player: 'Gabriel Jesus',
      description: 'Right-footed shot from the centre of the box'
    },
    {
      id: '2', 
      minute: 23,
      type: 'yellow_card' as const,
      team: 'away' as const,
      player: 'Casemiro',
      description: 'Unsporting behaviour'
    },
    {
      id: '3',
      minute: 34,
      type: 'goal' as const,
      team: 'away' as const, 
      player: 'Marcus Rashford',
      description: 'Left-footed shot from outside the box'
    },
    {
      id: '4',
      minute: 45,
      type: 'yellow_card' as const,
      team: 'home' as const,
      player: 'Thomas Partey',
      description: 'Foul'
    },
    {
      id: '5',
      minute: 67,
      type: 'substitution' as const,
      team: 'home' as const,
      player: 'Eddie Nketiah',
      playerOut: 'Gabriel Jesus',
      description: 'Tactical change'
    },
    {
      id: '6',
      minute: 73,
      type: 'goal' as const,
      team: 'home' as const,
      player: 'Martin Ødegaard',
      description: 'Penalty kick'
    },
    {
      id: '7',
      minute: 78,
      type: 'substitution' as const,
      team: 'away' as const,
      player: 'Antony',
      playerOut: 'Marcus Rashford',
      description: 'Fresh legs'
    },
    {
      id: '8',
      minute: 85,
      type: 'yellow_card' as const,
      team: 'away' as const,
      player: 'Bruno Fernandes',
      description: 'Dissent'
    },
    {
      id: '9',
      minute: 90,
      type: 'goal' as const,
      team: 'home' as const,
      player: 'Bukayo Saka',
      description: 'Counter-attack finish'
    }
  ].sort((a, b) => b.minute - a.minute); // Reverse sort: later actions first (top), earlier last (bottom)
};

// Transform API events to MatchAction format
const getMatchActionsFromAPI = (matchEvents: any[], homeTeam: any, awayTeam: any): MatchAction[] => {
  if (!matchEvents || !Array.isArray(matchEvents)) return [];
  
  return matchEvents
    .map((event: any, index: number): MatchAction | null => {
      try {
        // Map API event types to our format
        let eventType: MatchAction['type'];
        const apiType = event.type?.toLowerCase() || '';
        
        if (apiType.includes('goal') || apiType === 'goal') {
          eventType = 'goal';
        } else if (apiType.includes('penalty') || apiType === 'penalty') {
          eventType = 'penalty';
        } else if (apiType.includes('own') && apiType.includes('goal')) {
          eventType = 'own_goal';
        } else if (apiType.includes('yellow') || apiType === 'card' && event.detail?.includes('yellow')) {
          eventType = 'yellow_card';
        } else if (apiType.includes('red') || apiType === 'card' && event.detail?.includes('red')) {
          eventType = 'red_card';
        } else if (apiType.includes('substitution') || apiType === 'subst') {
          eventType = 'substitution';
        } else if (apiType.includes('var')) {
          eventType = 'var';
        } else {
          // Skip unknown event types
          return null;
        }
        
        // Determine which team this event belongs to by comparing team information
        let team: 'home' | 'away' = 'home'; // default fallback
        
        if (event.team) {
          // Check if event team matches home or away team
          const eventTeamName = event.team.name || event.team;
          const eventTeamId = event.team.id || event.teamId;
          
          // Compare by team name (primary method)
          if (eventTeamName) {
            const eventTeamLower = eventTeamName.toLowerCase().trim();
            const homeTeamLower = homeTeam.name.toLowerCase().trim();
            const awayTeamLower = awayTeam.name.toLowerCase().trim();
            
            if (eventTeamLower === awayTeamLower || 
                eventTeamLower.includes(awayTeamLower) || 
                awayTeamLower.includes(eventTeamLower)) {
              team = 'away';
            } else if (eventTeamLower === homeTeamLower || 
                      eventTeamLower.includes(homeTeamLower) || 
                      homeTeamLower.includes(eventTeamLower)) {
              team = 'home';
            }
          }
          
          // Fallback: Compare by team ID if available
          if (eventTeamId && (homeTeam.id || awayTeam.id)) {
            if (eventTeamId === awayTeam.id) {
              team = 'away';
            } else if (eventTeamId === homeTeam.id) {
              team = 'home';
            }
          }
        }
        
        // Alternative: Check if event has a 'side' or 'team' indicator
        if (event.side) {
          const side = event.side.toLowerCase();
          if (side === 'away' || side === 'visitor' || side === '1') {
            team = 'away';
          } else if (side === 'home' || side === '0') {
            team = 'home';
          }
        }
        
        // Get player name
        const playerName = event.player || event.playerName || 'Unknown Player';
        
        // Get substitution info
        const playerOut = event.substituted || event.assist || event.playerOut || undefined;
        
        // Create description
        let description = '';
        if (eventType === 'goal' || eventType === 'penalty') {
          description = event.assist ? `Assisted by ${event.assist}` : 'Goal scored';
        } else if (eventType === 'substitution') {
          description = playerOut ? `Substituted for ${playerOut}` : 'Substitution';
        } else if (eventType === 'yellow_card' || eventType === 'red_card') {
          description = event.detail || 'Card shown';
        } else {
          description = event.detail || 'Match event';
        }
        
        return {
          id: `api-event-${index}`,
          minute: parseInt(event.time || event.minute || '0'),
          type: eventType,
          team,
          player: playerName,
          playerOut,
          description
        };
      } catch (error) {
        console.error('[FullTimeSummary] Error transforming event:', error, event);
        return null;
      }
    })
    .filter((action): action is MatchAction => action !== null)
    .sort((a, b) => b.minute - a.minute); // Reverse sort: later actions first
};

// Compact Timeline component for inside the score container
const CompactMatchTimeline: React.FC<{ homeTeam: any; awayTeam: any; matchEvents?: any[] }> = ({ 
  homeTeam, 
  awayTeam, 
  matchEvents 
}) => {
  // Use API data if available, otherwise fallback to hardcoded data
  const actions = matchEvents && matchEvents.length > 0 
    ? getMatchActionsFromAPI(matchEvents, homeTeam, awayTeam)
    : getMatchActions(homeTeam.name, awayTeam.name);
  
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'goal':
      case 'own_goal':
      case 'penalty':
        return <Goal className="w-3 h-3" />;
      case 'yellow_card':
        return <Square className="w-3 h-3 text-yellow-500" />;
      case 'red_card':
        return <Square className="w-3 h-3 text-red-500" />;
      case 'substitution':
        return <RefreshCw className="w-3 h-3" />;
      default:
        return <Target className="w-3 h-3" />;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'yellow_card':
        return 'bg-yellow-500';
      case 'red_card':
        return 'bg-red-500';
      default:
        return 'bg-gray-600'; // All other actions use neutral gray
    }
  };

  return (
    <div className="relative max-h-48 overflow-y-auto px-8">
      {/* Compact actions */}
      <div className="space-y-3 py-2 relative">
        {/* Compact timeline line with fade effects - positioned to span all actions */}
        <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 top-0 bottom-0">
          <div 
            className="w-full h-full relative"
            style={{ backgroundColor: '#1F1F1F' }}
          >
            {/* Top fade */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black to-transparent"></div>
            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black to-transparent"></div>
          </div>
        </div>
        
        {actions.map((action, index) => (
          <div key={action.id} className="relative">
            {/* Compact action card */}
            <div className={`flex ${action.team === 'home' ? 'justify-start' : 'justify-end'}`}>
              <div className={`w-56 ${action.team === 'home' ? 'mr-20 pr-4' : 'ml-20 pl-4'}`}>
                <div className={`rounded-full px-4 py-2 ${action.team === 'home' ? 'text-right' : ''}`} style={{ backgroundColor: '#1F1F1F' }}>
                  <div className={`flex items-center gap-2 text-xs ${action.team === 'home' ? 'justify-end' : ''}`}>
                    {action.team === 'home' ? (
                      <>
                        <div className="text-white flex items-center gap-1">
                          <span className="font-medium">{action.player}</span>
                          {getActionIcon(action.type)}
                        </div>
                        <span className="text-xs font-bold text-white">
                          {action.minute}'
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-bold text-white">
                          {action.minute}'
                        </span>
                        <div className="text-white flex items-center gap-1">
                          {getActionIcon(action.type)}
                          <span className="font-medium">{action.player}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Timeline component
const MatchTimeline: React.FC<{ homeTeam: any; awayTeam: any; matchEvents?: any[] }> = ({ 
  homeTeam, 
  awayTeam, 
  matchEvents 
}) => {
  // Use API data if available, otherwise fallback to hardcoded data
  const actions = matchEvents && matchEvents.length > 0 
    ? getMatchActionsFromAPI(matchEvents, homeTeam, awayTeam)
    : getMatchActions(homeTeam.name, awayTeam.name);
  
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'goal':
      case 'own_goal':
      case 'penalty':
        return <Goal className="w-4 h-4" />;
      case 'yellow_card':
        return <Square className="w-4 h-4 text-yellow-500" />;
      case 'red_card':
        return <Square className="w-4 h-4 text-red-500" />;
      case 'substitution':
        return <RefreshCw className="w-4 h-4" />;
      case 'var':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'yellow_card':
        return 'bg-yellow-500';
      case 'red_card':
        return 'bg-red-500';
      default:
        return 'bg-gray-600'; // All other actions use neutral gray
    }
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'goal':
        return 'Goal';
      case 'own_goal':
        return 'Own Goal';
      case 'penalty':
        return 'Penalty';
      case 'yellow_card':
        return 'Yellow Card';
      case 'red_card':
        return 'Red Card';
      case 'substitution':
        return 'Substitution';
      case 'var':
        return 'VAR';
      default:
        return 'Event';
    }
  };

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gray-700 h-full"></div>
      
      {/* Match start indicator */}
      <div className="relative flex justify-center mb-8">
        <div className="bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-medium border border-gray-600">
          <Clock className="w-4 h-4 inline mr-2" />
          Kick Off
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-6">
        {actions.map((action, index) => (
          <div key={action.id} className="relative">
            {/* Timeline dot */}
            <div className={`absolute left-1/2 transform -translate-x-1/2 w-4 h-4 ${getActionColor(action.type)} rounded-full border-2 border-gray-800 z-10`}></div>
            
            {/* Action card */}
            <div className={`flex ${action.team === 'home' ? 'justify-start pr-1/2' : 'justify-end pl-1/2'}`}>
              <div className={`max-w-sm ${action.team === 'home' ? 'mr-8' : 'ml-8'}`}>
                <div className={`bg-gray-800/90 rounded-lg p-4 border border-gray-700/50 ${action.team === 'away' ? 'text-right' : ''}`}>
                  {/* Minute and action type */}
                  <div className={`flex items-center gap-2 mb-2 ${action.team === 'away' ? 'justify-end' : ''}`}>
                    <div className={`px-2 py-1 rounded text-xs font-bold text-white ${getActionColor(action.type)}`}>
                      {action.minute}'
                    </div>
                    <div className={`flex items-center gap-1 text-white text-sm font-medium ${getActionColor(action.type)} px-2 py-1 rounded`}>
                      {getActionIcon(action.type)}
                      {getActionLabel(action.type)}
                    </div>
                  </div>
                  
                  {/* Player info */}
                  <div className="text-white font-semibold text-sm mb-1">
                    {action.player}
                    {action.playerOut && (
                      <span className="text-gray-400 text-xs ml-2">
                        ↔ {action.playerOut}
                      </span>
                    )}
                  </div>
                  
                  {/* Description */}
                  <div className="text-gray-400 text-xs">
                    {action.description}
                  </div>
                  
                  {/* Team indicator */}
                  <div className={`flex items-center gap-2 mt-2 ${action.team === 'away' ? 'justify-end' : ''}`}>
                    <img 
                      src={action.team === 'home' ? homeTeam.logo : awayTeam.logo} 
                      alt={action.team === 'home' ? homeTeam.name : awayTeam.name}
                      className="w-4 h-4 object-contain" 
                    />
                    <span className="text-gray-500 text-xs">
                      {action.team === 'home' ? homeTeam.name : awayTeam.name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full-time indicator */}
      <div className="relative flex justify-center mt-8">
        <div className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium">
          <Square className="w-4 h-4 inline mr-2" />
          Full Time
        </div>
      </div>
    </div>
  );
};

// Dynamic statistics interface - handles ANY stat from the API
interface DynamicStatistic {
  displayName: string;
  homeValue: number;
  awayValue: number;
}

// Process ALL statistics from the API response - shows everything dynamically
const processAllStatisticsFromAPI = (matchStatistics: any[]): DynamicStatistic[] | null => {
  if (!matchStatistics || !Array.isArray(matchStatistics) || matchStatistics.length < 2) {
    console.log('[MatchStats] No statistics data available or insufficient teams');
    return null;
  }
  
  try {
    const homeTeamStats = matchStatistics[0];
    const awayTeamStats = matchStatistics[1];
    
    console.log('[MatchStats] Processing ALL statistics from API:', {
      homeTeam: homeTeamStats?.team?.name,
      homeStatsCount: homeTeamStats?.statistics?.length,
      awayTeam: awayTeamStats?.team?.name,
      awayStatsCount: awayTeamStats?.statistics?.length
    });
    
    if (!homeTeamStats?.statistics || !awayTeamStats?.statistics) {
      console.log('[MatchStats] No statistics arrays found in API response');
    return null;
  }
    
    // Create a map to match statistics by displayName
    const homeStatsMap = new Map();
    const awayStatsMap = new Map();
    
    // Process home team statistics
    homeTeamStats.statistics.forEach((stat: any) => {
      if (stat.displayName && typeof stat.value === 'number') {
        homeStatsMap.set(stat.displayName, stat.value);
      }
    });
    
    // Process away team statistics  
    awayTeamStats.statistics.forEach((stat: any) => {
      if (stat.displayName && typeof stat.value === 'number') {
        awayStatsMap.set(stat.displayName, stat.value);
      }
    });
    
    // Get all unique statistic names from both teams
    const allStatNames = new Set([...homeStatsMap.keys(), ...awayStatsMap.keys()]);
    
    // Create dynamic statistics array
    const dynamicStats: DynamicStatistic[] = [];
    
    allStatNames.forEach(statName => {
      const homeValue = homeStatsMap.get(statName) || 0;
      const awayValue = awayStatsMap.get(statName) || 0;
      
      // Only include stats where at least one team has a value > 0
      if (homeValue > 0 || awayValue > 0) {
        dynamicStats.push({
          displayName: statName,
          homeValue: homeValue,
          awayValue: awayValue
        });
      }
    });
    
    console.log('[MatchStats] Processed dynamic statistics:', {
      totalStats: dynamicStats.length,
      statsNames: dynamicStats.map(s => s.displayName)
    });
    
    return dynamicStats.length > 0 ? dynamicStats : null;
    
  } catch (error) {
    console.error('[MatchStats] Error processing statistics from API:', error);
    return null;
  }
};

// All-new MatchStatsChart component - shows ALL API data with horizontal bars
const MatchStatsChart: React.FC<{ homeTeam: any; awayTeam: any; matchStatistics?: any[] }> = ({ 
  homeTeam, 
  awayTeam, 
  matchStatistics 
}) => {
  // Process ALL statistics from the API
  const allStats = matchStatistics && matchStatistics.length >= 2
    ? processAllStatisticsFromAPI(matchStatistics)
    : null;
  
  // If no stats available, show a message
  if (!allStats || allStats.length === 0) {
  return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-sm mb-2">
          📊 Match statistics are not available for this game
            </div>
        <div className="text-gray-500 text-xs">
          Statistics are typically available for matches from major leagues and recent games
                </div>
          </div>
        );
  }

  // Calculate bar widths based on relative values
  const getBarWidth = (value: number, otherValue: number, isLeft: boolean): number => {
    const total = value + otherValue;
    if (total === 0) return 0;
    
    const percentage = (value / total) * 100;
    return isLeft ? percentage : 100 - percentage;
  };

  // Format values for display
  const formatValue = (value: number): string => {
    // Handle percentage values (typically > 1 for percentages like 65.5)
    if (value > 1 && value <= 100 && value % 1 !== 0) {
      return `${value.toFixed(1)}%`;
    }
    
    // Handle decimal values (like xG: 1.5)
    if (value % 1 !== 0) {
      return value.toFixed(1);
    }
    
    // Handle whole numbers
    return value.toString();
  };

  return (
    <div className="space-y-4">
      {/* Header showing teams */}
      <div className="flex justify-between items-center text-sm text-gray-400 mb-6">
        <span>{homeTeam.name}</span>
        <span className="text-xs">MATCH STATISTICS ({allStats.length})</span>
        <span>{awayTeam.name}</span>
      </div>

      {/* Render ALL statistics from API */}
      {allStats.map((stat, index) => {
        const homeWidth = getBarWidth(stat.homeValue, stat.awayValue, true);
        const awayWidth = getBarWidth(stat.homeValue, stat.awayValue, false);
        
        // Determine which team is leading to assign yellow color
        const homeIsLeading = stat.homeValue > stat.awayValue;
        const awayIsLeading = stat.awayValue > stat.homeValue;
          
          return (
          <div key={`${stat.displayName}-${index}`} className="space-y-2">
            {/* Statistic name and values */}
            <div className="flex justify-between items-center text-sm">
              <span className={`text-right ${homeIsLeading ? 'text-yellow-400 font-medium' : 'text-gray-300'}`}>
                {formatValue(stat.homeValue)}
              </span>
              <span className="text-center text-gray-400 text-xs font-medium px-4">
                {stat.displayName}
              </span>
              <span className={`text-left ${awayIsLeading ? 'text-yellow-400 font-medium' : 'text-gray-300'}`}>
                {formatValue(stat.awayValue)}
              </span>
            </div>
            
            {/* Horizontal bar chart */}
            <div className="flex items-center">
              {/* Home team bar */}
              <div className="flex-1 flex justify-end">
                <div 
                  className={`h-2 ${homeIsLeading ? 'bg-yellow-400' : 'bg-gray-600'} rounded-l transition-all duration-300`}
                  style={{ width: `${homeWidth}%` }}
                        />
                      </div>
              
              {/* Center divider */}
              <div className="w-px h-4 bg-gray-500 mx-1" />
              
              {/* Away team bar */}
              <div className="flex-1 flex justify-start">
                <div 
                  className={`h-2 ${awayIsLeading ? 'bg-yellow-400' : 'bg-gray-600'} rounded-r transition-all duration-300`}
                  style={{ width: `${awayWidth}%` }}
                      />
                    </div>
              </div>
            </div>
          );
        })}
      
      {/* Debug info for development */}
      <div className="text-center text-gray-500 text-xs mt-6 pt-4 border-t border-gray-800">
        Showing all {allStats.length} statistics from API • Updated in real-time
      </div>
    </div>
  );
};

// Video utility functions
  const isValidVideoUrl = (url: string): boolean => {
    if (!url || typeof url !== 'string') {
      console.log('[FullTimeSummary] Invalid video URL - empty or not string:', url);
      return false;
    }
    
    console.log('[FullTimeSummary] Checking video URL:', url);
    
    // List of problematic domains that often refuse connections
    const blockedDomains = [
      'streamff.com',
      'streamff.net',
      'streamff.org',
      'streamff.tv',
      'streamable.com',
      'dailymotion.com'
    ];
    
  // Check if URL contains any blocked domains
    const urlLowerCase = url.toLowerCase();
    const containsBlockedDomain = blockedDomains.some(domain => {
      const isBlocked = urlLowerCase.includes(domain);
      if (isBlocked) {
        console.log(`[FullTimeSummary] Blocked video URL - contains ${domain}:`, url);
      }
      return isBlocked;
    });
    
    if (containsBlockedDomain) {
      return false;
    }
    
    // Basic URL validation
    try {
      const urlObj = new URL(url);
      console.log('[FullTimeSummary] Valid video URL:', url, 'Host:', urlObj.hostname);
      return true;
    } catch (error) {
      console.log('[FullTimeSummary] Invalid video URL format:', url, 'Error:', error);
      return false;
    }
  };

  const getVideoEmbedUrl = (url: string): string => {
    if (!url) return '';
    
    console.log('[FullTimeSummary] Processing video URL:', url);
    
    // If it's already an embed URL, use it
    if (url.includes('embed')) {
      console.log('[FullTimeSummary] Already embed URL:', url);
      return url;
    }
    
    // Extract YouTube video ID
    const youtubeRegex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/i;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) {
      const videoId = youtubeMatch[1];
      console.log('[FullTimeSummary] YouTube video ID:', videoId);
      return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`;
    }
    
    // For other video URLs, try to use them directly
    console.log('[FullTimeSummary] Using direct video URL:', url);
    return url;
  };

// League Standings Chart Component
const LeagueStandingsChart: React.FC<{ 
  homeTeam: any; 
  awayTeam: any; 
  competition: any;
  matchSeason: string;
}> = ({ homeTeam, awayTeam, competition, matchSeason }) => {
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStandings = async () => {
      // Extract API season from formatted season (e.g., "2024-25" -> "2024")
      const apiSeason = matchSeason.includes('-') ? matchSeason.split('-')[0] : matchSeason;
      
      try {
        setLoading(true);
        setError(null);
        
        console.log(`[FullTimeSummary] ===== DEBUGGING LEAGUE STANDINGS =====`);
        console.log(`[FullTimeSummary] Full competition object:`, JSON.stringify(competition, null, 2));
        console.log(`[FullTimeSummary] Competition ID:`, competition?.id);
        console.log(`[FullTimeSummary] Competition name:`, competition?.name);
        console.log(`[FullTimeSummary] Match season:`, matchSeason);
        
        // Check if competition ID exists and is valid
        if (!competition?.id || competition.id === 'unknown-competition') {
          console.error(`[FullTimeSummary] ❌ Invalid competition ID: ${competition?.id}`);
          setError('Competition information not available for standings');
          setLoading(false);
          return;
        }
        
        // Use the actual competition ID directly from the API data
        const standingsParams = {
          leagueId: competition.id.toString(), // Use the actual competition ID from match data
          season: apiSeason
        };
        
        console.log(`[FullTimeSummary] 📡 Calling standings API with params:`, standingsParams);
        console.log(`[FullTimeSummary] 📅 Note: Using API season ${apiSeason} for display season ${matchSeason}`);
        
        const response = await highlightlyClient.getStandings(standingsParams);
        
        console.log(`[FullTimeSummary] 📡 Raw API response:`, JSON.stringify(response, null, 2));
        
        if (response && (response.groups || response.standings || response.data)) {
          console.log(`[FullTimeSummary] ✅ SUCCESS! Found standings data`);
          
          // Handle response format - API returns groups with standings
          let standingsData = [];
          if (response.groups && Array.isArray(response.groups) && response.groups.length > 0) {
            // Use first group's standings
            standingsData = response.groups[0].standings || [];
            console.log(`[FullTimeSummary] Using response.groups[0].standings`);
          } else if (Array.isArray(response)) {
            standingsData = response;
            console.log(`[FullTimeSummary] Using direct array response`);
          } else if (response.data && Array.isArray(response.data)) {
            standingsData = response.data;
            console.log(`[FullTimeSummary] Using response.data array`);
          } else if (response.league && response.league.standings) {
            standingsData = response.league.standings[0] || []; // First group of standings
            console.log(`[FullTimeSummary] Using response.league.standings[0]`);
          } else {
            console.log(`[FullTimeSummary] Trying to find standings in response object:`, Object.keys(response));
            // Try to find standings data in different possible locations
            if (response.standings && Array.isArray(response.standings)) {
              standingsData = response.standings;
            } else if (response[0] && response[0].standings) {
              standingsData = response[0].standings;
            }
          }
          
          console.log(`[FullTimeSummary] Raw standings data:`, JSON.stringify(standingsData, null, 2));
          
          // Map the API response format to our expected format
          const mappedStandings = standingsData.map((standing: any, index: number) => {
            console.log(`[FullTimeSummary] Mapping standing ${index}:`, JSON.stringify(standing, null, 2));
            return {
              position: standing.position || index + 1,
              team: {
                id: standing.team?.id || '',
                name: standing.team?.name || '',
                logo: standing.team?.logo || ''
              },
              points: standing.points || standing.total?.points || 0,
              played: standing.total?.games || standing.total?.played || 0,
              won: standing.total?.wins || 0,
              drawn: standing.total?.draws || 0,
              lost: standing.total?.loses || standing.total?.lost || 0,
              goalsFor: standing.total?.scoredGoals || standing.total?.goalsFor || 0,
              goalsAgainst: standing.total?.receivedGoals || standing.total?.goalsAgainst || 0,
              goalDifference: (standing.total?.scoredGoals || 0) - (standing.total?.receivedGoals || 0)
            };
          });
          
          console.log(`[FullTimeSummary] ✅ Final standings data (${mappedStandings.length} teams):`, mappedStandings);
          setStandings(mappedStandings);
          setLoading(false);
        } else {
          console.log(`[FullTimeSummary] ❌ No standings found in response:`, response);
          setError('League standings not available for this competition');
          setLoading(false);
        }
      } catch (error) {
        console.error(`[FullTimeSummary] ❌ Error fetching league standings:`, error);
        
        // Smart fallback: If 2025 fails with 404, try 2024
        if (apiSeason === '2025' && error.message && error.message.includes('404')) {
          console.log(`[FullTimeSummary] 🔄 Season 2025 not available, trying fallback to 2024...`);
          
          try {
            const fallbackParams = {
              leagueId: competition.id.toString(),
              season: '2024'
            };
            
            console.log(`[FullTimeSummary] 📡 Fallback API call with params:`, fallbackParams);
            const fallbackResponse = await highlightlyClient.getStandings(fallbackParams);
            
            if (fallbackResponse && (fallbackResponse.groups || fallbackResponse.standings || fallbackResponse.data)) {
              console.log(`[FullTimeSummary] ✅ SUCCESS with 2024 fallback!`);
              
              // Use the same processing logic as above
              let standingsData = [];
              if (fallbackResponse.groups && Array.isArray(fallbackResponse.groups) && fallbackResponse.groups.length > 0) {
                standingsData = fallbackResponse.groups[0].standings || [];
              } else if (Array.isArray(fallbackResponse)) {
                standingsData = fallbackResponse;
              } else if (fallbackResponse.data && Array.isArray(fallbackResponse.data)) {
                standingsData = fallbackResponse.data;
              } else if (fallbackResponse.league && fallbackResponse.league.standings) {
                standingsData = fallbackResponse.league.standings[0] || [];
              }
              
              const mappedStandings = standingsData.map((standing: any, index: number) => ({
                position: standing.position || index + 1,
                team: {
                  id: standing.team?.id || '',
                  name: standing.team?.name || '',
                  logo: standing.team?.logo || ''
                },
                points: standing.points || standing.total?.points || 0,
                played: standing.total?.games || standing.total?.played || 0,
                won: standing.total?.wins || 0,
                drawn: standing.total?.draws || 0,
                lost: standing.total?.loses || standing.total?.lost || 0,
                goalsFor: standing.total?.scoredGoals || standing.total?.goalsFor || 0,
                goalsAgainst: standing.total?.receivedGoals || standing.total?.goalsAgainst || 0,
                goalDifference: (standing.total?.scoredGoals || 0) - (standing.total?.receivedGoals || 0)
              }));
              
              console.log(`[FullTimeSummary] ✅ Fallback success! Using 2024 data (${mappedStandings.length} teams)`);
              setStandings(mappedStandings);
              setLoading(false);
              return; // Exit successfully
            }
          } catch (fallbackError) {
            console.error(`[FullTimeSummary] ❌ Fallback to 2024 also failed:`, fallbackError);
          }
        }
        
        // If we get here, both the original request and fallback failed
        setError('Failed to load league standings');
        setLoading(false);
      }
    };

    // Only fetch if we have competition and competition ID
    if (competition && competition.id && competition.id !== 'unknown-competition') {
      console.log(`[FullTimeSummary] 🚀 Starting standings fetch for competition:`, competition.name);
      fetchStandings();
    } else {
      console.log(`[FullTimeSummary] ❌ No valid competition data available:`, competition);
      setError('Competition information not available');
      setLoading(false);
    }
  }, [competition, matchSeason]);

  // Helper function to highlight teams in the match
  const isMatchTeam = (teamName: string) => {
    return teamName.toLowerCase() === homeTeam.name.toLowerCase() || 
           teamName.toLowerCase() === awayTeam.name.toLowerCase();
  };

  // Helper function to get team highlight color
  const getTeamHighlightColor = (teamName: string) => {
    if (teamName.toLowerCase() === homeTeam.name.toLowerCase()) {
      return 'bg-blue-900/30 border-blue-500/50';
    }
    if (teamName.toLowerCase() === awayTeam.name.toLowerCase()) {
      return 'bg-red-900/30 border-red-500/50';
    }
    return '';
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-sm">
          <div className="mb-3">
            <div className="w-16 h-16 bg-gray-800/50 rounded-full mx-auto flex items-center justify-center mb-4">
              <div className="w-8 h-8 border-l-4 border-white/80 rounded-full animate-spin"></div>
              </div>
            </div>
          <p className="text-white font-medium text-base mb-3">Loading League Standings...</p>
          <p className="text-sm mb-4 max-w-md mx-auto">
            Fetching the latest standings for {competition.name} to show where both teams currently rank.
          </p>
          </div>
              </div>
    );
  }

  if (error || standings.length === 0) {
    return (
              <div className="text-center py-8">
                <div className="text-gray-400 text-sm">
                  <div className="mb-3">
                    <div className="w-16 h-16 bg-gray-800/50 rounded-full mx-auto flex items-center justify-center mb-4">
              <div className="text-2xl">📊</div>
                    </div>
                  </div>
          <p className="text-white font-medium text-base mb-3">Standings Not Available</p>
                  <p className="text-sm mb-4 max-w-md mx-auto">
            {error || `League standings are not available for ${competition.name} at this time.`}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center text-xs">
                    <div className="flex items-center text-blue-400">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
              Check back later for updates
                    </div>
                  </div>
                </div>
              </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Competition Header */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center space-x-3 mb-2">
          <img 
            src={competition.logo} 
            alt={competition.name}
            className="w-8 h-8 object-contain" 
          />
          <div className="text-white font-medium text-lg">{competition.name}</div>
          </div>
        <div className="text-gray-400 text-sm">
          {matchSeason} Season • {standings.length} Teams
          </div>
          </div>

      {/* Standings Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-[#121212]">
            <tr className="text-xs text-gray-400 uppercase tracking-wider">
              <th className="px-2 py-3 text-left w-12">#</th>
              <th className="px-3 py-3 text-left min-w-[180px]">Team</th>
              <th className="px-2 py-3 text-center w-10">P</th>
              <th className="px-2 py-3 text-center w-10">W</th>
              <th className="px-2 py-3 text-center w-10">D</th>
              <th className="px-2 py-3 text-center w-10">L</th>
              <th className="px-2 py-3 text-center w-12 hidden sm:table-cell">GF</th>
              <th className="px-2 py-3 text-center w-12 hidden sm:table-cell">GA</th>
              <th className="px-2 py-3 text-center w-12">GD</th>
              <th className="px-2 py-3 text-center w-12 font-semibold">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/30">
            {standings.map((standing: any, index: number) => (
              <tr 
                key={index}
                className={`hover:bg-gray-800/30 transition-colors ${
                  isMatchTeam(standing.team.name) 
                    ? `${getTeamHighlightColor(standing.team.name)} border-l-2` 
                    : ''
                }`}
              >
                <td className="px-2 py-3 text-center">
                  <span className={`text-sm font-medium ${
                    isMatchTeam(standing.team.name) ? 'text-white' : 'text-gray-300'
                  }`}>
                    {standing.position}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={standing.team.logo} 
                      alt={standing.team.name}
                      className="w-6 h-6 object-contain" 
                    />
                    <span className={`text-sm font-medium truncate ${
                      isMatchTeam(standing.team.name) ? 'text-white' : 'text-gray-300'
                    }`}>
                      {standing.team.name}
                    </span>
                          </div>
                </td>
                <td className="px-2 py-3 text-center text-sm text-gray-300">{standing.played}</td>
                <td className="px-2 py-3 text-center text-sm text-gray-300">{standing.won}</td>
                <td className="px-2 py-3 text-center text-sm text-gray-300">{standing.drawn}</td>
                <td className="px-2 py-3 text-center text-sm text-gray-300">{standing.lost}</td>
                <td className="px-2 py-3 text-center text-sm text-gray-300 hidden sm:table-cell">{standing.goalsFor}</td>
                <td className="px-2 py-3 text-center text-sm text-gray-300 hidden sm:table-cell">{standing.goalsAgainst}</td>
                <td className="px-2 py-3 text-center text-sm">
                  <span className={`${
                    standing.goalDifference > 0 ? 'text-green-400' : 
                    standing.goalDifference < 0 ? 'text-red-400' : 'text-gray-300'
                  }`}>
                    {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                  </span>
                </td>
                <td className="px-2 py-3 text-center">
                  <span className={`text-sm font-semibold ${
                    isMatchTeam(standing.team.name) ? 'text-yellow-400' : 'text-white'
                  }`}>
                    {standing.points}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
                      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center text-xs text-gray-400 mt-4">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-900/30 border border-blue-500/50 rounded"></div>
          <span>{homeTeam.name}</span>
                      </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-900/30 border border-red-500/50 rounded"></div>
          <span>{awayTeam.name}</span>
                      </div>
        <div className="hidden sm:flex items-center gap-2 ml-4">
          <span>P: Played</span>
          <span>W: Won</span>
          <span>D: Drawn</span>
          <span>L: Lost</span>
          <span>GF: Goals For</span>
          <span>GA: Goals Against</span>
          <span>GD: Goal Difference</span>
          <span>Pts: Points</span>
                      </div>
                          </div>
                      </div>
  );
};

// Team Form Chart Component - Shows last matches form and head-to-head
const TeamFormChart: React.FC<{ 
  homeTeam: any; 
  awayTeam: any; 
  apiSeason: string;
  competition: any;
}> = ({ homeTeam, awayTeam, apiSeason, competition }) => {
  const [homeTeamForm, setHomeTeamForm] = useState<any>(null);
  const [awayTeamForm, setAwayTeamForm] = useState<any>(null);
  const [headToHeadData, setHeadToHeadData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeamFormData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`[TeamFormChart] Fetching form data for ${homeTeam.name} vs ${awayTeam.name}...`);
        
        // Fetch recent matches for both teams and head-to-head data in parallel
        const [homeTeamHomeMatches, homeTeamAwayMatches, awayTeamHomeMatches, awayTeamAwayMatches, h2hMatches] = await Promise.all([
          // Get home matches for home team
          highlightlyClient.getMatches({
            homeTeamName: homeTeam.name,
            leagueId: competition?.id?.toString() || undefined,
            limit: '15'
          }).catch((err) => {
            console.error(`Error fetching home team home matches:`, err);
            return { data: [] };
          }),
          
          // Get away matches for home team
          highlightlyClient.getMatches({
            awayTeamName: homeTeam.name,
            leagueId: competition?.id?.toString() || undefined,
            limit: '15'
          }).catch((err) => {
            console.error(`Error fetching home team away matches:`, err);
            return { data: [] };
          }),
          
          // Get home matches for away team
          highlightlyClient.getMatches({
            homeTeamName: awayTeam.name,
            leagueId: competition?.id?.toString() || undefined,
            limit: '15'
          }).catch((err) => {
            console.error(`Error fetching away team home matches:`, err);
            return { data: [] };
          }),
          
          // Get away matches for away team
          highlightlyClient.getMatches({
            awayTeamName: awayTeam.name,
            leagueId: competition?.id?.toString() || undefined,
            limit: '15'
          }).catch((err) => {
            console.error(`Error fetching away team away matches:`, err);
            return { data: [] };
          }),
          
          // Get head-to-head matches between these teams
          highlightlyClient.getMatches({
            homeTeamName: homeTeam.name,
            awayTeamName: awayTeam.name,
            limit: '10'
          }).catch((err) => {
            console.error(`Error fetching head-to-head matches:`, err);
            return { data: [] };
          })
        ]);
        
        // Combine home and away matches for each team
        const allHomeTeamMatches = [
          ...(homeTeamHomeMatches?.data || []),
          ...(homeTeamAwayMatches?.data || [])
        ];
        
        const allAwayTeamMatches = [
          ...(awayTeamHomeMatches?.data || []),
          ...(awayTeamAwayMatches?.data || [])
        ];
        
        console.log(`[TeamFormChart] API Results:`, {
          homeTeamMatches: allHomeTeamMatches.length,
          awayTeamMatches: allAwayTeamMatches.length,
          h2hMatches: h2hMatches?.data?.length || 0
        });
        
        // Filter for finished matches only and sort by date (most recent first)
        const finishedHomeMatches = allHomeTeamMatches
          .filter((match: any) => 
            match.state?.description === 'Finished' || 
            match.state?.description === 'Full Time'
          )
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 10);
        
        const finishedAwayMatches = allAwayTeamMatches
          .filter((match: any) => 
            match.state?.description === 'Finished' || 
            match.state?.description === 'Full Time'
          )
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 10);
        
        const finishedH2HMatches = h2hMatches?.data?.filter((match: any) => 
          match.state?.description === 'Finished' || 
          match.state?.description === 'Full Time'
        ) || [];
        
        console.log(`[TeamFormChart] Finished matches:`, {
          homeFinished: finishedHomeMatches.length,
          awayFinished: finishedAwayMatches.length,
          h2hFinished: finishedH2HMatches.length
        });
        
        // Transform data for both teams
        const homeFormData = transformTeamFormData(finishedHomeMatches, homeTeam.name);
        const awayFormData = transformTeamFormData(finishedAwayMatches, awayTeam.name);
        const h2hData = transformHeadToHeadData(finishedH2HMatches);
        
        console.log(`[TeamFormChart] Transformed data:`, {
          homeFormData: homeFormData ? 'success' : 'null',
          awayFormData: awayFormData ? 'success' : 'null',
          h2hData: h2hData.length
        });
        
        setHomeTeamForm(homeFormData);
        setAwayTeamForm(awayFormData);
        setHeadToHeadData(h2hData);
        setLoading(false);
        
      } catch (error) {
        console.error(`[TeamFormChart] Error fetching team form data:`, error);
        setError('Failed to load team form data');
        setLoading(false);
      }
    };

    fetchTeamFormData();
  }, [homeTeam, awayTeam, apiSeason, competition]);

  // Transform match data into team form statistics
  const transformTeamFormData = (matches: any[], teamName: string) => {
    if (!matches || matches.length === 0) return null;
    
    const recentMatches = matches.slice(0, 10).map((match: any) => {
      const isHome = match.homeTeam?.name === teamName;
      
      // Parse score from the API format (e.g., "1 - 1" or "2 - 0")
      let homeScore = 0;
      let awayScore = 0;
      
      if (match.state?.score?.current) {
        const scoreMatch = match.state.score.current.match(/(\d+)\s*-\s*(\d+)/);
        if (scoreMatch) {
          homeScore = parseInt(scoreMatch[1], 10);
          awayScore = parseInt(scoreMatch[2], 10);
        }
      }
      
      const totalGoals = homeScore + awayScore;
      
      // Determine result for this team
      let result = 'D';
      if (homeScore !== awayScore) {
        result = isHome ? (homeScore > awayScore ? 'W' : 'L') : (awayScore > homeScore ? 'W' : 'L');
      }
      
      return {
        result,
        isHome,
        homeScore,
        awayScore,
        totalGoals,
        opponent: isHome ? match.awayTeam?.name : match.homeTeam?.name,
        date: match.date
      };
    });
    
    // Calculate form statistics
    const stats = {
      over25: recentMatches.filter(m => m.totalGoals > 2.5).length,
      under25: recentMatches.filter(m => m.totalGoals <= 2.5).length,
      cleanSheet: recentMatches.filter(m => 
        (m.isHome && m.awayScore === 0) || (!m.isHome && m.homeScore === 0)
      ).length,
      failedToScore: recentMatches.filter(m => 
        (m.isHome && m.homeScore === 0) || (!m.isHome && m.awayScore === 0)
      ).length,
      conceded: recentMatches.filter(m => 
        (m.isHome && m.awayScore > 0) || (!m.isHome && m.homeScore > 0)
      ).length,
      concededTwo: recentMatches.filter(m => 
        (m.isHome && m.awayScore >= 2) || (!m.isHome && m.homeScore >= 2)
      ).length
    };
    
    return {
      form: recentMatches.map(m => m.result),
      recentMatches,
      stats
    };
  };

  // Transform head-to-head match data
  const transformHeadToHeadData = (matches: any[]) => {
    if (!matches || matches.length === 0) return [];
    
    return matches.slice(0, 2).map((match: any) => {
      // Parse score from the API format (e.g., "1 - 1" or "2 - 0")
      let homeScore = 0;
      let awayScore = 0;
      
      if (match.state?.score?.current) {
        const scoreMatch = match.state.score.current.match(/(\d+)\s*-\s*(\d+)/);
        if (scoreMatch) {
          homeScore = parseInt(scoreMatch[1], 10);
          awayScore = parseInt(scoreMatch[2], 10);
        }
      }
      
      const homeTeamName = match.homeTeam?.name || '';
      const awayTeamName = match.awayTeam?.name || '';
      
      const matchDate = match.date || '';
      const formattedDate = new Date(matchDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      return {
        date: formattedDate,
        homeTeam: homeTeamName,
        awayTeam: awayTeamName,
        score: `${homeScore}-${awayScore}`,
        competition: match.competition?.name || 'Unknown'
      };
    });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
                      <div className="text-gray-400 text-sm">
          <div className="mb-3">
            <div className="w-16 h-16 bg-gray-800/50 rounded-full mx-auto flex items-center justify-center mb-4">
              <div className="w-8 h-8 border-l-4 border-white/80 rounded-full animate-spin"></div>
                        </div>
                      </div>
          <p className="text-white font-medium text-base mb-3">Loading Team Form...</p>
          <p className="text-sm mb-4 max-w-md mx-auto">
            Fetching recent match data and statistics for both teams.
          </p>
                    </div>
                </div>
    );
  }

  if (error || (!homeTeamForm && !awayTeamForm)) {
    return (
      <div className="text-center py-8">
                    <div className="text-gray-400 text-sm">
          <div className="mb-3">
            <div className="w-16 h-16 bg-gray-800/50 rounded-full mx-auto flex items-center justify-center mb-4">
              <div className="text-2xl">📊</div>
                    </div>
                  </div>
          <p className="text-white font-medium text-base mb-3">Form Data Not Available</p>
          <p className="text-sm mb-4 max-w-md mx-auto">
            Recent match data for these teams is not available at this time.
                    </p>
                  </div>
                            </div>
                          );
  }

                          return (
    <div className="space-y-6">
      {/* Teams Header */}
      <div className="flex justify-between items-center text-sm text-gray-400 mb-6">
        <div className="flex items-center gap-2">
          <img src={homeTeam.logo} alt={homeTeam.name} className="w-6 h-6 object-contain" />
          <span>{homeTeam.name}</span>
                            </div>
        <span className="text-xs">LAST 10 MATCHES</span>
        <div className="flex items-center gap-2">
          <span>{awayTeam.name}</span>
          <img src={awayTeam.logo} alt={awayTeam.name} className="w-6 h-6 object-contain" />
                      </div>
                    </div>

      {/* Form Statistics */}
      <div className="space-y-4">
                      {/* Over 2.5 Goals */}
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-1.5">
                          {Array.from({ length: 10 }, (_, index) => {
                            const match = homeTeamForm?.recentMatches?.[index];
              const over25 = match ? match.totalGoals > 2.5 : false;
                            return (
                              <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                  {match && over25 && <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>}
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="text-center px-8">
                          <div className="text-white text-sm font-medium">OVER 2.5</div>
            <div className="flex gap-4 text-xs text-gray-400 mt-1">
              <span>{homeTeamForm?.stats?.over25 || 0}/10</span>
              <span>{awayTeamForm?.stats?.over25 || 0}/10</span>
            </div>
                        </div>
                        
                        <div className="flex space-x-1.5">
                          {Array.from({ length: 10 }, (_, index) => {
                            const match = awayTeamForm?.recentMatches?.[index];
              const over25 = match ? match.totalGoals > 2.5 : false;
                            return (
                              <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                  {match && over25 && <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Under 2.5 Goals */}
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-1.5">
                          {Array.from({ length: 10 }, (_, index) => {
                            const match = homeTeamForm?.recentMatches?.[index];
              const under25 = match ? match.totalGoals <= 2.5 : false;
                            return (
                              <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                  {match && under25 && <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>}
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="text-center px-8">
                          <div className="text-white text-sm font-medium">UNDER 2.5</div>
            <div className="flex gap-4 text-xs text-gray-400 mt-1">
              <span>{homeTeamForm?.stats?.under25 || 0}/10</span>
              <span>{awayTeamForm?.stats?.under25 || 0}/10</span>
            </div>
                        </div>
                        
                        <div className="flex space-x-1.5">
                          {Array.from({ length: 10 }, (_, index) => {
                            const match = awayTeamForm?.recentMatches?.[index];
              const under25 = match ? match.totalGoals <= 2.5 : false;
                            return (
                              <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                  {match && under25 && <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Clean Sheet */}
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-1.5">
                          {Array.from({ length: 10 }, (_, index) => {
                            const match = homeTeamForm?.recentMatches?.[index];
                            const cleanSheet = match ? (match.isHome ? match.awayScore === 0 : match.homeScore === 0) : false;
                            return (
                              <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                  {match && cleanSheet && <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>}
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="text-center px-8">
                          <div className="text-white text-sm font-medium">CLEAN SHEET</div>
            <div className="flex gap-4 text-xs text-gray-400 mt-1">
              <span>{homeTeamForm?.stats?.cleanSheet || 0}/10</span>
              <span>{awayTeamForm?.stats?.cleanSheet || 0}/10</span>
            </div>
                        </div>
                        
                        <div className="flex space-x-1.5">
                          {Array.from({ length: 10 }, (_, index) => {
                            const match = awayTeamForm?.recentMatches?.[index];
                            const cleanSheet = match ? (match.isHome ? match.awayScore === 0 : match.homeScore === 0) : false;
                            return (
                              <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                  {match && cleanSheet && <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Failed to Score */}
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-1.5">
                          {Array.from({ length: 10 }, (_, index) => {
                            const match = homeTeamForm?.recentMatches?.[index];
                            const failedToScore = match ? (match.isHome ? match.homeScore === 0 : match.awayScore === 0) : false;
                            return (
                              <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                  {match && failedToScore && <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>}
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="text-center px-8">
                          <div className="text-white text-sm font-medium">FAILED TO SCORE</div>
            <div className="flex gap-4 text-xs text-gray-400 mt-1">
              <span>{homeTeamForm?.stats?.failedToScore || 0}/10</span>
              <span>{awayTeamForm?.stats?.failedToScore || 0}/10</span>
            </div>
                        </div>
                        
                        <div className="flex space-x-1.5">
                          {Array.from({ length: 10 }, (_, index) => {
                            const match = awayTeamForm?.recentMatches?.[index];
                            const failedToScore = match ? (match.isHome ? match.homeScore === 0 : match.awayScore === 0) : false;
                            return (
                              <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                  {match && failedToScore && <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Conceded */}
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-1.5">
                          {Array.from({ length: 10 }, (_, index) => {
                            const match = homeTeamForm?.recentMatches?.[index];
                            const conceded = match ? (match.isHome ? match.awayScore > 0 : match.homeScore > 0) : false;
                            return (
                              <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                  {match && conceded && <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>}
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="text-center px-8">
                          <div className="text-white text-sm font-medium">CONCEDED</div>
            <div className="flex gap-4 text-xs text-gray-400 mt-1">
              <span>{homeTeamForm?.stats?.conceded || 0}/10</span>
              <span>{awayTeamForm?.stats?.conceded || 0}/10</span>
            </div>
                        </div>
                        
                        <div className="flex space-x-1.5">
                          {Array.from({ length: 10 }, (_, index) => {
                            const match = awayTeamForm?.recentMatches?.[index];
                            const conceded = match ? (match.isHome ? match.awayScore > 0 : match.homeScore > 0) : false;
                            return (
                              <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                  {match && conceded && <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Conceded Two */}
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-1.5">
                          {Array.from({ length: 10 }, (_, index) => {
                            const match = homeTeamForm?.recentMatches?.[index];
                            const concededTwo = match ? (match.isHome ? match.awayScore >= 2 : match.homeScore >= 2) : false;
                            return (
                              <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                  {match && concededTwo && <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>}
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="text-center px-8">
                          <div className="text-white text-sm font-medium">CONCEDED TWO</div>
            <div className="flex gap-4 text-xs text-gray-400 mt-1">
              <span>{homeTeamForm?.stats?.concededTwo || 0}/10</span>
              <span>{awayTeamForm?.stats?.concededTwo || 0}/10</span>
            </div>
                        </div>
                        
                        <div className="flex space-x-1.5">
                          {Array.from({ length: 10 }, (_, index) => {
                            const match = awayTeamForm?.recentMatches?.[index];
                            const concededTwo = match ? (match.isHome ? match.awayScore >= 2 : match.homeScore >= 2) : false;
                            return (
                              <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                  {match && concededTwo && <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Head-to-Head Section */}
                    {headToHeadData.length > 0 && (
                      <>
                        <div className="border-t border-white/10 pt-6 mb-4">
                          <h4 className="text-lg font-semibold text-center text-white mb-4">HEAD-TO-HEAD</h4>
                        </div>
                        
                        <div className="space-y-3">
                          {headToHeadData.map((encounter, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-800/50 rounded-lg p-4">
                              <div className="text-sm text-gray-400 min-w-[100px]">{encounter.date}</div>
                              <div className="flex items-center justify-center flex-1">
                                <div className="text-center">
                                  <div className="text-white font-medium text-sm">
                                    {encounter.homeTeam} <span className="text-yellow-400 font-bold mx-3">{encounter.score}</span> {encounter.awayTeam}
                                  </div>
                                </div>
                              </div>
                              <div className="text-sm text-gray-400 min-w-[120px] text-right">{encounter.competition}</div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
    </div>
  );
};

// Main FullTimeSummary component
const FullTimeSummary: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiDataLoading, setApiDataLoading] = useState(true);

  useEffect(() => {
    const fetchMatch = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setApiDataLoading(true);
        
        // Fetch match data from API
        const matchData = await getMatchById(id);
        setMatch(matchData);
      } catch (err: any) {
        setError(err.message || 'Failed to load match data');
        setApiDataLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
  }, [id]);

  // Helper functions
  const getActiveService = () => 'highlightly';
  const isPreSeasonMatch = () => false;
  const getNoDataMessage = (type: string) => {
    if (type === 'standings') return 'League standings are not available for this competition';
    if (type === 'form') return 'Team form data is not available for these teams';
    return 'Data not available';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-lg font-medium">Loading Match Summary...</div>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-lg font-medium mb-4">
            {error || 'Match not found'}
          </div>
          <button 
            onClick={() => navigate('/')} 
            className="bg-yellow-500 text-black px-6 py-3 rounded-lg font-medium hover:bg-yellow-400 transition-colors"
          >
            Back to Matches
          </button>
        </div>
      </div>
    );
  }

  // Calculate the season for standings - use proper football season logic
  // Football seasons span two years: 2024-25 season runs from Aug 2024 to May 2025
  // For API calls, this is represented as the starting year (2024)
  const matchDate = new Date(match.date);
  const matchYear = matchDate.getFullYear();
  const matchMonth = matchDate.getMonth() + 1; // getMonth() is 0-indexed
  
  // If match is in Jan-May, it belongs to the previous year's season
  // If match is in Jun-Dec, it belongs to the current year's season
  const seasonYear = matchMonth <= 5 ? matchYear - 1 : matchYear;
  const matchSeason = seasonYear.toString();
  
  // Create formatted season display (e.g., "2024-25 Season")
  const formattedSeason = `${seasonYear}-${(seasonYear + 1).toString().slice(-2)}`;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Back Home Button */}
        <div className="flex justify-start">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 bg-gray-800/50 hover:bg-gray-700/50 text-white px-4 py-2 rounded-lg transition-colors border border-gray-600/50 hover:border-gray-500"
          >
            <ArrowLeft size={16} />
            <span className="text-sm font-medium">Back Home</span>
          </button>
        </div>

        {/* Match Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-8 mb-6">
              {/* Home Team */}
              <div className="text-center flex-1">
                <img 
                  src={match.homeTeam.logo} 
                  alt={match.homeTeam.name}
                  className="w-20 h-20 object-contain mx-auto mb-3" 
                />
                <div className="text-white font-medium text-lg">{match.homeTeam.name}</div>
              </div>

              {/* Final Score and Result - Centered */}
              <div className="text-center px-8">
                <div className="text-base font-bold mb-4" style={{ color: '#FF4C4C' }}>
                  FULL TIME
                </div>
                <div className="text-white font-bold mb-2" style={{ fontSize: '64px' }}>
                  {match.score?.home || 0} - {match.score?.away || 0}
                </div>
              </div>

              {/* Away Team */}
              <div className="text-center flex-1">
                <img 
                  src={match.awayTeam.logo} 
                  alt={match.awayTeam.name}
                  className="w-20 h-20 object-contain mx-auto mb-3" 
                />
                <div className="text-white font-medium text-lg">{match.awayTeam.name}</div>
              </div>
            </div>

            {/* Match Timeline - Below everything but in same container */}
            <div className="mt-8 pt-6">
              <div className="max-w-lg mx-auto relative">
                {/* Fade overlay for top */}
                <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none"></div>
                
                <CompactMatchTimeline homeTeam={match.homeTeam} awayTeam={match.awayTeam} matchEvents={match.events} />
                
                {/* Fade overlay for bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none"></div>
              </div>
              
              {/* Match Date - Below timeline */}
              <div className="text-center text-gray-400 text-sm mt-6">
                <Clock size={14} className="inline mr-1" />
                {new Date(match.date).toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long', 
                  day: 'numeric'
                })} • {new Date(match.date).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  hour12: false 
                })}
              </div>
            </div>
          </div>

          {/* Video Highlights */}
          <div 
            className="rounded-xl p-6 border overflow-hidden"
            style={{
              background: '#000000',
              border: '1px solid #1B1B1B'
            }}
          >
          <h4 className="text-lg font-semibold mb-4 text-center text-white">MATCH HIGHLIGHTS</h4>
          
            {match.videoUrl && isValidVideoUrl(match.videoUrl) ? (
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <iframe
                  src={getVideoEmbedUrl(match.videoUrl)}
                  title={`${match.homeTeam.name} vs ${match.awayTeam.name} Highlights`}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="text-center py-8">
                    <div className="text-gray-400 text-sm">
                  <div className="mb-3">
                    <div className="w-16 h-16 bg-gray-800/50 rounded-full mx-auto flex items-center justify-center mb-4">
                      <div className="w-8 h-8 border-l-4 border-white/80 rounded-full animate-spin"></div>
                    </div>
                  </div>
                  <p className="text-white font-medium text-base mb-3">Highlights Coming Soon</p>
                  <p className="text-sm mb-4 max-w-md mx-auto">
                    Match highlights are being processed and will be available shortly after the final whistle. 
                    Our team is working to bring you the best moments from this match.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center text-xs">
                    <div className="flex items-center text-blue-400">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
                      Usually available within 2-4 hours
                    </div>
                    <span className="hidden sm:inline text-gray-600">•</span>
                    <button 
                      onClick={() => {
                        window.location.href = 'mailto:support@leaguelens.com?subject=Match%20Highlights%20Request&body=Hi,%20I%27m%20looking%20for%20highlights%20for%20the%20match%20' + encodeURIComponent(`${match.homeTeam.name} vs ${match.awayTeam.name}`) + '%20on%20' + encodeURIComponent(new Date(match.date).toLocaleDateString());
                      }}
                      className="text-yellow-400 hover:text-yellow-300 transition-colors underline"
                    >
                      Contact Support
                    </button>
                  </div>
                    </div>
                  </div>
            )}
          </div>

          {/* Match Stats */}
          <div 
            className="rounded-xl p-6 border overflow-hidden"
            style={{
              background: '#000000',
              border: '1px solid #1B1B1B'
            }}
          >
            <h4 className="text-lg font-semibold mb-6 text-center text-white">MATCH STATISTICS</h4>
            
            <MatchStatsChart homeTeam={match.homeTeam} awayTeam={match.awayTeam} matchStatistics={match.statistics} />
        </div>

        {/* Team Lineups */}
          <div 
            className="rounded-xl p-6 border overflow-hidden"
            style={{
              background: '#000000',
              border: '1px solid #1B1B1B'
            }}
          >
          <h4 className="text-lg font-semibold mb-6 text-center text-white">TEAM LINEUPS</h4>
            
          <TeamLineupsChart homeTeam={match.homeTeam} awayTeam={match.awayTeam} lineups={match.lineups} />
          </div>

        {/* League Standings */}
        <div 
          className="rounded-xl p-6 border overflow-hidden"
          style={{
            background: '#000000',
            border: '1px solid #1B1B1B'
          }}
        >
          <h4 className="text-lg font-semibold mb-6 text-center text-white">LEAGUE STANDINGS</h4>
          
          <LeagueStandingsChart 
            homeTeam={match.homeTeam} 
            awayTeam={match.awayTeam} 
            competition={match.competition}
            matchSeason={formattedSeason}
          />
        </div>

        {/* Last Matches Form */}
        <div 
          className="rounded-xl p-6 border overflow-hidden"
          style={{
            background: '#000000',
            border: '1px solid #1B1B1B'
          }}
        >
          <h4 className="text-lg font-semibold mb-6 text-center text-white">LAST MATCHES</h4>
          
          <TeamFormChart 
            homeTeam={match.homeTeam} 
            awayTeam={match.awayTeam} 
            apiSeason={matchSeason}
            competition={match.competition}
          />
      </div>
        </div>
      </div>
  );
};

// Team Lineups Chart Component
const TeamLineupsChart: React.FC<{ homeTeam: any; awayTeam: any; lineups?: any }> = ({ 
  homeTeam, 
  awayTeam, 
  lineups 
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'away'>('home');

  if (!lineups || (!lineups.homeTeam && !lineups.awayTeam)) {
    return (
      <div className="text-center py-8">
                    <div className="text-gray-400 text-sm">
          <div className="mb-3">
            <div className="w-16 h-16 bg-gray-800/50 rounded-full mx-auto flex items-center justify-center mb-4">
              <div className="w-8 h-8 border-l-4 border-white/80 rounded-full animate-spin"></div>
                    </div>
                  </div>
          <p className="text-white font-medium text-base mb-3">Lineups Coming Soon</p>
          <p className="text-sm mb-4 max-w-md mx-auto">
            Team lineups will be available 30 minutes before kickoff or shortly after the match begins.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center text-xs">
            <div className="flex items-center text-blue-400">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
              Usually available 30 minutes before kickoff
                  </div>
                            </div>
                      </div>
                            </div>
                          );
  }

  const renderTeamLineup = (team: any, isHome: boolean) => {
    if (!team || !team.initialLineup || !team.formation) {
                            return (
        <div className="text-center text-gray-400 text-sm py-8">
          <p>Lineup not available for this team</p>
                              </div>
                            );
    }

                            return (
      <div className="space-y-6">
        {/* Team Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <img 
              src={team.logo} 
              alt={team.name}
              className="w-10 h-10 object-contain" 
            />
            <div className="text-white font-medium text-lg">{team.name}</div>
                              </div>
          <div className="text-yellow-400 text-sm font-medium">
            Formation: {team.formation}
                        </div>
                      </div>

        {/* Formation Visualization */}
        <div className="relative bg-green-900/20 rounded-lg p-4 min-h-[300px] border border-green-700/30">
          {/* Field Lines */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="w-full h-full border border-white/20 rounded-lg relative">
              {/* Center Line */}
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20"></div>
              {/* Center Circle */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-white/20 rounded-full"></div>
              {/* Goal Areas */}
              <div className="absolute top-1/3 left-0 w-4 h-1/3 border-r border-t border-b border-white/20"></div>
              <div className="absolute top-1/3 right-0 w-4 h-1/3 border-l border-t border-b border-white/20"></div>
                              </div>
                        </div>
                        
          {/* Players by Formation Rows */}
          <div className="relative z-10 h-full flex flex-col justify-between py-2">
            {team.initialLineup.map((row: any[], rowIndex: number) => (
              <div key={rowIndex} className="flex justify-center space-x-2">
                {row.map((player: any, playerIndex: number) => (
                  <div 
                    key={playerIndex}
                    className="bg-black/60 border border-yellow-400/50 rounded-lg p-2 text-center min-w-[80px] backdrop-blur-sm"
                  >
                    <div className="text-yellow-400 text-xs font-bold mb-1">
                      #{player.number}
                        </div>
                    <div className="text-white text-xs font-medium leading-tight">
                      {player.name}
                              </div>
                    <div className="text-gray-400 text-xs mt-1">
                      {player.position}
                        </div>
                      </div>
                ))}
                              </div>
            ))}
                        </div>
                        </div>
                        
        {/* Substitutes */}
        {team.substitutes && team.substitutes.length > 0 && (
          <div className="mt-4">
            <h5 className="text-white font-medium text-sm mb-2">Substitutes</h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {team.substitutes.map((sub: any, index: number) => (
                <div 
                  key={index}
                  className="bg-gray-800/50 border border-gray-600/50 rounded p-2 text-center"
                >
                  <div className="text-yellow-400 text-xs font-bold">
                    #{sub.number}
                              </div>
                  <div className="text-white text-xs font-medium">
                    {sub.name}
                        </div>
                  <div className="text-gray-400 text-xs">
                    {sub.position}
                      </div>
                            </div>
                          ))}
                    </div>
        </div>
      )}
          </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Team Tabs */}
      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-8 justify-center">
          <button
            onClick={() => setActiveTab('home')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2
              ${activeTab === 'home' 
                ? 'border-yellow-400 text-yellow-400' 
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
          >
            <img 
              src={homeTeam.logo} 
              alt={homeTeam.name}
              className="w-5 h-5 object-contain" 
            />
            {homeTeam.name}
          </button>
          <button
            onClick={() => setActiveTab('away')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2
              ${activeTab === 'away' 
                ? 'border-yellow-400 text-yellow-400' 
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
          >
            <img 
              src={awayTeam.logo} 
              alt={awayTeam.name}
              className="w-5 h-5 object-contain" 
            />
            {awayTeam.name}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'home' && renderTeamLineup(lineups.homeTeam, true)}
        {activeTab === 'away' && renderTeamLineup(lineups.awayTeam, false)}
        </div>
    </div>
  );
};

export default FullTimeSummary; 