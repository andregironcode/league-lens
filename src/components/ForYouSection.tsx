import React, { useEffect, useState } from 'react';
import { Match } from '@/types';
import MatchCard from './MatchCard';
import { Loader2, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ForYouMatch extends Match {
  weight: number;
  weightBreakdown: {
    leagueWeight: number;
    stageWeight: number;
    teamWeight: number;
    formWeight: number;
    timeWeight: number;
  };
}

const ForYouSection: React.FC = () => {
  const [matches, setMatches] = useState<ForYouMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForYouMatches = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/for-you/matches');
        
        if (!response.ok) {
          throw new Error('Failed to fetch For You matches');
        }
        
        const data = await response.json();
        setMatches(data.matches || []);
      } catch (err) {
        console.error('Error fetching For You matches:', err);
        setError(err instanceof Error ? err.message : 'Failed to load matches');
      } finally {
        setLoading(false);
      }
    };

    fetchForYouMatches();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchForYouMatches, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#FFC30B]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-gray-900 border-gray-800 p-8">
        <p className="text-gray-400 text-center">{error}</p>
      </Card>
    );
  }

  if (matches.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-800 p-8">
        <p className="text-gray-400 text-center">No featured matches available</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="h-6 w-6 text-[#FFC30B]" />
        <h2 className="text-2xl font-bold text-white">For You</h2>
        <span className="text-sm text-gray-400">Top matches from the last 7 days</span>
      </div>

      <div className="grid gap-4">
        {matches.map((match, index) => (
          <div key={match.id} className="relative">
            {index === 0 && (
              <div className="absolute -top-2 -left-2 bg-gradient-to-r from-[#FFC30B] to-yellow-600 text-black text-xs font-bold px-3 py-1 rounded-full z-10">
                TOP MATCH
              </div>
            )}
            
            <div className={`transform transition-transform hover:scale-[1.02] ${
              index === 0 ? 'ring-2 ring-[#FFC30B] ring-opacity-50' : ''
            }`}>
              <MatchCard 
                match={{
                  ...match,
                  date: match.utc_date || match.match_date,
                  homeTeam: match.home_team,
                  awayTeam: match.away_team,
                  league: match.league || { name: 'League', logo: '' }
                } as any} 
                showLeague={true}
                className={index === 0 ? 'border-[#FFC30B]' : ''}
              />
            </div>

            {/* Match weight breakdown tooltip */}
            <div className="absolute top-2 right-2 group">
              <div className="bg-gray-800 px-2 py-1 rounded text-xs text-gray-400">
                Score: {match.weight}
              </div>
              
              {/* Hover tooltip with breakdown */}
              <div className="absolute right-0 top-8 w-64 bg-gray-800 border border-gray-700 rounded-lg p-4 
                            opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                <p className="text-xs font-semibold text-white mb-2">Match Score Breakdown</p>
                <div className="space-y-1 text-xs text-gray-400">
                  <div className="flex justify-between">
                    <span>League importance:</span>
                    <span>{match.weightBreakdown.leagueWeight}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Competition stage:</span>
                    <span>{match.weightBreakdown.stageWeight}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Team quality:</span>
                    <span>{match.weightBreakdown.teamWeight}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Team form:</span>
                    <span>{match.weightBreakdown.formWeight}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recency:</span>
                    <span>{match.weightBreakdown.timeWeight}</span>
                  </div>
                  <div className="border-t border-gray-700 pt-1 mt-1">
                    <div className="flex justify-between font-semibold text-white">
                      <span>Total:</span>
                      <span>{match.weight}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ForYouSection;