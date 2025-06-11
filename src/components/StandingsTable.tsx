import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

// Interface that matches the actual API response structure with all possible formats
interface ApiStandingsRow {
  position: number;
  rank?: number; // Some API responses use rank instead of position
  team: {
    id: string;
    name: string;
    logo: string;
  };
  points: number;
  goalsDiff?: number; // Direct goal difference field
  group?: string;
  form?: string;
  status?: string;
  description?: string;
  // Format 1: nested in total
  total?: {
    games?: number;
    played?: number;
    wins?: number;
    win?: number;
    draws?: number;
    draw?: number;
    loses?: number;
    lose?: number;
    lost?: number;
    scoredGoals?: number;
    goalsFor?: number;
    receivedGoals?: number;
    goalsAgainst?: number;
  };
  // Format 2: nested in all
  all?: {
    played?: number;
    win?: number;
    draw?: number;
    lose?: number;
    goals?: {
      for?: number;
      against?: number;
    };
  };
  // Format 3: direct properties
  played?: number;
  win?: number;
  draw?: number;
  lose?: number;
  goals?: {
    for?: number;
    against?: number;
  };
  // Format 4: direct properties with different naming
  matchesPlayed?: number;
  won?: number;
  drawn?: number;
  lost?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  goalDifference?: number;
  // Home and away stats
  home?: {
    played?: number;
    win?: number;
    draw?: number;
    lose?: number;
    goals?: {
      for?: number;
      against?: number;
    };
  };
  away?: {
    played?: number;
    win?: number;
    draw?: number;
    lose?: number;
    goals?: {
      for?: number;
      against?: number;
    };
  };
}

interface StandingsTableProps {
  standings: ApiStandingsRow[];
  homeTeamId?: string;
  awayTeamId?: string;
}

const StandingsTable: React.FC<StandingsTableProps> = ({ standings, homeTeamId, awayTeamId }) => {
  if (!standings || standings.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        <ShieldCheck size={24} className="mx-auto mb-2" />
        Standings are not available for this competition.
      </div>
    );
  }

  // Helper function to safely get values from the standings row with all possible structures
  const extractStandingsData = (row: ApiStandingsRow) => {
    // Get position (some APIs use rank instead)
    const position = row.position || row.rank || 0;
    
    // Get games played
    const played = 
      row.played || 
      row.matchesPlayed ||
      row.total?.games || 
      row.total?.played || 
      row.all?.played || 
      0;
    
    // Get wins
    const wins = 
      row.win || 
      row.won ||
      row.total?.wins ||
      row.total?.win ||
      row.all?.win ||
      0;
    
    // Get draws
    const draws = 
      row.draw ||
      row.drawn ||
      row.total?.draws ||
      row.total?.draw ||
      row.all?.draw ||
      0;
    
    // Get losses
    const loses = 
      row.lose ||
      row.lost ||
      row.total?.loses ||
      row.total?.lose ||
      row.total?.lost ||
      row.all?.lose ||
      0;
    
    // Get goals for
    const goalsFor = 
      row.goalsFor ||
      row.goals?.for ||
      row.total?.scoredGoals ||
      row.total?.goalsFor ||
      (row.all?.goals?.for || 0);
    
    // Get goals against
    const goalsAgainst = 
      row.goalsAgainst ||
      row.goals?.against ||
      row.total?.receivedGoals ||
      row.total?.goalsAgainst ||
      (row.all?.goals?.against || 0);
    
    // Get goal difference (calculate if not provided)
    const goalDifference = 
      row.goalDifference ||
      row.goalsDiff ||
      (goalsFor - goalsAgainst);
    
    return {
      position,
      played,
      wins,
      draws,
      loses,
      goalsFor,
      goalsAgainst,
      goalDifference,
      points: row.points
    };
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-300">
        <thead className="text-xs text-gray-400 uppercase bg-gray-900/50">
          <tr>
            <th scope="col" className="px-4 py-3 text-center">Pos</th>
            <th scope="col" className="px-6 py-3">Team</th>
            <th scope="col" className="px-2 py-3 text-center">P</th>
            <th scope="col" className="px-2 py-3 text-center">W</th>
            <th scope="col" className="px-2 py-3 text-center">D</th>
            <th scope="col" className="px-2 py-3 text-center">L</th>
            <th scope="col" className="px-2 py-3 text-center">GF</th>
            <th scope="col" className="px-2 py-3 text-center">GA</th>
            <th scope="col" className="px-2 py-3 text-center">GD</th>
            <th scope="col" className="px-4 py-3 text-center">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row) => {
            // Extract data using our helper function to handle all API formats
            const {
              position,
              played,
              wins,
              draws,
              loses,
              goalsFor,
              goalsAgainst,
              goalDifference,
              points
            } = extractStandingsData(row);
            
            const isHome = row.team?.id === homeTeamId;
            const isAway = row.team?.id === awayTeamId;
            const rowClass = isHome || isAway ? 'bg-yellow-500/10' : '';

            return (
              <tr key={`${row.team?.id}-${position}`} className={`border-b border-gray-800 hover:bg-gray-800/60 ${rowClass}`}>
                <td className="px-4 py-3 font-medium text-center text-white">{position}</td>
                <td className="px-6 py-3 font-medium text-white whitespace-nowrap">
                  {row.team.id ? (
                    <Link 
                      to={`/team/${row.team.id}`} 
                      className="flex items-center gap-3 hover:text-yellow-400 transition-colors"
                      title={`View ${row.team.name} team page`}
                    >
                      <img 
                        src={row.team.logo} 
                        alt={row.team.name} 
                        className="w-5 h-5 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                        }} 
                      />
                      <span>{row.team.name}</span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3">
                      <img 
                        src={row.team.logo} 
                        alt={row.team.name} 
                        className="w-5 h-5 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                        }} 
                      />
                      <span>{row.team.name}</span>
                    </div>
                  )}
                </td>
                <td className="px-2 py-3 text-center">{played}</td>
                <td className="px-2 py-3 text-center">{wins}</td>
                <td className="px-2 py-3 text-center">{draws}</td>
                <td className="px-2 py-3 text-center">{loses}</td>
                <td className="px-2 py-3 text-center">{goalsFor}</td>
                <td className="px-2 py-3 text-center">{goalsAgainst}</td>
                <td className="px-2 py-3 text-center">{goalDifference}</td>
                <td className="px-4 py-3 font-bold text-center text-white">{points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default StandingsTable; 