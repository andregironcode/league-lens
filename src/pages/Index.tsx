
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import HighlightCard from '@/components/HighlightCard';
import LeagueSection from '@/components/LeagueSection';
import { getRecommendedHighlights, getLeagueHighlights } from '@/services/highlightService';
import { MatchHighlight, League } from '@/types';
import { ChevronRight } from 'lucide-react';

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
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-10">
        {/* Hero Section */}
        <section className="mt-8 md:mt-16 mb-16">
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
              Latest Football Highlights
            </h1>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Watch highlights from all major leagues and competitions, updated daily with the best quality.
            </p>
          </div>
        </section>

        {/* Recommended Highlights */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Recommended</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Big matches from the last 7 days
              </p>
            </div>
            <a 
              href="#" 
              className="flex items-center text-sm font-medium hover:underline"
            >
              View all
              <ChevronRight size={16} className="ml-1" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading.recommended 
              ? renderSkeleton(3)
              : recommendedHighlights.map((highlight, index) => (
                <div 
                  key={highlight.id}
                  className={`transform transition-all duration-300 ${
                    index === 0 
                      ? 'lg:col-span-3 lg:row-span-2' 
                      : ''
                  }`}
                >
                  <HighlightCard 
                    highlight={highlight} 
                    featured={index === 0}
                  />
                </div>
              ))
            }
          </div>
        </section>

        {/* Leagues Section */}
        <section id="leagues" className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold tracking-tight">Browse by League</h2>
          </div>

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
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-secondary py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} LeagueLens. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              All videos are sourced from official channels and we do not host any content.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
