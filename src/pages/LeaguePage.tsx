
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, StarOff } from 'lucide-react';
import { League, MatchHighlight } from '@/types';
import { getLeagueById } from '@/services/highlightService';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import HighlightCard from '@/components/HighlightCard';
import { toast } from '@/hooks/use-toast';

const LeaguePage: React.FC = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const [league, setLeague] = useState<League | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { isLoggedIn, followLeague, unfollowLeague, isLeagueFollowed } = useAuth();
  
  useEffect(() => {
    const fetchLeague = async () => {
      if (leagueId) {
        try {
          setIsLoading(true);
          const leagueData = await getLeagueById(leagueId);
          setLeague(leagueData);
        } catch (error) {
          console.error('Failed to fetch league:', error);
          toast({
            title: "Error",
            description: "Failed to load league data. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchLeague();
  }, [leagueId]);

  const handleFollowToggle = () => {
    if (!leagueId) return;
    
    if (isLeagueFollowed(leagueId)) {
      unfollowLeague(leagueId);
    } else {
      followLeague(leagueId);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="w-full h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFC30B]"></div>
        </div>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold">League not found</h2>
          <p className="mt-2 text-gray-600">The league you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <img
            src={league.logo}
            alt={league.name}
            className="w-16 h-16 object-contain"
          />
          <h1 className="text-3xl font-bold">{league.name}</h1>
        </div>
        
        <Button
          variant="outline"
          className={isLeagueFollowed(league.id) ? "bg-[#FFC30B]/10" : ""}
          onClick={handleFollowToggle}
        >
          {isLeagueFollowed(league.id) ? (
            <>
              <StarOff className="mr-2 h-4 w-4" />
              Unfollow
            </>
          ) : (
            <>
              <Star className="mr-2 h-4 w-4" />
              Follow
            </>
          )}
        </Button>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Recent Highlights</h2>
        {league.highlights && league.highlights.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {league.highlights.map((highlight) => (
              <HighlightCard key={highlight.id} highlight={highlight} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No highlights available for this league.</p>
          </div>
        )}
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-4">League Information</h2>
        {/* We can add more league details here in the future like tables, upcoming fixtures, etc. */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <p className="text-gray-700">More league information coming soon.</p>
        </div>
      </div>
    </div>
  );
};

export default LeaguePage;
