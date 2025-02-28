
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock,
  Eye, 
  Share2 
} from 'lucide-react';
import { getMatchById } from '@/services/highlightService';
import { MatchHighlight } from '@/types';
import { formatDistanceToNow } from 'date-fns';

const MatchDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<MatchHighlight | null>(null);
  const [loading, setLoading] = useState(true);
  const [formattedDate, setFormattedDate] = useState('');
  const [exactDate, setExactDate] = useState('');

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
      <div className="min-h-screen bg-background pt-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto animate-pulse">
          <div className="h-8 bg-highlight-200 rounded w-48 mb-6"></div>
          <div className="aspect-video bg-highlight-200 rounded mb-8"></div>
          <div className="h-10 bg-highlight-200 rounded w-3/4 mb-6"></div>
          <div className="h-20 bg-highlight-200 rounded mb-8"></div>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-background pt-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-semibold">Match not found</h1>
          <button 
            onClick={handleGoBack}
            className="mt-4 flex items-center mx-auto text-sm font-medium px-4 py-2 rounded-md bg-highlight-200 hover:bg-highlight-300 transition-colors"
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
    <div className="min-h-screen bg-background pt-16 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <button 
          onClick={handleGoBack}
          className="flex items-center mb-6 text-sm font-medium hover:underline transition-colors"
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
            <span className="inline-block bg-highlight-900 text-white text-sm px-3 py-1 rounded-full">
              {match.competition.name}
            </span>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold mb-4">
            {match.title}
          </h1>
          
          <div className="flex flex-wrap items-center text-sm text-muted-foreground mb-6 space-x-6">
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
        <section className="mb-12 bg-card rounded-xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-col items-center mb-6 md:mb-0">
              <div className="w-16 h-16 bg-highlight-100 rounded-full flex items-center justify-center mb-2">
                {/* Team logo (placeholder) */}
                <span className="text-xl font-bold">{match.homeTeam.name.charAt(0)}</span>
              </div>
              <span className="font-semibold text-lg">{match.homeTeam.name}</span>
            </div>
            
            <div className="flex items-center mb-6 md:mb-0">
              <span className="text-4xl md:text-5xl font-bold px-4 text-center">
                {match.score.home} - {match.score.away}
              </span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-highlight-100 rounded-full flex items-center justify-center mb-2">
                {/* Team logo (placeholder) */}
                <span className="text-xl font-bold">{match.awayTeam.name.charAt(0)}</span>
              </div>
              <span className="font-semibold text-lg">{match.awayTeam.name}</span>
            </div>
          </div>
        </section>

        {/* Share button */}
        <div className="flex justify-center mb-8">
          <button className="flex items-center px-4 py-2 rounded-md border border-input hover:bg-secondary transition-colors">
            <Share2 size={16} className="mr-2" />
            Share this highlight
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchDetails;
