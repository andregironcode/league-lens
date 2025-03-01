
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import HeroCarousel from '@/components/HeroCarousel';
import LeagueSection from '@/components/LeagueSection';
import { getRecommendedHighlights, getLeagueHighlights } from '@/services/highlightService';
import { MatchHighlight, League } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';

const Index = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
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
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#111111]' : 'bg-white'} ${isDarkMode ? 'text-white' : 'text-black'}`}>
      <Header />
      
      <main className="pt-16 pb-10">
        {/* Hero Carousel */}
        <section className="mb-12">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4">
            {loading.recommended ? (
              <div className={`w-full h-[50vh] max-h-[550px] ${isDarkMode ? 'bg-highlight-800' : 'bg-gray-200'} rounded-lg animate-pulse`}></div>
            ) : (
              <HeroCarousel highlights={recommendedHighlights} />
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
                      <div className={`h-8 ${isDarkMode ? 'bg-highlight-200' : 'bg-gray-200'} rounded w-48 mb-6`}></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array(3).fill(0).map((_, i) => (
                          <div
                            key={i}
                            className="highlight-card aspect-video"
                          >
                            <div className={`absolute inset-0 ${isDarkMode ? 'bg-highlight-200' : 'bg-gray-200'} animate-image-shimmer bg-shimmer bg-[length:200%_100%]`}></div>
                          </div>
                        ))}
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
      <footer className={`${isDarkMode ? 'bg-[#222222]' : 'bg-gray-100'} py-8`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              © {new Date().getFullYear()} Score90. All rights reserved.
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-2`}>
              All videos are sourced from official channels and we do not host any content.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
