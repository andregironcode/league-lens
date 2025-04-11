
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { fetchMatches, fetchMatchesByLeague, fetchMatchesByCountry } from '@/services/highlightService';
import { format, addDays, subDays, startOfDay, endOfDay } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import DayNavigation from '@/components/DayNavigation';
import EnhancedMatchFilters from '@/components/EnhancedMatchFilters';
import MatchCard from '@/components/MatchCard';

const Fixtures = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<{
    league?: string;
    country?: string;
  }>({});

  const fetchFixtures = async () => {
    setIsLoading(true);
    
    try {
      let matches;
      
      if (filters.league) {
        matches = await fetchMatchesByLeague(filters.league);
      } else if (filters.country) {
        matches = await fetchMatchesByCountry(filters.country);
      } else {
        matches = await fetchMatches();
      }
      
      // Filter matches for the selected date
      const startDate = startOfDay(selectedDate).toISOString();
      const endDate = endOfDay(selectedDate).toISOString();
      
      const dateFiltered = matches.filter((match: any) => {
        const matchDate = new Date(match.kickoff || match.date);
        return matchDate >= new Date(startDate) && matchDate <= new Date(endDate);
      });
      
      setFixtures(dateFiltered);
    } catch (error) {
      console.error('Failed to fetch fixtures:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFixtures();
  }, [selectedDate, filters]);

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
    setFilters({
      league: newFilters.league,
      country: newFilters.country,
    });
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
        <h1 className="text-3xl font-bold mb-6 text-white mt-8">Fixtures & Results</h1>
        
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
          <div>
            {Object.entries(groupFixturesByLeague(fixtures)).map(([league, matches]) => (
              <div key={league} className="mb-10">
                <h2 className="text-xl font-bold mb-4 text-white">{league}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {matches.map(match => (
                    <MatchCard 
                      key={match.id}
                      match={match}
                      matchType={match.status === 'FINISHED' || match.status === 'FT' ? 'finished' : 
                              (match.status === 'LIVE' || match.status === 'IN_PLAY' || match.status === 'HT' ? 'live' : 'upcoming')}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-highlight-800 rounded-lg p-6 text-center my-8">
            <p className="text-gray-400">No fixtures found for {format(selectedDate, 'dd MMMM yyyy')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Fixtures;
