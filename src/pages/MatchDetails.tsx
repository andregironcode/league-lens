
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
  BarChart4,
  ChevronDown
} from 'lucide-react';
import Header from '@/components/Header';
import { getMatchById } from '@/services/highlightService';
import { MatchHighlight } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const MatchDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<MatchHighlight | null>(null);
  const [loading, setLoading] = useState(true);
  const [formattedDate, setFormattedDate] = useState('');
  const [exactDate, setExactDate] = useState('');
  const [activeTab, setActiveTab] = useState('stats');
  const [showAllComments, setShowAllComments] = useState(false);
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

  // Helper function to get YouTube video ID from URL
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

  const toggleShowAllComments = () => {
    setShowAllComments(!showAllComments);
  };

  // Example comments
  const comments = [
    {
      id: 1,
      user: { name: "John", initial: "J" },
      time: "2 hours ago",
      content: "What a goal by Robertson! Incredible finish."
    },
    {
      id: 2,
      user: { name: "Sarah", initial: "S" },
      time: "1 hour ago",
      content: "Liverpool deserved this win. Great team performance!"
    },
    {
      id: 3,
      user: { name: "Mike", initial: "M" },
      time: "30 minutes ago",
      content: "Arsenal's defense was all over the place today."
    },
    {
      id: 4,
      user: { name: "Jamie", initial: "J" },
      time: "15 minutes ago",
      content: "That referee decision was absolutely shocking."
    },
    {
      id: 5,
      user: { name: "Alex", initial: "A" },
      time: "5 minutes ago",
      content: "Can't wait for the next match. This was a thriller!"
    }
  ];

  // Show only first 2 comments unless showAllComments is true
  const displayedComments = showAllComments ? comments : comments.slice(0, 2);

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

        {/* Match details */}
        <section className="mb-4">
          <div className="mb-4">
            <span className="inline-block bg-[#1A1F2C] text-white text-sm px-3 py-1 rounded-full">
              {match.competition.name}
            </span>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold mb-4 text-white">
            {match.title}
          </h1>
          
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

        {/* Score section - Moved above video with updated background color */}
        <section className="mb-6 bg-[#222222] rounded-xl p-6 shadow-sm">
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

        {/* Video section */}
        <section className="mb-6">
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

        {/* Comments section - Now directly under the video with proper styling */}
        <section className="mb-8 bg-[#222222] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg text-white flex items-center">
              <MessageCircle className="mr-2 w-5 h-5" />
              Comments
            </h3>
            {comments.length > 2 && (
              <button 
                onClick={toggleShowAllComments}
                className="text-[#FFC30B] hover:text-[#FFC30B]/90 text-sm font-medium flex items-center"
              >
                View All
                <ChevronDown className="ml-1 w-4 h-4" />
              </button>
            )}
          </div>

          <div className="space-y-4">
            {displayedComments.map(comment => (
              <div key={comment.id} className="bg-[#111827] p-4 rounded">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#FFC30B] flex items-center justify-center text-black font-bold">
                    {comment.user.initial}
                  </div>
                  <div className="ml-2">
                    <div className="text-white font-medium">{comment.user.name}</div>
                    <div className="text-gray-400 text-xs">{comment.time}</div>
                  </div>
                </div>
                <p className="text-white text-sm">{comment.content}</p>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <input
              type="text"
              placeholder="Add a comment..."
              className="w-full bg-[#111827] border border-gray-700 text-white px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-[#FFC30B]"
            />
          </div>
        </section>

        {/* Custom Tabs for Stats and Lineups */}
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
                  : 'bg-[#111827] text-white hover:bg-[#1a202c] rounded-tr-lg'
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
                
                {/* Possession stat */}
                <div className="mb-6">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-white">55%</span>
                    <span className="text-sm font-medium text-center text-white">Possession</span>
                    <span className="text-sm text-white">45%</span>
                  </div>
                  <div className="w-full h-2 bg-[#111827] rounded-full overflow-hidden">
                    <div className="flex h-full">
                      <div className="bg-[#FFC30B] h-full" style={{ width: '55%' }}></div>
                      <div className="bg-white h-full" style={{ width: '45%' }}></div>
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
                  <div className="w-full h-2 bg-[#111827] rounded-full overflow-hidden">
                    <div className="flex h-full">
                      <div className="bg-[#FFC30B] h-full" style={{ width: '56%' }}></div>
                      <div className="bg-white h-full" style={{ width: '44%' }}></div>
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
                  <div className="w-full h-2 bg-[#111827] rounded-full overflow-hidden">
                    <div className="flex h-full">
                      <div className="bg-[#FFC30B] h-full" style={{ width: '60%' }}></div>
                      <div className="bg-white h-full" style={{ width: '40%' }}></div>
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
                  <div className="w-full h-2 bg-[#111827] rounded-full overflow-hidden">
                    <div className="flex h-full">
                      <div className="bg-[#FFC30B] h-full" style={{ width: '62%' }}></div>
                      <div className="bg-white h-full" style={{ width: '38%' }}></div>
                    </div>
                  </div>
                </div>

                {/* Fouls stat */}
                <div className="mb-0">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-white">10</span>
                    <span className="text-sm font-medium text-center text-white">Fouls</span>
                    <span className="text-sm text-white">12</span>
                  </div>
                  <div className="w-full h-2 bg-[#111827] rounded-full overflow-hidden">
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
                      <div key={index} className="flex items-center p-2 bg-[#111827] rounded">
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
                      <div key={index} className="flex items-center p-2 bg-[#111827] rounded">
                        <span className="text-white text-sm">{player}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Share button */}
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
