
import React from 'react';
import { League } from '@/types';
import { Link } from 'react-router-dom';

interface LeagueSectionProps {
  league: League; // Changed from leagues: League[] to league: League
}

const LeagueSection: React.FC<LeagueSectionProps> = ({ league }) => {
  return (
    <div className="py-8 bg-[#222222] rounded-lg mb-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <Link to={`/league/${league.id}`} className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
            <img
              src={league.logo}
              alt={league.name}
              className="w-8 h-8 object-contain"
            />
            <h2 className="text-2xl font-bold text-white">{league.name}</h2>
          </Link>
          <Link 
            to={`/league/${league.id}`} 
            className="text-sm text-gray-300 hover:text-[#FFC30B] transition-colors"
          >
            View all
          </Link>
        </div>

        {league.highlights.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {league.highlights.slice(0, 3).map(highlight => (
              <div key={highlight.id} className="bg-[#333333] rounded-lg overflow-hidden hover:bg-[#3a3a3a] transition-colors">
                <Link to={`/match/${highlight.id}`}>
                  <div className="aspect-video relative">
                    <img 
                      src={highlight.thumbnailUrl || "https://via.placeholder.com/640x360"} 
                      alt={highlight.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute bottom-0 p-3 w-full">
                      <div className="flex items-center justify-between text-white">
                        <div className="flex items-center space-x-2">
                          <img src={highlight.homeTeam.logo} alt={highlight.homeTeam.name} className="w-5 h-5 object-contain" />
                          <span className="text-sm font-medium">{highlight.score.home}</span>
                          <span className="text-xs">-</span>
                          <span className="text-sm font-medium">{highlight.score.away}</span>
                          <img src={highlight.awayTeam.logo} alt={highlight.awayTeam.name} className="w-5 h-5 object-contain" />
                        </div>
                        <span className="text-xs opacity-80">{highlight.duration}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-white text-sm font-medium line-clamp-2">{highlight.title}</h3>
                    <p className="text-gray-400 text-xs mt-1">{highlight.views.toLocaleString()} views</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-400 text-center py-10">No highlights available</div>
        )}
      </div>
    </div>
  );
};

export default LeagueSection;
