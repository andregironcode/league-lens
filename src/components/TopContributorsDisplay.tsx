import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCheck, Users } from 'lucide-react';

interface TopContributorsDisplayProps {
  leagueName?: string;
  season?: string | null;
  // In the future, this might take actual player stats data as props
}

const TopContributorsDisplay: React.FC<TopContributorsDisplayProps> = ({ leagueName, season }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center">
            <Users className="mr-2 h-6 w-6 text-indigo-600" />
            Top Contributors {leagueName ? ` - ${leagueName} ` : ''}{season ? `(${season})` : ''}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center text-gray-500 py-4">
          <UserCheck className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>Detailed top scorer and assister information is planned for a future update.</p>
          <p className="text-sm text-gray-400 mt-1">
            (Fetching comprehensive league-wide player statistics like top goals/assists is challenging with the current API capabilities.)
          </p>
        </div>
        {/* 
        Placeholder for future implementation:
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-md font-semibold mb-2">Most Goals</h4>
            <p className="text-sm text-gray-500">Player 1 - 15 Goals</p>
            <p className="text-sm text-gray-500">Player 2 - 12 Goals</p>
          </div>
          <div>
            <h4 className="text-md font-semibold mb-2">Most Assists</h4>
            <p className="text-sm text-gray-500">Player A - 10 Assists</p>
            <p className="text-sm text-gray-500">Player B - 8 Assists</p>
          </div>
        </div>
        */}
      </CardContent>
    </Card>
  );
};

export default TopContributorsDisplay; 