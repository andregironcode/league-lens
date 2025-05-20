import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import HeroCarousel from '@/components/HeroCarousel';
import LeagueSection from '@/components/LeagueSection';
import { MatchHighlight, League } from '@/types';
import { getRecentHighlights, getHighlightsByLeague } from '@/services/highlightlyService';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Bug } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [recommendedHighlights, setRecommendedHighlights] = useState<MatchHighlight[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState({
    recommended: true,
    leagues: true
  });
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Reset error state on new fetch
      setError(null);
      setDebugInfo(null);
      setLoading({
        recommended: true,
        leagues: true
      });
      
      // Fetch recommended highlights
      console.log("🔍 Fetching recommended highlights...");
      const recommendedData = await getRecentHighlights(5);
      
      if (recommendedData.length === 0) {
        console.warn("⚠️ No recommended highlights received from API");
        toast({
          title: "No Highlights Available",
          description: "The API returned no highlights. This could be a temporary issue.",
          variant: "destructive"
        });
      } else {
        console.log(`✅ Retrieved ${recommendedData.length} recommended highlights`);
      }
      
      setRecommendedHighlights(recommendedData);
      setLoading(prev => ({ ...prev, recommended: false }));

      // Fetch league highlights
      console.log("🔍 Fetching league highlights...");
      const leaguesData = await getHighlightsByLeague();
      
      if (leaguesData.length === 0) {
        console.warn("⚠️ No leagues with highlights received from API");
        toast({
          title: "No Leagues Available",
          description: "The API returned no leagues with highlights. This could be a temporary issue.",
          variant: "destructive"
        });
      } else {
        console.log(`✅ Retrieved ${leaguesData.length} leagues with highlights`);
      }
      
      setLeagues(leaguesData);
      setLoading(prev => ({ ...prev, leagues: false }));
    } catch (error) {
      console.error('❌ Error fetching highlights:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError('Failed to load data from Highlightly API. Please check your network connection or try again later.');
      setDebugInfo(`Error details: ${errorMessage}`);
      setLoading({ recommended: false, leagues: false });
      
      toast({
        title: "API Connection Error",
        description: "Failed to connect to the Highlightly football API. Please try again later.",
        variant: "destructive"
      });
    }
  };

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
        {/* Error message with debug info */}
        {error && (
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 mb-8">
            <div className="bg-red-900/50 border border-red-700 text-white p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-400" />
                <p className="font-semibold">Highlightly API Error</p>
              </div>
              <p>{error}</p>
              
              {debugInfo && (
                <div className="mt-3 p-2 bg-black/30 rounded text-xs font-mono overflow-auto max-h-32">
                  {debugInfo}
                </div>
              )}
              
              <div className="mt-3 flex justify-between items-center">
                <span className="text-xs text-gray-400">Failed to connect to API proxy</span>
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => fetchData()} 
                    variant="destructive"
                    size="sm"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('Using API Proxy:');
                      console.log('- Frontend calls: /api/highlights');
                      console.log('- Proxy target: https://soccer.highlightly.net/highlights');
                      console.log('- Auth header added by proxy: Authorization: Bearer c05d22e5-9a84-4a95-83c7-77ef598647ed');
                      toast({
                        title: "Debug Info",
                        description: "Check the browser console for API proxy details",
                      });
                    }}
                  >
                    <Bug className="mr-2 h-4 w-4" />
                    Debug
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Hero Carousel - Wider layout */}
        <section className="mb-12">
          <div className="w-full mx-auto px-0 sm:px-0">
            {loading.recommended ? (
              <div className="w-full h-[50vh] max-h-[550px] bg-highlight-800 rounded-lg animate-pulse"></div>
            ) : recommendedHighlights.length > 0 ? (
              <HeroCarousel highlights={recommendedHighlights} />
            ) : (
              <div className="w-full h-[50vh] max-h-[550px] bg-highlight-800 rounded-lg flex flex-col items-center justify-center p-6">
                <h3 className="text-xl font-semibold mb-2 text-gray-300">No Highlights Available</h3>
                <p className="text-gray-400 text-center max-w-lg mb-4">
                  Unable to load highlights from the Highlightly API. This could be due to network issues, 
                  API limitations, or no content being available at this time.
                </p>
                <Button onClick={() => fetchData()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Content
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Leagues Section */}
        <section id="leagues" className="mb-16">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
            {loading.leagues ? (
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
            ) : leagues.length > 0 ? (
              <>
                <h2 className="text-2xl font-bold mb-6 text-white">Popular Leagues</h2>
                {leagues.map(league => (
                  <LeagueSection key={league.id} league={league} />
                ))}
              </>
            ) : (
              <div className="bg-highlight-800 rounded-lg p-8 text-center">
                <h3 className="text-xl font-semibold mb-3 text-gray-300">No Leagues Available</h3>
                <p className="text-gray-400 mb-6 max-w-lg mx-auto">
                  We couldn't load league data from the Highlightly API. This could be due to network issues,
                  API limitations, or no content being available at this time.
                </p>
                <Button onClick={() => fetchData()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Leagues
                </Button>
              </div>
            )}
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
              All videos are sourced from official channels via Highlightly API.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
