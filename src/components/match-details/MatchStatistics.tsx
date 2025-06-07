import React from 'react';
import { BarChart4 } from 'lucide-react';
import { TeamStatistics, Team } from '@/types';

interface MatchStatisticsProps {
  statistics: TeamStatistics[];
  homeTeam: Team;
  awayTeam: Team;
}

const MatchStatistics: React.FC<MatchStatisticsProps> = ({ statistics, homeTeam, awayTeam }) => {
  if (!statistics || statistics.length < 2) {
    return (
      <div className="text-center py-8 text-gray-400">
        <BarChart4 size={32} className="mx-auto mb-2" />
        <p className="text-white font-medium">Match Statistics Unavailable</p>
        <p className="text-sm">Detailed match statistics are not yet available for this match.</p>
      </div>
    );
  }

  const homeStats = statistics[0]?.statistics || [];
  const awayStats = statistics[1]?.statistics || [];

  const getPercentage = (homeValue: any, awayValue: any): { homePercent: number; awayPercent: number } => {
    let homePercent = 50, awayPercent = 50;
    
    if (typeof homeValue === 'number' && typeof awayValue === 'number') {
      const total = homeValue + awayValue;
      if (total > 0) {
        homePercent = (homeValue / total) * 100;
        awayPercent = (awayValue / total) * 100;
      }
    } else if (typeof homeValue === 'string' && homeValue.includes('%')) {
      homePercent = parseFloat(homeValue);
      awayPercent = typeof awayValue === 'string' ? parseFloat(awayValue) : 0;
    }
    
    return { homePercent, awayPercent };
  };

  const isHigher = (value1: any, value2: any): boolean => {
    if (typeof value1 === 'number' && typeof value2 === 'number') {
      return value1 > value2;
    }
    if (typeof value1 === 'string' && typeof value2 === 'string') {
      return parseFloat(value1) > parseFloat(value2);
    }
    return false;
  };

  return (
    <div className="space-y-4">
      {/* Team Headers */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <img src={homeTeam.logo} alt={homeTeam.name} className="w-8 h-8 object-contain" />
          <span className="text-white font-medium text-sm">{homeTeam.name}</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-white font-medium text-sm">{awayTeam.name}</span>
          <img src={awayTeam.logo} alt={awayTeam.name} className="w-8 h-8 object-contain" />
        </div>
      </div>

      {/* Statistics Rows */}
      <div className="space-y-4">
        {homeStats.map((homeStat, index) => {
          const awayStat = awayStats[index];
          if (!awayStat) return null;

          const homeValue = homeStat.value;
          const awayValue = awayStat.value;
          const { homePercent, awayPercent } = getPercentage(homeValue, awayValue);
          
          const homeIsHigher = isHigher(homeValue, awayValue);
          const awayIsHigher = isHigher(awayValue, homeValue);
          
          return (
            <div key={index} className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className={`text-sm font-medium ${homeIsHigher ? 'text-yellow-400' : 'text-gray-400'}`}>
                  {homeValue}
                </span>
                <span className="text-sm font-medium text-white text-center flex-1 mx-4">
                  {homeStat.displayName}
                </span>
                <span className={`text-sm font-medium ${awayIsHigher ? 'text-yellow-400' : 'text-gray-400'}`}>
                  {awayValue}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden flex">
                <div 
                  className={`h-full ${homeIsHigher ? 'bg-yellow-400' : 'bg-gray-600'}`} 
                  style={{ width: `${homePercent}%` }}
                />
                <div 
                  className={`h-full ${awayIsHigher ? 'bg-yellow-400' : 'bg-gray-600'}`} 
                  style={{ width: `${awayPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MatchStatistics; 