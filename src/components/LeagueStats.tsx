import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Match, LeagueStatistics } from '@/types';
import MatchCard from '@/components/MatchCard';
import { BarChart2, CheckCircle, Home, Target } from 'lucide-react';

interface LeagueStatsProps {
  stats: LeagueStatistics;
}

const COLORS = ['#4ade80', '#facc15', '#f87171'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 text-white p-2 rounded border border-gray-700">
        <p className="font-bold">{`${payload[0].name}: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const LeagueStats: React.FC<LeagueStatsProps> = ({ stats }) => {
  const pieData = [
    { name: 'Home Wins', value: stats.homeWins },
    { name: 'Draws', value: stats.draws },
    { name: 'Away Wins', value: stats.awayWins },
  ];

  return (
    <div className="rounded-xl p-6 border bg-black border-solid border-[#1B1B1B]">
      {/* Horizontal Stats Section */}
      <div className="mb-8">
        <div className="flex justify-center items-center space-x-12">
          {/* Total Matches */}
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{stats.totalMatches}</div>
            <div className="text-sm text-gray-400 mt-1">Total Matches</div>
          </div>
          
          {/* Total Goals */}
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{stats.totalGoals}</div>
            <div className="text-sm text-gray-400 mt-1">Total Goals</div>
          </div>
          
          {/* Total Clean Sheets */}
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{stats.totalCleanSheets}</div>
            <div className="text-sm text-gray-400 mt-1">Total Clean Sheets</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left column for chart */}
        <div className="flex flex-col items-center justify-center">
          <h4 className="text-md font-semibold text-white mb-4">Match Outcomes</h4>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8">
                  {pieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-4 mt-4 text-xs">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center">
                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                {entry.name} ({entry.value})
              </div>
            ))}
          </div>
        </div>

        {/* Right column for detailed stats */}
        <div className="space-y-4">
          <div className="flex items-center text-sm">
            <Home className="w-5 h-5 mr-3 text-yellow-400" />
            <span className="text-gray-400">Goals per Match:</span>
            <span className="text-white font-medium ml-auto">{stats.averageGoalsPerMatch.toFixed(2)}</span>
          </div>
          <div className="flex items-center text-sm">
            <CheckCircle className="w-5 h-5 mr-3 text-yellow-400" />
            <span className="text-gray-400">Clean Sheet Rate:</span>
            <span className="text-white font-medium ml-auto">{stats.cleanSheetRate.toFixed(2)}%</span>
          </div>
        </div>
      </div>
      
      {stats.biggestWin && (
        <div className="mt-8">
          <h4 className="text-md font-semibold text-white mb-4 text-center">Biggest Win</h4>
          <MatchCard match={stats.biggestWin} showDate={true} />
        </div>
      )}
    </div>
  );
};

export default LeagueStats; 