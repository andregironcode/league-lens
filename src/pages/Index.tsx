import React, { useState, useEffect, useCallback } from 'react';
import { MatchHighlight, LeagueWithMatches, Match } from '@/types';
import { serviceAdapter } from '@/services/serviceAdapter';
import Header from '@/components/Header';
import HeroCarousel from '@/components/HeroCarousel';
import MatchFeedByLeague from '@/components/match-feed/MatchFeedByLeague';
import TopLeaguesFilter from '@/components/TopLeaguesFilter';
import DateSelector from '@/components/DateSelector';
import { formatDateForAPI, getCurrentDateCET, get14DayDateRange } from '@/utils/dateUtils';

const Index: React.FC = () => {
  const [featuredHighlights, setFeaturedHighlights] = useState<MatchHighlight[]>([]);
  const [featuredMatches, setFeaturedMatches] = useState<Match[]>([]);
  const [recentMatches, setRecentMatches] = useState<LeagueWithMatches[]>([]);
  const [selectedLeagueIds, setSelectedLeagueIds] = useState<string[]>([]);
  const [selectedTopLeagueId, setSelectedTopLeagueId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [matchesLoading, setMatchesLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatchesForDate = useCallback(async (date: string) => {
    try {
      setMatchesLoading(true);
      setError(null);
      console.log(`[Index] Fetching matches for date: ${date}`);
      const matchesData = await serviceAdapter.getMatchesForDate(date);
      console.log(`[Index] Received ${matchesData.length} leagues with matches for ${date}:`, matchesData);
      setRecentMatches(matchesData);
      
      // If no matches found, provide helpful logging
      if (matchesData.length === 0) {
        console.warn(`[Index] No matches found for ${date}. This might be normal if the date is during off-season or if no games were scheduled.`);
      }
    } catch (err) {
      console.error(`[Index] Error loading matches for date ${date}:`, err);
      setError('Failed to load matches for the selected date.');
    } finally {
      setMatchesLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Fetch featured matches with highlights for the hero carousel
        const featuredMatchesData = await serviceAdapter.getLast5FeaturedMatches();
        setFeaturedMatches(featuredMatchesData);
        
        // Also fetch regular highlights as fallback
        const highlightsData = await serviceAdapter.getRecommendedHighlights();
        setFeaturedHighlights(highlightsData);
      } catch (err) {
        console.error('[Index] Error loading highlights or featured matches:', err);
        setError('Failed to load featured content.');
      } finally {
        setLoading(false);
      }
      
      console.log(`[Index] Fetching matches for today's date`);
      
      const { dates } = get14DayDateRange();
      const todayDate = dates[7]; // Middle of 14-day range (7 days past + today + 6 days future)
      console.log(`[Index] Using today's date: ${todayDate} (position 7 in 14-day range)`);
      
      serviceAdapter.getMatchesForDate(todayDate)
        .then(leaguesWithMatches => {
          console.log(`[Index] Received ${leaguesWithMatches.length} leagues with matches for ${todayDate}`);
          
          if (leaguesWithMatches.length === 0) {
            console.warn(`[Index] No matches found for ${todayDate}. This might be during off-season or a rest day.`);
            console.warn(`[Index] Try using DateSlider to select different dates from the 14-day range`);
          }
          
          setRecentMatches(leaguesWithMatches);
        })
        .catch(error => {
          console.error('[Index] Error fetching matches:', error);
          setRecentMatches([]);
        })
        .finally(() => {
          setMatchesLoading(false);
        });
    };

    loadInitialData();
  }, []);

  const handleDateChange = (date: string) => {
    fetchMatchesForDate(date);
  };
  
  if (error && !matchesLoading) {
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
          <HeroCarousel 
            highlights={featuredHighlights} 
            // Make sure the HeroCarousel component accepts these props or update it accordingly
          />
        )}
      </section>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Recent Matches</h1>
      </div>
      
      <div className="mb-8">
        <DateSelector onDateChange={handleDateChange} />
      </div>

      <div className="rounded-3xl p-6 mb-8" style={{ backgroundColor: '#000000', border: '1px solid #1B1B1B' }}>
        <MatchFeedByLeague 
          leaguesWithMatches={recentMatches}
          loading={matchesLoading}
          selectedLeagueIds={[]}
          onLeagueSelect={() => {}}
          selectedCountryCode={null}
        />
      </div>
    </>
  );
};

export default Index;
