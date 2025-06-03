import React from 'react';

/**
 * TopCompetitions Sidebar Component
 * 
 * A vertical sidebar displaying:
 * - Top 15 global leagues 
 * - Top 5 football tournaments
 * 
 * Features:
 * - Uses CDN logos from scoresite.com
 * - Fallback to default.svg on image load errors
 * - Hover effects on each row
 * - No click interactivity (as requested)
 * - Responsive design with fixed width (256px)
 */

interface LeagueData {
  id: string;
  name: string;
}

interface TournamentData {
  id: string;
  name: string;
}

const TopCompetitions: React.FC = () => {
  // Top 15 global leagues with their actual IDs for CDN logos - aligned with priority filtering
  const topLeagues: LeagueData[] = [
    { id: '33973', name: 'Premier League' },
    { id: '140', name: 'La Liga' },
    { id: '135', name: 'Serie A' },
    { id: '78', name: 'Bundesliga' },
    { id: '61', name: 'Ligue 1' },
    { id: '94', name: 'Liga Portugal' },
    { id: '307', name: 'Saudi Pro League' },
    { id: '88', name: 'Eredivisie' },
    { id: '253', name: 'Major League Soccer' },
    { id: '71', name: 'Brasileirão Serie A' },
    { id: '128', name: 'Argentine Primera División' },
    { id: '144', name: 'Belgian Pro League' },
    { id: '207', name: 'Swiss Super League' },
    { id: '169', name: 'Scottish Premiership' },
    { id: '218', name: 'Turkish Süper Lig' }
  ];

  // Top 5 most-viewed football tournaments - aligned with priority filtering
  const topTournaments: TournamentData[] = [
    { id: '2', name: 'UEFA Champions League' },
    { id: '1', name: 'FIFA World Cup' },
    { id: '4', name: 'UEFA European Championship' },
    { id: '3', name: 'UEFA Europa League' },
    { id: '9', name: 'Copa América' }
  ];

  return (
    <div className="w-64 bg-[#111111] border-r border-gray-800 h-full overflow-y-auto">
      {/* Top Leagues Section */}
      <div className="p-4">
        <h3 className="text-white text-lg font-semibold mb-4">Top Leagues</h3>
        <div className="space-y-1">
          {topLeagues.map((league) => (
            <div
              key={league.id}
              className="flex items-center gap-2 px-4 py-2 rounded hover:bg-[#1f1f1f] cursor-pointer transition-colors"
            >
              <img
                src={`https://cdn.scoresite.com/leagues/${league.id}.png`}
                alt={league.name}
                onError={(e) => e.currentTarget.src = '/icons/default.svg'}
                className="w-6 h-6 object-contain rounded-full"
              />
              <span className="text-white text-sm font-medium">{league.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Tournaments Section */}
      <div className="p-4 border-t border-gray-800">
        <h3 className="text-white text-lg font-semibold mb-4">Top Tournaments</h3>
        <div className="space-y-1">
          {topTournaments.map((tournament) => (
            <div
              key={tournament.id}
              className="flex items-center gap-2 px-4 py-2 rounded hover:bg-[#1f1f1f] cursor-pointer transition-colors"
            >
              <img
                src={`https://cdn.scoresite.com/tournaments/${tournament.id}.png`}
                alt={tournament.name}
                onError={(e) => e.currentTarget.src = '/icons/default.svg'}
                className="w-6 h-6 object-contain rounded-full"
              />
              <span className="text-white text-sm font-medium">{tournament.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopCompetitions; 