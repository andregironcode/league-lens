
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, MessageCircle } from 'lucide-react';
import { MatchHighlight } from '@/types';
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface HeroCarouselProps {
  highlights: MatchHighlight[];
}

const HeroCarousel = ({ highlights }: HeroCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const navigate = useNavigate();

  const currentHighlight = highlights[currentIndex];

  // Extract YouTube video ID
  const getYoutubeVideoId = (url: string): string => {
    const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/i;
    const match = url.match(regex);
    return match ? match[1] : '';
  };

  const handleNavigateToMatch = () => {
    navigate(`/match/${currentHighlight.id}`);
  };

  const handlePrevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? highlights.length - 1 : prevIndex - 1
    );
  };

  const handleNextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === highlights.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handleOpenComments = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowComments(true);
  };

  const handleCloseComments = () => {
    setShowComments(false);
  };

  return (
    <div className="relative w-full overflow-hidden bg-[#222222] rounded-xl shadow-lg h-[55vh] max-h-[550px] border border-highlight-700/10">
      {/* Background Image with gradient overlay */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/70 to-transparent z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#000000]/80 to-transparent z-10"></div>
        
        <img
          src={currentHighlight.thumbnailUrl}
          alt={currentHighlight.title}
          className="w-full h-full object-cover opacity-40"
        />

        {/* Video preview - card-like appearance with shadow and border */}
        <div className="absolute top-1/3 right-1/2 transform translate-x-1/2 -translate-y-1/3 w-[50%] max-w-3xl aspect-video rounded-lg overflow-hidden shadow-xl z-20 border-2 border-gray-700/30">
          <iframe
            src={`https://www.youtube.com/embed/${getYoutubeVideoId(currentHighlight.videoUrl)}?autoplay=1&mute=1&controls=0&modestbranding=1&loop=1&playlist=${getYoutubeVideoId(currentHighlight.videoUrl)}`}
            title={currentHighlight.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            className="w-full h-full"
          ></iframe>
          
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/10 transition-colors cursor-pointer" onClick={handleNavigateToMatch}>
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-8 h-8 text-white" fill="white" />
            </div>
          </div>
        </div>
      </div>

      {/* Content - moved to below the video */}
      <div className="relative z-20 h-full flex flex-col justify-end p-6 md:p-8">
        <div className="bg-[#333333]/80 backdrop-blur-sm p-5 rounded-lg shadow-md border border-gray-700/30">
          <div className="flex items-center mb-2">
            <div className="flex items-center">
              <img 
                src={currentHighlight.homeTeam.logo !== '/teams/mancity.png' ? 
                    `https://api.sofascore.app/api/v1/team/${currentHighlight.homeTeam.id}/image` : 
                    'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg'} 
                alt={currentHighlight.homeTeam.name} 
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                }}
              />
              <span className="text-white text-lg mx-2">{currentHighlight.score.home} - {currentHighlight.score.away}</span>
              <img 
                src={currentHighlight.awayTeam.logo !== '/teams/arsenal.png' ? 
                    `https://api.sofascore.app/api/v1/team/${currentHighlight.awayTeam.id}/image` : 
                    'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg'} 
                alt={currentHighlight.awayTeam.name} 
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                }}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 truncate max-w-xl">
              {currentHighlight.homeTeam.name} vs {currentHighlight.awayTeam.name}
            </h1>
          </div>
          
          <div className="flex items-center space-x-3 mt-3">
            <button 
              onClick={handleNavigateToMatch}
              className="bg-white text-black px-5 py-2 rounded-full font-semibold flex items-center hover:bg-white/90 transition-colors"
            >
              <Play className="w-4 h-4 mr-2" />
              Play
            </button>
            
            <button
              onClick={handleOpenComments}
              className="bg-[#FFC30B] text-black px-4 py-2 rounded-full font-medium flex items-center hover:bg-[#FFC30B]/90 transition-colors"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              +{Math.floor(Math.random() * 20) + 5}
            </button>
            
            <span className="text-white/90 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-md">
              {currentHighlight.competition.name}
            </span>
            <span className="text-white/90 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-md">
              {currentHighlight.duration}
            </span>
          </div>
        </div>
      </div>

      {/* Carousel Controls - Larger and more prominent */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3 z-30">
        {highlights.map((_, index) => (
          <button
            key={index}
            className={`h-3 rounded-full transition-all ${
              index === currentIndex ? "bg-[#FFC30B] w-8" : "bg-white/50 w-3"
            }`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Previous/Next buttons */}
      <button
        className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full bg-black/30 flex items-center justify-center text-white z-30 hover:bg-black/50 transition-colors"
        onClick={handlePrevSlide}
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-7 h-7" />
      </button>
      <button
        className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full bg-black/30 flex items-center justify-center text-white z-30 hover:bg-black/50 transition-colors"
        onClick={handleNextSlide}
        aria-label="Next slide"
      >
        <ChevronRight className="w-7 h-7" />
      </button>

      {/* Comments Dialog */}
      <Dialog open={showComments} onOpenChange={handleCloseComments}>
        <DialogContent className="sm:max-w-md bg-[#222222] border-gray-700">
          <div className="p-4">
            <h2 className="text-xl font-bold text-white mb-4">Comments</h2>
            <div className="space-y-4">
              {/* Example comments */}
              <div className="bg-[#333333] p-3 rounded">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#FFC30B] flex items-center justify-center text-black font-bold">J</div>
                  <div className="ml-2">
                    <div className="text-white font-medium">John</div>
                    <div className="text-gray-400 text-xs">2 hours ago</div>
                  </div>
                </div>
                <p className="text-white text-sm">What a goal by Robertson! Incredible finish.</p>
              </div>
              
              <div className="bg-[#333333] p-3 rounded">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#FFC30B] flex items-center justify-center text-black font-bold">S</div>
                  <div className="ml-2">
                    <div className="text-white font-medium">Sarah</div>
                    <div className="text-gray-400 text-xs">1 hour ago</div>
                  </div>
                </div>
                <p className="text-white text-sm">Liverpool deserved this win. Great team performance!</p>
              </div>
              
              <div className="bg-[#333333] p-3 rounded">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#FFC30B] flex items-center justify-center text-black font-bold">M</div>
                  <div className="ml-2">
                    <div className="text-white font-medium">Mike</div>
                    <div className="text-gray-400 text-xs">30 minutes ago</div>
                  </div>
                </div>
                <p className="text-white text-sm">Arsenal's defense was all over the place today.</p>
              </div>
            </div>
            
            <div className="mt-4">
              <input
                type="text"
                placeholder="Add a comment..."
                className="w-full bg-[#111111] border border-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#FFC30B]"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HeroCarousel;
