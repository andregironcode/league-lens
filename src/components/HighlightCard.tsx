
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Clock, Eye } from 'lucide-react';
import { MatchHighlight } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface HighlightCardProps {
  highlight: MatchHighlight;
  featured?: boolean;
}

const HighlightCard = ({ highlight, featured = false }: HighlightCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const navigate = useNavigate();
  
  const formattedDate = formatDistanceToNow(new Date(highlight.date), { addSuffix: true });
  const formattedViews = new Intl.NumberFormat('en-US', { 
    notation: 'compact',
    compactDisplay: 'short'
  }).format(highlight.views);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleCardClick = () => {
    navigate(`/match/${highlight.id}`);
  };

  return (
    <div 
      className={`highlight-card group ${
        featured ? 'aspect-video md:aspect-[16/9]' : 'aspect-video'
      } cursor-pointer`}
      onClick={handleCardClick}
    >
      <div className="absolute inset-0 z-0">
        {!imageLoaded && <div className="image-placeholder" />}
        <img
          src={highlight.thumbnailUrl}
          alt={highlight.title}
          onLoad={handleImageLoad}
          className={`lazy-image ${imageLoaded ? 'lazy-image-loaded' : 'lazy-image-loading'}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      </div>
      
      <div className="absolute inset-0 p-4 flex flex-col justify-end z-10">
        <div className="flex items-center space-x-2 mb-2">
          <span className="bg-highlight-900/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
            {highlight.competition.name}
          </span>
          <span className="bg-highlight-900/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
            {highlight.duration}
          </span>
        </div>
        
        <div className="flex justify-between items-end">
          <div className="flex-1">
            <h3 className="text-white font-medium text-base md:text-lg line-clamp-2 group-hover:underline">
              {highlight.title}
            </h3>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center text-gray-300 text-xs">
                <Clock size={12} className="mr-1" />
                {formattedDate}
              </div>
              <div className="flex items-center text-gray-300 text-xs">
                <Eye size={12} className="mr-1" />
                {formattedViews} views
              </div>
            </div>
          </div>
          
          <div className={`flex items-center justify-center w-12 h-12 rounded-full
            bg-white/10 backdrop-blur-md text-white 
            group-hover:bg-white group-hover:text-highlight-900
            transition-all duration-300 transform group-hover:scale-110
            ${featured ? 'md:w-14 md:h-14' : ''}`}
          >
            <PlayCircle className="w-6 h-6 md:w-7 md:h-7" />
          </div>
        </div>
        
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center space-x-1 text-white text-sm md:text-base font-semibold">
            <span>{highlight.homeTeam.name}</span>
            <span className="text-gray-300 px-1">{highlight.score.home}</span>
            <span className="text-gray-400">-</span>
            <span className="text-gray-300 px-1">{highlight.score.away}</span>
            <span>{highlight.awayTeam.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HighlightCard;
