import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MatchHighlight } from '@/types';
import { serviceAdapter } from '@/services/serviceAdapter';
import Header from '@/components/Header';
import HeroCarousel from '@/components/HeroCarousel';
import MatchFeedByLeague from '@/components/match-feed/MatchFeedByLeague';
import DateFilter from '@/components/DateFilter';

const Index: React.FC = () => {
  const [featuredHighlights, setFeaturedHighlights] = useState<MatchHighlight[]>([]);
  const [dateMatches, setDateMatches] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedLeagueIds, setSelectedLeagueIds] = useState<string[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [dateMatchesLoading, setDateMatchesLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Live update functionality for today's matches
  const liveUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  // Load highlights immediately on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('[Index] Loading initial data...');

        const highlightsData = await serviceAdapter.getRecommendedHighlights().catch(err => {
          console.error('[Index] Error loading highlights:', err);
          return [];
        });

        if (isMounted) {
        console.log('[Index] Initial data loaded:', {
          highlights: highlightsData.length
        });
        setFeaturedHighlights(highlightsData);
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

  // Load matches for selected date - memoized to prevent infinite loops
  const loadMatchesForDate = useCallback(async (dateString: string) => {
    try {
      setDateMatchesLoading(true);
      console.log(`[Index] Loading matches for date: ${dateString}`);
      
      const matchesData = await serviceAdapter.getMatchesForDate(dateString);
      
      console.log(`[Index] Loaded ${matchesData.length} leagues with matches for ${dateString}`);
      setDateMatches(matchesData);
      
    } catch (err) {
      console.error(`[Index] Error loading matches for ${dateString}:`, err);
      setDateMatches([]);
    } finally {
      setDateMatchesLoading(false);
    }
  }, []); // No dependencies needed - function is pure

  // Handle date selection - memoized to prevent infinite loops in DateFilter
  const handleDateSelect = useCallback((dateString: string) => {
    console.log(`[Index] Date selected: ${dateString}`);
    setSelectedDate(dateString);
    loadMatchesForDate(dateString);
  }, [loadMatchesForDate]); // Only depends on loadMatchesForDate (which is also memoized)

  // Handle league filter selection - memoized for consistency
  const handleLeagueSelect = useCallback((leagueIds: string[]) => {
    console.log(`[Index] League filter selected: ${leagueIds.join(', ')}`);
    setSelectedLeagueIds(leagueIds);
  }, []);

  // Handle country filter selection - memoized for consistency
  const handleCountrySelect = useCallback((countryCode: string | null) => {
    console.log(`[Index] Country filter selected: ${countryCode}`);
    setSelectedCountryCode(countryCode);
  }, []);

  // Set up live updates for today's matches
  useEffect(() => {
    if (isToday && selectedDate) {
      console.log('[Index] Setting up live updates for today\'s matches');
      
      // Set up interval to refresh today's matches every 30 seconds
      liveUpdateInterval.current = setInterval(() => {
        console.log('[Index] Live update: refreshing today\'s matches');
        loadMatchesForDate(selectedDate);
      }, 30000); // 30 seconds
      
      return () => {
        if (liveUpdateInterval.current) {
          console.log('[Index] Clearing live update interval');
          clearInterval(liveUpdateInterval.current);
        }
      };
    } else {
      // Clear interval if not today
      if (liveUpdateInterval.current) {
        console.log('[Index] Clearing live update interval (not today)');
        clearInterval(liveUpdateInterval.current);
        liveUpdateInterval.current = null;
      }
    }
  }, [isToday, selectedDate, loadMatchesForDate]); // Added loadMatchesForDate dependency

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (liveUpdateInterval.current) {
        clearInterval(liveUpdateInterval.current);
      }
    };
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
      
      {/* Main content - removed sidebar layout */}
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

          {/* Date Filter */}
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 mt-8">
          <DateFilter 
            onDateSelect={handleDateSelect} 
            selectedDate={selectedDate}
            selectedLeagueIds={selectedLeagueIds}
          />
          </div>

        {/* Matches Content */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 mt-8">
          {selectedDate ? (
            <MatchFeedByLeague 
              leaguesWithMatches={dateMatches}
              loading={dateMatchesLoading}
              selectedDate={selectedDate}
              isToday={isToday}
              selectedLeagueIds={selectedLeagueIds}
              onLeagueSelect={handleLeagueSelect}
              selectedCountryCode={selectedCountryCode}
              onCountrySelect={handleCountrySelect}
            />
          ) : (
            <div className="bg-[#1a1a1a] rounded-lg p-12 text-center border border-gray-700/30">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Select a Date</h3>
              <p className="text-gray-400">
                Choose a date above to view matches from the world's top football leagues.
              </p>
            </div>
          )}
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
