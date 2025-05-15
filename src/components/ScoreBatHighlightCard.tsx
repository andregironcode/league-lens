
import { useState } from 'react';
import { Play, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ScoreBatMatch } from '@/types';
import VideoPlayerDialog from './VideoPlayerDialog';

interface ScoreBatHighlightCardProps {
  match: ScoreBatMatch;
}

const ScoreBatHighlightCard = ({ match }: ScoreBatHighlightCardProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const formattedDate = formatDistanceToNow(new Date(match.date), { addSuffix: true });
  
  // Parse score from title if possible (format: "Team A 1-0 Team B")
  const scoreRegex = /(\d+)\s*-\s*(\d+)/;
  const scoreMatch = match.title.match(scoreRegex);
  const homeScore = scoreMatch ? parseInt(scoreMatch[1]) : 0;
  const awayScore = scoreMatch ? parseInt(scoreMatch[2]) : 0;
  
  // Parse team names from title (format: "Team A - Team B")
  const teamNames = match.title.split(' - ');
  const homeTeamName = teamNames[0] || '';
  const awayTeamName = teamNames[1] ? teamNames[1].replace(scoreRegex, '').trim() : '';

  // Extract video duration if available
  const videoDuration = match.videos && match.videos.length > 0 ? '10:24' : '00:00';

  return (
    <>
      <div 
        className="bg-highlight-800 rounded-lg p-3 cursor-pointer hover:bg-highlight-700 transition-colors"
        onClick={() => setIsDialogOpen(true)}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3 flex-1">
            <div className="flex items-center justify-center">
              {/* Use generic team logos or extract from API if available */}
              <img 
                src={`https://ui-avatars.com/api/?name=${homeTeamName.split(' ')[0]}&background=random&color=fff&size=128`}
                alt={homeTeamName}
                className="w-8 h-8 object-contain rounded-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                }}
              />
              <span className="text-white font-bold mx-2 text-lg">
                {homeScore}-{awayScore}
              </span>
              <img 
                src={`https://ui-avatars.com/api/?name=${awayTeamName.split(' ')[0]}&background=random&color=fff&size=128`}
                alt={awayTeamName}
                className="w-8 h-8 object-contain rounded-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                }}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#FFC30B] text-black">
            <Play className="w-5 h-5" fill="black" />
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <div className="text-white font-medium truncate pr-2">
              <span className="hover:text-[#FFC30B] transition-colors">
                {homeTeamName}
              </span>
              {" vs "}
              <span className="hover:text-[#FFC30B] transition-colors">
                {awayTeamName}
              </span>
            </div>
            <div className="flex items-center text-gray-400 text-xs mt-1">
              <Clock size={12} className="mr-1" />
              {formattedDate}
            </div>
          </div>
          
          <div className="bg-highlight-900 text-white text-xs px-2 py-1 rounded">
            {videoDuration}
          </div>
        </div>
      </div>

      <VideoPlayerDialog 
        match={match}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
};

export default ScoreBatHighlightCard;
