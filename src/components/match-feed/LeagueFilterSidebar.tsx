import React from 'react';

interface LeagueFilter {
  id: string;
  name: string;
  logoUrl: string;
}

interface LeagueFilterSidebarProps {
  selectedLeagueId: string | null;
  onLeagueSelect: (leagueId: string | null) => void;
  availableLeagueIds?: string[]; // IDs of leagues that have matches for the selected date
  hasMatches?: boolean; // Whether there are any matches for the selected date
}

// Static list of important leagues and tournaments
const IMPORTANT_LEAGUES: LeagueFilter[] = [
  // Top competitions and tournaments
  { id: '2', name: 'UEFA Champions League', logoUrl: 'https://cdn.scoresite.com/tournaments/2.png' },
  { id: '1', name: 'FIFA World Cup', logoUrl: 'https://cdn.scoresite.com/tournaments/1.png' },
  { id: '3', name: 'UEFA Europa League', logoUrl: 'https://cdn.scoresite.com/tournaments/3.png' },
  { id: '4', name: 'UEFA European Championship', logoUrl: 'https://cdn.scoresite.com/tournaments/4.png' },
  
  // Top domestic leagues
  { id: '39', name: 'Premier League', logoUrl: 'https://cdn.scoresite.com/logos/leagues/39.png' },
  { id: '140', name: 'La Liga', logoUrl: 'https://cdn.scoresite.com/logos/leagues/140.png' },
  { id: '135', name: 'Serie A', logoUrl: 'https://cdn.scoresite.com/logos/leagues/135.png' },
  { id: '78', name: 'Bundesliga', logoUrl: 'https://cdn.scoresite.com/logos/leagues/78.png' },
  { id: '61', name: 'Ligue 1', logoUrl: 'https://cdn.scoresite.com/logos/leagues/61.png' },
  { id: '94', name: 'Liga Portugal', logoUrl: 'https://cdn.scoresite.com/logos/leagues/94.png' },
  { id: '307', name: 'Saudi Pro League', logoUrl: 'https://cdn.scoresite.com/logos/leagues/307.png' },
  
  // Additional popular leagues
  { id: '88', name: 'Eredivisie', logoUrl: 'https://cdn.scoresite.com/logos/leagues/88.png' },
  { id: '253', name: 'Major League Soccer', logoUrl: 'https://cdn.scoresite.com/logos/leagues/253.png' },
  { id: '71', name: 'Brasileirão Serie A', logoUrl: 'https://cdn.scoresite.com/logos/leagues/71.png' },
  { id: '128', name: 'Argentine Primera División', logoUrl: 'https://cdn.scoresite.com/logos/leagues/128.png' }
];

const LeagueFilterSidebar: React.FC<LeagueFilterSidebarProps> = ({
  selectedLeagueId,
  onLeagueSelect,
  availableLeagueIds = [],
  hasMatches = true
}) => {
  const handleLeagueClick = (leagueId: string) => {
    // If clicking the same league, reset the filter
    if (selectedLeagueId === leagueId) {
      onLeagueSelect(null);
    } else {
      onLeagueSelect(leagueId);
    }
  };

  // Check which leagues have matches available
  const availableLeagueIdsSet = new Set(availableLeagueIds);

  return (
    <div className="w-80 bg-[#111111] border-r border-gray-800 h-full overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-2">Filter by League</h3>
        {hasMatches ? (
          <p className="text-sm text-gray-400">Click a league to filter matches</p>
        ) : (
          <p className="text-sm text-yellow-400">No matches available for this date</p>
        )}
        {selectedLeagueId && (
          <button
            onClick={() => onLeagueSelect(null)}
            className="mt-3 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Clear filter
          </button>
        )}
      </div>
      
      {/* Scrollable League List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-2">
          {IMPORTANT_LEAGUES.map((league) => {
            const isSelected = selectedLeagueId === league.id;
            const hasMatchesForLeague = availableLeagueIdsSet.has(league.id);
            const isDisabled = hasMatches && !hasMatchesForLeague;
            
            return (
              <button
                key={league.id}
                onClick={() => handleLeagueClick(league.id)}
                disabled={isDisabled}
                className={`
                  w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200
                  ${isSelected 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : isDisabled 
                      ? 'text-gray-500 cursor-not-allowed opacity-50' 
                      : 'hover:bg-[#1f1f1f] text-gray-300 hover:text-white'
                  }
                `}
              >
                <img
                  src={league.logoUrl}
                  alt={league.name}
                  className={`w-6 h-6 object-contain flex-shrink-0 ${isDisabled ? 'grayscale' : ''}`}
                  onError={(e) => e.currentTarget.src = '/icons/default.svg'}
                />
                <div className="flex-1 text-left">
                  <span className="text-sm font-medium truncate block">
                    {league.name}
                  </span>
                  {hasMatches && hasMatchesForLeague && (
                    <span className="text-xs text-green-400">Available</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        
        {/* Help text when no matches */}
        {!hasMatches && (
          <div className="p-4 border-t border-gray-800">
            <div className="text-center text-gray-500">
              <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-xs">No matches scheduled for this date</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeagueFilterSidebar; 