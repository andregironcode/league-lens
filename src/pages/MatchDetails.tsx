import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getMatchHighlightById } from '@/services/highlightService';
import { MatchHighlight } from '@/types';
import ReactPlayer from 'react-player';
import { Button } from "@/components/ui/button"
import { CalendarIcon, ClockIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import CommentSection from '@/components/CommentSection';
import LoginDialog from '@/components/LoginDialog';

const MatchDetails = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const [highlight, setHighlight] = useState<MatchHighlight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { saveMatch, unsaveMatch, isMatchSaved } = useAuth();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  
  useEffect(() => {
    const fetchHighlight = async () => {
      if (matchId) {
        setIsLoading(true);
        try {
          const matchHighlight = await getMatchHighlightById(matchId);
          setHighlight(matchHighlight);
        } catch (error) {
          console.error('Failed to fetch match highlight:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchHighlight();
  }, [matchId]);

  const handleSaveMatch = () => {
    if (!highlight) return;
    
    if (isMatchSaved(highlight.id)) {
      unsaveMatch(highlight.id);
    } else {
      saveMatch(highlight.id);
    }
  };

  if (isLoading) {
    return <div className="container mx-auto">Loading...</div>;
  }

  if (!highlight) {
    return <div className="container mx-auto">Match not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{highlight.title}</h1>

      <div className="relative mb-6">
        <ReactPlayer
          url={highlight.videoUrl}
          width="100%"
          height="560px"
          controls
          style={{ backgroundColor: 'black' }}
        />
        <div className="absolute bottom-0 left-0 p-4 w-full bg-gradient-to-t from-black to-transparent text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{highlight.homeTeam.name} vs {highlight.awayTeam.name}</h2>
              <p className="text-sm">
                {highlight.competition.name} - {format(new Date(highlight.date), 'PPP')}
              </p>
            </div>
            <div className="flex items-center">
              <Button
                variant="outline"
                className="ml-2"
                onClick={handleSaveMatch}
              >
                {isMatchSaved(highlight?.id || '') ? (
                  <BookmarkCheck className="h-5 w-5 text-[#FFC30B]" />
                ) : (
                  <Bookmark className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-5 w-5 text-gray-500" />
          <span>{format(new Date(highlight.date), 'PPP')}</span>
        </div>
        <div className="flex items-center space-x-2">
          <ClockIcon className="h-5 w-5 text-gray-500" />
          <span>{highlight.duration}</span>
        </div>
        <div>
          <span>{highlight.views} views</span>
        </div>
      </div>
      
      {highlight && <CommentSection matchId={highlight.id} />}
      
      <LoginDialog 
        open={showLoginDialog} 
        onOpenChange={setShowLoginDialog} 
        action="save this match"
      />
    </div>
  );
};

export default MatchDetails;
