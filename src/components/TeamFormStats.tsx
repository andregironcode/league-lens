import React from 'react';
import { Match } from '@/types';

type MatchAnalysis = {
  outcome: 'W' | 'D' | 'L';
  over2_5: boolean;
  under2_5: boolean;
  cleanSheet: boolean;
  failedToScore: boolean;
  conceded: boolean;
  concededTwo: boolean;
};

const calculateDetailedTeamFormStats = (matches: Match[], teamId: string): MatchAnalysis[] => {
  const analyses: MatchAnalysis[] = [];

  matches.slice(0, 5).forEach(match => {
    const isHome = match.homeTeam.id.toString() === teamId;
    
    // Correctly parse the score from the "current" string (e.g., "5 - 0")
    const scoreString = match.state?.score?.current;
    let homeGoals = 0;
    let awayGoals = 0;

    if (scoreString && typeof scoreString === 'string' && scoreString.includes(' - ')) {
      const parts = scoreString.split(' - ');
      homeGoals = parseInt(parts[0], 10) || 0;
      awayGoals = parseInt(parts[1], 10) || 0;
    }

    const totalGoals = homeGoals + awayGoals;
    const goalsScored = isHome ? homeGoals : awayGoals;
    const goalsConceded = isHome ? awayGoals : homeGoals;

    // Determine outcome
    let outcome: 'W' | 'D' | 'L';
    if (homeGoals === awayGoals) {
      outcome = 'D';
    } else if ((isHome && homeGoals > awayGoals) || (!isHome && awayGoals > homeGoals)) {
      outcome = 'W';
    } else {
      outcome = 'L';
    }

    analyses.push({
      outcome,
      over2_5: totalGoals > 2.5,
      under2_5: totalGoals < 2.5,
      cleanSheet: goalsConceded === 0,
      failedToScore: goalsScored === 0,
      conceded: goalsConceded > 0,
      concededTwo: goalsConceded >= 2,
    });
  });

  return analyses;
};

const StatCircle = ({ isActive }: { isActive: boolean }) => (
  <div 
    className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0"
    style={{ 
      backgroundColor: '#333333',
      border: '2px solid #6B6B6B',
      boxShadow: isActive ? '0 0 8px rgba(255, 255, 255, 0.3)' : 'none',
      minWidth: '32px',
      minHeight: '32px'
    }}
  >
    {isActive && (
      <div 
        className="rounded-full animate-pulse flex-shrink-0"
        style={{ 
          backgroundColor: '#FFFFFF',
          width: '3px',
          height: '3px'
        }}
      />
    )}
  </div>
);

const OutcomeCircle = ({ outcome }: { outcome: 'W' | 'D' | 'L' }) => {
  const getOutcomeStyle = (outcome: 'W' | 'D' | 'L') => {
    if (outcome === 'W') return { backgroundColor: '#54A95F' };
    if (outcome === 'D') return { backgroundColor: '#F9CC44' };
    return { backgroundColor: '#ED5565' };
  };

  const style = getOutcomeStyle(outcome);

  return (
    <div 
      className="w-8 h-8 flex items-center justify-center font-bold text-white rounded-full transition-all duration-200 flex-shrink-0"
      style={{
        ...style,
        minWidth: '32px',
        minHeight: '32px',
        fontSize: '14px'
      }}
    >
      {outcome}
    </div>
  );
};

const StatRow = ({ 
  label, 
  homeAnalyses, 
  awayAnalyses,
  condition 
}: { 
  label: string; 
  homeAnalyses: MatchAnalysis[];
  awayAnalyses: MatchAnalysis[];
  condition: (analysis: MatchAnalysis) => boolean;
}) => (
  <div className="grid grid-cols-7 items-center gap-2">
    {/* Home team pill and circles - closer to center */}
    <div className="col-span-2 flex justify-end">
      <div 
        className="flex gap-2 px-3 py-1 rounded-full"
        style={{ backgroundColor: '#1F1F1F' }}
      >
        {homeAnalyses.slice().reverse().map((analysis, index) => (
          <StatCircle key={index} isActive={condition(analysis)} />
        ))}
      </div>
    </div>

    {/* Central label */}
    <div className="col-span-3 text-center">
      <span className="font-sans font-medium" style={{ fontSize: '14px', color: '#727272' }}>{label}</span>
    </div>

    {/* Away team pill and circles - closer to center */}
    <div className="col-span-2 flex justify-start">
      <div 
        className="flex gap-2 px-3 py-1 rounded-full"
        style={{ backgroundColor: '#1F1F1F' }}
      >
        {awayAnalyses.map((analysis, index) => (
          <StatCircle key={index} isActive={condition(analysis)} />
        ))}
      </div>
    </div>
  </div>
);

// Updated component to handle both teams
const TeamFormStats: React.FC<{ 
  homeMatches: Match[], 
  homeTeamId: string, 
  homeTeamName: string,
  awayMatches: Match[], 
  awayTeamId: string, 
  awayTeamName: string 
}> = ({ homeMatches, homeTeamId, homeTeamName, awayMatches, awayTeamId, awayTeamName }) => {
  
  if (!homeMatches?.length && !awayMatches?.length) {
    return <div className="text-center text-gray-500 text-sm py-4">No recent match data available.</div>;
  }

  const homeAnalyses = calculateDetailedTeamFormStats(homeMatches, homeTeamId);
  const awayAnalyses = calculateDetailedTeamFormStats(awayMatches, awayTeamId);

  return (
    <div className="space-y-6">
      {/* Team names header */}
      <div className="grid grid-cols-7 items-center gap-2">
        <div className="col-span-2 text-center">
          <h4 className="font-bold text-white text-sm">{homeTeamName}</h4>
        </div>
        <div className="col-span-3 text-center">
          <h4 className="font-bold text-white text-sm">Last 5 Matches</h4>
        </div>
        <div className="col-span-2 text-center">
          <h4 className="font-bold text-white text-sm">{awayTeamName}</h4>
        </div>
      </div>

      {/* Outcome row - aligned with stat rows */}
      <div className="grid grid-cols-7 items-center gap-2">
        {/* Home team outcome pill and circles */}
        <div className="col-span-2 flex justify-end">
          <div 
            className="flex gap-2 px-3 py-1 rounded-full"
            style={{ backgroundColor: '#1F1F1F' }}
          >
            {homeAnalyses.slice().reverse().map((analysis, index) => (
              <OutcomeCircle key={index} outcome={analysis.outcome} />
            ))}
          </div>
        </div>

        {/* Central outcome label */}
        <div className="col-span-3 text-center">
          <span className="font-sans font-medium" style={{ fontSize: '14px', color: '#727272' }}>OUTCOME</span>
        </div>

        {/* Away team outcome pill and circles */}
        <div className="col-span-2 flex justify-start">
          <div 
            className="flex gap-2 px-3 py-1 rounded-full"
            style={{ backgroundColor: '#1F1F1F' }}
          >
            {awayAnalyses.map((analysis, index) => (
              <OutcomeCircle key={index} outcome={analysis.outcome} />
            ))}
          </div>
        </div>
      </div>

      {/* Statistics with central labels */}
      <div className="space-y-2">
        <StatRow 
          label="OVER 2.5" 
          homeAnalyses={homeAnalyses} 
          awayAnalyses={awayAnalyses}
          condition={(a) => a.over2_5} 
        />
        <StatRow 
          label="UNDER 2.5" 
          homeAnalyses={homeAnalyses} 
          awayAnalyses={awayAnalyses}
          condition={(a) => a.under2_5} 
        />
        <StatRow 
          label="CLEAN SHEET" 
          homeAnalyses={homeAnalyses} 
          awayAnalyses={awayAnalyses}
          condition={(a) => a.cleanSheet} 
        />
        <StatRow 
          label="CONCEDED" 
          homeAnalyses={homeAnalyses} 
          awayAnalyses={awayAnalyses}
          condition={(a) => a.conceded} 
        />
        <StatRow 
          label="CONCEDED TWO" 
          homeAnalyses={homeAnalyses} 
          awayAnalyses={awayAnalyses}
          condition={(a) => a.concededTwo} 
        />
        <StatRow 
          label="FAILED TO SCORE" 
          homeAnalyses={homeAnalyses} 
          awayAnalyses={awayAnalyses}
          condition={(a) => a.failedToScore} 
        />
      </div>
    </div>
  );
};

export default TeamFormStats; 