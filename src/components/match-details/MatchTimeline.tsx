import React, { useState } from 'react';
import { Clock, Target, UserMinus, UserPlus, Square, AlertTriangle, CheckCircle, XCircle, Flag, ChevronDown, Play, Flag as FlagIcon, Timer, Tv2, ArrowRightLeft, PauseCircle } from 'lucide-react';
import { MatchEvent, Team, Match } from '@/types';

/**
 * Helper functions for event visualization and description
 */

// Event icon map based on event type
const getEventIcon = (type: string) => {
  if (!type) return <Clock size={36} className="text-gray-400" />;
  
  const t = type.toLowerCase();
  
  // Match phases
  if (t.includes('kickoff') && t.includes('1')) return <Play size={36} className="text-green-400" />;
  if (t.includes('kickoff') && t.includes('2')) return <Play size={36} className="text-blue-400" />;
  if (t.includes('half-time') || t.includes('halftime')) return <PauseCircle size={36} className="text-yellow-400" />;
  if (t.includes('full-time') || t.includes('fulltime') || t.includes('end')) return <Timer size={36} className="text-red-400" />;
  if (t.includes('var')) return <Tv2 size={36} className="text-purple-400" />;
  
  // Regular events
  if (t.includes('goal') && !t.includes('cancel')) return <Target size={36} className="text-yellow-400" />;
  if (t.includes('kick') || t.includes('off')) return <FlagIcon size={36} className="text-white" />;
  if (t.includes('cancel')) return <XCircle size={36} className="text-white" />;
  if (t.includes('penalty')) return <FlagIcon size={36} className="text-yellow-400" />;
  if (t.includes('substitution')) return <ArrowRightLeft size={36} className="text-blue-300" />;
  if (t.includes('card')) return <Square size={36} className={t.includes('yellow') ? "text-yellow-400" : "text-red-500"} />;
  
  // Default
  return <Clock size={36} className="text-gray-400" />;
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
  
  // Calculate match end time - typically the last event or 90+ minutes
  const calculateMatchEndTime = (): string => {
    if (!matchEvents || matchEvents.length === 0) return '90\'';
    
    // Look for a full-time or end event
    const endEvent = matchEvents.find(event => {
      const type = (event.type || '').toLowerCase();
      return type.includes('full-time') || type.includes('fulltime') || type.includes('end');
    });
    
    if (endEvent && endEvent.time) return endEvent.time;
    
    // If no specific end event, get the time from the last event
    const lastEvent = matchEvents[matchEvents.length - 1];
    if (lastEvent && lastEvent.time) {
      // Try to parse the time and add a small buffer if it's less than 90
      const timeMatch = lastEvent.time.match(/(\d+)/);
      if (timeMatch) {
        const minutes = parseInt(timeMatch[1], 10);
        return minutes < 90 ? '90\'' : lastEvent.time;
      }
      return lastEvent.time;
    }
    
    return '90\'';
  };

  if (!matchEvents || !Array.isArray(matchEvents) || matchEvents.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock size={32} className="mx-auto mb-2 text-gray-400" />
        <p className="text-gray-400">No match events available</p>
      </div>
    );
  }

  // Create a special end event
  const endEvent = {
    type: 'Full-time',
    time: calculateMatchEndTime(),
    special: true
  };
  
  // Handle events properly - include regular events (not the end event yet)
  const regularEvents = matchEvents;
  
  // Determine which events to display:
  // If showing all events: all regular events plus the end event
  // If collapsed: just the first 3 regular events
  const displayedEvents = showAllEvents ? [...regularEvents, endEvent] : regularEvents.slice(0, Math.min(3, regularEvents.length));
  
  // Always show the 'View more' button to reveal/hide the end event
  const hasMoreEvents = true;

  return (
    <div className="relative w-full max-w-2xl mx-auto pt-4 pb-8 overflow-hidden">
      {/* Timeline container with consistent spacing */}
      <div className="flex flex-col space-y-16 relative">
        {/* Simplified timeline vertical connector */}
        <div className="absolute left-7 w-0.5 bg-gray-700 z-0" style={{
          top: '3.5rem',  // Start right after Match Start icon
          bottom: '3.5rem',  // End right before the last element (View More or Match End)
          display: matchEvents && matchEvents.length > 0 ? 'block' : 'none'
        }} />
        
        {/* Timeline start marker */}
        <div className="relative flex items-center">
          <div className="absolute left-0 w-14 h-14 flex items-center justify-center rounded-full bg-[#222] border-2 border-green-700 z-10">
            <Play size={36} className="text-green-400" />
          </div>
          <div className="ml-20">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold text-gray-200 min-w-[48px]">0'</span>
              <span className="text-xl font-bold text-green-400">MATCH START</span>
            </div>
          </div>
        </div>
        
        {/* Event items */}
        {displayedEvents.map((event, idx) => (
          <div key={idx} className="relative flex items-start">
            {/* Icon positioned directly on the timeline - with special styling for end event */}
            <div className="absolute left-0 w-14 h-14 flex items-center justify-center rounded-full bg-[#222] border-2 border-gray-700 z-10"
                 style={event.special ? {borderColor: '#b91c1c'} : {}}
            >
              {getEventIcon(event.type || '')}
            </div>
            
            {/* Event content - pushed to the right of the timeline */}
            <div className="ml-20">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold text-gray-200 min-w-[48px]">{event.time || ''}</span>
                <span className="text-xl font-extrabold">
                  {/* Format event type based on category */}
                  {(() => {
                    const t = (event.type || '').toLowerCase();
                    
                    // Event type styling based on category
                    if (t.includes('goal') && !t.includes('cancel')) {
                      return <span className="text-yellow-400">GOAL!!</span>;
                    } else if (t.includes('var')) {
                      return <span className="text-purple-400">VAR CHECK</span>;
                    } else if (t.includes('yellow card')) {
                      return <span className="text-yellow-400">YELLOW CARD</span>;
                    } else if (t.includes('red card')) {
                      return <span className="text-red-500">RED CARD</span>;
                    } else if (t.includes('kickoff') && t.includes('1')) {
                      return <span className="text-green-400">KICK OFF</span>;
                    } else if (t.includes('kickoff') && t.includes('2')) {
                      return <span className="text-blue-400">SECOND HALF</span>;
                    } else if (t.includes('half-time') || t.includes('halftime')) {
                      return <span className="text-yellow-400">HALF-TIME</span>;
                    } else if (t.includes('full-time') || t.includes('fulltime') || t.includes('end')) {
                      return <span className="text-red-400">MATCH END</span>;
                    } else {
                      return <span className="text-white">{event.type || 'Event'}</span>;
                    }
                  })()} 
                </span>
                {event.score && <span className="text-2xl font-bold text-white ml-2">{event.score}</span>}
              </div>
              
              <div className="text-gray-300 text-lg mt-1">
                {/* Event description */}
                <div className="space-y-1">
                  {/* Event description based on type */}
                  {(() => {
                    const t = (event.type || '').toLowerCase();
                    const customDescription = getEventDescription(event);
                    
                    // For match phase events (kickoff, halftime, fulltime)
                    if (t.includes('kickoff') || t.includes('half-time') || t.includes('halftime') || 
                        t.includes('full-time') || t.includes('fulltime') || t.includes('end')) {
                      return (
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{customDescription}</span>
                        </div>
                      );
                    }
                    
                    // For VAR events
                    else if (t.includes('var')) {
                      return (
                        <div>
                          <div className="font-medium">{customDescription}</div>
                          {event.detail && (
                            <div className="ml-0 mt-1 text-sm italic text-purple-300">{event.detail}</div>
                          )}
                        </div>
                      );
                    }
                    
                    // For standard player events
                    else {
                      return (
                        <>
                          {/* Player information with team context */}
                          {event.player && (
                            <div className="flex items-center space-x-2">
                              {event.team && event.team.logo && (
                                <img 
                                  src={event.team.logo} 
                                  alt={event.team.name || 'Team'} 
                                  className="w-5 h-5 object-contain"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                                  }}
                                />
                              )}
                              <span className="font-medium">{event.player}</span>
                              {event.assist && <span className="text-sm opacity-75"> (Assist: {event.assist})</span>}
                            </div>
                          )}
                          
                          {/* Substitution info */}
                          {event.substituted && (
                            <div className="ml-7 text-sm opacity-75">
                              <span>Player substituted: {event.substituted}</span>
                            </div>
                          )}
                          
                          {/* Additional event details */}
                          {event.description && (
                            <div className="ml-0 mt-1">
                              <span className="text-sm">{event.description}</span>
                            </div>
                          )}
                          
                          {/* Technical details */}
                          {event.detail && event.detail !== event.description && (
                            <div className="ml-0 mt-1 text-gray-400">
                              <span className="text-sm italic">{event.detail}</span>
                            </div>
                          )}
                        </>
                      );
                    }
                  })()}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Fade effect at the bottom of the timeline */}
        <div className="absolute left-0 right-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent z-0" />
        
        {/* View more/less button */}
        {hasMoreEvents && (
          <div className="relative flex items-center z-10">
            <div className="absolute left-0 w-14 h-14 flex items-center justify-center rounded-full bg-[#222] border-2 border-gray-700 opacity-90 z-10 shadow-lg">
              <ChevronDown 
                size={24} 
                className={`text-yellow-400 transition-transform duration-300 ${showAllEvents ? 'transform rotate-180' : ''}`} 
              />
            </div>
            <div className="ml-20">
              <button 
                onClick={() => setShowAllEvents(!showAllEvents)} 
                className="text-yellow-400 font-medium text-lg hover:underline flex items-center gap-2 transition-all hover:text-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-30 rounded px-2 py-1"
              >
                {showAllEvents ? 'View less' : 'View more'}
                <ChevronDown 
                  size={18} 
                  className={`transition-transform duration-300 ${showAllEvents ? 'transform rotate-180' : ''}`} 
                />
              </button>
            </div>
          </div>
        )}
        
        {/* Match End event is now part of the allEvents array */}
      </div>
    </div>
  );
};

export default MatchTimeline; 