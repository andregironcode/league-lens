
import { useState, useEffect, useRef } from 'react';
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
  ChevronDown,
  X,
  ThumbsUp,
  MessageSquare,
  MoreVertical
} from 'lucide-react';
import Header from '@/components/Header';
import { getMatchById } from '@/services/highlightService';
import { MatchHighlight } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

const MatchDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<MatchHighlight | null>(null);
  const [loading, setLoading] = useState(true);
  const [formattedDate, setFormattedDate] = useState('');
  const [exactDate, setExactDate] = useState('');
  const [activeTab, setActiveTab] = useState('stats');
  const [showComments, setShowComments] = useState(false);
  const [commentSortBy, setCommentSortBy] = useState<'top' | 'newest'>('top');
  const [showTopCommentDialog, setShowTopCommentDialog] = useState(false);
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

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  // Example comments with more YouTube-like data
  const comments = [
    {
      id: 1,
      user: { name: "BenDover13", username: "@bendover13", initial: "B" },
      time: "17 hours ago",
      content: "I'm a Liverpool fan but have to admit that was an incredible finish by De Bruyne",
      likes: 1742,
      replies: 141
    },
    {
      id: 2,
      user: { name: "GoonerForLife", username: "@goonerforlife", initial: "G" },
      time: "16 hours ago",
      content: "Arsenal's defense was all over the place today. We need to fix this before the next match.",
      likes: 928,
      replies: 37
    },
    {
      id: 3,
      user: { name: "FootballExpert99", username: "@footballexpert99", initial: "F" },
      time: "10 hours ago",
      content: "That referee decision was absolutely shocking. How is that not a penalty?",
      likes: 1963,
      replies: 82
    },
    {
      id: 4,
      user: { name: "MCFC_Fan", username: "@mcfcfan", initial: "M" },
      time: "8 hours ago",
      content: "City absolutely dominated this game. Arsenal never stood a chance.",
      likes: 524,
      replies: 19
    },
    {
      id: 5,
      user: { name: "PremierLeagueFan", username: "@plefan", initial: "P" },
      time: "4 hours ago",
      content: "Best game of the season so far! What a match!",
      likes: 1024,
      replies: 12
    }
  ];

  // Get top comment based on likes
  const topComment = [...comments].sort((a, b) => b.likes - a.likes)[0];

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

        {/* Video first - at the top of the page */}
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

        {/* Match details */}
        <section className="mb-4">
          <div className="mb-4">
            <span className="inline-block bg-[#222222] text-white text-sm px-3 py-1 rounded-full">
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

        {/* Score section with fixed logo display */}
        <section className="mb-6 bg-[#222222] rounded-xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-col items-center mb-6 md:mb-0">
              <img 
                src={match.homeTeam.logo} 
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
                src={match.awayTeam.logo} 
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

        {/* Top Comment Teaser */}
        {topComment && (
          <section className="mb-6 bg-[#292929] rounded-xl p-4 border border-[#FFC30B] shadow-md">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <MessageCircle size={18} className="mr-2 text-[#FFC30B]" />
                Top Comment
              </h3>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="px-3 py-1 bg-[#333333] rounded-full text-xs font-medium text-white hover:bg-[#444444] transition-colors">
                    View All
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-[#222222] text-white border-[#333333] max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-xl text-white">Comments</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Join the conversation about this match
                    </DialogDescription>
                  </DialogHeader>
                  <div className="max-h-[60vh] overflow-y-auto mt-4 pr-2">
                    {comments.map(comment => (
                      <div key={comment.id} className="border-b border-gray-700 py-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 rounded-full bg-[#FFC30B] flex-shrink-0 flex items-center justify-center text-black font-bold">
                            {comment.user.initial}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center">
                              <span className="text-white text-sm font-medium">{comment.user.username}</span>
                              <span className="text-gray-400 text-xs ml-2">{comment.time}</span>
                            </div>
                            <p className="text-white text-sm mt-1">{comment.content}</p>
                            <div className="flex items-center mt-2 space-x-4">
                              <button className="flex items-center text-gray-400 hover:text-white">
                                <ThumbsUp size={14} className="mr-1" />
                                <span className="text-xs">{comment.likes}</span>
                              </button>
                              <button className="flex items-center text-gray-400 hover:text-white">
                                <MessageSquare size={14} className="mr-1" />
                                <span className="text-xs">{comment.replies}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#FFC30B] flex-shrink-0 flex items-center justify-center text-black font-bold">
                {topComment.user.initial}
              </div>
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="text-white text-sm font-medium">{topComment.user.username}</span>
                  <span className="text-gray-400 text-xs ml-2">{topComment.time}</span>
                </div>
                <p className="text-white text-sm mt-1">{topComment.content}</p>
                <div className="flex items-center mt-2 space-x-4">
                  <span className="flex items-center text-gray-300">
                    <ThumbsUp size={14} className="mr-1 text-[#FFC30B]" />
                    <span className="text-xs">{new Intl.NumberFormat('en-US').format(topComment.likes)}</span>
                  </span>
                  <span className="flex items-center text-gray-300">
                    <MessageSquare size={14} className="mr-1" />
                    <span className="text-xs">{topComment.replies} replies</span>
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Comments section (can be toggled) */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white flex items-center">
              Comments
            </h3>
            <button 
              onClick={toggleComments}
              className="px-4 py-2 bg-[#222222] rounded-full text-sm font-medium text-white hover:bg-[#333333] transition-colors"
            >
              {showComments ? "Hide comments" : "Show comments"}
            </button>
          </div>
          
          {showComments && (
            <div className="bg-[#222222] rounded-xl overflow-hidden">
              <div className="p-4">
                {/* Comment sort */}
                <div className="mb-6 flex space-x-2">
                  <button 
                    className={`px-4 py-2 rounded-full text-sm font-medium ${commentSortBy === 'top' ? 'bg-white text-black' : 'bg-[#191919] text-white'}`}
                    onClick={() => setCommentSortBy('top')}
                  >
                    Top
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-full text-sm font-medium ${commentSortBy === 'newest' ? 'bg-white text-black' : 'bg-[#191919] text-white'}`}
                    onClick={() => setCommentSortBy('newest')}
                  >
                    Newest
                  </button>
                </div>
                
                {/* Comment guidelines banner */}
                <div className="mb-6 py-3 px-4 bg-[#191919] rounded">
                  <p className="text-white text-sm">
                    Remember to keep comments respectful and to follow our
                    <span className="text-[#FFC30B] ml-1">Community Guidelines</span>
                  </p>
                </div>
                
                {/* Comments List */}
                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                  {comments.map(comment => (
                    <div key={comment.id} className="border-b border-gray-800 pb-6">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-full bg-[#FFC30B] flex-shrink-0 flex items-center justify-center text-black font-bold">
                          {comment.user.initial}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center">
                                <span className="text-white text-sm font-medium">{comment.user.username}</span>
                                <span className="text-gray-400 text-xs ml-2">{comment.time}</span>
                              </div>
                              <p className="text-white text-sm mt-1">{comment.content}</p>
                            </div>
                            <button className="text-gray-400 hover:text-white">
                              <MoreVertical size={16} />
                            </button>
                          </div>
                          
                          {/* Comment actions */}
                          <div className="flex items-center mt-3 space-x-4">
                            <button className="flex items-center text-gray-400 hover:text-white">
                              <ThumbsUp size={16} className="mr-1" />
                              <span className="text-xs">{comment.likes}</span>
                            </button>
                            <button className="flex items-center text-gray-400 hover:text-white">
                              <ThumbsUp size={16} className="mr-1 transform rotate-180" />
                            </button>
                            <button className="flex items-center text-gray-400 hover:text-white">
                              <MessageSquare size={16} className="mr-1" />
                              <span className="text-xs">{comment.replies} replies</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Comment input */}
                <div className="sticky bottom-0 bg-[#222222] pt-4 pb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-[#FFC30B] flex-shrink-0 flex items-center justify-center text-black font-bold">
                      A
                    </div>
                    <div className="flex-1 bg-[#191919] rounded-full px-4 py-2 flex items-center">
                      <input 
                        type="text" 
                        placeholder="Add a comment..." 
                        className="bg-transparent text-white w-full focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

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
                
                {/* Possession stat */}
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

                {/* Shots stat */}
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

                {/* Shots on target stat */}
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

                {/* Corner stat */}
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

                {/* Fouls stat */}
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
