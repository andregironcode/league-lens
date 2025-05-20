
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { HighlightlyHighlight, HighlightlyMatch } from "@/types";
import { useState, useEffect } from "react";
import { Calendar, Eye, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface VideoPlayerDialogProps {
  match?: HighlightlyMatch | null;
  open?: boolean;
  onOpenChange?: React.Dispatch<React.SetStateAction<boolean>>;
  videoUrl?: string;
  title?: string;
  // Support both naming conventions for backward compatibility
  isOpen?: boolean;
  onClose?: () => void;
  highlight?: HighlightlyHighlight | null;
}

const VideoPlayerDialog = ({ 
  match, 
  open, 
  onOpenChange, 
  videoUrl, 
  title,
  // Support both naming conventions for backward compatibility
  isOpen, 
  onClose,
  highlight
}: VideoPlayerDialogProps) => {
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  
  // Use either open or isOpen, prioritizing open
  const dialogOpen = open !== undefined ? open : isOpen;
  
  // Handle close with either onOpenChange or onClose
  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else if (!newOpen && onClose) {
      onClose();
    }
  };

  // Reset selected video index when match changes
  useEffect(() => {
    setSelectedVideoIndex(0);
  }, [match, highlight]);

  // Create a display object from either match, highlight, or direct video URL
  let displayMatch = null;
  
  if (match) {
    displayMatch = {
      title: match.homeTeam.name + " vs " + match.awayTeam.name,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      score: match.score?.fullTime || { home: 0, away: 0 },
      competition: match.competition,
      date: match.date,
      embedUrl: null
    };
  } else if (highlight) {
    displayMatch = {
      title: highlight.title || highlight.homeTeam.name + " vs " + highlight.awayTeam.name,
      homeTeam: highlight.homeTeam,
      awayTeam: highlight.awayTeam,
      score: { home: highlight.homeGoals, away: highlight.awayGoals },
      competition: highlight.competition,
      date: highlight.date,
      embedUrl: highlight.embedUrl
    };
  } else if (videoUrl) {
    displayMatch = {
      title: title || "Highlight Video",
      homeTeam: { name: "", logo: "" },
      awayTeam: { name: "", logo: "" },
      score: { home: 0, away: 0 },
      competition: { name: "Highlight" },
      date: new Date().toISOString(),
      embedUrl: videoUrl
    };
  }

  if (!displayMatch) return null;
  
  // Format date
  const formattedDate = displayMatch.date ? formatDistanceToNow(new Date(displayMatch.date), { addSuffix: true }) : '';
  const exactDate = displayMatch.date ? new Date(displayMatch.date).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }) : '';

  // Process embed code to add autoplay parameter if it's an iframe
  const processEmbedUrl = (embedUrl: string): string => {
    if (!embedUrl) return '';
    
    try {
      const url = new URL(embedUrl, window.location.origin);
      
      // Add autoplay parameter based on video platform
      if (embedUrl.includes('youtube.com')) {
        url.searchParams.set('autoplay', '1');
        url.searchParams.set('mute', '0'); // Unmuted autoplay
      } else if (embedUrl.includes('vimeo.com')) {
        url.searchParams.set('autoplay', '1');
      } else {
        // For other platforms, we'll try the autoplay parameter
        url.searchParams.set('autoplay', '1');
      }
      
      return url.toString();
    } catch (e) {
      console.error("Error processing embed URL:", e);
      return embedUrl;
    }
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

  const homeTeamAbbrev = getTeamAbbreviation(displayMatch.homeTeam.name);
  const awayTeamAbbrev = getTeamAbbreviation(displayMatch.awayTeam.name);
  const homeTeamColor = getTeamColor(displayMatch.homeTeam.name);
  const awayTeamColor = getTeamColor(displayMatch.awayTeam.name);

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-6xl w-full bg-black border-highlight-800 text-white p-0 overflow-hidden">
        <DialogTitle className="sr-only">{displayMatch.title}</DialogTitle>
        <div className="flex flex-col h-full">
          {/* Back button */}
          <div className="px-6 pt-6">
            <button 
              onClick={() => handleOpenChange(false)}
              className="flex items-center mb-4 text-sm font-medium hover:underline transition-colors text-white"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Home
            </button>
          </div>

          {/* Video Player */}
          <div className="w-full aspect-video">
            {displayMatch.embedUrl ? (
              <iframe 
                className="w-full h-full"
                src={processEmbedUrl(displayMatch.embedUrl)}
                frameBorder="0" 
                allowFullScreen
                allow="autoplay; encrypted-media"
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
                {displayMatch.competition?.name || "Highlight"}
              </span>
            </div>
          </div>
          
          {/* Match Title */}
          <div className="px-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-3 text-white">
              {displayMatch.title}
            </h1>
            
            <div className="flex flex-wrap items-center text-sm text-gray-400 mb-6 space-x-6">
              {exactDate && (
                <div className="flex items-center">
                  <Calendar size={16} className="mr-2" />
                  <span>{exactDate}</span>
                </div>
              )}
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
                    {displayMatch.homeTeam.name}
                  </span>
                </div>
                
                <div className="text-5xl md:text-6xl font-bold text-center text-white">
                  {displayMatch.score.home} <span className="text-gray-400">-</span> {displayMatch.score.away}
                </div>
                
                <div className="flex flex-col items-center">
                  <div className={`w-16 h-16 ${awayTeamColor} rounded-full flex items-center justify-center text-2xl font-bold text-white`}>
                    {awayTeamAbbrev}
                  </div>
                  <span className="font-semibold text-lg mt-2 text-white text-center">
                    {displayMatch.awayTeam.name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoPlayerDialog;
