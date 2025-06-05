import React from 'react';
import { Match } from '@/types';
import { CheckCircle, XCircle, MinusCircle, Shield, ShieldOff, Forward, TrendingUp, TrendingDown } from 'lucide-react';

type FormStats = {
  wins: number;
  draws: number;
  losses: number;
  over2_5: number;
  under2_5: number;
  cleanSheet: number;
  failedToScore: number;
  conceded: number;
  concededTwo: number;
  outcomes: ('W' | 'D' | 'L')[];
};

const calculateTeamFormStats = (matches: Match[], teamId: string): FormStats => {
  const stats: FormStats = {
    wins: 0, draws: 0, losses: 0, over2_5: 0, under2_5: 0,
    cleanSheet: 0, failedToScore: 0, conceded: 0, concededTwo: 0, outcomes: [],
  };

  matches.slice(0, 5).forEach(match => {
    const isHome = match.homeTeam.id.toString() === teamId;
    const goals = match.goals || { home: 0, away: 0 };
    const homeGoals = goals.home ?? 0;
    const awayGoals = goals.away ?? 0;
    const totalGoals = homeGoals + awayGoals;

    let outcome: 'W' | 'D' | 'L';
    if (homeGoals === awayGoals) {
      stats.draws++;
      outcome = 'D';
    } else if ((isHome && homeGoals > awayGoals) || (!isHome && awayGoals > homeGoals)) {
      stats.wins++;
      outcome = 'W';
    } else {
      stats.losses++;
      outcome = 'L';
    }
    stats.outcomes.push(outcome);

    if (totalGoals > 2.5) stats.over2_5++;
    if (totalGoals < 2.5) stats.under2_5++;
    
    const goalsScored = isHome ? homeGoals : awayGoals;
    const goalsConceded = isHome ? awayGoals : homeGoals;

    if (goalsScored === 0) stats.failedToScore++;
    if (goalsConceded === 0) stats.cleanSheet++;
    if (goalsConceded > 0) stats.conceded++;
    if (goalsConceded >= 2) stats.concededTwo++;
  });

  return stats;
};

const StatItem = ({ icon, label, value, total = 5 }: { icon: React.ReactNode, label: string, value: number, total?: number }) => (
  <div className="flex items-center justify-between text-sm">
    <div className="flex items-center gap-2 text-gray-300">
      {icon}
      <span>{label}</span>
    </div>
    <span className="font-semibold text-white">{value}/{total}</span>
  </div>
);

const TeamFormStats: React.FC<{ matches: Match[], teamId: string, teamName: string }> = ({ matches, teamId, teamName }) => {
  if (!matches || matches.length === 0) {
    return <div className="text-center text-gray-500 text-sm py-4">No recent match data available for {teamName}.</div>;
  }
  const stats = calculateTeamFormStats(matches, teamId);

  const getOutcomeClass = (outcome: 'W' | 'D' | 'L') => {
    if (outcome === 'W') return 'bg-green-500 border-green-400';
    if (outcome === 'D') return 'bg-gray-500 border-gray-400';
    return 'bg-red-500 border-red-400';
  };

  return (
    <div>
      <h4 className="font-bold text-white mb-3 text-center">{teamName} - Last 5 Matches</h4>
      <div className="flex justify-center gap-2 mb-4">
        {stats.outcomes.map((o, i) => (
          <div key={i} className={`w-8 h-8 flex items-center justify-center font-bold text-white rounded-full border-2 ${getOutcomeClass(o)}`}>
            {o}
          </div>
        ))}
      </div>
      <div className="space-y-2 rounded-lg bg-black/30 p-4">
        <StatItem icon={<TrendingUp size={16} className="text-cyan-400" />} label="Over 2.5 Goals" value={stats.over2_5} />
        <StatItem icon={<TrendingDown size={16} className="text-cyan-400" />} label="Under 2.5 Goals" value={stats.under2_5} />
        <StatItem icon={<Shield size={16} className="text-green-400" />} label="Clean Sheet" value={stats.cleanSheet} />
        <StatItem icon={<ShieldOff size={16} className="text-red-400" />} label="Conceded" value={stats.conceded} />
        <StatItem icon={<ShieldOff size={16} className="text-red-600" />} label="Conceded 2+" value={stats.concededTwo} />
        <StatItem icon={<XCircle size={16} className="text-orange-400" />} label="Failed to Score" value={stats.failedToScore} />
      </div>
    </div>
  );
};

export default TeamFormStats; 