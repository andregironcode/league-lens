
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import HeroCarousel from '@/components/HeroCarousel';
import LeagueSection from '@/components/LeagueSection';
import { getRecommendedHighlights, getLeagueHighlights } from '@/services/highlightService';
import { MatchHighlight, League } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Index = () => {
  const [recommendedHighlights, setRecommendedHighlights] = useState<MatchHighlight[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState({
    recommended: true,
    leagues: true
  });
  const [showSwipeHint, setShowSwipeHint] = useState(true);

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

    // Hide swipe hint after 5 seconds
    const timer = setTimeout(() => {
      setShowSwipeHint(false);
    }, 5000);

    return () => clearTimeout(timer);
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
        {/* Hero Carousel */}
        <section className="mb-12 relative">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4">
            {loading.recommended ? (
              <div className="w-full h-[50vh] max-h-[550px] bg-highlight-800 rounded-lg animate-pulse"></div>
            ) : (
              <>
                <HeroCarousel highlights={recommendedHighlights} />
                {showSwipeHint && (
                  <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 pointer-events-none z-50 flex justify-between px-4 md:px-10 animate-pulse">
                    <div className="bg-black/50 backdrop-blur-sm rounded-full p-2 flex items-center text-xs md:text-sm text-white/90">
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      <span className="hidden md:inline">Swipe</span>
                    </div>
                    <div className="bg-black/50 backdrop-blur-sm rounded-full p-2 flex items-center text-xs md:text-sm text-white/90">
                      <span className="hidden md:inline">Swipe</span>
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Leagues Section - removed heading as requested */}
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
