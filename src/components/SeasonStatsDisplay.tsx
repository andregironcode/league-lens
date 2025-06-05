import React from 'react';
import { CalculatedSeasonStats, Match as MatchType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle,TrendingUp, TrendingDown, MinusCircle, ShieldCheck, Percent, ListOrdered, Star } from 'lucide-react';
import MatchList from './MatchList'; // To display the biggest match

interface SeasonStatsDisplayProps {
  stats: CalculatedSeasonStats | null;
  leagueName?: string;
  season?: string | null;
}

const StatItem: React.FC<{ icon: React.ElementType; label: string; value: string | number | undefined; unit?: string; className?: string }> = 
  ({ icon: Icon, label, value, unit, className }) => (
  <div className={`flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg ${className || ''}`}>
    <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">{value ?? 'N/A'}{unit}</p>
    </div>
  </div>
);

const SeasonStatsDisplay: React.FC<SeasonStatsDisplayProps> = ({ stats, leagueName, season }) => {
  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Season Statistics {season ? `(${season})` : ''}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center text-gray-500 py-4">
            <AlertTriangle className="w-10 h-10 mb-2 text-gray-400" />
            <p>Not enough data to calculate season statistics for {leagueName || 'this league'}.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Season Statistics {leagueName ? `${leagueName} ` : ''}{season ? `(${season})` : ''}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatItem icon={ListOrdered} label="Matches Played" value={stats.totalMatchesPlayed} />
          <StatItem icon={TrendingUp} label="Total Goals" value={stats.totalGoals} />
          <StatItem icon={Percent} label="Avg. Goals / Match" value={stats.avgGoalsPerMatch} />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">Match Outcomes</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatItem icon={TrendingUp} label="Home Wins" value={stats.homeWinPercentage} unit="%" className="bg-green-50 dark:bg-green-800/30" />
            <StatItem icon={MinusCircle} label="Draws" value={stats.drawPercentage} unit="%" className="bg-yellow-50 dark:bg-yellow-800/30" />
            <StatItem icon={TrendingDown} label="Away Wins" value={stats.awayWinPercentage} unit="%" className="bg-blue-50 dark:bg-blue-800/30" />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">Clean Sheets</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatItem icon={ShieldCheck} label="Total Clean Sheets Kept" value={stats.cleanSheetsTotal} />
            <StatItem icon={ShieldCheck} label="Matches with ≥1 Clean Sheet" value={stats.matchesWithAtLeastOneCleanSheet} />
            <StatItem icon={Percent} label="Clean Sheet Rate" value={stats.cleanSheetRate} unit="%" />
          </div>
        </div>

        {stats.frequentScorelines && stats.frequentScorelines.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">Most Frequent Scorelines</h3>
            <div className="space-y-2">
              {stats.frequentScorelines.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-md text-sm">
                  <span className="font-mono text-gray-700 dark:text-gray-200">{item.score}</span>
                  <span className="text-gray-500 dark:text-gray-400">({item.count} times)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.biggestMatch && (
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">Biggest Match (Most Goals)</h3>
            <MatchList matches={[stats.biggestMatch]} emptyMessage="Could not determine biggest match." />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SeasonStatsDisplay; 