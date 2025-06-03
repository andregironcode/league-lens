import React, { useState, useEffect, useRef } from 'react';
import { MatchHighlight } from '@/types';
import { serviceAdapter } from '@/services/serviceAdapter';
import Header from '@/components/Header';
import HighlightBanner from '@/components/HighlightBanner';
import DatePickerNavigation from '@/components/DatePickerNavigation';
import MatchFeedByLeague from '@/components/MatchFeedByLeague';
import TopLeaguesFilter from '@/components/TopLeaguesFilter';
import CountryFilter from '@/components/CountryFilter';

const IndexNew: React.FC = () => {
  const [featuredHighlights, setFeaturedHighlights] = useState<MatchHighlight[]>([]);
  const [dateMatches, setDateMatches] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
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

        console.log('[IndexNew] Loading initial data...');

        // Load featured highlights
        const highlightsData = await serviceAdapter.getRecommendedHighlights().catch(err => {
          console.error('[IndexNew] Error loading highlights:', err);
          return [];
        });

        console.log('[IndexNew] Initial data loaded:', {
          highlights: highlightsData.length
        });

        setFeaturedHighlights(highlightsData);

        // Remove automatic loading of today's matches for better performance
        // User can select today's date manually if they want to see matches
        // const today = new Date().toISOString().split('T')[0];
        // setSelectedDate(today);
        // loadMatchesForDate(today);

      } catch (err) {
        console.error('[IndexNew] Error during initial load:', err);
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
      console.log(`[IndexNew] Loading matches for date: ${dateString}`);
      
      const matchesData = await serviceAdapter.getMatchesForDate(dateString);
      
      console.log(`[IndexNew] Loaded ${matchesData.length} leagues with matches for ${dateString}`);
      setDateMatches(matchesData);
      
    } catch (err) {
      console.error(`[IndexNew] Error loading matches for ${dateString}:`, err);
      setDateMatches([]);
    } finally {
      setDateMatchesLoading(false);
    }
  };

  // Handle date selection
  const handleDateSelect = (dateString: string) => {
    console.log(`[IndexNew] Date selected: ${dateString}`);
    setSelectedDate(dateString);
    loadMatchesForDate(dateString);
  };

  // Handle league filter selection
  const handleLeagueSelect = (leagueId: string | null) => {
    console.log(`[IndexNew] League filter selected: ${leagueId}`);
    setSelectedLeagueId(leagueId);
  };

  // Handle country filter selection
  const handleCountrySelect = (countryCode: string | null) => {
    console.log(`[IndexNew] Country filter selected: ${countryCode}`);
    setSelectedCountryCode(countryCode);
  };

  // Set up live updates for today's matches
  useEffect(() => {
    if (isToday && selectedDate) {
      console.log('[IndexNew] Setting up live updates for today\'s matches');
      
      // Set up interval to refresh today's matches every 30 seconds
      liveUpdateInterval.current = setInterval(() => {
        console.log('[IndexNew] Live update: refreshing today\'s matches');
        loadMatchesForDate(selectedDate);
      }, 30000); // 30 seconds
      
      return () => {
        if (liveUpdateInterval.current) {
          console.log('[IndexNew] Clearing live update interval');
          clearInterval(liveUpdateInterval.current);
        }
      };
    } else {
      // Clear interval if not today
      if (liveUpdateInterval.current) {
        console.log('[IndexNew] Clearing live update interval (not today)');
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-4">Something went wrong</h1>
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
      <>
        <Header />
        
        <div className="pt-16 min-h-screen">
          {/* Main Content */}
          <main className="w-full">
            <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 lg:py-8">
              {/* 1. Highlight Banner (Top Hero Section) */}
              {featuredHighlights.length > 0 && (
                <HighlightBanner highlight={featuredHighlights[0]} />
              )}
              
              {/* 2. Date Picker Navigation */}
              <div className="mb-6 sm:mb-8">
                <DatePickerNavigation
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                />
              </div>
              
              {/* 3. Browse Matches by Date Section */}
              <div className="mb-16">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
                  Browse Matches by Date
                  {selectedDate && (
                    <span className="text-gray-400 text-base sm:text-lg font-normal ml-2">
                      {new Date(selectedDate).toLocaleDateString('en-US', { 
                        weekday: 'long',
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  )}
                </h2>
                
                <div className="space-y-4 sm:space-y-6">
                  {/* Filter Components */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Top Leagues Filter */}
                    <TopLeaguesFilter
                      selectedLeagueId={selectedLeagueId}
                      onLeagueSelect={handleLeagueSelect}
                    />
                    
                    {/* Country Filter */}
                    <div>
                      <CountryFilter
                        selectedCountryCode={selectedCountryCode}
                        onCountrySelect={handleCountrySelect}
                      />
                    </div>
                  </div>
                  
                  {/* Matches */}
                  {dateMatchesLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                      <p className="text-gray-400 text-sm sm:text-base">Loading matches...</p>
                    </div>
                  ) : (
                    <MatchFeedByLeague
                      leaguesWithMatches={dateMatches}
                      selectedLeagueId={selectedLeagueId}
                    />
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Footer */}
        <footer className="text-xs text-gray-500 px-3 sm:px-4 py-6 sm:py-8 text-center bg-[#0a0a0a] border-t border-gray-800">
          © 2025 Score90. All rights reserved. All videos are sourced from official channels and we do not host any content.
        </footer>
      </>
    </div>
  );
};

export default IndexNew; 