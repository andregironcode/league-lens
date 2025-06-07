import React from 'react';
import { Match } from '@/types';
import { Swords } from 'lucide-react';

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

  // Helper function to parse score from API format
  const parseScore = (match: Match): { home: number; away: number } => {
    // Try API format first: state.score.current = "5 - 0"
    if (match.state?.score?.current) {
      const scoreParts = match.state.score.current.split(' - ');
      if (scoreParts.length === 2) {
        return {
          home: parseInt(scoreParts[0]) || 0,
          away: parseInt(scoreParts[1]) || 0
        };
      }
    }
    
    // Fallback to goals format if available
    if (match.goals) {
      return {
        home: match.goals.home ?? 0,
        away: match.goals.away ?? 0
      };
    }
    
    // Default fallback
    return { home: 0, away: 0 };
  };



  const recentMatches = matches.slice(0, 5);



  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold text-white text-center mb-4">Head-to-Head</h3>

      
      <div className="space-y-2">
        {recentMatches.map(match => {
          const score = parseScore(match);
          return (
            <div key={match.id} className="bg-black/30 p-4 rounded-lg text-sm">
              {/* Date and League - Top Section */}
              <div className="flex items-center justify-center gap-2 mb-3 text-center">
                <span className="text-gray-400">{new Date(match.date).toLocaleDateString()}</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-400">{match.league?.name || 'Unknown League'}</span>
              </div>
              
              {/* Scoreline - Middle Section (Perfectly Centered) */}
              <div className="grid grid-cols-3 items-center gap-2">
                <span className="font-medium text-white text-right truncate">{match.homeTeam.name}</span>
                <div className="flex justify-center">
                  <span className="font-bold text-yellow-400 bg-gray-800 px-3 py-1 rounded text-lg">
                    {score.home} - {score.away}
                  </span>
                </div>
                <span className="font-medium text-white text-left truncate">{match.awayTeam.name}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HeadToHeadStats; 