import React from 'react';
import { Target, UserMinus, UserPlus, Square, Clock } from 'lucide-react';

interface ScorelineEvent {
  id: string;
  minute: number;
  time: string;
  type: 'goal' | 'penalty' | 'own_goal' | 'yellow_card' | 'red_card' | 'substitution';
  team: 'home' | 'away';
  player: string;
  playerOut?: string;
  assist?: string;
  description: string;
}

const parseEventTime = (timeString: string): { minute: number; displayTime: string } => {
  if (!timeString) return { minute: 0, displayTime: '0\'' };
  
  // Handle stoppage time format like "90'+1'" or "45+3"
  if (timeString.includes('+')) {
    const parts = timeString.split('+');
    const mainTime = parseInt(parts[0].replace(/[^0-9]/g, ''), 10) || 0;
    const stoppage = parseInt(parts[1].replace(/[^0-9]/g, ''), 10) || 0;
    
    return {
      minute: mainTime + stoppage, // For sorting purposes
      displayTime: `${mainTime}'+${stoppage}'`
    };
  }
  
  // Regular time
  const minute = parseInt(timeString.replace(/[^0-9]/g, ''), 10) || 0;
  return {
    minute,
    displayTime: `${minute}'`
  };
};

const getScorelineEventsFromAPI = (matchEvents: any[], homeTeam: any, awayTeam: any): ScorelineEvent[] => {
  if (!matchEvents || !Array.isArray(matchEvents)) return [];
  
  console.log(`[ScorelineTimeline] Processing ${matchEvents.length} events for scoreline...`);
  console.log(`[ScorelineTimeline] Home team:`, { id: homeTeam?.id, name: homeTeam?.name });
  console.log(`[ScorelineTimeline] Away team:`, { id: awayTeam?.id, name: awayTeam?.name });
  console.log(`[ScorelineTimeline] Sample event structure:`, matchEvents[0]);
  
  return matchEvents
    .map((event: any, index: number): ScorelineEvent | null => {
      try {
        let eventType: ScorelineEvent['type'];
        const apiType = event.type?.toLowerCase() || event.event_type?.toLowerCase() || '';
        
        // Only process key events: goals, cards, and substitutions
        if (apiType.includes('goal') && !apiType.includes('own')) {
          eventType = 'goal';
        } else if (apiType.includes('penalty')) {
          eventType = 'penalty';
        } else if (apiType.includes('own') && apiType.includes('goal')) {
          eventType = 'own_goal';
        } else if (apiType.includes('yellow')) {
          eventType = 'yellow_card';
        } else if (apiType.includes('red')) {
          eventType = 'red_card';
        } else if (apiType.includes('substitution')) {
          eventType = 'substitution';
        } else {
          return null; // Skip other events (VAR, fouls, etc.)
        }
        
        // Determine which team this event belongs to - use our database structure
        let team: 'home' | 'away' = 'home'; // default to home
        
        // Our database stores team_id directly, not nested in team object
        const eventTeamId = Number(event.team_id);
        const homeTeamId = Number(homeTeam?.id);
        const awayTeamId = Number(awayTeam?.id);
        
        console.log(`[ScorelineTimeline] Event analysis:`, {
          eventPlayer: event.player_name || event.player,
          eventType: apiType,
          eventTeamId,
          homeTeamId,
          awayTeamId,
          isEventHomeTeam: eventTeamId === homeTeamId,
          isEventAwayTeam: eventTeamId === awayTeamId
        });
        
        if (eventTeamId === homeTeamId) {
          team = 'home';
          console.log(`[ScorelineTimeline] ✅ ${event.player_name || event.player} -> HOME side (left)`);
        } else if (eventTeamId === awayTeamId) {
          team = 'away';
          console.log(`[ScorelineTimeline] ✅ ${event.player_name || event.player} -> AWAY side (right)`);
        } else {
          console.warn(`[ScorelineTimeline] ⚠️  Unknown team for ${event.player_name || event.player}:`, {
            eventTeamId,
            homeTeamId,
            awayTeamId
          });
        }
        
        const playerName = event.player_name || event.player || 'Unknown Player';
        const playerOut = event.substituted || undefined;
        const assist = event.assist || undefined;
        
        let description = '';
        if (eventType === 'goal' || eventType === 'penalty') {
          description = assist ? `Assisted by ${assist}` : 'Goal scored';
        } else if (eventType === 'substitution') {
          description = playerOut ? `Substituted for ${playerOut}` : 'Substitution';
        } else if (eventType === 'yellow_card' || eventType === 'red_card') {
          description = 'Card shown';
        } else {
          description = event.description || event.detail || 'Match event';
        }
        
        // Use minute field from our database, fallback to time field
        const eventTime = event.minute || event.time || '0';
        const timeData = parseEventTime(eventTime.toString());
        
        const processedEvent = {
          id: `scoreline-event-${index}`,
          minute: timeData.minute,
          time: timeData.displayTime,
          type: eventType,
          team,
          player: playerName,
          playerOut,
          assist,
          description
        };
        
        console.log(`[ScorelineTimeline] Processed event:`, processedEvent);
        return processedEvent;
      } catch (err) {
        console.error('Error processing scoreline event:', event, err);
        return null;
      }
    })
    .filter((action): action is ScorelineEvent => action !== null)
    .sort((a, b) => b.minute - a.minute);
};

const ScorelineTimeline: React.FC<{ 
  homeTeam: any; 
  awayTeam: any; 
  matchEvents?: any[];
  matchDate?: string;
  matchTime?: string;
}> = ({ 
  homeTeam, 
  awayTeam, 
  matchEvents,
  matchDate,
  matchTime
}) => {
  // Top-level debugging of incoming events
  console.log(`[ScorelineTimeline] Component rendering with:`, {
    eventsCount: matchEvents?.length || 0,
    homeTeamName: homeTeam?.name,
    awayTeamName: awayTeam?.name,
    hasValidEvents: Array.isArray(matchEvents) && matchEvents.length > 0,
    matchDate,
    firstTwoEvents: matchEvents?.slice(0, 2) || [],
    allEvents: matchEvents
  });
  
  const events = getScorelineEventsFromAPI(matchEvents || [], homeTeam, awayTeam);

  const formatMatchDateTime = (date?: string, time?: string): string => {
    if (!date) return '';
    
    try {
      const matchDate = new Date(date);
      const dayName = matchDate.toLocaleDateString('en-US', { weekday: 'long' });
      const monthName = matchDate.toLocaleDateString('en-US', { month: 'long' });
      const day = matchDate.getDate();
      
      // Extract time from date string or use provided time
      let timeString = '';
      if (time) {
        timeString = time;
      } else {
        // Try to extract time from the date string
        const timeMatch = date.match(/(\d{2}):(\d{2})/);
        if (timeMatch) {
          timeString = `${timeMatch[1]}:${timeMatch[2]}`;
        } else {
          timeString = matchDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });
        }
      }
      
      return `${timeString}, ${dayName}, ${monthName} ${day}`;
    } catch (error) {
      console.error('Error formatting match date:', error);
      return '';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'goal':
      case 'penalty':
        return <Target size={12} className="text-gray-300" />;
      case 'own_goal':
        return <Target size={12} className="text-gray-300" />;
      case 'yellow_card':
        return <Square size={12} className="text-yellow-400 fill-current" />;
      case 'red_card':
        return <Square size={12} className="text-red-500 fill-current" />;
      case 'substitution':
        return <div className="flex items-center gap-0.5">
          <UserMinus size={12} className="text-gray-300" />
          <UserPlus size={12} className="text-gray-300" />
        </div>;
      default:
        return <Target size={12} className="text-gray-300" />;
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'goal': return 'Goal';
      case 'penalty': return 'Penalty Goal';
      case 'own_goal': return 'Own Goal';
      case 'yellow_card': return 'Yellow Card';
      case 'red_card': return 'Red Card';
      case 'substitution': return 'Substitution';
      default: return 'Event';
    }
  };

  const getEventContainerStyle = (type: string, isHome: boolean) => {
    return "shadow-sm bg-[#1F1F1F]";
  };

  if (!events.length) {
    return (
      <div className="text-center py-8">
        <Target size={32} className="mx-auto mb-2 text-gray-400" />
        <p className="text-gray-400">No key events in this match</p>
      </div>
    );
  }

  console.log(`[ScorelineTimeline] Rendering ${events.length} processed events`);

  return (
    <div className="space-y-4">
      {/* Scoreline Events with Key Events Design */}
      <div className="relative max-h-96 overflow-hidden px-2 min-w-[600px]">
        {/* Center line with subtle faded edges */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[3px] transform -translate-x-1/2 z-0" style={{
          background: 'linear-gradient(to bottom, transparent 0%, #4B4B4B 10%, #4B4B4B 90%, transparent 100%)'
        }}></div>
        
        {/* Bottom fade overlay only */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black to-transparent z-20 pointer-events-none"></div>
        
        <div className="space-y-3 pb-4 relative z-10 overflow-y-auto max-h-96">
          {events.map((event, index) => {
            const isHome = event.team === 'home';
            
            return (
              <div key={event.id} className="relative flex items-center min-h-[80px]">
                {/* Home team events (left side) */}
                {isHome ? (
                  <>
                    <div className="flex-1 flex justify-end">
                      <div 
                        className={`${getEventContainerStyle(event.type, true)} p-4 max-w-[220px] min-w-[180px] flex items-center mr-4`}
                        style={{ borderRadius: '18px' }}
                      >
                        {/* Player info (farthest from center) */}
                        <div className="flex-1 min-w-0 text-right mr-2">
                          <div className="text-gray-200 text-sm font-medium truncate">
                            {event.player}
                          </div>
                          <div className="text-blue-400 text-xs truncate mt-[2px]">
                            {getEventLabel(event.type)}
                          </div>
                          {event.assist && (
                            <div className="text-gray-400 text-xs truncate mt-[5px]">
                              Assist: {event.assist}
                            </div>
                          )}
                          {event.playerOut && (
                            <div className="text-gray-400 text-xs truncate mt-[5px]">
                              Out: {event.playerOut}
                            </div>
                          )}
                        </div>
                        
                        {/* Event Icon (closest to center) */}
                        <div className="flex items-center justify-center flex-shrink-0">
                          {getEventIcon(event.type)}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1"></div>
                  </>
                ) : (
                  <>
                    <div className="flex-1"></div>
                    <div className="flex-1 flex justify-start">
                      <div 
                        className={`${getEventContainerStyle(event.type, false)} p-4 max-w-[220px] min-w-[180px] flex items-center ml-4`}
                        style={{ borderRadius: '18px' }}
                      >
                        {/* Event Icon (closest to center) */}
                        <div className="flex items-center justify-center flex-shrink-0 mr-2">
                          {getEventIcon(event.type)}
                        </div>
                        
                        {/* Player info (farthest from center) */}
                        <div className="flex-1 min-w-0">
                          <div className="text-gray-200 text-sm font-medium truncate">
                            {event.player}
                          </div>
                          <div className="text-red-400 text-xs truncate mt-[2px]">
                            {getEventLabel(event.type)}
                          </div>
                          {event.assist && (
                            <div className="text-gray-400 text-xs truncate mt-[5px]">
                              Assist: {event.assist}
                            </div>
                          )}
                          {event.playerOut && (
                            <div className="text-gray-400 text-xs truncate mt-[5px]">
                              Out: {event.playerOut}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Match Date and Time */}
      {matchDate && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Clock size={14} style={{ color: '#727272' }} />
          <span className="text-sm" style={{ color: '#727272' }}>
            {formatMatchDateTime(matchDate, matchTime)}
          </span>
        </div>
      )}
    </div>
  );
};

export default ScorelineTimeline; 