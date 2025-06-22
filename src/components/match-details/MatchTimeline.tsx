import React, { useState } from 'react';
import { Clock, Target, UserMinus, UserPlus, Square, AlertTriangle, CheckCircle, XCircle, Flag, ChevronDown, Play, Flag as FlagIcon, Timer, Tv2, ArrowRightLeft, PauseCircle } from 'lucide-react';
import { MatchEvent, Team, Match } from '@/types';

/**
 * Helper functions for event visualization and description
 */

// Event icon map based on event type
const getEventIcon = (type: string) => {
  if (!type) return <Clock size={24} className="text-gray-400" />;
  
  const t = type.toLowerCase();
  
  // Match phases
  if (t.includes('kickoff') && t.includes('1')) return <Play size={24} className="text-green-400" />;
  if (t.includes('kickoff') && t.includes('2')) return <Play size={24} className="text-blue-400" />;
  if (t.includes('half-time') || t.includes('halftime')) return <PauseCircle size={24} className="text-yellow-400" />;
  if (t.includes('full-time') || t.includes('fulltime') || t.includes('end')) return <Timer size={24} className="text-red-400" />;
  if (t.includes('var')) return <Tv2 size={24} className="text-purple-400" />;
  
  // Regular events
  if (t.includes('goal') && !t.includes('cancel')) return <Target size={24} className="text-yellow-400" />;
  if (t.includes('kick') || t.includes('off')) return <FlagIcon size={24} className="text-white" />;
  if (t.includes('cancel')) return <XCircle size={24} className="text-white" />;
  if (t.includes('penalty')) return <FlagIcon size={24} className="text-yellow-400" />;
  if (t.includes('substitution')) return <ArrowRightLeft size={24} className="text-blue-300" />;
  if (t.includes('card')) return <Square size={24} className={t.includes('yellow') ? "text-yellow-400" : "text-red-500"} />;
  
  // Default
  return <Clock size={24} className="text-gray-400" />;
};

// Generate event description based on type
const getEventDescription = (event: any) => {
  if (!event) return null;
  
  const type = (event.type || '').toLowerCase();
  let description = '';
  
  // Special event descriptions
  if (type.includes('kickoff') && type.includes('1')) {
    return 'First half begins';
  } else if (type.includes('kickoff') && type.includes('2')) {
    return 'Second half begins';
  } else if (type.includes('half-time') || type.includes('halftime')) {
    return 'Half-time break';
  } else if (type.includes('full-time') || type.includes('fulltime') || type.includes('end')) {
    return 'Match ended';
  } else if (type.includes('var')) {
    return 'VAR Review: ' + (event.description || 'Checking incident');
  }
  
  return event.description || null;
};

interface MatchTimelineProps {
  matchEvents?: any[];
  homeTeam?: Team;
  awayTeam?: Team;
}

const MatchTimeline: React.FC<MatchTimelineProps> = ({ matchEvents, homeTeam, awayTeam }) => {
  const [showAllEvents, setShowAllEvents] = useState(false);

  if (!matchEvents || !Array.isArray(matchEvents) || matchEvents.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock size={32} className="mx-auto mb-2 text-gray-400" />
        <p className="text-gray-400">No match events available</p>
      </div>
    );
  }

  // Separate events by team
  const homeEvents = matchEvents.filter(event => 
    event.team === homeTeam?.name || event.team_id === homeTeam?.id
  );
  
  const awayEvents = matchEvents.filter(event => 
    event.team === awayTeam?.name || event.team_id === awayTeam?.id
  );

  // Neutral events (kickoff, halftime, fulltime, VAR)
  const neutralEvents = matchEvents.filter(event => {
    const t = (event.type || '').toLowerCase();
    return t.includes('kickoff') || t.includes('half-time') || t.includes('halftime') || 
           t.includes('full-time') || t.includes('fulltime') || t.includes('end') || 
           t.includes('var');
  });

  // Check if we have proper minute data or if all events are at minute 0
  const hasProperMinutes = matchEvents.some(e => (e.minute || 0) > 0);
  
  // If all events are at minute 0, display them in order without minute grouping
  if (!hasProperMinutes) {
    const displayedEvents = showAllEvents ? matchEvents : matchEvents.slice(0, 10);
    
    return (
      <div className="w-full max-w-4xl mx-auto py-6">
        {/* Team Headers */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Home Team Header */}
          <div className="flex items-center justify-end space-x-3">
            <span className="text-lg font-bold text-blue-300">{homeTeam?.name}</span>
            <img 
              src={homeTeam?.logo || '/public/teams/default.png'} 
              alt={homeTeam?.name} 
              className="w-8 h-8 object-contain"
            />
          </div>
          
          {/* Center Timeline Header */}
          <div className="text-center">
            <span className="text-lg font-bold text-gray-300">Match Events</span>
          </div>
          
          {/* Away Team Header */}
          <div className="flex items-center justify-start space-x-3">
            <img 
              src={awayTeam?.logo || '/public/teams/default.png'} 
              alt={awayTeam?.name} 
              className="w-8 h-8 object-contain"
            />
            <span className="text-lg font-bold text-red-300">{awayTeam?.name}</span>
          </div>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {displayedEvents.map((event, idx) => {
            const isHomeEvent = event.team === homeTeam?.name || event.team_id === homeTeam?.id;
            const isAwayEvent = event.team === awayTeam?.name || event.team_id === awayTeam?.id;
            const isNeutralEvent = !isHomeEvent && !isAwayEvent;

            return (
              <div key={idx} className="grid grid-cols-3 gap-4">
                {/* Home team event */}
                <div className="text-right">
                  {isHomeEvent && (
                    <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-3">
                      <div className="flex items-center justify-end space-x-2">
                        {getEventIcon(event.type || '')}
                        <div>
                          <div className="font-bold text-blue-300 text-sm">
                            {event.type?.toUpperCase() || 'EVENT'}
                          </div>
                          {(event.player || event.player_name) && (
                            <div className="text-white text-sm">{event.player || event.player_name}</div>
                          )}
                          {event.description && (
                            <div className="text-gray-300 text-xs">{event.description}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Neutral event */}
                <div className="text-center">
                  {isNeutralEvent && (
                    <div className="bg-gray-800 border border-gray-600 rounded-lg p-2">
                      <div className="flex items-center justify-center space-x-2">
                        {getEventIcon(event.type || '')}
                        <span className="font-bold text-yellow-400 text-sm">
                          {event.type?.toUpperCase() || 'EVENT'}
                        </span>
                      </div>
                      {event.description && (
                        <div className="text-gray-300 text-xs mt-1">{event.description}</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Away team event */}
                <div className="text-left">
                  {isAwayEvent && (
                    <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3">
                      <div className="flex items-center justify-start space-x-2">
                        <div>
                          <div className="font-bold text-red-300 text-sm">
                            {event.type?.toUpperCase() || 'EVENT'}
                          </div>
                          {(event.player || event.player_name) && (
                            <div className="text-white text-sm">{event.player || event.player_name}</div>
                          )}
                          {event.description && (
                            <div className="text-gray-300 text-xs">{event.description}</div>
                          )}
                        </div>
                        {getEventIcon(event.type || '')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Show more/less button */}
        {matchEvents.length > 10 && (
          <div className="text-center mt-8">
            <button 
              onClick={() => setShowAllEvents(!showAllEvents)} 
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
            >
              <span>{showAllEvents ? 'Show Less' : `Show All ${matchEvents.length} Events`}</span>
              <ChevronDown 
                size={18} 
                className={`transition-transform duration-300 ${showAllEvents ? 'transform rotate-180' : ''}`} 
              />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Original timeline view for events with proper minutes
  const allMinutes = [...new Set(matchEvents.map(e => e.minute || 0))].sort((a, b) => a - b);
  const displayedMinutes = showAllEvents ? allMinutes : allMinutes.slice(0, 5);

  return (
    <div className="w-full max-w-4xl mx-auto py-6">
      {/* Team Headers */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Home Team Header */}
        <div className="flex items-center justify-end space-x-3">
          <span className="text-lg font-bold text-blue-300">{homeTeam?.name}</span>
          <img 
            src={homeTeam?.logo || '/public/teams/default.png'} 
            alt={homeTeam?.name} 
            className="w-8 h-8 object-contain"
          />
        </div>
        
        {/* Center Timeline Header */}
        <div className="text-center">
          <span className="text-lg font-bold text-gray-300">Match Events</span>
        </div>
        
        {/* Away Team Header */}
        <div className="flex items-center justify-start space-x-3">
          <img 
            src={awayTeam?.logo || '/public/teams/default.png'} 
            alt={awayTeam?.name} 
            className="w-8 h-8 object-contain"
          />
          <span className="text-lg font-bold text-red-300">{awayTeam?.name}</span>
        </div>
      </div>

      {/* Timeline Events */}
      <div className="relative">
        {/* Central timeline line */}
        <div className="absolute left-1/2 transform -translate-x-0.5 w-1 bg-gray-600 h-full"></div>
        
        {/* Match Start */}
        <div className="relative mb-8">
          <div className="absolute left-1/2 transform -translate-x-1/2 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center z-10">
            <Play size={20} className="text-white" />
          </div>
          <div className="text-center pt-14">
            <span className="text-xl font-bold text-green-400">KICK OFF</span>
          </div>
        </div>

        {/* Events by minute */}
        {displayedMinutes.map((minute, idx) => {
          const minuteHomeEvents = homeEvents.filter(e => e.minute === minute);
          const minuteAwayEvents = awayEvents.filter(e => e.minute === minute);
          const minuteNeutralEvents = neutralEvents.filter(e => e.minute === minute);

          return (
            <div key={minute} className="relative mb-12">
              {/* Minute marker on timeline */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center z-10 border-2 border-gray-500">
                <span className="text-sm font-bold text-white">{minute}'</span>
              </div>

              {/* Events grid */}
              <div className="grid grid-cols-3 gap-4 pt-12">
                {/* Home team events (left side) */}
                <div className="text-right space-y-2">
                  {minuteHomeEvents.map((event, eventIdx) => (
                    <div key={eventIdx} className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-3">
                      <div className="flex items-center justify-end space-x-2">
                        {getEventIcon(event.type || '')}
                        <div>
                          <div className="font-bold text-blue-300 text-sm">
                            {event.type?.toUpperCase() || 'EVENT'}
                          </div>
                          {(event.player || event.player_name) && (
                            <div className="text-white text-sm">{event.player || event.player_name}</div>
                          )}
                          {event.description && (
                            <div className="text-gray-300 text-xs">{event.description}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Neutral events (center) */}
                <div className="text-center space-y-2">
                  {minuteNeutralEvents.map((event, eventIdx) => (
                    <div key={eventIdx} className="bg-gray-800 border border-gray-600 rounded-lg p-2">
                      <div className="flex items-center justify-center space-x-2">
                        {getEventIcon(event.type || '')}
                        <span className="font-bold text-yellow-400 text-sm">
                          {event.type?.toUpperCase() || 'EVENT'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Away team events (right side) */}
                <div className="text-left space-y-2">
                  {minuteAwayEvents.map((event, eventIdx) => (
                    <div key={eventIdx} className="bg-red-900/30 border border-red-500/50 rounded-lg p-3">
                      <div className="flex items-center justify-start space-x-2">
                        <div>
                          <div className="font-bold text-red-300 text-sm">
                            {event.type?.toUpperCase() || 'EVENT'}
                          </div>
                          {(event.player || event.player_name) && (
                            <div className="text-white text-sm">{event.player || event.player_name}</div>
                          )}
                          {event.description && (
                            <div className="text-gray-300 text-xs">{event.description}</div>
                          )}
                        </div>
                        {getEventIcon(event.type || '')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {/* Match End */}
        <div className="relative">
          <div className="absolute left-1/2 transform -translate-x-1/2 w-12 h-12 bg-red-600 rounded-full flex items-center justify-center z-10">
            <Timer size={20} className="text-white" />
          </div>
          <div className="text-center pt-14">
            <span className="text-xl font-bold text-red-400">FULL TIME</span>
          </div>
        </div>
      </div>

      {/* Show more/less button */}
      {allMinutes.length > 5 && (
        <div className="text-center mt-8">
          <button 
            onClick={() => setShowAllEvents(!showAllEvents)} 
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
          >
            <span>{showAllEvents ? 'Show Less' : 'Show All Events'}</span>
            <ChevronDown 
              size={18} 
              className={`transition-transform duration-300 ${showAllEvents ? 'transform rotate-180' : ''}`} 
            />
          </button>
        </div>
      )}
    </div>
  );
};

export default MatchTimeline; 