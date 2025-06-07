import React from 'react';
import { Target, UserMinus, UserPlus, Square } from 'lucide-react';

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
  
  return matchEvents
    .map((event: any, index: number): ScorelineEvent | null => {
      try {
        let eventType: ScorelineEvent['type'];
        const apiType = event.type?.toLowerCase() || '';
        
        // Only process key events: goals, cards, and substitutions
        if (apiType.includes('goal') || apiType === 'goal') {
          eventType = 'goal';
        } else if (apiType.includes('penalty') || apiType === 'penalty') {
          eventType = 'penalty';
        } else if (apiType.includes('own') && apiType.includes('goal')) {
          eventType = 'own_goal';
        } else if (apiType.includes('yellow') || apiType === 'yellow card') {
          eventType = 'yellow_card';
        } else if (apiType.includes('red') || apiType === 'red card') {
          eventType = 'red_card';
        } else if (apiType.includes('substitution') || apiType === 'subst') {
          eventType = 'substitution';
        } else {
          return null; // Skip other events (VAR, fouls, etc.)
        }
        
        // Determine which team this event belongs to using the same logic as MatchTimeline
        let team: 'home' | 'away' = 'home'; // default to home
        
        if (event.team && event.team.id) {
          const eventTeamId = Number(event.team.id);
          const homeTeamId = Number(homeTeam?.id);
          const awayTeamId = Number(awayTeam?.id);
          
          console.log(`[ScorelineTimeline] Event analysis:`, {
            eventPlayer: event.player,
            eventTeamId,
            eventTeamName: event.team.name,
            homeTeamId,
            homeTeamName: homeTeam?.name,
            awayTeamId,
            awayTeamName: awayTeam?.name,
            isEventHomeTeam: eventTeamId === homeTeamId,
            isEventAwayTeam: eventTeamId === awayTeamId
          });
          
                  if (eventTeamId === homeTeamId) {
          team = 'home';
          console.log(`[ScorelineTimeline] ✅ ${event.player} (${event.team.name}) -> HOME side (left)`);
        } else if (eventTeamId === awayTeamId) {
          team = 'away';
          console.log(`[ScorelineTimeline] ✅ ${event.player} (${event.team.name}) -> AWAY side (right)`);
        } else {
            console.warn(`[ScorelineTimeline] ⚠️  Unknown team for ${event.player}:`, {
              eventTeamId,
              homeTeamId,
              awayTeamId
            });
          }
        }
        
        const playerName = event.player || 'Unknown Player';
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
          description = event.detail || 'Match event';
        }
        
        const timeData = parseEventTime(event.time || '0');
        
        return {
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
      } catch (err) {
        console.error('Error processing scoreline event:', event, err);
        return null;
      }
    })
    .filter((action): action is ScorelineEvent => action !== null)
    .sort((a, b) => a.minute - b.minute);
};

const ScorelineTimeline: React.FC<{ homeTeam: any; awayTeam: any; matchEvents?: any[] }> = ({ 
  homeTeam, 
  awayTeam, 
  matchEvents 
}) => {
  const events = getScorelineEventsFromAPI(matchEvents || [], homeTeam, awayTeam);

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

  return (
    <div className="space-y-4">
      {/* Scoreline Events with Key Events Design */}
      <div className="relative max-h-96 overflow-visible px-2 min-w-[600px]">
        {/* Extended center line that goes all the way through */}
        <div className="absolute left-1/2 -top-32 -bottom-32 w-px transform -translate-x-1/2 bg-gradient-to-b from-transparent from-0% via-gray-600/30 via-20% via-gray-600 via-50% via-gray-600 via-80% via-gray-600/30 to-transparent to-100% z-0"></div>
        
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
                        
                        {/* Time */}
                        <div className="text-white text-xs font-bold flex-shrink-0 min-w-[40px] text-center mr-1">
                          {event.time}
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
                        <div className="flex items-center justify-center flex-shrink-0 mr-1">
                          {getEventIcon(event.type)}
                        </div>
                        
                        {/* Time */}
                        <div className="text-white text-xs font-bold flex-shrink-0 min-w-[40px] text-center mr-2">
                          {event.time}
                        </div>
                        
                        {/* Player info (farthest from center) */}
                        <div className="flex-1 min-w-0">
                          <div className="text-gray-200 text-sm font-medium truncate">
                            {event.player}
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
    </div>
  );
};

export default ScorelineTimeline; 