
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, Info } from 'lucide-react';
import { MatchHighlight } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Tooltip } from '@/components/ui/tooltip';

interface HighlightCardProps {
  highlight: MatchHighlight;
  featured?: boolean;
}

// Helper function to get short team names
const getShortTeamName = (fullName: string): string => {
  // Common mappings for popular teams
  const teamMappings: Record<string, string> = {
    'Manchester City': 'Man City',
    'Manchester United': 'Man United',
    'Tottenham Hotspur': 'Spurs',
    'Wolverhampton Wanderers': 'Wolves',
    'Newcastle United': 'Newcastle',
    'Borussia Dortmund': 'Dortmund',
    'Bayern Munich': 'Bayern',
    'RB Leipzig': 'Leipzig',
    'Bayer Leverkusen': 'Leverkusen',
    'Barcelona': 'Barça',
    'Real Madrid': 'Madrid',
    'Atletico Madrid': 'Atletico',
    'Inter Milan': 'Inter',
    'AC Milan': 'Milan',
    'Juventus': 'Juve',
    'Paris Saint-Germain': 'PSG',
    'Ajax Amsterdam': 'Ajax'
  };

  return teamMappings[fullName] || fullName;
};

// Extract competition name in a more readable format
const formatCompetitionName = (competition: string): string => {
  // Remove country prefix if present (e.g., "ENGLAND: Premier League" -> "Premier League")
  if (competition.includes(':')) {
    return competition.split(':')[1].trim();
  }
  return competition;
};

const HighlightCard = ({ highlight, featured = false }: HighlightCardProps) => {
  const navigate = useNavigate();
  const formattedDate = formatDistanceToNow(new Date(highlight.date), { addSuffix: true });
  
  // Get competition name in readable format
  const competitionName = highlight.competition.name;

  const handleCardClick = () => {
    console.log('Navigating to match with ID:', highlight.id);
    navigate(`/match/${highlight.id}`);
  };

  const handleTeamClick = (teamId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    navigate(`/team/${teamId}`);
  };

  // Check if the highlight has video content
  const hasVideo = highlight.videos && highlight.videos.length > 0;
  const videoCount = highlight.videos?.length || 0;

  return (
    <div 
      className="bg-highlight-800 rounded-lg p-3 cursor-pointer hover:bg-highlight-700 transition-colors"
      onClick={handleCardClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1">
          <div className="flex items-center justify-center">
            <img 
              src={highlight.homeTeam?.logo} 
              alt={highlight.homeTeam?.name} 
              className="w-8 h-8 object-contain cursor-pointer hover:scale-110 transition-transform"
              onClick={(e) => handleTeamClick(highlight.homeTeam?.id, e)}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
              }}
            />
            <span className="text-white font-bold mx-2 text-lg">
              {highlight.score?.home}-{highlight.score?.away}
            </span>
            <img 
              src={highlight.awayTeam?.logo} 
              alt={highlight.awayTeam?.name} 
              className="w-8 h-8 object-contain cursor-pointer hover:scale-110 transition-transform"
              onClick={(e) => handleTeamClick(highlight.awayTeam?.id, e)}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
              }}
            />
          </div>
        </div>
        
        <div className="relative">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#FFC30B] text-black">
            <Play className="w-5 h-5" fill="black" />
          </div>
          {videoCount > 1 && (
            <div className="absolute -top-1 -right-1 bg-highlight-900 text-white text-xs px-1.5 py-0.5 rounded-full">
              {videoCount}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          <div className="text-white font-medium truncate pr-2">
            <span 
              className="cursor-pointer hover:text-[#FFC30B] transition-colors"
              onClick={(e) => handleTeamClick(highlight.homeTeam?.id, e)}
            >
              {getShortTeamName(highlight.homeTeam?.name)}
            </span>
            {" vs "}
            <span 
              className="cursor-pointer hover:text-[#FFC30B] transition-colors"
              onClick={(e) => handleTeamClick(highlight.awayTeam?.id, e)}
            >
              {getShortTeamName(highlight.awayTeam?.name)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center text-gray-400 text-xs mt-1">
              <Clock size={12} className="mr-1" />
              {formattedDate}
            </div>
            {competitionName && (
              <div className="text-xs mt-1 bg-highlight-900 text-white px-1.5 py-0.5 rounded">
                {competitionName}
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-highlight-900 text-white text-xs px-2 py-1 rounded">
          {highlight.duration || 'Highlight'}
        </div>
      </div>
    </div>
  );
};

export default HighlightCard;
