
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScoreBatMatch, ScoreBatVideo } from "@/types";
import { useState } from "react";

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl w-full bg-highlight-800 border-highlight-700 text-white">
        <DialogTitle className="text-white text-lg font-semibold mb-4">
          {match.title}
        </DialogTitle>
        
        {/* Video Player */}
        <div className="w-full aspect-video mb-4">
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
        
        {/* Video Selection */}
        {videos.length > 1 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {videos.map((video: ScoreBatVideo, index: number) => (
              <button
                key={video.id}
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
        )}
        
        <div className="flex items-center text-sm text-gray-400 mt-2">
          <span>{match.competition}</span>
          <span className="mx-2">•</span>
          <span>{new Date(match.date).toLocaleDateString()}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoPlayerDialog;
