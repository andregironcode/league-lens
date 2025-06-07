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

  // Define the desired order of statistics with Shots Accuracy after Possession
  const statisticsOrder = [
    'Possession',
    'Shots accuracy',
    'Expected Goals',
    'Shots on target',
    'Big Chances Created',
    'Goal Kicks',
    'Blocked shots',
    'Shots within penalty area',
    'Shots outside penalty area',
    'Fouls',
    'Corners',
    'Throw-Ins',
    'Goalkeeper saves',
    'Free Kicks',
    'Offsides',
    'Total passes',
    'Successful passes',
    'Failed passes',
    'Yellow cards',
    'Red cards'
  ];

  // Create ordered statistics pairs
  const createOrderedStats = () => {
    const orderedPairs: Array<{ homeStat: any; awayStat: any }> = [];
    
    // For each desired statistic in order, find matching home and away stats
    statisticsOrder.forEach(desiredStat => {
      const homeStat = homeStats.find(stat => stat.displayName === desiredStat);
      const awayStat = awayStats.find(stat => stat.displayName === desiredStat);
      
      // Only include if both teams have this statistic
      if (homeStat && awayStat) {
        orderedPairs.push({ homeStat, awayStat });
      }
    });

    return orderedPairs;
  };

  const orderedStatsPairs = createOrderedStats();

  const getOptimizedPercentage = (homeValue: any, awayValue: any): { homePercent: number; awayPercent: number } => {
    let homePercent = 50, awayPercent = 50;
    
    // Handle percentage values that come as decimals (0.59 -> 59%)
    if (typeof homeValue === 'number' && typeof awayValue === 'number') {
      if (homeValue === 0 && awayValue === 0) {
        return { homePercent: 50, awayPercent: 50 };
      }
      
      const total = homeValue + awayValue;
      if (total > 0) {
        const rawHomePercent = (homeValue / total) * 100;
        const rawAwayPercent = (awayValue / total) * 100;
        
        // Apply optimization for better visual representation
        const MIN_PERCENT = 15; // Minimum visible bar size
        const MAX_PERCENT = 85; // Maximum bar size to ensure opponent visibility
        
        // If the difference is extreme, apply logarithmic scaling
        const ratio = Math.max(homeValue, awayValue) / Math.min(homeValue, awayValue);
        
        if (ratio > 10) {
          // Very extreme difference - use logarithmic scaling
          const logRatio = Math.log10(ratio);
          const scaleFactor = Math.min(logRatio / 2, 2); // Cap the scaling
          
          if (homeValue > awayValue) {
            homePercent = 50 + (25 * scaleFactor);
            awayPercent = 50 - (25 * scaleFactor);
          } else {
            awayPercent = 50 + (25 * scaleFactor);
            homePercent = 50 - (25 * scaleFactor);
          }
        } else if (ratio > 3) {
          // Moderate difference - apply gentle scaling
          const adjustmentFactor = Math.min((ratio - 1) / 4, 0.7);
          
          if (homeValue > awayValue) {
            homePercent = 50 + (35 * adjustmentFactor);
            awayPercent = 50 - (35 * adjustmentFactor);
          } else {
            awayPercent = 50 + (35 * adjustmentFactor);
            homePercent = 50 - (35 * adjustmentFactor);
          }
        } else {
          // Small difference - use direct proportional but with limits
          homePercent = Math.max(MIN_PERCENT, Math.min(MAX_PERCENT, rawHomePercent));
          awayPercent = Math.max(MIN_PERCENT, Math.min(MAX_PERCENT, rawAwayPercent));
          
          // Ensure they sum to 100
          const sum = homePercent + awayPercent;
          homePercent = (homePercent / sum) * 100;
          awayPercent = (awayPercent / sum) * 100;
        }
      }
    } else if (typeof homeValue === 'string' && homeValue.includes('%')) {
      // Already percentage values
      homePercent = parseFloat(homeValue);
      awayPercent = typeof awayValue === 'string' ? parseFloat(awayValue) : 0;
      
      // Apply the same min/max constraints for percentage values
      const MIN_PERCENT = 15;
      const MAX_PERCENT = 85;
      
      homePercent = Math.max(MIN_PERCENT, Math.min(MAX_PERCENT, homePercent));
      awayPercent = Math.max(MIN_PERCENT, Math.min(MAX_PERCENT, awayPercent));
      
      // Normalize to 100%
      const sum = homePercent + awayPercent;
      homePercent = (homePercent / sum) * 100;
      awayPercent = (awayPercent / sum) * 100;
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

  const formatStatValue = (value: any): string => {
    if (typeof value === 'number') {
      // Handle percentage values (0.59 -> 59%)
      if (value > 0 && value < 1) {
        return `${Math.round(value * 100)}%`;
      }
      return value.toString();
    }
    return value?.toString() || '0';
  };

  return (
    <div className="space-y-4">
      {/* Statistics Rows */}
      <div className="space-y-4">
        {orderedStatsPairs.map(({ homeStat, awayStat }, index) => {
          const homeValue = homeStat.value;
          const awayValue = awayStat.value;
          const { homePercent, awayPercent } = getOptimizedPercentage(homeValue, awayValue);
          
          const homeIsHigher = isHigher(homeValue, awayValue);
          const awayIsHigher = isHigher(awayValue, homeValue);
          
          return (
            <div key={`${homeStat.displayName}-${index}`} className="space-y-2">
              {/* External Label */}
              <div className="text-center">
                <span 
                  className="font-sans font-normal text-gray-400"
                  style={{ fontSize: '14px' }}
                >
                  {homeStat.displayName}
                </span>
              </div>

              {/* Center-Gapped Pill-Shaped Progress Bars Container */}
              <div className="relative" style={{ height: '36px' }}>
                {/* Background pill for home team (full width) */}
                <div 
                  className="absolute top-0 h-full rounded-full"
                  style={{
                    backgroundColor: '#1C1C1C',
                    left: '0',
                    width: 'calc(50% - 2.5px)',
                    height: '36px'
                  }}
                />
                
                {/* Background pill for away team (full width) */}
                <div 
                  className="absolute top-0 h-full rounded-full"
                  style={{
                    backgroundColor: '#1C1C1C',
                    left: 'calc(50% + 2.5px)',
                    width: 'calc(50% - 2.5px)',
                    height: '36px'
                  }}
                />

                {/* Home team progress bar (extends from center leftward) */}
                <div 
                  className="absolute top-0 h-full transition-all duration-300 ease-out rounded-full"
                  style={{
                    backgroundColor: homeIsHigher ? '#F7CC45' : '#585858',
                    right: '50%',
                    marginRight: '2.5px',
                    width: `${homePercent * 0.5}%`,
                    height: '36px'
                  }}
                >
                  {/* Home team value (positioned on right side) */}
                  <div className="absolute inset-0 flex items-center justify-end pr-4">
                    <span 
                      className="font-bold"
                      style={{ fontSize: '14px', color: '#FFFFFF' }}
                    >
                      {formatStatValue(homeValue)}
                    </span>
                  </div>
                </div>
                
                {/* Away team progress bar (extends from center rightward) */}
                <div 
                  className="absolute top-0 h-full transition-all duration-300 ease-out rounded-full"
                  style={{
                    backgroundColor: awayIsHigher ? '#F7CC45' : '#585858',
                    left: '50%',
                    marginLeft: '2.5px',
                    width: `${awayPercent * 0.5}%`,
                    height: '36px'
                  }}
                >
                  {/* Away team value (positioned on left side) */}
                  <div className="absolute inset-0 flex items-center justify-start pl-4">
                    <span 
                      className="font-bold"
                      style={{ fontSize: '14px', color: '#FFFFFF' }}
                    >
                      {formatStatValue(awayValue)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MatchStatistics;