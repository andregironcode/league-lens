import React from 'react';
import { Match as MatchType } from '@/types';
import MatchList from './MatchList'; // Re-use the generic MatchList for consistency
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface TodaysMatchesDisplayProps {
  matches: MatchType[];
  title?: string;
}

const TodaysMatchesDisplay: React.FC<TodaysMatchesDisplayProps> = ({ 
  matches, 
  title = "Today's Matches"
}) => {
  if (!matches || matches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center text-gray-500 py-4">
            <AlertTriangle className="w-10 h-10 mb-2 text-gray-400" />
            <p>No matches scheduled for today in this league.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Utilize the MatchList component for rendering
  // We might want to pass specific props to MatchList if a different style is needed for "Today's Matches"
  // For example, a more compact view or different information density.
  // For now, using default MatchList rendering.
  return <MatchList matches={matches} title={title} emptyMessage="No matches scheduled for today." />;
};

export default TodaysMatchesDisplay; 