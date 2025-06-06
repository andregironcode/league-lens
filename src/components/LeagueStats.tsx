import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { LeagueStatistics } from '@/types';
import MatchCard from '@/components/MatchCard';

interface LeagueStatsProps {
  stats: LeagueStatistics;
}

const COLORS = ['#22C55E', '#FCD34D', '#EF4444'];

const LeagueStats: React.FC<LeagueStatsProps> = ({ stats }) => {
  const totalMatches = stats.homeWins + stats.awayWins + stats.draws;

  // Helper function to render goal circles
  const renderGoalCircles = (value: number) => {
    const wholeGoals = Math.floor(value);
    const decimal = value - wholeGoals;
    const circles = [];

    // Add full circles for whole numbers
    for (let i = 0; i < wholeGoals; i++) {
      circles.push(
        <div
          key={`full-${i}`}
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: '#F7CC45' }}
        />
      );
    }

    // Add partial circle for decimal if > 0
    if (decimal > 0) {
      circles.push(
        <div
          key="partial"
          className="rounded-full"
          style={{
            backgroundColor: '#F7CC45',
            width: `${12 * decimal}px`,
            height: `${12 * decimal}px`,
          }}
        />
      );
    }

    return circles;
  };
  
  const pieData = [
    { name: 'Home Wins', value: stats.homeWins, color: '#22C55E' },
    { name: 'Draws', value: stats.draws, color: '#FCD34D' },
    { name: 'Away Wins', value: stats.awayWins, color: '#EF4444' }
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / totalMatches) * 100).toFixed(1);
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-white text-sm">
            <span className="font-semibold">{data.name}:</span> {data.value} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    /* Main Statistics Container - Wraps All Sections */
    <div className="rounded-xl p-6 border bg-black border-solid border-[#1B1B1B]">
      <div className="space-y-6">
        {/* Total Stats Container */}
        <div className="rounded-xl p-6 border bg-gray-900 border-solid border-[#333333]">
          <div className="flex justify-center items-center space-x-12">
            <div className="text-center">
              <div className="text-[30px] font-bold text-white">{stats.totalMatches}</div>
              <div className="text-[14px] text-white mt-0.5">Matches</div>
            </div>
            <div className="text-center">
              <div className="text-[30px] font-bold text-white">{stats.totalGoals}</div>
              <div className="text-[14px] text-white mt-0.5">Goals</div>
            </div>
            <div className="text-center">
              <div className="text-[30px] font-bold text-white">{stats.totalCleanSheets}</div>
              <div className="text-[14px] text-white mt-0.5">Clean Sheets</div>
            </div>
          </div>
        </div>

        {/* Main Stats Layout - Match Outcomes + Right Side Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side - Match Outcomes (Smaller) */}
          <div className="rounded-xl p-6 border bg-gray-900 border-solid border-[#333333]">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Match Outcomes</h3>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ color: '#ffffff' }}
                    formatter={(value, entry) => `${value}: ${(entry as any).payload.value}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Side - Stacked Stats */}
          <div className="space-y-6">
            {/* Key Stats - No Container */}
            <div className="flex justify-center items-center space-x-12">
              {/* Goals per Match with Circle Visualizer */}
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <div className="flex items-center space-x-1">
                    {renderGoalCircles(stats.averageGoalsPerMatch)}
                  </div>
                  <div className="text-[20px] font-bold text-white">{stats.averageGoalsPerMatch.toFixed(2)}</div>
                </div>
                <div className="text-[14px] text-[#8F8F8F]">Goals per Match</div>
              </div>
              
              {/* Clean Sheet Rate with Pill Progress Bar */}
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <div 
                    className="rounded-full"
                    style={{
                      backgroundColor: '#2A2A2A',
                      width: '70px',
                      height: '12px',
                      position: 'relative'
                    }}
                  >
                    <div
                      className="rounded-full h-full"
                      style={{
                        backgroundColor: '#F7CC45',
                        width: `${Math.min(stats.cleanSheetRate, 100)}%`,
                      }}
                    />
                  </div>
                  <div className="text-[20px] font-bold text-white">{stats.cleanSheetRate.toFixed(1)}%</div>
                </div>
                <div className="text-[14px] text-[#8F8F8F]">Clean Sheet Rate</div>
              </div>
            </div>

            {/* Most Frequent Scorelines Container - Horizontal Layout */}
            <div className="rounded-xl p-6 border bg-gray-900 border-solid border-[#333333]">
              <h3 className="text-xl font-bold text-white mb-4 text-center">Most Frequent Scorelines</h3>
              <div className="flex justify-center items-center space-x-8">
                {stats.mostFrequentScorelines.slice(0, 3).map((scoreline, index) => (
                  <div key={index} className="text-center">
                    <div className="text-xl font-bold text-white">{scoreline.scoreline}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {((scoreline.count / totalMatches) * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
                {stats.mostFrequentScorelines.length === 0 && (
                  <div className="text-gray-400 text-center">No scoreline data available</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Biggest Win Container */}
        {stats.biggestWin && (
          <div className="rounded-xl p-6 border bg-gray-900 border-solid border-[#333333]">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Biggest Win</h3>
            <MatchCard 
              match={stats.biggestWin} 
              showDate={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default LeagueStats; 