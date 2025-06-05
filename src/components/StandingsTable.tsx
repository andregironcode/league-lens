import React from 'react';
import { StandingsRow } from '@/types';
import { ShieldCheck } from 'lucide-react';

interface StandingsTableProps {
  standings: StandingsRow[];
  homeTeamId: string;
  awayTeamId: string;
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
            <th scope="col" className="px-2 py-3 text-center">GD</th>
            <th scope="col" className="px-4 py-3 text-center">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row) => {
            const isHome = row.team.id === homeTeamId;
            const isAway = row.team.id === awayTeamId;
            const rowClass = isHome || isAway ? 'bg-yellow-500/10' : '';

            return (
              <tr key={row.position} className={`border-b border-gray-800 hover:bg-gray-800/60 ${rowClass}`}>
                <td className="px-4 py-3 font-medium text-center text-white">{row.position}</td>
                <td className="px-6 py-3 font-medium text-white whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <img src={row.team.logo} alt={row.team.name} className="w-5 h-5 object-contain" />
                    <span>{row.team.name}</span>
                  </div>
                </td>
                <td className="px-2 py-3 text-center">{row.played}</td>
                <td className="px-2 py-3 text-center">{row.won}</td>
                <td className="px-2 py-3 text-center">{row.drawn}</td>
                <td className="px-2 py-3 text-center">{row.lost}</td>
                <td className="px-2 py-3 text-center">{row.goalDifference}</td>
                <td className="px-4 py-3 font-bold text-center text-white">{row.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default StandingsTable; 