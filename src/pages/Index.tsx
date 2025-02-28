
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import HeroCarousel from '@/components/HeroCarousel';
import HighlightCard from '@/components/HighlightCard';
import LeagueSection from '@/components/LeagueSection';
import DayNavigation from '@/components/DayNavigation';
import CategoryTabs from '@/components/CategoryTabs';
import { getRecommendedHighlights, getLeagueHighlights } from '@/services/highlightService';
import { MatchHighlight, League } from '@/types';

const Index = () => {
  const [recommendedHighlights, setRecommendedHighlights] = useState<MatchHighlight[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState('all');
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

  // Simulate filtering by date and category
  useEffect(() => {
    console.log(`Filtering for date: ${selectedDay} and category: ${selectedCategory}`);
    // In a real app, you'd make an API call with these filters
    // For now, we'll just use our existing data
  }, [selectedDay, selectedCategory]);

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
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <main className="pt-16 pb-10">
        {/* Hero Carousel */}
        <section className="mb-8">
          {loading.recommended ? (
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
              <div className="w-full h-[60vh] max-h-[650px] bg-highlight-800 rounded-lg animate-pulse"></div>
            </div>
          ) : (
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
              <HeroCarousel highlights={recommendedHighlights} />
            </div>
          )}
        </section>

        {/* Day-based navigation */}
        <section className="mb-8">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
            <DayNavigation onSelectDay={setSelectedDay} />
          </div>
        </section>

        {/* Category Tabs */}
        <section>
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
            <CategoryTabs onSelectCategory={setSelectedCategory} />
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
      <footer className="bg-highlight-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} LeagueLens. All rights reserved.
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
