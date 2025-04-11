
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import HeroCarousel from '@/components/HeroCarousel';
import LeagueSection from '@/components/LeagueSection';
import { fetchMatches, fetchLeagues } from '@/services/highlightService';
import { MatchHighlight, League } from '@/types';

const Index = () => {
  const [recommendedHighlights, setRecommendedHighlights] = useState<MatchHighlight[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState({
    recommended: true,
    leagues: true
  });
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all matches for recommended highlights (recent finished or live matches)
        const matchesData = await fetchMatches();
        console.log('Matches fetched:', matchesData ? matchesData.length : 0);
        
        // First check for live matches for recommended
        let recentHighlights = matchesData
          .filter((match: any) => match.status === 'LIVE' || match.status === 'IN_PLAY' || match.status === 'PAUSED')
          .slice(0, 6);
        
        // If no live matches, use recently finished ones
        if (recentHighlights.length === 0) {
          recentHighlights = matchesData
            .filter((match: any) => match.status === 'FINISHED' || match.status === 'FT')
            .slice(0, 6);
        }
        
        // Map matches to highlight format
        const formattedHighlights = recentHighlights.map((match: any) => ({
          id: match.id,
          title: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
          date: match.date,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          score: match.score,
          competition: match.competition,
          thumbnailUrl: match.thumbnail || 'https://e0.365dm.com/23/04/768x432/skysports-arsenal-manchester-city_6131683.jpg?20230426210634', // Fallback image if no thumbnail
          videoUrl: match.embedUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Fallback video if no embed URL
        }));
        
        setRecommendedHighlights(formattedHighlights);
        setLoading(prev => ({ ...prev, recommended: false }));

        // Fetch leagues and their highlights
        const leaguesData = await fetchLeagues();
        console.log('Leagues fetched:', leaguesData ? leaguesData.length : 0);
        
        // For each league, get recent matches
        const leaguesWithHighlights = await Promise.all(
          leaguesData.map(async (league: any) => {
            const leagueMatches = await fetchMatches(undefined, league.id);
            const leagueHighlights = leagueMatches
              .filter((match: any) => match.status === 'FINISHED' || match.status === 'FT')
              .slice(0, 3)
              .map((match: any) => ({
                id: match.id,
                title: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
                date: match.date,
                homeTeam: match.homeTeam,
                awayTeam: match.awayTeam,
                score: match.score,
                competition: match.competition,
              }));
            
            return {
              ...league,
              highlights: leagueHighlights
            };
          })
        );
        
        setLeagues(leaguesWithHighlights);
        setLoading(prev => ({ ...prev, leagues: false }));
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error fetching highlights:', error);
        setLoading({ recommended: false, leagues: false });
      }
    };

    fetchData();

    // Set up auto-refresh every 2 minutes
    const refreshInterval = setInterval(fetchData, 120000); // 2 minutes

    return () => clearInterval(refreshInterval);
  }, []);

  // Helper function for skeleton loading
  const renderSkeleton = (count: number, featured = false) => {
    return Array(count)
      .fill(0)
      .map((_, i) => (
        <div
          key={i}
          className={`highlight-card ${
            featured ? 'aspect-video md:aspect-[16/9]' : 'aspect-video'
          }`}
        >
          <div className="absolute inset-0 bg-highlight-200 animate-image-shimmer bg-shimmer bg-[length:200%_100%]"></div>
        </div>
      ));
  };

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <Header />
      
      <main className="pt-16 pb-10">
        {/* Hero Carousel - Wider layout */}
        <section className="mb-12">
          <div className="w-full mx-auto px-0 sm:px-0">
            {loading.recommended ? (
              <div className="w-full h-[50vh] max-h-[550px] bg-highlight-800 rounded-lg animate-pulse"></div>
            ) : (
              <HeroCarousel highlights={recommendedHighlights} />
            )}
          </div>
        </section>

        {/* Leagues Section */}
        <section id="leagues" className="mb-16">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
            {loading.leagues 
              ? (
                <div className="space-y-10">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-8 bg-highlight-200 rounded w-48 mb-6"></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {renderSkeleton(3)}
                      </div>
                    </div>
                  ))}
                </div>
              )
              : leagues.map(league => (
                <LeagueSection key={league.id} league={league} />
              ))
            }
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#222222] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Score90. All rights reserved.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              All videos are sourced from official channels and we do not host any content.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
