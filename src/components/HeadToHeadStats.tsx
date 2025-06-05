import React from 'react';
import { Match } from '@/types';
import { Swords, Check, Minus, X } from 'lucide-react';

const HeadToHeadStats: React.FC<{
  matches: Match[];
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
}> = ({ matches, homeTeamId, homeTeamName, awayTeamId, awayTeamName }) => {
  if (!matches || matches.length === 0) {
    return (
      <div className="text-center text-gray-500 text-sm py-4">
        <Swords size={20} className="mx-auto mb-2" />
        No head-to-head match data available.
      </div>
    );
  }

  let homeWins = 0;
  let awayWins = 0;
  let draws = 0;

  matches.forEach(match => {
    const goals = match.goals || { home: 0, away: 0 };
    const homeGoals = goals.home ?? 0;
    const awayGoals = goals.away ?? 0;

    if (homeGoals === awayGoals) {
      draws++;
    } else if (match.homeTeam.id.toString() === homeTeamId) {
      if (homeGoals > awayGoals) homeWins++;
      else awayWins++;
    } else { // Current away team was home team in this past match
      if (homeGoals > awayGoals) awayWins++;
      else homeWins++;
    }
  });

  const recentMatches = matches.slice(0, 5);

  const getResultBadge = (match: Match) => {
    const goals = match.goals || { home: 0, away: 0 };
    if (goals.home === goals.away) {
      return <Minus size={12} className="text-gray-400" />;
    }
    const didHomeWin = goals.home > goals.away;
    if (match.homeTeam.id.toString() === homeTeamId) {
      return didHomeWin ? <Check size={12} className="text-green-400" /> : <X size={12} className="text-red-400" />;
    } else {
      return didHomeWin ? <X size={12} className="text-red-400" /> : <Check size={12} className="text-green-400" />;
    }
  };


  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold text-white text-center mb-4">Head-to-Head</h3>
      <div className="grid grid-cols-3 text-center mb-6">
        <div>
          <p className="text-2xl font-bold text-white">{homeWins}</p>
          <p className="text-sm text-gray-400">{homeTeamName} Wins</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{draws}</p>
          <p className="text-sm text-gray-400">Draws</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{awayWins}</p>
          <p className="text-sm text-gray-400">{awayTeamName} Wins</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <h4 className="text-md font-semibold text-white text-center mb-2">Recent Encounters</h4>
        {recentMatches.map(match => (
          <div key={match.id} className="flex items-center justify-between bg-black/30 p-2 rounded-lg text-sm">
            <span className="text-gray-400">{new Date(match.date).toLocaleDateString()}</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-white text-right">{match.homeTeam.name}</span>
              <span className="font-bold text-yellow-400 bg-gray-800 px-2 py-0.5 rounded">{match.goals?.home} - {match.goals?.away}</span>
              <span className="font-medium text-white text-left">{match.awayTeam.name}</span>
            </div>
            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-700">
              {getResultBadge(match)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeadToHeadStats; 