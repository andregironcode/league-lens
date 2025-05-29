import React from 'react';
import Header from '@/components/Header';
import HeroCarousel from '@/components/HeroCarousel';
import LeagueSection from '@/components/LeagueSection';
import RecentMatchesSection from '@/components/RecentMatchesSection';
import { getRecommendedHighlights, getLeagueHighlights, getRecentMatchesForTopLeagues, getActiveService } from '@/services/serviceAdapter';
import { MatchHighlight, League, LeagueWithMatches } from '@/types';

function Index() {
  const [recommendedHighlights, setRecommendedHighlights] = React.useState<MatchHighlight[]>([]);
  const [leagues, setLeagues] = React.useState<League[]>([]);
  const [recentMatches, setRecentMatches] = React.useState<LeagueWithMatches[]>([]);
  const [loading, setLoading] = React.useState({
    recommended: true,
    leagues: true,
    matches: true
  });

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch recommended highlights
        const recommendedData = await getRecommendedHighlights();
        setRecommendedHighlights(recommendedData);
        setLoading(prev => ({ ...prev, recommended: false }));

        // Fetch recent matches for top leagues
        const matchesData = await getRecentMatchesForTopLeagues();
        setRecentMatches(matchesData);
        setLoading(prev => ({ ...prev, matches: false }));

        // Fetch league highlights
        const leaguesData = await getLeagueHighlights();
        setLeagues(leaguesData);
        setLoading(prev => ({ ...prev, leagues: false }));
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading({ recommended: false, leagues: false, matches: false });
      }
    };

    fetchData();
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

        {/* Recent Matches Section */}
        <RecentMatchesSection 
          leaguesWithMatches={recentMatches} 
          loading={loading.matches} 
        />

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
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
