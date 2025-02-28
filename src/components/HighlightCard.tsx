
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Clock } from 'lucide-react';
import { MatchHighlight } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface HighlightCardProps {
  highlight: MatchHighlight;
  featured?: boolean;
}

const HighlightCard = ({ highlight, featured = false }: HighlightCardProps) => {
  const navigate = useNavigate();
  const formattedDate = formatDistanceToNow(new Date(highlight.date), { addSuffix: true });

  const handleCardClick = () => {
    navigate(`/match/${highlight.id}`);
  };

  return (
    <div 
      className="bg-highlight-800 rounded-lg p-3 cursor-pointer hover:bg-highlight-700 transition-colors"
      onClick={handleCardClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1">
          <div className="flex items-center">
            <div className="flex flex-col items-center mr-2">
              <img 
                src={highlight.homeTeam.logo} 
                alt={highlight.homeTeam.name} 
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                }}
              />
            </div>
            <span className="text-white font-bold mx-2 text-lg">
              {highlight.score.home}-{highlight.score.away}
            </span>
            <div className="flex flex-col items-center ml-2">
              <img 
                src={highlight.awayTeam.logo} 
                alt={highlight.awayTeam.name} 
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                }}
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#FFC30B] text-black">
          <Play className="w-5 h-5" fill="black" />
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          <div className="text-white font-medium truncate pr-2">
            {highlight.homeTeam.name} vs {highlight.awayTeam.name}
          </div>
          <div className="flex items-center text-gray-400 text-xs mt-1">
            <Clock size={12} className="mr-1" />
            {formattedDate}
          </div>
        </div>
        
        <div className="bg-highlight-900 text-white text-xs px-2 py-1 rounded">
          {highlight.duration}
        </div>
      </div>
    </div>
  );
};

export default HighlightCard;
