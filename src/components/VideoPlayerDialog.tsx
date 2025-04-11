
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScoreBatMatch, ScoreBatVideo } from "@/types";
import { useState, useEffect } from "react";
import { Calendar, Eye, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fetchHighlightlyMatch } from "@/services/highlightService";
import { toast } from "sonner";

interface VideoPlayerDialogProps {
  match: ScoreBatMatch | null;
  isOpen: boolean;
  onClose: () => void;
  matchId?: string; // Optional match ID for fetching from Highlightly API
}

const VideoPlayerDialog = ({ match, isOpen, onClose, matchId }: VideoPlayerDialogProps) => {
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightlyData, setHighlightlyData] = useState<any>(null);

  // Reset selected video index when match changes
  useEffect(() => {
    setSelectedVideoIndex(0);
  }, [match]);

  // Fetch match data from Highlightly API if matchId is provided
  useEffect(() => {
    if (matchId && isOpen) {
      setIsLoading(true);
      fetchHighlightlyMatch(matchId)
        .then(data => {
          setHighlightlyData(data);
          console.log("Fetched Highlightly data:", data);
        })
        .catch(error => {
          console.error("Failed to fetch match from Highlightly:", error);
          toast.error("Failed to load highlight from Highlightly API");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [matchId, isOpen]);

  // If we're loading or neither match nor highlightlyData is available, show loading state
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-6xl w-full bg-black border-highlight-800 text-white p-0 overflow-hidden">
          <div className="flex items-center justify-center p-8 h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FFC30B]"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // If no match data is available, return null
  if (!match && !highlightlyData) return null;

  // Use highlightlyData if available, otherwise use match data
  const activeMatch = highlightlyData || match;
  const videos = activeMatch.videos || [];
  const currentVideo = videos[selectedVideoIndex];
  
  // Parse score from title if possible (format: "Team A 1-0 Team B")
  const scoreRegex = /(\d+)\s*-\s*(\d+)/;
  const scoreMatch = activeMatch.title.match(scoreRegex);
  const homeScore = scoreMatch ? parseInt(scoreMatch[1]) : 0;
  const awayScore = scoreMatch ? parseInt(scoreMatch[2]) : 0;
  
  // Parse team names from title (format: "Team A - Team B")
  const teamNames = activeMatch.title.split(' - ');
  const homeTeamName = teamNames[0] || '';
  const awayTeamName = teamNames[1] ? teamNames[1].replace(scoreRegex, '').trim() : '';
  
  // Format date
  const formattedDate = formatDistanceToNow(new Date(activeMatch.date), { addSuffix: true });
  const exactDate = new Date(activeMatch.date).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Process embed code to add autoplay parameter if it's an iframe
  const processEmbedCode = (embedCode: string): string => {
    if (!embedCode) return '';
    
    // Add autoplay=1 parameter to iframe src if it's a YouTube or other video embed
    return embedCode.replace(/src="([^"]+)"/, (match, src) => {
      const url = new URL(src, window.location.origin);
      
      // Add autoplay parameter based on video platform
      if (src.includes('youtube.com')) {
        url.searchParams.set('autoplay', '1');
        url.searchParams.set('mute', '0'); // Unmuted autoplay
      } else if (src.includes('vimeo.com')) {
        url.searchParams.set('autoplay', '1');
      } else {
        // For other platforms, we'll try the autoplay parameter
        url.searchParams.set('autoplay', '1');
      }
      
      return `src="${url.toString()}" allow="autoplay; encrypted-media"`;
    });
  };

  // Get team abbreviations for the team circles
  const getTeamAbbreviation = (name: string): string => {
    if (!name) return '';
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    // Get first letters of first two words
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  };

  // Generate a consistent background color for team abbreviation circles
  const getTeamColor = (name: string): string => {
    const colors = [
      'bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    
    // Create a simple hash of the name to pick a consistent color
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Get a positive number
    hash = Math.abs(hash);
    
    // Get a color from the colors array
    return colors[hash % colors.length];
  };

  const homeTeamAbbrev = getTeamAbbreviation(homeTeamName);
  const awayTeamAbbrev = getTeamAbbreviation(awayTeamName);
  const homeTeamColor = getTeamColor(homeTeamName);
  const awayTeamColor = getTeamColor(awayTeamName);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl w-full bg-black border-highlight-800 text-white p-0 overflow-hidden">
        <DialogTitle className="sr-only">{activeMatch.title}</DialogTitle>
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
                dangerouslySetInnerHTML={{ __html: processEmbedCode(currentVideo.embed) }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-black">
                <p className="text-white">No video available</p>
              </div>
            )}
          </div>
          
          {/* Competition Info */}
          <div className="px-6 pt-4">
            <div className="mb-2">
              <span className="inline-block bg-[#222222] text-white text-sm px-3 py-1 rounded-full">
                {activeMatch.competition}
              </span>
            </div>
          </div>
          
          {/* Match Title */}
          <div className="px-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-3 text-white">
              {activeMatch.title}
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
                  <div className={`w-16 h-16 ${homeTeamColor} rounded-full flex items-center justify-center text-2xl font-bold text-white`}>
                    {homeTeamAbbrev}
                  </div>
                  <span className="font-semibold text-lg mt-2 text-white text-center">
                    {homeTeamName}
                  </span>
                </div>
                
                <div className="text-5xl md:text-6xl font-bold text-center text-white">
                  {homeScore} <span className="text-gray-400">-</span> {awayScore}
                </div>
                
                <div className="flex flex-col items-center">
                  <div className={`w-16 h-16 ${awayTeamColor} rounded-full flex items-center justify-center text-2xl font-bold text-white`}>
                    {awayTeamAbbrev}
                  </div>
                  <span className="font-semibold text-lg mt-2 text-white text-center">
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
