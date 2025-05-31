import React, { useState, useEffect, useRef } from 'react';
import { MatchHighlight, League } from '@/types';
import { serviceAdapter } from '@/services/serviceAdapter';
import Header from '@/components/Header';
import HeroCarousel from '@/components/HeroCarousel';
import MatchesSection from '@/components/MatchesSection';
import DateFilter from '@/components/DateFilter';
import LeagueSection from '@/components/LeagueSection';

const Index: React.FC = () => {
  const [featuredHighlights, setFeaturedHighlights] = useState<MatchHighlight[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [dateMatches, setDateMatches] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
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

        // Load featured highlights and league data in parallel
        const [highlightsData, leaguesData] = await Promise.all([
          serviceAdapter.getRecommendedHighlights().catch(err => {
            console.error('[Index] Error loading highlights:', err);
            return [];
          }),
          serviceAdapter.getLeagueHighlights().catch(err => {
            console.error('[Index] Error loading leagues:', err);
            return [];
          })
        ]);

        console.log('[Index] Initial data loaded:', {
          highlights: highlightsData.length,
          leagues: leaguesData.length
        });

        setFeaturedHighlights(highlightsData);
        setLeagues(leaguesData);

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
      
      <main className="pt-16 pb-10">
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
              Select a date to view past results, live matches, and upcoming fixtures from the top 5 European leagues.
            </p>
          </div>
          <DateFilter onDateSelect={handleDateSelect} selectedDate={selectedDate} />
        </div>

        {/* Date-filtered Matches Section */}
        {selectedDate && (
          <MatchesSection 
            leaguesWithMatches={dateMatches}
            loading={dateMatchesLoading}
            selectedDate={selectedDate}
            isToday={isToday}
          />
        )}

        {/* League Highlights Section */}
        <section id="leagues" className="mb-16">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
            {loading ? (
              <div className="space-y-10">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-8 bg-gray-700 rounded w-48 mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3].map((j) => (
                        <div key={j} className="h-48 bg-gray-800 rounded-lg"></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              leagues.map(league => (
                <LeagueSection key={league.id} league={league} />
              ))
            )}
          </div>
        </section>
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
