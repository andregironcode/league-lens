import React, { useState } from 'react';
import { Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Lineups, Player } from '@/types';

interface TeamLineupsProps {
  lineups?: Lineups;
}

// Helper component for displaying a single player row
const PlayerRow: React.FC<{ player: Player }> = ({ player }) => (
  <div className="flex items-center space-x-3 p-2 rounded-md" style={{ backgroundColor: '#1C1C1C' }}>
    <div 
      className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-white"
    >
      {player.number}
    </div>
    <div>
      <div className="font-semibold text-white text-base leading-tight">{player.name}</div>
      <p className="text-sm font-normal text-gray-400">{player.position}</p>
    </div>
  </div>
);

// New component for the full lineup display with starters list and substitutes dropdown
const FullLineupDisplay: React.FC<{ 
  lineup?: { formation: string; initialLineup: Player[][]; substitutes: Player[] };
}> = ({ lineup }) => {
  const [subsOpen, setSubsOpen] = useState(false);

  if (!lineup || !lineup.initialLineup || lineup.initialLineup.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400 rounded-xl mt-4" style={{ backgroundColor: '#191919' }}>
        <Users size={32} className="mx-auto mb-3" />
        <p className="font-semibold text-white">Lineup Unavailable</p>
        <p className="text-sm">Lineup information is not yet available for this team.</p>
      </div>
    );
  }

  // Flatten the initial lineup for a single list view
  const starters = lineup.initialLineup.flat();

  return (
    <div className="space-y-6 mt-4">
      {/* Football Pitch Visualization */}
      <div 
        className="p-4 rounded-xl relative min-h-[400px] flex flex-col justify-around"
        style={{
          backgroundColor: 'rgba(34, 197, 94, 0.2)', // Slightly more subtle green
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      >
        {/* Pitch Markings */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 w-32 h-32 transform -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/20"></div>
          <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white/20"></div>
          <div className="absolute top-1/2 left-0 w-24 h-48 transform -translate-y-1/2 border-y-2 border-r-2 border-white/20 rounded-r-lg"></div>
          <div className="absolute top-1/2 right-0 w-24 h-48 transform -translate-y-1/2 border-y-2 border-l-2 border-white/20 rounded-l-lg"></div>
        </div>

        {/* Players by Formation */}
        <div className="space-y-4 min-h-[400px] flex flex-col justify-around relative z-10 p-2">
          {lineup.initialLineup.map((row: Player[], rowIndex: number) => (
            <div key={rowIndex} className="flex justify-around items-center w-full">
              {row.map((player: Player) => (
                <div key={player.number} className="text-center w-24 flex-shrink-0">
                  <div 
                    className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg mx-auto shadow-xl"
                    style={{ border: '3px solid rgba(255, 255, 255, 0.8)' }}
                  >
                    {player.number}
                  </div>
                  <p className="text-white text-sm font-medium mt-1.5 bg-black/70 px-2 py-1 rounded-full truncate">
                    {player.name.split(' ').pop()}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Formation Display */}
      <div className="text-center">
        <p className="text-gray-300 text-lg">Formation: <span className="font-bold text-yellow-400">{lineup.formation || 'N/A'}</span></p>
      </div>

      {/* Starters List */}
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-white">Starting XI</h3>
        {starters.map((player) => (
          <PlayerRow key={`starter-${player.number}`} player={player} />
        ))}
      </div>

      {/* Substitutes Dropdown */}
      <div className="space-y-3">
        <button
          onClick={() => setSubsOpen(!subsOpen)}
          className="w-full flex justify-between items-center text-left text-xl font-bold text-white"
        >
          Substitutes
          {subsOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </button>
        {subsOpen && (
          <div className="space-y-2 pt-2">
            {lineup.substitutes?.length > 0 ? lineup.substitutes.map((player) => (
              <PlayerRow key={`sub-${player.number}`} player={player} />
            )) : <p className="text-gray-400">No substitutes listed.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

const TeamLineups: React.FC<TeamLineupsProps> = ({ lineups }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'away'>('home');

  if (!lineups || !lineups.homeTeam || !lineups.awayTeam) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Users size={32} className="mx-auto mb-2" />
        <p className="text-white font-medium">Team Lineups Unavailable</p>
        <p className="text-sm">Lineup information is not available for this match.</p>
      </div>
    );
  }

  const { homeTeam, awayTeam } = lineups;

  return (
    <div className="w-full">
      {/* Tab Buttons */}
      <div className="flex justify-center space-x-2 border-b-2 border-gray-700 mb-4">
        {/* Home Tab */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex items-center space-x-3 px-4 py-3 text-lg font-semibold transition-colors duration-200 ${
            activeTab === 'home' 
              ? 'border-b-4 border-yellow-400 text-white' 
              : 'border-b-4 border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <img src={homeTeam.logo} alt={homeTeam.name} className="w-8 h-8"/>
          <span>{homeTeam.name}</span>
        </button>
        {/* Away Tab */}
        <button
          onClick={() => setActiveTab('away')}
          className={`flex items-center space-x-3 px-4 py-3 text-lg font-semibold transition-colors duration-200 ${
            activeTab === 'away' 
              ? 'border-b-4 border-yellow-400 text-white' 
              : 'border-b-4 border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <img src={awayTeam.logo} alt={awayTeam.name} className="w-8 h-8"/>
          <span>{awayTeam.name}</span>
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'home' ? (
          <FullLineupDisplay lineup={homeTeam} />
        ) : (
          <FullLineupDisplay lineup={awayTeam} />
        )}
      </div>
    </div>
  );
};

export default TeamLineups; 