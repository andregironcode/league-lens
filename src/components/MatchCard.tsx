import { useState } from 'react';
import { Calendar, Clock, Video } from 'lucide-react';
import { format } from 'date-fns';
import { formatMatchStatus } from '@/utils/formatMatchStatus';
import { useNavigate } from 'react-router-dom';

interface MatchCardProps {
  match: {
    id: string;
    homeTeam: {
      name: string;
      logo: string;
    };
    awayTeam: {
      name: string;
      logo: string;
    };
    score?: {
      home: number;
      away: number;
    };
    status: string;
    kickoff?: string;
    date?: string;
    competition?: {
      name: string;
      logo: string;
    };
    time?: string;
    hasHighlights?: boolean;
    embedUrl?: string;
  };
  onHighlightClick?: (match: any) => void;
  matchType: 'live' | 'upcoming' | 'finished';
}

const MatchCard = ({ match, onHighlightClick, matchType }: MatchCardProps) => {
  const [showVideo, setShowVideo] = useState(false);
  const navigate = useNavigate();
  
  // Format kickoff time
  const formatTime = (dateString?: string) => {
    if (!dateString) return '--:--';
    
    try {
      const date = new Date(dateString);
      return format(date, 'HH:mm');
    } catch (e) {
      return '--:--';
    }
  };
  
  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '--';
    
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMM');
    } catch (e) {
      return '--';
    }
  };

  // Format match time for display
  const formatMatchTime = (time?: string) => {
    if (!time) return '';
    
    // If it's a minute number (e.g., '45', '90')
    if (/^\d+$/.test(time)) {
      return `${time}'`;
    }
    
    // Otherwise return as is
    return time;
  };

  const handleClick = () => {
    if (match.embedUrl && !showVideo) {
      setShowVideo(true);
      return;
    }
    
    if (match.hasHighlights && onHighlightClick) {
      onHighlightClick(match);
    } else {
      navigate(`/match/${match.id}`);
    }
  };
  
  return (
    <div 
      className={`bg-highlight-800 rounded-lg p-4 hover:bg-highlight-700 transition-colors ${match.hasHighlights || match.embedUrl ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
    >
      <div className="flex justify-between items-center mb-2">
        {matchType === 'live' && (
          <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded">
            {formatMatchStatus(match.status)}
          </span>
        )}
        {matchType === 'upcoming' && (
          <div className="flex items-center text-xs text-gray-400">
            <Calendar size={12} className="mr-1" />
            <span>{formatDate(match.kickoff || match.date)}</span>
          </div>
        )}
        {matchType === 'finished' && (
          <div className="flex items-center text-xs text-gray-400">
            <Calendar size={12} className="mr-1" />
            <span>{formatDate(match.date || match.kickoff)}</span>
          </div>
        )}
        <span className="text-xs text-gray-400">{match.competition?.name}</span>
      </div>
      
      {showVideo && match.embedUrl ? (
        <div className="relative pt-[56.25%] mt-2">
          <iframe 
            className="absolute top-0 left-0 w-full h-full rounded"
            src={match.embedUrl}
            title="Match Highlights"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      ) : (
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center w-[40%]">
            <img 
              src={match.homeTeam.logo} 
              alt={match.homeTeam.name}
              className="w-8 h-8 object-contain mr-2"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
              }}
            />
            <span className="text-white text-sm truncate">{match.homeTeam.name}</span>
          </div>
          
          {matchType === 'upcoming' && (
            <div className="flex items-center bg-black bg-opacity-30 px-3 py-1 rounded">
              <Clock size={12} className="text-[#FFC30B] mr-1" />
              <span className="text-white text-sm font-medium">{formatTime(match.kickoff || match.date)}</span>
            </div>
          )}
          
          {(matchType === 'live' || matchType === 'finished') && match.score && (
            <div className="flex flex-col items-center">
              <div className="flex items-center bg-black bg-opacity-50 px-3 py-1 rounded">
                <span className="text-white font-bold mx-1 text-lg">{match.score.home}</span>
                <span className="text-gray-400 mx-1">-</span>
                <span className="text-white font-bold mx-1 text-lg">{match.score.away}</span>
              </div>
              {matchType === 'live' && (
                <span className="text-[#FFC30B] text-xs mt-1 font-medium">{formatMatchTime(match.time)}</span>
              )}
              {matchType === 'finished' && (
                <span className="text-xs text-gray-400 mt-1 font-medium">FT</span>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-end w-[40%]">
            <span className="text-white text-sm truncate text-right">{match.awayTeam.name}</span>
            <img 
              src={match.awayTeam.logo} 
              alt={match.awayTeam.name}
              className="w-8 h-8 object-contain ml-2"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
              }}
            />
          </div>
        </div>
      )}

      {(match.hasHighlights || match.embedUrl) && !showVideo && (
        <div className="mt-2 flex justify-center">
          <div className="flex items-center text-xs text-[#FFC30B] bg-[#FFC30B] bg-opacity-10 px-2 py-1 rounded">
            <Video size={12} className="mr-1" />
            <span>Highlights Available</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchCard;
