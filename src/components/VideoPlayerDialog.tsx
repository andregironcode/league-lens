
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScoreBatMatch, ScoreBatVideo } from "@/types";
import { useState } from "react";
import { Calendar, Eye, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface VideoPlayerDialogProps {
  match: ScoreBatMatch | null;
  isOpen: boolean;
  onClose: () => void;
}

const VideoPlayerDialog = ({ match, isOpen, onClose }: VideoPlayerDialogProps) => {
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);

  if (!match) return null;

  const videos = match.videos || [];
  const currentVideo = videos[selectedVideoIndex];
  
  // Parse score from title if possible (format: "Team A 1-0 Team B")
  const scoreRegex = /(\d+)\s*-\s*(\d+)/;
  const scoreMatch = match.title.match(scoreRegex);
  const homeScore = scoreMatch ? parseInt(scoreMatch[1]) : 0;
  const awayScore = scoreMatch ? parseInt(scoreMatch[2]) : 0;
  
  // Parse team names from title (format: "Team A - Team B")
  const teamNames = match.title.split(' - ');
  const homeTeamName = teamNames[0] || '';
  const awayTeamName = teamNames[1] ? teamNames[1].replace(scoreRegex, '').trim() : '';
  
  // Format date
  const formattedDate = formatDistanceToNow(new Date(match.date), { addSuffix: true });
  const exactDate = new Date(match.date).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl w-full bg-black border-highlight-800 text-white p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Back button */}
          <div className="px-6 pt-6">
            <button 
              onClick={onClose}
              className="flex items-center mb-4 text-sm font-medium hover:underline transition-colors text-white"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Home
            </button>
          </div>

          {/* Video Player */}
          <div className="w-full aspect-video">
            {currentVideo ? (
              <div 
                className="w-full h-full"
                dangerouslySetInnerHTML={{ __html: currentVideo.embed }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-black">
                <p className="text-white">No video available</p>
              </div>
            )}
          </div>
          
          {/* Video Information */}
          <div className="px-6 py-4">
            <div className="mb-4">
              <span className="inline-block bg-[#222222] text-white text-sm px-3 py-1 rounded-full">
                {match.competition}
              </span>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold mb-4 text-white">
              {match.title}
            </h1>
            
            <div className="flex flex-wrap items-center text-sm text-gray-400 mb-6 space-x-6">
              <div className="flex items-center">
                <Calendar size={16} className="mr-2" />
                <span>{exactDate}</span>
              </div>
              <div className="flex items-center">
                <Eye size={16} className="mr-2" />
                <span>1,243,000 views</span>
              </div>
            </div>
          </div>
          
          {/* Teams and Score */}
          <div className="px-6 pb-6">
            <div className="bg-[#111111] rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center">
                <div className="flex flex-col items-center">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${homeTeamName.split(' ')[0]}&background=random&color=fff&size=128`}
                    alt={homeTeamName}
                    className="w-16 h-16 object-contain rounded-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                    }}
                  />
                  <span className="font-semibold text-lg mt-2 text-white">
                    {homeTeamName}
                  </span>
                </div>
                
                <div className="text-4xl md:text-5xl font-bold text-center text-white">
                  {homeScore} <span className="text-gray-400">-</span> {awayScore}
                </div>
                
                <div className="flex flex-col items-center">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${awayTeamName.split(' ')[0]}&background=random&color=fff&size=128`}
                    alt={awayTeamName}
                    className="w-16 h-16 object-contain rounded-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                    }}
                  />
                  <span className="font-semibold text-lg mt-2 text-white">
                    {awayTeamName}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Video Selection */}
          {videos.length > 1 && (
            <div className="px-6 pb-6">
              <h3 className="text-lg font-semibold mb-3 text-white">Available Highlights</h3>
              <div className="flex flex-wrap gap-2">
                {videos.map((video: ScoreBatVideo, index: number) => (
                  <button
                    key={video.id || index}
                    onClick={() => setSelectedVideoIndex(index)}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      selectedVideoIndex === index
                        ? "bg-[#FFC30B] text-black"
                        : "bg-highlight-700 text-white hover:bg-highlight-600"
                    }`}
                  >
                    Highlight {index + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoPlayerDialog;
