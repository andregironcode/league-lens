
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { MatchHighlight } from '@/types';

interface HeroCarouselProps {
  highlights: MatchHighlight[];
}

const HeroCarousel = ({ highlights }: HeroCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
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

  return (
    <div className="relative w-full overflow-hidden bg-black rounded-lg shadow-lg h-[65vh] max-h-[700px]">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 to-transparent z-10"></div>
        
        <img
          src={currentHighlight.thumbnailUrl}
          alt={currentHighlight.title}
          className="w-full h-full object-cover opacity-80"
        />

        {/* Video preview - larger now */}
        <div className="absolute top-1/2 right-8 transform -translate-y-1/2 w-2/5 max-w-2xl aspect-video rounded-lg overflow-hidden shadow-2xl border-4 border-white/10 z-20">
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

      {/* Content */}
      <div className="relative z-20 h-full flex flex-col justify-end p-8 md:p-12">
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
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 max-w-2xl">
          {currentHighlight.homeTeam.name} <span className="text-white/60">vs</span> {currentHighlight.awayTeam.name}
        </h1>
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleNavigateToMatch}
            className="bg-white text-black px-6 py-3 rounded-full font-semibold flex items-center hover:bg-white/90 transition-colors"
          >
            <Play className="w-5 h-5 mr-2" />
            Play
          </button>
          <span className="text-white/90 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-md">
            {currentHighlight.competition.name}
          </span>
          <span className="text-white/90 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-md">
            {currentHighlight.duration}
          </span>
        </div>
      </div>

      {/* Carousel Controls - Larger and more prominent */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-30">
        {highlights.map((_, index) => (
          <button
            key={index}
            className={`h-3 rounded-full transition-all ${
              index === currentIndex ? "bg-white w-8" : "bg-white/50 w-3"
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
    </div>
  );
};

export default HeroCarousel;
