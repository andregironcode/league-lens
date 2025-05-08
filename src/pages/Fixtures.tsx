
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { fetchMatches, fetchMatchesByLeague, fetchMatchesByCountry, fetchStandings } from '@/services/highlightService';
import { format, addDays, subDays, startOfDay, endOfDay } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import DayNavigation from '@/components/DayNavigation';
import EnhancedMatchFilters from '@/components/EnhancedMatchFilters';
import MatchCard from '@/components/MatchCard';
import MatchDetailPopup from '@/components/MatchDetailPopup';
import StandingsTable from '@/components/StandingsTable';

const Fixtures = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [standings, setStandings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStandings, setIsLoadingStandings] = useState(false);
  const [filters, setFilters] = useState<{
    league?: string;
    country?: string;
    date?: Date;
  }>({});
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchFixtures = async () => {
    setIsLoading(true);
    
    try {
      let matches;
      
      // Format the date as 'YYYY-MM-DD'
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      if (filters.league) {
        matches = await fetchMatchesByLeague(filters.league);
        setSelectedLeagueId(matches[0]?.competition?.id || null);
      } else if (filters.country) {
        matches = await fetchMatchesByCountry(filters.country);
        setSelectedLeagueId(null);
      } else {
        matches = await fetchMatches(formattedDate);
        setSelectedLeagueId(null);
      }
      
      // Filter matches for the selected date if we're not already filtering by date
      if (!filters.date) {
        const startDate = startOfDay(selectedDate).toISOString();
        const endDate = endOfDay(selectedDate).toISOString();
        
        const dateFiltered = matches.filter((match: any) => {
          const matchDate = new Date(match.kickoff || match.date);
          return matchDate >= new Date(startDate) && matchDate <= new Date(endDate);
        });
        
        setFixtures(dateFiltered);
      } else {
        setFixtures(matches);
      }
      
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch fixtures:', error);
      setFixtures([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFixtures();
    
    // Setup auto-refresh interval
    const refreshInterval = setInterval(() => {
      fetchFixtures();
    }, Math.floor(Math.random() * 60000) + 60000); // Refresh between 60-120 seconds
    
    return () => clearInterval(refreshInterval);
  }, [selectedDate, filters]);

  useEffect(() => {
    // Fetch standings when a league is selected
    const getStandings = async () => {
      if (!selectedLeagueId) {
        setStandings(null);
        return;
      }
      
      setIsLoadingStandings(true);
      try {
        const standingsData = await fetchStandings(selectedLeagueId);
        setStandings(standingsData);
      } catch (error) {
        console.error('Failed to fetch standings:', error);
        setStandings(null);
      } finally {
        setIsLoadingStandings(false);
      }
    };
    
    getStandings();
  }, [selectedLeagueId]);

  const goToNextDay = () => {
    setSelectedDate(prevDate => addDays(prevDate, 1));
  };

  const goToPrevDay = () => {
    setSelectedDate(prevDate => subDays(prevDate, 1));
  };

  const handleFilterChange = (newFilters: {
    league?: string;
    country?: string;
    date?: Date;
  }) => {
    setFilters(newFilters);
    
    // If date is selected in filter, update the selectedDate state
    if (newFilters.date) {
      setSelectedDate(newFilters.date);
    }
  };

  const handleMatchClick = (match: any) => {
    setSelectedMatch(match);
    setIsDetailOpen(true);
  };

  const groupFixturesByLeague = (fixtures: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    
    fixtures.forEach(fixture => {
      const league = fixture.competition?.name || 'Other Competitions';
      if (!grouped[league]) {
        grouped[league] = [];
      }
      grouped[league].push(fixture);
    });
    
    return grouped;
  };

  return (
    <div className="min-h-screen bg-black pt-16 pb-16">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white mt-8">Fixtures & Results</h1>
          <div className="text-xs text-gray-400 flex items-center">
            <Clock size={12} className="mr-1" />
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
        </div>
        
        <EnhancedMatchFilters onFilterChange={handleFilterChange} />
        
        <div className="mb-6">
          <DayNavigation 
            currentDate={selectedDate}
            onPreviousDay={goToPrevDay}
            onNextDay={goToNextDay}
          />
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FFC30B]"></div>
          </div>
        ) : fixtures.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              {Object.entries(groupFixturesByLeague(fixtures)).map(([league, matches]) => (
                <div key={league} className="mb-10">
                  <h2 className="text-xl font-bold mb-4 text-white flex items-center">
                    {matches[0]?.competition?.logo && (
                      <img 
                        src={matches[0].competition.logo}
                        alt={league}
                        className="w-6 h-6 mr-2 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                        }}
                      />
                    )}
                    {league}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matches.map(match => (
                      <div
                        key={match.id}
                        onClick={() => handleMatchClick(match)}
                        className="cursor-pointer"
                      >
                        <MatchCard 
                          match={match}
                          matchType={match.status === 'FINISHED' || match.status === 'FT' ? 'finished' : 
                                  (match.status === 'LIVE' || match.status === 'IN_PLAY' || match.status === 'HT' ? 'live' : 'upcoming')}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Standings sidebar */}
            <div className="md:col-span-1">
              {selectedLeagueId ? (
                <div className="sticky top-20">
                  <StandingsTable 
                    standings={standings || []} 
                    title={`${filters.league || 'League'} Standings`}
                    isLoading={isLoadingStandings}
                  />
                </div>
              ) : (
                <div className="bg-highlight-800 rounded-lg p-6 text-center">
                  <h3 className="text-lg font-medium mb-2 text-white">League Standings</h3>
                  <p className="text-gray-400">Select a specific league to view standings</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-highlight-800 rounded-lg p-6 text-center my-8">
            <p className="text-gray-400">No fixtures found for {format(selectedDate, 'dd MMMM yyyy')}</p>
          </div>
        )}
      </div>

      {/* Match detail popup */}
      {selectedMatch && (
        <MatchDetailPopup
          matchId={selectedMatch.id}
          match={selectedMatch}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
        />
      )}
    </div>
  );
};

export default Fixtures;
