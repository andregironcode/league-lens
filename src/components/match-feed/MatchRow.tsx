import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Match } from '@/types';
import LiveBadge from './LiveBadge';

// List of possible match status descriptions from the API for reference
const API_STATUS = {
  LIVE: ['Live', 'In Play'],
  FINISHED: ['Finished', 'Full Time', 'FT'],
  UPCOMING: ['Not Started', 'Scheduled', 'TBD']
};

interface MatchRowProps {
  match: Match;
}

// Enhanced team logo function - ensures we always have a proper logo from external sources
const getTeamLogo = (teamName: string, teamLogo?: string, teamId?: string): string => {
  // Priority 1: Use API-provided logo if it exists and looks valid
  if (teamLogo && teamLogo.trim() && !teamLogo.includes('placeholder') && !teamLogo.includes('default')) {
    return teamLogo;
  }

  // Priority 2: Try multiple external CDN sources with team ID
  if (teamId) {
    const externalSources = [
      `https://media.api-sports.io/football/teams/${teamId}.png`,
      `https://www.thesportsdb.com/images/media/team/badge/${teamId}.png`,
      `https://api.sofascore.app/api/v1/team/${teamId}/image`,
      `https://images.fotmob.com/image_resources/logo/teamlogo/${teamId}.png`
    ];
    // Return first external source
    return externalSources[0];
  }

  // Priority 3: Try constructing URL from team name for well-known teams
  const sluggedName = teamName.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');

  const nameBasedSources = [
    `https://www.thesportsdb.com/images/media/team/badge/${sluggedName}.png`,
    `https://logos-world.net/wp-content/uploads/2020/06/${sluggedName}-logo.png`,
    `https://1000logos.net/wp-content/uploads/2018/06/${sluggedName}-Logo.png`
  ];

  // Return first name-based source
  if (nameBasedSources.length > 0) {
    return nameBasedSources[0];
  }

  // Priority 4: Generate a professional text-based logo as final fallback
  const initials = teamName
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();

  // Create a color based on team name for consistency
  const colors = ['#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af'];
  const colorIndex = teamName.length % colors.length;

  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill="${colors[colorIndex]}"/>
      <circle cx="12" cy="12" r="10" fill="#1f2937" stroke="#374151" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="8" fill="none" stroke="#4b5563" stroke-width="0.5"/>
      <text x="12" y="16" font-family="Arial, sans-serif" font-size="7" font-weight="bold" text-anchor="middle" fill="#ffffff">
        ${initials}
      </text>
    </svg>
  `)}`;
};

const MatchRow: React.FC<MatchRowProps> = ({ match }) => {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Determine match status from state.description and state.clock (API provides status in 'state' object)
  const stateDescription = match.state?.description;
  const stateClock = match.state?.clock;
  
  // Debug match status values
  console.log(`[MatchRow] Match ID ${match.id} status values:`, {
    matchId: match.id,
    stateDescription,
    stateClock,
    stateObject: match.state,
    date: match.date,
    scorePresent: !!match.score
  });
  
  // Updated logic based on actual API response format
  const isLive = 
    stateDescription === 'Live' || 
    stateDescription === 'In Play' || 
    (!!stateClock && stateClock < 90 && stateDescription !== 'Finished');
    
  const isFinished = 
    stateDescription === 'Finished' || 
    stateDescription === 'Full Time' || 
    stateDescription === 'FT' || 
    (!!stateClock && stateClock >= 90 && stateDescription !== 'Live' && stateDescription !== 'In Play');
    
  const isUpcoming = !isLive && !isFinished;
  
  // Log the determined status for debugging
  console.log(`[MatchRow] Match ID ${match.id} determined status:`, {
    isLive,
    isFinished,
    isUpcoming
  });

  // Format kickoff time from fixture date or match date
  const formatKickoffTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      });
    } catch {
      return 'TBD';
    }
  };

  const kickoffTime = formatKickoffTime(match.fixture?.date || match.date);

  // Get match status display
  const getStatusDisplay = () => {
    if (isLive) return 'LIVE';
    if (isFinished) return 'FT';
    return 'KO';
  };

  // Handle match click - navigate to match details for ALL matches (finished, live, and upcoming)
  const handleMatchClick = async () => {
    if (!isNavigating) {
      try {
        setIsNavigating(true);
        
        console.log(`[MatchRow] Navigating to match details for ID: ${match.id}, status: ${isUpcoming ? 'upcoming' : isLive ? 'live' : 'finished'}`);
        
        // Route finished matches to Full-time Summary page
        if (isFinished) {
                  console.log(`[MatchRow] 🎯 ROUTING FINISHED MATCH to /match/${String(match.id)}`);
        navigate(`/match/${String(match.id)}`);
        } else {
                                  console.log(`[MatchRow] 🎯 ROUTING NON-FINISHED MATCH to /match/${String(match.id)}`);
            navigate(`/match/${String(match.id)}`);
        }
      } catch (error) {
        console.error('Navigation error:', error);
        setIsNavigating(false);
      }
    }
  };

  const canClick = true; // All matches are now clickable

  return (
    <div 
      className={`flex items-center justify-between p-4 transition-colors rounded-lg backdrop-blur-sm ${
        canClick 
          ? isNavigating 
            ? 'bg-white/20 cursor-wait opacity-75' 
            : 'hover:bg-white/10 cursor-pointer hover:scale-[1.01] active:scale-[0.99]'
          : 'hover:bg-white/10'
      }`}
      onClick={handleMatchClick}
      title={
        canClick 
          ? isNavigating 
            ? 'Loading match details...' 
            : 'Click to view match details'
          : undefined
      }
    >
      {/* Kickoff Time */}
      <div className="flex items-center space-x-4 min-w-0 flex-1">
        <div className="text-gray-300 text-sm font-medium min-w-[3rem]">
          {kickoffTime}
        </div>

        {/* Home Team */}
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <img 
            src={getTeamLogo(match.homeTeam.name, match.homeTeam.logo, String(match.homeTeam.id))} 
            alt={match.homeTeam.name}
            className="w-6 h-6 object-contain flex-shrink-0"
            loading="lazy"
          />
          <span className="text-white text-sm font-medium truncate">
            {match.homeTeam.name}
          </span>
        </div>

        {/* Score or VS */}
        <div className="flex items-center space-x-2">
          {match.score ? (
            <div className={`px-3 py-1 rounded text-white font-bold text-sm backdrop-blur-sm ${
              isLive ? 'bg-red-500/80' : 'bg-black/40'
            }`}>
              {match.score.home} - {match.score.away}
            </div>
          ) : (
            <div className="px-3 py-1 text-gray-300 text-sm font-medium">
              vs
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="flex items-center space-x-2 min-w-0 flex-1 justify-end">
          <span className="text-white text-sm font-medium truncate text-right">
            {match.awayTeam.name}
          </span>
          <img 
            src={getTeamLogo(match.awayTeam.name, match.awayTeam.logo, String(match.awayTeam.id))} 
            alt={match.awayTeam.name}
            className="w-6 h-6 object-contain flex-shrink-0"
            loading="lazy"
          />
        </div>
      </div>

      {/* Status and Live Badge */}
      <div className="flex items-center space-x-2 ml-4">
        <span className={`px-2 py-1 rounded text-xs font-medium backdrop-blur-sm ${
          isLive 
            ? 'text-red-400 bg-red-500/20 border border-red-500/30'
            : isFinished 
            ? 'text-green-400 bg-green-500/20 border border-green-500/30'
            : 'text-blue-400 bg-blue-500/20 border border-blue-500/30'
        }`}>
          {getStatusDisplay()}
        </span>
        {isLive && <LiveBadge />}
        
        {/* Click indicator for all matches */}
        <div className="text-gray-400 text-xs opacity-70">
          {isNavigating ? 'Loading...' : 'Click for details'}
        </div>
      </div>
    </div>
  );
};

export default MatchRow;