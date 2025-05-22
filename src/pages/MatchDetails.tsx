
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock,
  Eye, 
  Share2,
  Shirt,
  BarChart4,
} from 'lucide-react';
import Header from '@/components/Header';
import { getMatchById } from '@/services/highlightService';
import { MatchHighlight } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

const MatchDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<MatchHighlight | null>(null);
  const [loading, setLoading] = useState(true);
  const [formattedDate, setFormattedDate] = useState('');
  const [exactDate, setExactDate] = useState('');
  const [activeTab, setActiveTab] = useState('stats');
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        if (!id) return;
        setLoading(true);
        const matchData = await getMatchById(id);
        setMatch(matchData);
        
        if (matchData) {
          const date = new Date(matchData.date);
          setFormattedDate(formatDistanceToNow(date, { addSuffix: true }));
          setExactDate(date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }));
        }
      } catch (error) {
        console.error('Error fetching match details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
  }, [id]);

  // Generate mock goalscorers based on match score
  const generateMockGoalscorers = (match: MatchHighlight | null) => {
    if (!match) return { home: [], away: [] };
    
    const homeGoals = [];
    const awayGoals = [];
    
    // Generate random player names for home team
    const homePlayerNames = [
      "Alexander", "James", "Wilson", "Thompson", "Martinez",
      "Rodriguez", "Jackson", "Williams", "Davies", "Johnson"
    ];
    
    // Generate random player names for away team
    const awayPlayerNames = [
      "Smith", "Brown", "Miller", "Garcia", "Lee",
      "Walker", "Harris", "Clark", "Lewis", "Young"
    ];
    
    // Generate random minutes for goals
    const generateMinutes = (count: number) => {
      const minutes = [];
      for (let i = 0; i < count; i++) {
        // Goals typically happen between 1-90 minutes
        minutes.push(Math.floor(Math.random() * 90) + 1);
      }
      // Sort minutes in ascending order
      return minutes.sort((a, b) => a - b);
    };
    
    const homeMinutes = generateMinutes(match.score.home);
    const awayMinutes = generateMinutes(match.score.away);
    
    // Create goal objects for home team
    for (let i = 0; i < match.score.home; i++) {
      const playerIndex = Math.floor(Math.random() * homePlayerNames.length);
      homeGoals.push({
        player: homePlayerNames[playerIndex],
        minute: homeMinutes[i],
        isPenalty: Math.random() > 0.8, // 20% chance of being a penalty
        isOwnGoal: false // We'll handle own goals separately
      });
    }
    
    // Create goal objects for away team
    for (let i = 0; i < match.score.away; i++) {
      const playerIndex = Math.floor(Math.random() * awayPlayerNames.length);
      awayGoals.push({
        player: awayPlayerNames[playerIndex],
        minute: awayMinutes[i],
        isPenalty: Math.random() > 0.8, // 20% chance of being a penalty
        isOwnGoal: false
      });
    }
    
    return { home: homeGoals, away: awayGoals };
  };

  const getYoutubeVideoId = (url: string): string => {
    const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/i;
    const match = url.match(regex);
    return match ? match[1] : '';
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        toast({
          title: "Link copied!",
          description: "Share this highlight with your friends",
          variant: "default",
        });
      })
      .catch((error) => {
        console.error('Failed to copy: ', error);
      });
  };

  const handleTeamClick = (teamId: string) => {
    navigate(`/team/${teamId}`);
  };

  // Generate mock goalscorers data
  const goalscorers = generateMockGoalscorers(match);

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-20 px-4 sm:px-6">
        <Header />
        <div className="max-w-7xl mx-auto animate-pulse">
          <div className="h-8 bg-highlight-800 rounded w-48 mb-6"></div>
          <div className="aspect-video bg-highlight-800 rounded mb-8"></div>
          <div className="h-10 bg-highlight-800 rounded w-3/4 mb-6"></div>
          <div className="h-20 bg-highlight-800 rounded mb-8"></div>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-black pt-20 px-4 sm:px-6">
        <Header />
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-semibold text-white">Match not found</h1>
          <button 
            onClick={handleGoBack}
            className="mt-4 flex items-center mx-auto text-sm font-medium px-4 py-2 rounded-md bg-highlight-800 hover:bg-highlight-700 transition-colors text-white"
          >
            <ArrowLeft size={16} className="mr-2" />
            Go back
          </button>
        </div>
      </div>
    );
  }

  const videoId = getYoutubeVideoId(match.videoUrl);

  return (
    <div className="min-h-screen bg-black text-white pt-16 pb-16">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <button 
          onClick={handleGoBack}
          className="flex items-center mb-6 text-sm font-medium hover:underline transition-colors text-white"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Home
        </button>

        {/* Competition name */}
        <div className="mb-4">
          <span className="inline-block bg-[#222222] text-white text-sm px-3 py-1 rounded-full">
            {match.competition.name}
          </span>
        </div>

        {/* Team names, logos, and score section */}
        <section className="mb-8 bg-[#222222] rounded-xl p-6 shadow-sm">
          <div className="flex flex-col justify-center items-center mb-4">
            <span className="text-sm font-medium bg-[#333333] px-3 py-1 rounded-full text-white mb-3">FT</span>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div 
              className="flex flex-col items-center mb-6 md:mb-0 cursor-pointer hover:opacity-80 transition-opacity md:w-1/3 md:items-end"
              onClick={() => handleTeamClick(match.homeTeam.id)}
            >
              <img 
                src={match.homeTeam.logo} 
                alt={match.homeTeam.name} 
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                }}
              />
              <span className="font-semibold text-lg mt-2 text-white hover:text-[#FFC30B] transition-colors">
                {match.homeTeam.name}
              </span>
            </div>
            
            <div className="flex items-center mb-6 md:mb-0 md:w-1/3 justify-center">
              <span className="text-4xl md:text-5xl font-bold px-4 text-center text-white">
                {match.score.home} <span className="text-gray-400">-</span> {match.score.away}
              </span>
            </div>
            
            <div 
              className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity md:w-1/3 md:items-start"
              onClick={() => handleTeamClick(match.awayTeam.id)}
            >
              <img 
                src={match.awayTeam.logo} 
                alt={match.awayTeam.name} 
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                }}
              />
              <span className="font-semibold text-lg mt-2 text-white hover:text-[#FFC30B] transition-colors">
                {match.awayTeam.name}
              </span>
            </div>
          </div>
        </section>

        {/* Match title */}
        <h1 className="text-xl md:text-2xl font-bold mb-4 text-white">
          {match.title}
        </h1>

        {/* Video player */}
        <div className="mb-8 w-full">
          <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-lg" ref={videoContainerRef}>
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              title={match.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>

        {/* Goalscorers section */}
        <section className="mb-8 bg-[#222222] rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-center text-white">Goalscorers</h3>
          
          <div className="flex flex-col md:flex-row justify-between">
            <div className="md:w-[48%] mb-4 md:mb-0">
              {/* Home team goalscorers */}
              <h4 className="text-md font-medium mb-3 flex items-center text-white">
                <img 
                  src={match.homeTeam.logo} 
                  alt={match.homeTeam.name} 
                  className="w-5 h-5 object-contain mr-2"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                  }}
                />
                {match.homeTeam.name}
              </h4>
              <div className="space-y-2">
                {goalscorers.home.length > 0 ? (
                  goalscorers.home.map((goal, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-[#191919] rounded">
                      <span className="text-white text-sm">{goal.player}</span>
                      <div className="flex items-center">
                        {goal.isPenalty && <span className="text-xs bg-[#333333] px-1 rounded mr-2">P</span>}
                        <span className="text-sm text-gray-400">{goal.minute}'</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-2 bg-[#191919] rounded">
                    <span className="text-gray-400 text-sm">No goals</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="md:w-[48%]">
              {/* Away team goalscorers */}
              <h4 className="text-md font-medium mb-3 flex items-center text-white justify-end">
                {match.awayTeam.name}
                <img 
                  src={match.awayTeam.logo}
                  alt={match.awayTeam.name} 
                  className="w-5 h-5 object-contain ml-2"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                  }}
                />
              </h4>
              <div className="space-y-2">
                {goalscorers.away.length > 0 ? (
                  goalscorers.away.map((goal, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-[#191919] rounded">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-400">{goal.minute}'</span>
                        {goal.isPenalty && <span className="text-xs bg-[#333333] px-1 rounded ml-2">P</span>}
                      </div>
                      <span className="text-white text-sm">{goal.player}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-2 bg-[#191919] rounded">
                    <span className="text-gray-400 text-sm">No goals</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        
        <section className="mb-4">
          <div className="flex flex-wrap items-center text-sm text-gray-400 mb-4 space-x-6">
            <div className="flex items-center">
              <Calendar size={16} className="mr-2" />
              <span>{exactDate}</span>
            </div>
            <div className="flex items-center">
              <Clock size={16} className="mr-2" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center">
              <Eye size={16} className="mr-2" />
              <span>{new Intl.NumberFormat('en-US').format(match.views)} views</span>
            </div>
          </div>
        </section>

        <div className="mb-8">
          <div className="grid grid-cols-2 gap-0 mb-4">
            <button 
              onClick={() => setActiveTab('stats')}
              className={`flex justify-center items-center py-3 px-4 font-medium text-sm ${
                activeTab === 'stats' 
                  ? 'bg-[#FFC30B] text-black rounded-tl-lg' 
                  : 'bg-[#222222] text-white hover:bg-[#333333] rounded-tl-lg'
              }`}
            >
              <BarChart4 className="w-4 h-4 mr-2" />
              Match Stats
            </button>
            <button 
              onClick={() => setActiveTab('lineups')}
              className={`flex justify-center items-center py-3 px-4 font-medium text-sm ${
                activeTab === 'lineups' 
                  ? 'bg-[#FFC30B] text-black rounded-tr-lg' 
                  : 'bg-[#191919] text-white hover:bg-[#252525] rounded-tr-lg'
              }`}
            >
              <Shirt className="w-4 h-4 mr-2" />
              Lineups
            </button>
          </div>
          
          <div className="bg-[#222222] rounded-b-lg p-6">
            {activeTab === 'stats' ? (
              <>
                <h3 className="text-lg font-semibold mb-6 text-center text-white">Match Statistics</h3>
                
                <div className="mb-6">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-white">55%</span>
                    <span className="text-sm font-medium text-center text-white">Possession</span>
                    <span className="text-sm text-white">45%</span>
                  </div>
                  <div className="w-full h-2 bg-[#191919] rounded-full overflow-hidden">
                    <div className="flex h-full">
                      <div className="bg-[#FFC30B] h-full" style={{ width: '55%' }}></div>
                      <div className="bg-white h-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-white">15</span>
                    <span className="text-sm font-medium text-center text-white">Shots</span>
                    <span className="text-sm text-white">12</span>
                  </div>
                  <div className="w-full h-2 bg-[#191919] rounded-full overflow-hidden">
                    <div className="flex h-full">
                      <div className="bg-[#FFC30B] h-full" style={{ width: '56%' }}></div>
                      <div className="bg-white h-full" style={{ width: '44%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-white">6</span>
                    <span className="text-sm font-medium text-center text-white">Shots on Target</span>
                    <span className="text-sm text-white">4</span>
                  </div>
                  <div className="w-full h-2 bg-[#191919] rounded-full overflow-hidden">
                    <div className="flex h-full">
                      <div className="bg-[#FFC30B] h-full" style={{ width: '60%' }}></div>
                      <div className="bg-white h-full" style={{ width: '40%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-white">8</span>
                    <span className="text-sm font-medium text-center text-white">Corners</span>
                    <span className="text-sm text-white">5</span>
                  </div>
                  <div className="w-full h-2 bg-[#191919] rounded-full overflow-hidden">
                    <div className="flex h-full">
                      <div className="bg-[#FFC30B] h-full" style={{ width: '62%' }}></div>
                      <div className="bg-white h-full" style={{ width: '38%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="mb-0">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-white">10</span>
                    <span className="text-sm font-medium text-center text-white">Fouls</span>
                    <span className="text-sm text-white">12</span>
                  </div>
                  <div className="w-full h-2 bg-[#191919] rounded-full overflow-hidden">
                    <div className="flex h-full">
                      <div className="bg-[#FFC30B] h-full" style={{ width: '45%' }}></div>
                      <div className="bg-white h-full" style={{ width: '55%' }}></div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col md:flex-row justify-between">
                <div className="md:w-[48%] mb-6 md:mb-0">
                  <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
                    <img 
                      src={match.homeTeam.logo} 
                      alt={match.homeTeam.name} 
                      className="w-6 h-6 object-contain mr-2"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                      }}
                    />
                    {match.homeTeam.name}
                  </h3>
                  <div className="space-y-2">
                    {[
                      "1. Alisson",
                      "66. Alexander-Arnold",
                      "4. Van Dijk (C)",
                      "32. Matip",
                      "26. Robertson",
                      "3. Fabinho",
                      "6. Thiago",
                      "14. Henderson",
                      "11. Salah",
                      "20. Jota",
                      "10. Mané"
                    ].map((player, index) => (
                      <div key={index} className="flex items-center p-2 bg-[#191919] rounded">
                        <span className="text-white text-sm">{player}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="md:w-[48%]">
                  <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
                    <img 
                      src={match.awayTeam.logo}
                      alt={match.awayTeam.name} 
                      className="w-6 h-6 object-contain mr-2"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                      }}
                    />
                    {match.awayTeam.name}
                  </h3>
                  <div className="space-y-2">
                    {[
                      "32. Ramsdale",
                      "18. Tomiyasu",
                      "4. White",
                      "6. Gabriel",
                      "3. Tierney",
                      "5. Partey",
                      "34. Xhaka",
                      "7. Saka",
                      "8. Ødegaard (C)",
                      "35. Martinelli",
                      "9. Lacazette"
                    ].map((player, index) => (
                      <div key={index} className="flex items-center p-2 bg-[#191919] rounded">
                        <span className="text-white text-sm">{player}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center">
          <button 
            onClick={handleShare}
            className="flex items-center px-4 py-2 rounded-md border border-gray-700 hover:bg-[#222222] transition-colors text-white"
          >
            <Share2 size={16} className="mr-2" />
            Share this highlight
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchDetails;
