
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import HeroCarousel from '@/components/HeroCarousel';
import LeagueSection from '@/components/LeagueSection';
import { Toaster } from '@/components/ui/sonner';
import { getRecommendedHighlightsWithFallback, getLeagueHighlightsWithFallback } from '@/services/fallbackService';
import { MatchHighlight, League } from '@/types';

const Index = () => {
  const [recommendedHighlights, setRecommendedHighlights] = useState<MatchHighlight[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState({
    recommended: true,
    leagues: true
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching recommended highlights...');
        const recommendedData = await getRecommendedHighlightsWithFallback();
        console.log('Received recommended highlights:', recommendedData.length);
        setRecommendedHighlights(recommendedData);
        setLoading(prev => ({ ...prev, recommended: false }));

        console.log('Fetching league highlights...');
        const leaguesData = await getLeagueHighlightsWithFallback();
        console.log('Received league highlights:', leaguesData.length);
        
        // Sort leagues by number of highlights (most highlights first)
        const sortedLeagues = [...leaguesData].sort(
          (a, b) => b.highlights.length - a.highlights.length
        );
        
        setLeagues(sortedLeagues);
        setLoading(prev => ({ ...prev, leagues: false }));
      } catch (error) {
        console.error('Error fetching highlights:', error);
        setError('Failed to load highlights. Please refresh the page.');
        setLoading({ recommended: false, leagues: false });
      }
    };

    fetchData();
  }, []);

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
      <Toaster position="top-center" />
      
      <main className="pt-16 pb-10">
        <section className="mb-12">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4">
            {loading.recommended ? (
              <div className="w-full h-[50vh] max-h-[550px] bg-highlight-800 rounded-lg animate-pulse"></div>
            ) : error ? (
              <div className="w-full h-[30vh] flex items-center justify-center bg-highlight-800/50 rounded-lg">
                <p className="text-white">{error}</p>
              </div>
            ) : (
              <HeroCarousel highlights={recommendedHighlights} />
            )}
          </div>
        </section>

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
              : leagues.length > 0 ? (
                leagues.map(league => (
                  <LeagueSection key={league.id} league={league} />
                ))
              ) : (
                <div className="text-center py-20">
                  <p className="text-xl text-gray-400">No leagues available at the moment.</p>
                  <p className="text-sm text-gray-500 mt-2">Try refreshing the page or check back later.</p>
                </div>
              )
            }
          </div>
        </section>
      </main>

      <footer className="bg-[#222222] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Score90. All rights reserved.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              All videos are sourced from official channels and we do not host any content.
              Highlights powered by Scorebat API (Developer - Hobby Plan).
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
