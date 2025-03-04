
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import HeroCarousel from '@/components/HeroCarousel';
import LeagueSection from '@/components/LeagueSection';
import { getRecommendedHighlights, getLeagueHighlights } from '@/services/highlightService';
import { MatchHighlight, League } from '@/types';

const Index = () => {
  const [recommendedHighlights, setRecommendedHighlights] = useState<MatchHighlight[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState({
    recommended: true,
    leagues: true
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch recommended highlights
        const recommendedData = await getRecommendedHighlights();
        setRecommendedHighlights(recommendedData);
        setLoading(prev => ({ ...prev, recommended: false }));

        // Fetch league highlights
        const leaguesData = await getLeagueHighlights();
        setLeagues(leaguesData);
        setLoading(prev => ({ ...prev, leagues: false }));
      } catch (error) {
        console.error('Error fetching highlights:', error);
        setLoading({ recommended: false, leagues: false });
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
    <div className="min-h-screen bg-[#111111] text-white w-full">
      <Header />
      
      <main className="pt-16 pb-10 w-full">
        {/* Hero Carousel - With adjusted spacing for mobile */}
        <section className="mb-8 md:mb-16 hero-section">
          <div className="w-full container-xl mx-auto sm:px-4">
            {loading.recommended ? (
              <div className="w-full h-[50vh] max-h-[550px] bg-highlight-800 rounded-lg animate-pulse"></div>
            ) : (
              <HeroCarousel highlights={recommendedHighlights} />
            )}
          </div>
        </section>

        {/* Leagues Section */}
        <section id="leagues" className="mb-16">
          <div className="w-full container-xl mx-auto px-2 sm:px-4">
            {loading.leagues 
              ? (
                <div className="space-y-10">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-8 bg-highlight-200 rounded w-48 mb-6"></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {renderSkeleton(4)}
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
      <footer className="bg-[#222222] py-8 w-full">
        <div className="container-xl mx-auto px-2 sm:px-4">
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
