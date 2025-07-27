import React, { useState, useEffect } from 'react';
import { MatchHighlight } from '@/types';
import { supabaseDataService } from '@/services/supabaseDataService';
import HeroCarousel from '@/components/HeroCarousel';
import EnhancedMatchFeed from '@/components/EnhancedMatchFeed';
import ForYouSection from '@/components/ForYouSection';

const Index: React.FC = () => {
  const [featuredHighlights, setFeaturedHighlights] = useState<MatchHighlight[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Fetch featured highlights for the hero carousel
        const highlightsData = await supabaseDataService.getRecentHighlights(10);
        setFeaturedHighlights(highlightsData);
      } catch (err) {
        console.error('[Index] Error loading highlights:', err);
        setError('Failed to load featured content.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);
  
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[#FFC30B] text-black rounded-lg hover:bg-yellow-500 transition-colors font-medium"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="mb-12">
        {loading ? (
          <div className="w-full h-[50vh] max-h-[550px] bg-gray-800 rounded-lg animate-pulse"></div>
        ) : (
          <HeroCarousel highlights={featuredHighlights} />
        )}
      </section>

      {/* For You Section - Top matches based on importance */}
      <div className="mb-12">
        <ForYouSection />
      </div>

      {/* Match Feed Section - Shows matches from top 8 leagues (-1 to +5 days) */}
      <div className="mb-12">
        <EnhancedMatchFeed />
      </div>
    </>
  );
};

export default Index; 