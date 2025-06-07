import React from 'react';
import { Users } from 'lucide-react';
import { Lineups, Player } from '@/types';

interface TeamLineupsProps {
  lineups?: Lineups;
  homeTeamName: string;
  awayTeamName: string;
}

// Helper component for displaying a single player
const PlayerDisplay: React.FC<{ player: Player }> = ({ player }) => (
  <div className="flex items-center space-x-2 p-1.5 rounded-md bg-gray-800/60">
    <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white">
      {player.number}
    </div>
    <div>
      <div className="font-medium text-white text-sm leading-tight">{player.name}</div>
      <p className="text-sm font-light text-gray-400">{player.position}</p>
    </div>
  </div>
);

// Component for displaying a full team lineup
const TeamLineupDisplay: React.FC<{ 
  lineup?: { formation: string; initialLineup: Player[][]; substitutes: Player[] };
  teamName: string;
}> = ({ lineup, teamName }) => {
  if (!lineup || !lineup.initialLineup || lineup.initialLineup.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400 rounded-xl" style={{ backgroundColor: '#191919' }}>
        <Users size={32} className="mx-auto mb-3" />
        <p className="font-semibold text-white">Lineup Unavailable</p>
        <p className="text-sm">Lineup information is not yet available for {teamName}.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-lg font-semibold text-white">{teamName}</h4>
        <p className="text-yellow-400 font-bold text-md">Formation: {lineup.formation || 'N/A'}</p>
      </div>
      
      {/* Football Pitch Visualization */}
      <div 
        className="p-4 rounded-xl relative min-h-[300px] flex flex-col justify-around"
        style={{
          backgroundColor: 'rgba(34, 197, 94, 0.3)',
          backgroundImage: `
            linear-gradient(90deg, rgba(255,255,255,0.3) 50%, transparent 50%),
            linear-gradient(rgba(255,255,255,0.3) 50%, transparent 50%)
          `,
          backgroundSize: '20px 20px',
          border: '2px solid rgba(255,255,255,0.4)'
        }}
      >
        {/* Pitch Lines */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Center Circle */}
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 border-white/40"
          />
          {/* Center Line */}
          <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white/40" />
          {/* Goal Areas */}
          <div className="absolute top-1/2 left-2 transform -translate-y-1/2 w-8 h-16 border-2 border-white/40 border-l-0" />
          <div className="absolute top-1/2 right-2 transform -translate-y-1/2 w-8 h-16 border-2 border-white/40 border-r-0" />
        </div>

        {/* Players by Formation Lines */}
        <div className="space-y-4 min-h-[300px] flex flex-col justify-around relative z-10">
          {lineup.initialLineup.map((row: Player[], rowIndex: number) => (
            <div key={rowIndex} className="flex justify-around items-center">
              {row.map((player: Player) => (
                <div key={player.number} className="text-center w-28">
                  <div 
                    className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm mx-auto shadow-md"
                    style={{ border: '2px solid rgba(255, 255, 255, 0.7)' }}
                  >
                    {player.number}
                  </div>
                  <p className="text-white text-xs mt-1 bg-black/60 px-2 py-0.5 rounded-full truncate">
                    {player.name.split(' ').pop()} {/* Show last name only for space */}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Substitutes */}
      <div>
        <h5 className="text-md font-semibold text-gray-300 pb-2 mb-3" style={{ borderBottom: '1px solid #374151' }}>
          Substitutes
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {lineup.substitutes?.map((player: Player) => (
            <PlayerDisplay key={player.number} player={player} />
          ))}
        </div>
      </div>
    </div>
  );
};

const TeamLineups: React.FC<TeamLineupsProps> = ({ lineups, homeTeamName, awayTeamName }) => {
  if (!lineups) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Users size={32} className="mx-auto mb-2" />
        <p className="text-white font-medium">Team Lineups Unavailable</p>
        <p className="text-sm">Lineup information is not available for this match.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
      <TeamLineupDisplay lineup={lineups.homeTeam} teamName={homeTeamName} />
      <TeamLineupDisplay lineup={lineups.awayTeam} teamName={awayTeamName} />
    </div>
  );
};

export default TeamLineups; 