import React, { useState, useEffect, useRef } from 'react';
import { MatchHighlight } from '@/types';
import { serviceAdapter } from '@/services/serviceAdapter';
import Header from '@/components/Header';
import HeroCarousel from '@/components/HeroCarousel';
import MatchFeedByLeague from '@/components/match-feed/MatchFeedByLeague';
import LeagueFilterSidebar from '@/components/match-feed/LeagueFilterSidebar';
import DateFilter from '@/components/DateFilter';

const Index: React.FC = () => {
  const [featuredHighlights, setFeaturedHighlights] = useState<MatchHighlight[]>([]);
  const [dateMatches, setDateMatches] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [dateMatchesLoading, setDateMatchesLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Live update functionality for today's matches
  const liveUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('[Index] Loading initial data...');

        // Load featured highlights
        const highlightsData = await serviceAdapter.getRecommendedHighlights().catch(err => {
          console.error('[Index] Error loading highlights:', err);
          return [];
        });

        console.log('[Index] Initial data loaded:', {
          highlights: highlightsData.length
        });

        setFeaturedHighlights(highlightsData);

      } catch (err) {
        console.error('[Index] Error during initial load:', err);
        setError('Failed to load initial data');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Load matches for selected date
  const loadMatchesForDate = async (dateString: string) => {
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
  };

  // Handle date selection
  const handleDateSelect = (dateString: string) => {
    console.log(`[Index] Date selected: ${dateString}`);
    setSelectedDate(dateString);
    loadMatchesForDate(dateString);
  };

  // Handle league filter selection
  const handleLeagueSelect = (leagueId: string | null) => {
    console.log(`[Index] League filter selected: ${leagueId}`);
    setSelectedLeagueId(leagueId);
    // Close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

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
  }, [isToday, selectedDate]);

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
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
      
      {/* Layout with optional sidebar */}
      <div className="flex pt-16">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar - shows on desktop when there are matches, or when toggled on mobile */}
        {selectedDate && (
          <>
            {/* Desktop sidebar */}
            <div className="hidden lg:block lg:w-80 flex-shrink-0">
              <div className="fixed h-full w-80 top-16">
                <LeagueFilterSidebar
                  selectedLeagueId={selectedLeagueId}
                  onLeagueSelect={handleLeagueSelect}
                  availableLeagueIds={dateMatches.map(league => league.id)}
                  hasMatches={dateMatches.length > 0}
                />
              </div>
            </div>
            
            {/* Mobile sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out lg:hidden ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
              <div className="h-full pt-16">
                <LeagueFilterSidebar
                  selectedLeagueId={selectedLeagueId}
                  onLeagueSelect={handleLeagueSelect}
                  availableLeagueIds={dateMatches.map(league => league.id)}
                  hasMatches={dateMatches.length > 0}
                />
              </div>
            </div>
          </>
        )}
        
        {/* Main content */}
        <main className={`flex-1 pb-10 ${selectedDate ? 'lg:ml-0' : ''}`}>
          {/* Filter toggle button for mobile */}
          {selectedDate && (
            <div className="lg:hidden sticky top-16 z-30 bg-[#111111] border-b border-gray-800 p-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="text-sm font-medium">Filter Leagues</span>
                {selectedLeagueId && (
                  <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">1</span>
                )}
              </button>
            </div>
          )}

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
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white mb-4">Browse Matches by Date</h2>
              <p className="text-gray-400 text-sm mb-6">
                Select a date to view past results, live matches, and upcoming fixtures from the top 10 leagues worldwide.
              </p>
            </div>
            <DateFilter onDateSelect={handleDateSelect} selectedDate={selectedDate} />
          </div>

          {/* Date-filtered Matches Section */}
          {selectedDate && (
            <MatchFeedByLeague 
              leaguesWithMatches={dateMatches}
              loading={dateMatchesLoading}
              selectedDate={selectedDate}
              isToday={isToday}
              selectedLeagueId={selectedLeagueId}
            />
          )}
        </main>
      </div>

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
