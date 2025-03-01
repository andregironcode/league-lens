import React from 'react';
import { League } from '@/types';
import { Link } from 'react-router-dom';

interface LeagueSectionProps {
  leagues: League[];
}

const LeagueSection: React.FC<LeagueSectionProps> = ({ leagues }) => {
  return (
    <div className="py-12 bg-gray-50 rounded-lg">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Top Leagues</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {leagues.map((league) => (
            <div key={league.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              
              <div className="flex items-center justify-between mb-6">
                <Link to={`/league/${league.id}`} className="flex items-center space-x-2 hover:opacity-90 transition-opacity">
                  <img
                    src={league.logo}
                    alt={league.name}
                    className="w-8 h-8 object-contain"
                  />
                  <h2 className="text-xl font-bold">{league.name}</h2>
                </Link>
              </div>

              <div className="px-6 py-4">
                <p className="text-gray-600">
                  Stay up-to-date with the latest highlights and news from {league.name}.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeagueSection;
