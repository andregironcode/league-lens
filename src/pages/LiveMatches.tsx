
import { useState } from 'react';
import { ChevronLeft, ChevronRight, MessageCircle, Expand, Globe, Clock } from 'lucide-react';
import { MatchHighlight } from '@/types';
import Header from '@/components/Header';

// Example live matches data
const livematches: MatchHighlight[] = [
  {
    id: "live1",
    title: "Liverpool vs Chelsea - Premier League Live",
    date: new Date().toISOString(),
    thumbnailUrl: "https://e0.365dm.com/22/01/768x432/skysports-chelsea-liverpool_5643304.jpg",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    duration: "LIVE",
    views: 243000,
    homeTeam: {
      id: "1",
      name: "Liverpool",
      logo: "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg"
    },
    awayTeam: {
      id: "2",
      name: "Chelsea",
      logo: "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg"
    },
    score: {
      home: 2,
      away: 1
    },
    competition: {
      id: "1",
      name: "Premier League",
      logo: "/competitions/premier-league.png"
    }
  },
  {
    id: "live2",
    title: "Bayern Munich vs Borussia Dortmund - Bundesliga Live",
    date: new Date().toISOString(),
    thumbnailUrl: "https://e0.365dm.com/22/10/768x432/skysports-bundesliga-bayern-munich_5922057.jpg",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    duration: "LIVE",
    views: 198000,
    homeTeam: {
      id: "14",
      name: "Bayern Munich",
      logo: "https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg"
    },
    awayTeam: {
      id: "16",
      name: "Borussia Dortmund",
      logo: "https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg"
    },
    score: {
      home: 1,
      away: 1
    },
    competition: {
      id: "3",
      name: "Bundesliga",
      logo: "/competitions/bundesliga.png"
    }
  },
  {
    id: "live3",
    title: "PSG vs Marseille - Ligue 1 Live",
    date: new Date().toISOString(),
    thumbnailUrl: "https://phantom-marca.unidadeditorial.es/499a34bb2e5ebfeaddb2c639b8fbc35e/resize/1320/f/jpg/assets/multimedia/imagenes/2022/10/17/16660086222936.jpg",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    duration: "LIVE",
    views: 156000,
    homeTeam: {
      id: "3",
      name: "Paris Saint-Germain",
      logo: "https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg"
    },
    awayTeam: {
      id: "4",
      name: "Marseille",
      logo: "https://upload.wikimedia.org/wikipedia/commons/d/d8/Olympique_Marseille_logo.svg"
    },
    score: {
      home: 0,
      away: 0
    },
    competition: {
      id: "4",
      name: "Ligue 1",
      logo: "/competitions/ligue-1.png"
    }
  }
];

const LiveMatches = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentMatch = livematches[currentIndex];

  const handlePrevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? livematches.length - 1 : prevIndex - 1
    );
  };

  const handleNextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === livematches.length - 1 ? 0 : prevIndex + 1
    );
  };

  const getYoutubeVideoId = (url: string): string => {
    const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/i;
    const match = url.match(regex);
    return match ? match[1] : '';
  };

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

  return (
    <div className="min-h-screen bg-[#222222] text-white">
      <Header />
      <div className="container mx-auto pt-24 px-4">
        <h1 className="text-3xl font-bold mb-6 text-center">Live Matches</h1>
        
        <div className="relative w-full overflow-hidden bg-[#222222] rounded-xl shadow-lg min-h-[550px] border border-highlight-700/10 mt-4">
          <div className="absolute top-4 left-4 z-30 bg-black/70 backdrop-blur-sm rounded-full px-4 py-2 text-white flex items-center">
            <Clock className="w-4 h-4 mr-2 text-[#FFC30B]" />
            <span className="text-sm font-medium">LIVE</span>
          </div>
          
          <div className="absolute inset-0 w-full h-full">
            <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/70 to-transparent z-10"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#000000]/80 to-transparent z-10"></div>
            
            <img
              src={currentMatch.thumbnailUrl}
              alt=""
              className="w-full h-full object-cover opacity-40"
            />
          </div>

          <div className="relative z-20 w-full h-full flex items-center justify-center py-6 px-6 md:px-12">
            <div className="flex flex-col lg:flex-row items-center gap-8 w-full max-w-7xl mx-auto mt-4">
              <div className="w-full lg:w-[40%] self-center order-2 lg:order-1 lg:pl-10">
                <div className="flex justify-center items-center mb-6">
                  <div className="cursor-pointer transition-transform duration-200 hover:scale-110">
                    <img 
                      src={currentMatch.homeTeam.logo} 
                      alt={currentMatch.homeTeam.name} 
                      className="w-16 h-16 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                      }}
                    />
                  </div>
                  
                  <div className="text-white text-4xl font-bold mx-8">
                    {currentMatch.score.home} - {currentMatch.score.away}
                  </div>
                  
                  <div className="cursor-pointer transition-transform duration-200 hover:scale-110">
                    <img 
                      src={currentMatch.awayTeam.logo} 
                      alt={currentMatch.awayTeam.name} 
                      className="w-16 h-16 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                      }}
                    />
                  </div>
                </div>
                
                <div className="relative overflow-hidden max-w-full px-4">
                  <h1 className="text-xl md:text-2xl font-bold text-white mb-4 text-center">
                    <span className="cursor-pointer hover:text-[#FFC30B] transition-colors">
                      {getShortTeamName(currentMatch.homeTeam.name)}
                    </span>
                    {" vs "}
                    <span className="cursor-pointer hover:text-[#FFC30B] transition-colors">
                      {getShortTeamName(currentMatch.awayTeam.name)}
                    </span>
                  </h1>
                </div>

                <div className="flex items-center justify-center mb-4">
                  <div className="text-[#FFC30B] font-semibold animate-pulse">● LIVE</div>
                  <span className="mx-2 text-white/40">•</span>
                  <p className="text-white/70 hover:text-[#FFC30B] cursor-pointer transition-colors">
                    {currentMatch.competition.name}
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
                  <button className="bg-white text-black px-5 py-2 rounded-full font-semibold flex items-center hover:bg-white/90 transition-colors">
                    <Expand className="w-4 h-4 mr-2" />
                    Expand
                  </button>
                  
                  <button className="bg-[#FFC30B] text-black px-4 py-2 rounded-full font-medium flex items-center hover:bg-[#FFC30B]/90 transition-colors">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Chat
                  </button>
                </div>
                
                <div className="mt-6 text-center">
                  <p className="text-white/70 text-sm">
                    {currentMatch.views.toLocaleString()} viewers watching
                  </p>
                </div>
              </div>

              <div className="w-full lg:w-[60%] aspect-video rounded-lg overflow-hidden shadow-xl order-1 lg:order-2 lg:pr-10">
                <iframe
                  src={`https://www.youtube.com/embed/${getYoutubeVideoId(currentMatch.videoUrl)}?autoplay=1&mute=1&controls=1&modestbranding=1`}
                  title={currentMatch.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  className="w-full h-full"
                ></iframe>
              </div>
            </div>
          </div>

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3 z-30">
            {livematches.map((_, index) => (
              <button
                key={index}
                className={`h-3 rounded-full transition-all ${
                  index === currentIndex ? "bg-[#FFC30B] w-8" : "bg-white/50 w-3"
                }`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to match ${index + 1}`}
              />
            ))}
          </div>

          <button
            className="absolute left-2 md:left-6 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 flex items-center justify-center text-white z-30 hover:bg-black/50 transition-colors"
            onClick={handlePrevSlide}
            aria-label="Previous match"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            className="absolute right-2 md:right-6 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 flex items-center justify-center text-white z-30 hover:bg-black/50 transition-colors"
            onClick={handleNextSlide}
            aria-label="Next match"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
        
        <div className="mt-10 mb-8">
          <h2 className="text-xl font-bold mb-4">More Live Matches</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {livematches.map((match, index) => (
              <div 
                key={match.id}
                className={`bg-[#333333] rounded-lg overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-shadow ${
                  index === currentIndex ? 'ring-2 ring-[#FFC30B]' : ''
                }`}
                onClick={() => setCurrentIndex(index)}
              >
                <div className="relative">
                  <img 
                    src={match.thumbnailUrl} 
                    alt={match.title}
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-xs font-bold rounded-sm animate-pulse">
                    LIVE
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <img 
                        src={match.homeTeam.logo} 
                        alt={match.homeTeam.name}
                        className="w-6 h-6 object-contain mr-1"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                        }}
                      />
                      <span className="font-semibold">{match.score.home}</span>
                      <span className="mx-1">-</span>
                      <span className="font-semibold">{match.score.away}</span>
                      <img 
                        src={match.awayTeam.logo} 
                        alt={match.awayTeam.name}
                        className="w-6 h-6 object-contain ml-1"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-400">
                      {match.competition.name}
                    </div>
                  </div>
                  <h3 className="text-sm font-medium line-clamp-2">{match.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMatches;
