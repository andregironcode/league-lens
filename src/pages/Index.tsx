import React, { useState, useEffect, useCallback } from 'react';
import { MatchHighlight, LeagueWithMatches } from '@/types';
import { serviceAdapter } from '@/services/serviceAdapter';
import Header from '@/components/Header';
import HeroCarousel from '@/components/HeroCarousel';
import MatchFeedByLeague from '@/components/match-feed/MatchFeedByLeague';
import CountryFilter from '@/components/CountryFilter';

const Index: React.FC = () => {
  const [featuredHighlights, setFeaturedHighlights] = useState<MatchHighlight[]>([]);
  const [last7DaysMatches, setLast7DaysMatches] = useState<LeagueWithMatches[]>([]);
  const [selectedLeagueIds, setSelectedLeagueIds] = useState<string[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [matchesLoading, setMatchesLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('[Index] Loading initial data...');

        // Load data in parallel
        const [highlightsData, matchesData] = await Promise.all([
          serviceAdapter.getRecommendedHighlights().catch(err => {
            console.error('[Index] Error loading highlights:', err);
            return [];
          }),
          serviceAdapter.getMatchesFromLast7Days().catch(err => {
            console.error('[Index] Error loading last 7 days matches:', err);
            return [];
          })
        ]);

        if (isMounted) {
          console.log('[Index] Initial data loaded:', {
            highlights: highlightsData.length,
            leagues: matchesData.length
          });
          setFeaturedHighlights(highlightsData);
          setLast7DaysMatches(matchesData);
        }

      } catch (err) {
        if (isMounted) {
          console.error('[Index] Error during initial load:', err);
          setError('Failed to load initial data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInitialData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle league filter selection
  const handleLeagueSelect = useCallback((leagueIds: string[]) => {
    console.log(`[Index] League filter selected: ${leagueIds.join(', ')}`);
    setSelectedLeagueIds(leagueIds);
  }, []);

  // Handle country filter selection
  const handleCountrySelect = useCallback((countryCode: string | null) => {
    console.log(`[Index] Country filter selected: ${countryCode}`);
    setSelectedCountryCode(countryCode);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
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
    <div className="min-h-screen bg-[#111111] text-white">
      <Header />
      
      {/* Main content */}
      <main className="flex-1 pb-10 pt-16">
        {/* Hero Carousel */}
        <section className="mb-12">
          <div className="w-full mx-auto px-0 sm:px-0">
            {loading ? (
              <div className="w-full h-[50vh] max-h-[550px] bg-gray-800 rounded-lg animate-pulse"></div>
            ) : (
              <HeroCarousel highlights={featuredHighlights} />
            )}
          </div>
        </section>

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 mt-8">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Recent Matches</h1>
            <p className="text-gray-400">Matches from the last 7 days</p>
          </div>

          {/* Main Content Area */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Matches Content - Middle */}
            <div className="flex-1 min-w-0">
              <MatchFeedByLeague 
                leaguesWithMatches={last7DaysMatches}
                loading={matchesLoading}
                selectedLeagueIds={selectedLeagueIds}
                onLeagueSelect={handleLeagueSelect}
                selectedCountryCode={selectedCountryCode}
                onCountrySelect={handleCountrySelect}
              />
            </div>

            {/* Country Filter - Right */}
            <div className="lg:w-80 flex-shrink-0">
              <div className="lg:sticky lg:top-24">
                <CountryFilter
                  selectedCountryCode={selectedCountryCode}
                  onCountrySelect={handleCountrySelect}
                  onCountriesLoaded={(countries) => {
                    console.log('[Index] Countries loaded:', countries.length);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#222222] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center text-gray-400">
            <p>&copy; 2024 League Lens. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
