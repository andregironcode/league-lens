import React from 'react';

interface League {
  id: string;
  name: string;
  logoUrl: string;
}

interface TopLeaguesFilterProps {
  selectedLeagueId: string | null;
  onLeagueSelect: (leagueId: string | null) => void;
}

// Static list of top leagues
const TOP_LEAGUES: League[] = [
  { id: '33973', name: 'Premier League', logoUrl: '/competitions/premier-league.png' },
  { id: '140', name: 'La Liga', logoUrl: 'https://cdn.scoresite.com/logos/leagues/140.png' },
  { id: '135', name: 'Serie A', logoUrl: 'https://cdn.scoresite.com/logos/leagues/135.png' },
  { id: '78', name: 'Bundesliga', logoUrl: 'https://cdn.scoresite.com/logos/leagues/78.png' },
  { id: '61', name: 'Ligue 1', logoUrl: 'https://cdn.scoresite.com/logos/leagues/61.png' },
  { id: '2', name: 'Champions League', logoUrl: 'https://cdn.scoresite.com/tournaments/2.png' },
  { id: '3', name: 'Europa League', logoUrl: 'https://cdn.scoresite.com/tournaments/3.png' },
  { id: '94', name: 'Liga Portugal', logoUrl: 'https://cdn.scoresite.com/logos/leagues/94.png' },
  { id: '88', name: 'Eredivisie', logoUrl: 'https://cdn.scoresite.com/logos/leagues/88.png' },
  { id: '253', name: 'MLS', logoUrl: 'https://cdn.scoresite.com/logos/leagues/253.png' },
  { id: '71', name: 'Brasileirão', logoUrl: 'https://cdn.scoresite.com/logos/leagues/71.png' },
  { id: '307', name: 'Saudi Pro League', logoUrl: 'https://cdn.scoresite.com/logos/leagues/307.png' }
];

const TopLeaguesFilter: React.FC<TopLeaguesFilterProps> = ({
  selectedLeagueId,
  onLeagueSelect
}) => {
  const handleLeagueClick = (leagueId: string) => {
    // If clicking the same league, reset the filter
    if (selectedLeagueId === leagueId) {
      onLeagueSelect(null);
    } else {
      onLeagueSelect(leagueId);
    }
  };

  const handleClearFilter = () => {
    onLeagueSelect(null);
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg sm:rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-gray-700/30">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
          </svg>
          <span className="text-white text-sm sm:text-base font-semibold">Filter by League</span>
        </div>
        
        {selectedLeagueId && (
          <button
            onClick={handleClearFilter}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      
      {/* League Grid */}
      <div className="p-3 sm:p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3">
          {TOP_LEAGUES.map((league) => {
            const isSelected = selectedLeagueId === league.id;
            
            return (
              <div
                key={league.id}
                onClick={() => handleLeagueClick(league.id)}
                className={`
                  bg-[#121212] rounded-md px-2 sm:px-3 py-2 sm:py-2.5 flex flex-col items-center gap-2 
                  cursor-pointer transition-all duration-200 hover:bg-[#1a1a1a] 
                  touch-manipulation min-h-[70px] sm:min-h-[80px]
                  ${isSelected 
                    ? 'bg-[#2a2a2a] ring-1 ring-yellow-400/50 border border-yellow-400/30' 
                    : 'border border-transparent hover:border-gray-600/50'
                  }
                `}
              >
                {/* League Logo */}
                <img
                  src={league.logoUrl}
                  alt={league.name}
                  className="w-6 h-6 sm:w-8 sm:h-8 object-contain flex-shrink-0"
                  onError={(e) => e.currentTarget.src = '/icons/default.svg'}
                />
                
                {/* League Name */}
                <span className={`
                  text-xs text-center leading-tight
                  ${isSelected ? 'text-white font-medium' : 'text-gray-300'}
                `}>
                  {league.name}
                </span>
                
                {/* Selected Indicator */}
                {isSelected && (
                  <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full flex-shrink-0"></div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Show All / Clear Filter Button */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-700/30">
          <button
            onClick={handleClearFilter}
            className={`
              w-full bg-[#121212] rounded-md px-3 py-2 flex items-center justify-center gap-2
              text-xs sm:text-sm transition-all duration-200 hover:bg-[#1a1a1a]
              ${!selectedLeagueId 
                ? 'text-yellow-400 border border-yellow-400/30 bg-yellow-400/10' 
                : 'text-gray-300 border border-gray-600/30'
              }
            `}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Show All Leagues
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopLeaguesFilter; 