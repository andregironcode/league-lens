import React from 'react';
import { Clock, Target, UserMinus, UserPlus, Square, AlertTriangle } from 'lucide-react';

interface MatchAction {
  id: string;
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'own_goal' | 'penalty' | 'var';
  team: 'home' | 'away';
  player: string;
  playerOut?: string;
  assist?: string;
  description: string;
}

const getMatchActionsFromAPI = (matchEvents: any[], homeTeam: any, awayTeam: any): MatchAction[] => {
  if (!matchEvents || !Array.isArray(matchEvents)) return [];
  
  return matchEvents
    .map((event: any, index: number): MatchAction | null => {
      try {
        let eventType: MatchAction['type'];
        const apiType = event.type?.toLowerCase() || '';
        
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
        } else if (apiType.includes('var')) {
          eventType = 'var';
        } else {
          return null;
        }
        
        // Determine which team this event belongs to
        let team: 'home' | 'away' = 'home'; // default to home
        
        if (event.team && event.team.id) {
          const eventTeamId = Number(event.team.id);
          const homeTeamId = Number(homeTeam?.id);
          const awayTeamId = Number(awayTeam?.id);
          
          console.log(`[Timeline] Event analysis:`, {
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
            console.log(`[Timeline] ✅ ${event.player} (${event.team.name}) -> HOME side (left)`);
          } else if (eventTeamId === awayTeamId) {
            team = 'away';
            console.log(`[Timeline] ✅ ${event.player} (${event.team.name}) -> AWAY side (right)`);
          } else {
            console.warn(`[Timeline] ⚠️  Unknown team for ${event.player}:`, {
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
        
        return {
          id: `api-event-${index}`,
          minute: parseInt(event.time?.replace(/[^0-9]/g, '') || '0'),
          type: eventType,
          team,
          player: playerName,
          playerOut,
          assist,
          description
        };
      } catch (err) {
        console.error('Error processing match event:', event, err);
        return null;
      }
    })
    .filter((action): action is MatchAction => action !== null)
    .sort((a, b) => a.minute - b.minute);
};

const MatchTimeline: React.FC<{ homeTeam: any; awayTeam: any; matchEvents?: any[] }> = ({ 
  homeTeam, 
  awayTeam, 
  matchEvents 
}) => {
  const actions = getMatchActionsFromAPI(matchEvents || [], homeTeam, awayTeam);

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'goal':
      case 'penalty':
        return <Target size={16} className="text-gray-300" />;
      case 'own_goal':
        return <Target size={16} className="text-gray-300" />;
      case 'yellow_card':
        return <Square size={12} className="text-yellow-400 fill-current" />;
      case 'red_card':
        return <Square size={12} className="text-red-500 fill-current" />;
      case 'substitution':
        return <div className="flex items-center">
          <UserMinus size={12} className="text-gray-300" />
          <UserPlus size={12} className="text-gray-300 ml-1" />
        </div>;
      case 'var':
        return <AlertTriangle size={16} className="text-gray-300" />;
      default:
        return <Clock size={16} className="text-gray-300" />;
    }
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'goal': return 'Goal';
      case 'penalty': return 'Penalty Goal';
      case 'own_goal': return 'Own Goal';
      case 'yellow_card': return 'Yellow Card';
      case 'red_card': return 'Red Card';
      case 'substitution': return 'Substitution';
      case 'var': return 'VAR';
      default: return 'Event';
    }
  };

  if (!actions.length) {
    return (
      <div className="text-center py-8">
        <Clock size={32} className="mx-auto mb-2 text-gray-400" />
        <p className="text-gray-400">No match events available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline Events with New Design */}
      <div className="relative max-h-96 overflow-y-auto px-2 min-w-[600px]">
        {/* Center separator line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-600 transform -translate-x-1/2"></div>
        
        <div className="space-y-3 pb-4">
          {actions.map((action, index) => {
            const isHome = action.team === 'home';
            
            return (
              <div key={action.id} className="relative flex items-center min-h-[80px]">
                {/* Home team events (left side) */}
                {isHome ? (
                  <>
                    <div className="flex-1 flex justify-end pr-8">
                      <div 
                        className="bg-gray-800 border border-gray-700 p-4 max-w-[280px] min-w-[240px] flex items-center gap-3"
                        style={{ borderRadius: '18px' }}
                      >
                        {/* Icon */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-700 border border-gray-600 flex-shrink-0">
                          {getActionIcon(action.type)}
                        </div>
                        
                        {/* Time */}
                        <div className="text-white text-base font-bold flex-shrink-0 min-w-[40px]">
                          {action.minute}'
                        </div>
                        
                        {/* Player info */}
                        <div className="flex-1 min-w-0 text-left">
                          <div className="text-gray-200 text-sm font-medium truncate">
                            {action.player}
                          </div>
                          {action.assist && (
                            <div className="text-gray-400 text-xs truncate">
                              Assist: {action.assist}
                            </div>
                          )}
                          {action.playerOut && (
                            <div className="text-gray-400 text-xs truncate">
                              Out: {action.playerOut}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1"></div>
                  </>
                ) : (
                  <>
                    <div className="flex-1"></div>
                    <div className="flex-1 flex justify-start pl-8">
                      <div 
                        className="bg-gray-800 border border-gray-700 p-4 max-w-[280px] min-w-[240px] flex items-center gap-3"
                        style={{ borderRadius: '18px' }}
                      >
                        {/* Player info */}
                        <div className="flex-1 min-w-0 text-right">
                          <div className="text-gray-200 text-sm font-medium truncate">
                            {action.player}
                          </div>
                          {action.assist && (
                            <div className="text-gray-400 text-xs truncate">
                              Assist: {action.assist}
                            </div>
                          )}
                          {action.playerOut && (
                            <div className="text-gray-400 text-xs truncate">
                              Out: {action.playerOut}
                            </div>
                          )}
                        </div>
                        
                        {/* Time */}
                        <div className="text-white text-base font-bold flex-shrink-0 min-w-[40px]">
                          {action.minute}'
                        </div>
                        
                        {/* Icon */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-700 border border-gray-600 flex-shrink-0">
                          {getActionIcon(action.type)}
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

export default MatchTimeline; 