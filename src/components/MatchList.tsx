import React from 'react';
import { Match as MatchType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface MatchListProps {
  matches: MatchType[];
  title?: string;
  emptyMessage?: string;
  showLeagueInfo?: boolean; // If the list is for mixed leagues (e.g., general highlights/matches)
  maxItems?: number; // For snippet views
}

const MatchList: React.FC<MatchListProps> = ({
  matches,
  title,
  emptyMessage = 'No matches found.',
  showLeagueInfo = false,
  maxItems,
}) => {
  const matchesToDisplay = maxItems ? matches.slice(0, maxItems) : matches;

  if (!matchesToDisplay || matchesToDisplay.length === 0) {
    return (
      <Card>
        {title && <CardHeader><CardTitle>{title}</CardTitle></CardHeader>}
        <CardContent>
          <p>{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {title && <CardHeader><CardTitle>{title}</CardTitle></CardHeader>}
      <CardContent>
        <div className="space-y-4">
          {matchesToDisplay.map((match) => (
            <div key={match.id} className="p-3 border rounded-lg hover:shadow-md transition-shadow duration-200
              bg-white dark:bg-gray-800 dark:border-gray-700
            ">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{new Date(match.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  <span>{new Date(match.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                  {showLeagueInfo && match.league && (
                    <>
                      <span>|</span>
                      {match.league && match.league.id ? (
                        <Link 
                          to={`/league/${match.league.id}`} 
                          className="flex items-center space-x-1 hover:text-blue-500 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <img 
                            src={match.league.logo || '/icons/default-league.png'} 
                            alt={match.league.name} 
                            className="w-4 h-4 object-contain" 
                          />
                          <span>{match.league.name}</span>
                        </Link>
                      ) : (
                        <>
                          <img 
                            src={match.league.logo || '/icons/default-league.png'} 
                            alt={match.league.name} 
                            className="w-4 h-4 object-contain" 
                          />
                          <span>{match.league.name}</span>
                        </>
                      )}
                    </>
                  )}
                </div>
                {/* Handle match status/state using various possible API formats */}
                {(match.status && typeof match.status === 'object' && 'description' in match.status) && (
                  <Badge 
                    variant={
                      (match.status.description as string).toLowerCase().includes('finished') ? 'secondary' : 
                      (match.status.description as string).toLowerCase().includes('live') || 
                      (match.status.description as string).toLowerCase().includes('half') ? 'destructive' : 'outline'
                    }
                  >
                    {match.status.description as string}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-col items-center text-center w-2/5">
                  <img src={match.homeTeam.logo || '/icons/default-team.png'} alt={match.homeTeam.name} className="w-8 h-8 md:w-10 md:h-10 object-contain mb-1" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{match.homeTeam.name}</span>
                </div>

                <div className="text-center w-1/5">
                  {(match.status && typeof match.status === 'object' && 'description' in match.status && 
                    (match.status.description as string).toLowerCase().includes('finished')) || 
                    (match.score && typeof match.score === 'object' && 'current' in match.score) ? (
                    <span className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
                      {(match.score && typeof match.score === 'object' && 'current' in match.score) ? 
                        match.score.current as string : '-'}
                    </span>
                  ) : (
                    <span className="text-lg md:text-xl text-gray-400 dark:text-gray-500">vs</span>
                  )}
                </div>

                <div className="flex flex-col items-center text-center w-2/5">
                  <img src={match.awayTeam.logo || '/icons/default-team.png'} alt={match.awayTeam.name} className="w-8 h-8 md:w-10 md:h-10 object-contain mb-1" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{match.awayTeam.name}</span>
                </div>
              </div>

              {/* Optional: Link to match details page if applicable */}
              {/* <Link to={`/match/${match.id}`} className="mt-2 inline-block">
                <Button variant="link" size="sm">Match Details <ArrowRight className="ml-1 h-4 w-4" /></Button>
              </Link> */}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchList; 