
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock,
  Eye, 
  Share2,
  MessageCircle,
  Shirt,
  BarChart4
} from 'lucide-react';
import Header from '@/components/Header';
import { getMatchById } from '@/services/highlightService';
import { MatchHighlight } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MatchDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<MatchHighlight | null>(null);
  const [loading, setLoading] = useState(true);
  const [formattedDate, setFormattedDate] = useState('');
  const [exactDate, setExactDate] = useState('');
  const [activeTab, setActiveTab] = useState('comments');

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

  // Helper function to get YouTube video ID from URL
  const getYoutubeVideoId = (url: string): string => {
    const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/i;
    const match = url.match(regex);
    return match ? match[1] : '';
  };

  const handleGoBack = () => {
    navigate(-1);
  };

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
          Back to highlights
        </button>

        {/* Video section */}
        <section className="mb-8">
          <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              title={match.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </section>

        {/* Match details */}
        <section className="mb-8">
          <div className="mb-4">
            <span className="inline-block bg-[#1A1F2C] text-white text-sm px-3 py-1 rounded-full">
              {match.competition.name}
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
              <Clock size={16} className="mr-2" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center">
              <Eye size={16} className="mr-2" />
              <span>{new Intl.NumberFormat('en-US').format(match.views)} views</span>
            </div>
          </div>
        </section>

        {/* Score section */}
        <section className="mb-8 bg-[#1A1F2C] rounded-xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-col items-center mb-6 md:mb-0">
              <img 
                src={match.homeTeam.logo !== '/teams/mancity.png' ? 
                    `https://api.sofascore.app/api/v1/team/${match.homeTeam.id}/image` : 
                    'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg'} 
                alt={match.homeTeam.name} 
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                }}
              />
              <span className="font-semibold text-lg mt-2 text-white">{match.homeTeam.name}</span>
            </div>
            
            <div className="flex items-center mb-6 md:mb-0">
              <span className="text-4xl md:text-5xl font-bold px-4 text-center text-white">
                {match.score.home} <span className="text-gray-400">-</span> {match.score.away}
              </span>
            </div>
            
            <div className="flex flex-col items-center">
              <img 
                src={match.awayTeam.logo !== '/teams/arsenal.png' ? 
                    `https://api.sofascore.app/api/v1/team/${match.awayTeam.id}/image` : 
                    'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg'} 
                alt={match.awayTeam.name} 
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                }}
              />
              <span className="font-semibold text-lg mt-2 text-white">{match.awayTeam.name}</span>
            </div>
          </div>
        </section>

        {/* Tabs for Comments, Stats, and Lineups */}
        <section className="mb-8">
          <Tabs defaultValue="comments" className="w-full">
            <TabsList className="w-full bg-[#1A1F2C] mb-4">
              <TabsTrigger 
                value="comments" 
                className="flex-1 data-[state=active]:bg-[#FFC30B] data-[state=active]:text-black"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Comments
              </TabsTrigger>
              <TabsTrigger 
                value="stats" 
                className="flex-1 data-[state=active]:bg-[#FFC30B] data-[state=active]:text-black"
              >
                <BarChart4 className="w-4 h-4 mr-2" />
                Match Stats
              </TabsTrigger>
              <TabsTrigger 
                value="lineups" 
                className="flex-1 data-[state=active]:bg-[#FFC30B] data-[state=active]:text-black"
              >
                <Shirt className="w-4 h-4 mr-2" />
                Lineups
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="comments" className="mt-4">
              <div className="bg-[#1A1F2C] rounded-lg p-4">
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    className="w-full bg-highlight-800 border border-highlight-700 text-white px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-[#FFC30B]"
                  />
                </div>
                
                <div className="space-y-4">
                  {/* Example comments */}
                  <div className="bg-highlight-800 p-3 rounded">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-[#FFC30B] flex items-center justify-center text-black font-bold">J</div>
                      <div className="ml-2">
                        <div className="text-white font-medium">John</div>
                        <div className="text-gray-400 text-xs">2 hours ago</div>
                      </div>
                    </div>
                    <p className="text-white text-sm">What a goal by Robertson! Incredible finish.</p>
                  </div>
                  
                  <div className="bg-highlight-800 p-3 rounded">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-[#FFC30B] flex items-center justify-center text-black font-bold">S</div>
                      <div className="ml-2">
                        <div className="text-white font-medium">Sarah</div>
                        <div className="text-gray-400 text-xs">1 hour ago</div>
                      </div>
                    </div>
                    <p className="text-white text-sm">Liverpool deserved this win. Great team performance!</p>
                  </div>
                  
                  <div className="bg-highlight-800 p-3 rounded">
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
              </div>
            </TabsContent>
            
            <TabsContent value="stats" className="mt-4">
              <div className="bg-[#1A1F2C] rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-center text-white">Match Statistics</h3>
                
                {/* Possession stat */}
                <div className="mb-6">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-white">55%</span>
                    <span className="text-sm font-medium text-center text-white">Possession</span>
                    <span className="text-sm text-white">45%</span>
                  </div>
                  <div className="w-full h-2 bg-highlight-800 rounded-full overflow-hidden">
                    <div className="flex h-full">
                      <div className="bg-[#FFC30B] h-full" style={{ width: '55%' }}></div>
                      <div className="bg-blue-500 h-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                </div>

                {/* Shots stat */}
                <div className="mb-6">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-white">15</span>
                    <span className="text-sm font-medium text-center text-white">Shots</span>
                    <span className="text-sm text-white">12</span>
                  </div>
                  <div className="w-full h-2 bg-highlight-800 rounded-full overflow-hidden">
                    <div className="flex h-full">
                      <div className="bg-[#FFC30B] h-full" style={{ width: '56%' }}></div>
                      <div className="bg-blue-500 h-full" style={{ width: '44%' }}></div>
                    </div>
                  </div>
                </div>

                {/* Shots on target stat */}
                <div className="mb-6">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-white">6</span>
                    <span className="text-sm font-medium text-center text-white">Shots on Target</span>
                    <span className="text-sm text-white">4</span>
                  </div>
                  <div className="w-full h-2 bg-highlight-800 rounded-full overflow-hidden">
                    <div className="flex h-full">
                      <div className="bg-[#FFC30B] h-full" style={{ width: '60%' }}></div>
                      <div className="bg-blue-500 h-full" style={{ width: '40%' }}></div>
                    </div>
                  </div>
                </div>

                {/* Corner stat */}
                <div className="mb-6">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-white">8</span>
                    <span className="text-sm font-medium text-center text-white">Corners</span>
                    <span className="text-sm text-white">5</span>
                  </div>
                  <div className="w-full h-2 bg-highlight-800 rounded-full overflow-hidden">
                    <div className="flex h-full">
                      <div className="bg-[#FFC30B] h-full" style={{ width: '62%' }}></div>
                      <div className="bg-blue-500 h-full" style={{ width: '38%' }}></div>
                    </div>
                  </div>
                </div>

                {/* Fouls stat */}
                <div className="mb-6">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-white">10</span>
                    <span className="text-sm font-medium text-center text-white">Fouls</span>
                    <span className="text-sm text-white">12</span>
                  </div>
                  <div className="w-full h-2 bg-highlight-800 rounded-full overflow-hidden">
                    <div className="flex h-full">
                      <div className="bg-[#FFC30B] h-full" style={{ width: '45%' }}></div>
                      <div className="bg-blue-500 h-full" style={{ width: '55%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="lineups" className="mt-4">
              <div className="bg-[#1A1F2C] rounded-lg p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="md:w-[48%] mb-6 md:mb-0">
                    <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
                      <img 
                        src={match.homeTeam.logo !== '/teams/mancity.png' ? 
                            `https://api.sofascore.app/api/v1/team/${match.homeTeam.id}/image` : 
                            'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg'} 
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
                      {/* Example starting XI */}
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
                        <div key={index} className="flex items-center p-2 bg-highlight-800 rounded">
                          <span className="text-white text-sm">{player}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="md:w-[48%]">
                    <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
                      <img 
                        src={match.awayTeam.logo !== '/teams/arsenal.png' ? 
                            `https://api.sofascore.app/api/v1/team/${match.awayTeam.id}/image` : 
                            'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg'} 
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
                      {/* Example starting XI */}
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
                        <div key={index} className="flex items-center p-2 bg-highlight-800 rounded">
                          <span className="text-white text-sm">{player}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* Share button */}
        <div className="flex justify-center mb-8">
          <button className="flex items-center px-4 py-2 rounded-md border border-highlight-800 hover:bg-highlight-800 transition-colors text-white">
            <Share2 size={16} className="mr-2" />
            Share this highlight
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchDetails;
