
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Expand, MessageCircle, Globe, Flame } from 'lucide-react';
import { MatchHighlight } from '@/types';
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface HeroCarouselProps {
  highlights: MatchHighlight[];
}

const getShortTeamName = (fullName: string): string => {
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

const HeroCarousel = ({ highlights }: HeroCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const navigate = useNavigate();

  const currentHighlight = highlights[currentIndex];

  useEffect(() => {
    setIsScrolling(false);
    
    const timer = setTimeout(() => {
      const titleElement = document.getElementById('match-title');
      if (titleElement) {
        const isOverflowing = titleElement.scrollWidth > titleElement.clientWidth;
        setIsScrolling(isOverflowing);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [currentIndex]);

  const getYoutubeVideoId = (url: string): string => {
    const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/i;
    const match = url.match(regex);
    return match ? match[1] : '';
  };

  const handleNavigateToMatch = () => {
    navigate(`/match/${currentHighlight.id}`);
  };

  const handleNavigateToTeam = (teamId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/team/${teamId}`);
  };

  const handleNavigateToLeague = (leagueId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/league/${leagueId}`);
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
  
  // Format the relative date
  const formatRelativeDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      
      if (diffHrs < 1) return 'Just now';
      if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
      
      const diffDays = Math.floor(diffHrs / 24);
      if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      
      const diffMonths = Math.floor(diffDays / 30);
      return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    } catch (e) {
      return 'Recently';
    }
  };

  // If no highlights available, show a loading state
  if (!highlights || highlights.length === 0 || !currentHighlight) {
    return (
      <div className="relative w-full overflow-hidden bg-[#222222] rounded-xl shadow-lg min-h-[450px] sm:min-h-[550px] border border-highlight-700/10 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/70 to-transparent z-10"></div>
        <div className="flex items-center justify-center h-full">
          <p className="text-white/50 text-xl">Loading highlights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden bg-[#222222] rounded-xl shadow-lg min-h-[450px] sm:min-h-[550px] border border-highlight-700/10">
      <div className="absolute top-4 left-4 z-20 bg-black/70 backdrop-blur-sm rounded-full px-4 py-2 text-white flex items-center">
        <Flame className="w-4 h-4 mr-2 text-[#FFC30B]" />
        <span className="text-sm font-medium">For You</span>
      </div>
      
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/70 to-transparent z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#000000]/80 to-transparent z-10"></div>
        
        <img
          src={currentHighlight.thumbnailUrl}
          alt=""
          className="w-full h-full object-cover opacity-40"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop";
          }}
        />
      </div>

      <div className="relative z-20 flex flex-col h-full lg:hidden px-0 pt-16 pb-20">
        <div className="flex-1 mb-6 w-full">
          <div className="w-full aspect-video shadow-xl">
            <iframe
              src={`https://www.youtube.com/embed/${getYoutubeVideoId(currentHighlight.videoUrl)}?autoplay=1&mute=1&controls=1&modestbranding=1`}
              title={currentHighlight.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              className="w-full h-full"
            ></iframe>
          </div>
        </div>
        
        <div className="space-y-5 px-4">
          <div className="flex justify-center items-center">
            <div 
              onClick={(e) => handleNavigateToTeam(currentHighlight.homeTeam.id, e)}
              className="cursor-pointer transition-transform duration-200 hover:scale-110"
            >
              <img 
                src={currentHighlight.homeTeam.logo} 
                alt={currentHighlight.homeTeam.name} 
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                }}
              />
            </div>
            
            <div className="text-white text-4xl font-bold mx-8">
              {currentHighlight.score.home} - {currentHighlight.score.away}
            </div>
            
            <div 
              onClick={(e) => handleNavigateToTeam(currentHighlight.awayTeam.id, e)}
              className="cursor-pointer transition-transform duration-200 hover:scale-110"
            >
              <img 
                src={currentHighlight.awayTeam.logo} 
                alt={currentHighlight.awayTeam.name} 
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                }}
              />
            </div>
          </div>
          
          <div className="text-center">
            <h1 
              id="match-title"
              className={`text-2xl font-bold text-white mb-3 whitespace-nowrap overflow-hidden text-ellipsis ${
                isScrolling ? 'animate-marquee' : ''
              }`}
            >
              <span 
                onClick={(e) => handleNavigateToTeam(currentHighlight.homeTeam.id, e)}
                className="cursor-pointer hover:text-[#FFC30B] transition-colors"
              >
                {getShortTeamName(currentHighlight.homeTeam.name)}
              </span>
              {" vs "}
              <span 
                onClick={(e) => handleNavigateToTeam(currentHighlight.awayTeam.id, e)}
                className="cursor-pointer hover:text-[#FFC30B] transition-colors"
              >
                {getShortTeamName(currentHighlight.awayTeam.name)}
              </span>
            </h1>
          </div>
          
          <div className="flex items-center justify-center mb-4">
            <p className="text-white/70 text-sm">{formatRelativeDate(currentHighlight.date)}</p>
            <span className="mx-2 text-white/40">•</span>
            <p 
              className="text-white/70 text-sm hover:text-[#FFC30B] cursor-pointer transition-colors"
              onClick={(e) => handleNavigateToLeague(currentHighlight.competition.id, e)}
            >
              {currentHighlight.competition.name}
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-6 mt-2 mb-10">
            <button 
              onClick={handleNavigateToMatch}
              className="bg-white text-black px-6 py-3 rounded-full font-semibold flex items-center hover:bg-white/90 transition-colors"
            >
              <Expand className="w-4 h-4 mr-2" />
              Expand
            </button>
            
            <button
              onClick={handleOpenComments}
              className="bg-[#FFC30B] text-black px-5 py-3 rounded-full font-medium flex items-center hover:bg-[#FFC30B]/90 transition-colors"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              +{Math.floor(Math.random() * 20) + 5}
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-20 w-full h-full hidden lg:flex items-center justify-center py-2 px-2">
        <div className="flex flex-col lg:flex-row items-center gap-4 w-full max-w-full mx-auto mt-4">
          <div className="w-full lg:w-[35%] self-center order-2 lg:order-1 px-4">
            <div className="flex justify-center items-center mb-6">
              <div 
                onClick={(e) => handleNavigateToTeam(currentHighlight.homeTeam.id, e)}
                className="cursor-pointer transition-transform duration-200 hover:scale-110"
              >
                <img 
                  src={currentHighlight.homeTeam.logo} 
                  alt={currentHighlight.homeTeam.name} 
                  className="w-16 h-16 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                  }}
                />
              </div>
              
              <div className="text-white text-4xl font-bold mx-8">
                {currentHighlight.score.home} - {currentHighlight.score.away}
              </div>
              
              <div 
                onClick={(e) => handleNavigateToTeam(currentHighlight.awayTeam.id, e)}
                className="cursor-pointer transition-transform duration-200 hover:scale-110"
              >
                <img 
                  src={currentHighlight.awayTeam.logo} 
                  alt={currentHighlight.awayTeam.name} 
                  className="w-16 h-16 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                  }}
                />
              </div>
            </div>
            
            <div className="relative overflow-hidden max-w-full px-4">
              <h1 
                id="match-title"
                className={`text-xl md:text-2xl font-bold text-white mb-4 text-center whitespace-nowrap overflow-hidden text-ellipsis ${
                  isScrolling ? 'animate-marquee' : ''
                }`}
              >
                <span 
                  onClick={(e) => handleNavigateToTeam(currentHighlight.homeTeam.id, e)}
                  className="cursor-pointer hover:text-[#FFC30B] transition-colors"
                >
                  {getShortTeamName(currentHighlight.homeTeam.name)}
                </span>
                {" vs "}
                <span 
                  onClick={(e) => handleNavigateToTeam(currentHighlight.awayTeam.id, e)}
                  className="cursor-pointer hover:text-[#FFC30B] transition-colors"
                >
                  {getShortTeamName(currentHighlight.awayTeam.name)}
                </span>
              </h1>
            </div>

            <div className="flex items-center justify-center mb-4">
              <p className="text-white/70">{formatRelativeDate(currentHighlight.date)}</p>
              <span className="mx-2 text-white/40">•</span>
              <p 
                className="text-white/70 hover:text-[#FFC30B] cursor-pointer transition-colors"
                onClick={(e) => handleNavigateToLeague(currentHighlight.competition.id, e)}
              >
                {currentHighlight.competition.name}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
              <button 
                onClick={handleNavigateToMatch}
                className="bg-white text-black px-5 py-2 rounded-full font-semibold flex items-center hover:bg-white/90 transition-colors"
              >
                <Expand className="w-4 h-4 mr-2" />
                Expand
              </button>
              
              <button
                onClick={handleOpenComments}
                className="bg-[#FFC30B] text-black px-4 py-2 rounded-full font-medium flex items-center hover:bg-[#FFC30B]/90 transition-colors"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                +{Math.floor(Math.random() * 20) + 5}
              </button>
            </div>
          </div>

          <div className="w-full lg:w-[65%] aspect-video rounded-lg overflow-hidden shadow-xl order-1 lg:order-2">
            <iframe
              src={`https://www.youtube.com/embed/${getYoutubeVideoId(currentHighlight.videoUrl)}?autoplay=1&mute=1&controls=1&modestbranding=1`}
              title={currentHighlight.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              className="w-full h-full"
            ></iframe>
          </div>
        </div>
      </div>

      {highlights.length > 1 && (
        <>
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

          <button
            className="absolute left-2 md:left-6 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 flex items-center justify-center text-white z-30 hover:bg-black/80 transition-colors"
            onClick={handlePrevSlide}
            aria-label="Previous slide"
            style={{ marginTop: "40px" }}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            className="absolute right-2 md:right-6 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 flex items-center justify-center text-white z-30 hover:bg-black/80 transition-colors"
            onClick={handleNextSlide}
            aria-label="Next slide"
            style={{ marginTop: "40px" }}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      <Dialog open={showComments} onOpenChange={handleCloseComments}>
        <DialogContent className="sm:max-w-md bg-[#222222] border-gray-700">
          <div className="p-4">
            <h2 className="text-xl font-bold text-white mb-4">Comments</h2>
            <div className="space-y-4">
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
