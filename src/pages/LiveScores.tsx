
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import LiveMatchesSection from '@/components/LiveMatchesSection';
import UpcomingMatchesSection from '@/components/UpcomingMatchesSection';
import FinishedMatchesSection from '@/components/FinishedMatchesSection';
import EnhancedMatchFilters from '@/components/EnhancedMatchFilters';
import VerificationToggle from '@/components/VerificationToggle';
import { fetchMatches, fetchMatchesByLeague, fetchMatchesByCountry } from '@/services/highlightService';
import { format } from 'date-fns';

const LiveScores = () => {
  const [filters, setFilters] = useState<{
    league?: string;
    country?: string;
    date?: Date;
  }>({});
  
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [filteredData, setFilteredData] = useState<any>(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    const applyFilters = async () => {
      setIsFiltering(true);
      
      try {
        let data;
        
        if (filters.league) {
          data = await fetchMatchesByLeague(filters.league);
        } else if (filters.country) {
          data = await fetchMatchesByCountry(filters.country);
        } else if (filters.date) {
          // Format the date as 'YYYY-MM-DD'
          const formattedDate = format(filters.date, 'yyyy-MM-dd');
          data = await fetchMatches(formattedDate);
        } else {
          data = await fetchMatches();
        }
        
        setFilteredData(data);
        setLastRefresh(new Date());
      } catch (error) {
        console.error("Error applying filters:", error);
        setFilteredData(null);
      } finally {
        setIsFiltering(false);
      }
    };
    
    applyFilters();
    
    // Set up auto-refresh
    const refreshInterval = setInterval(() => {
      applyFilters();
    }, Math.floor(Math.random() * 60000) + 60000); // Refresh between 60-120 seconds
    
    return () => clearInterval(refreshInterval);
  }, [filters]);

  const handleFilterChange = (newFilters: {
    league?: string;
    country?: string;
    date?: Date;
  }) => {
    setFilters(newFilters);
  };

  const handleVerificationToggle = (verified: boolean) => {
    setShowVerifiedOnly(verified);
  };
  
  return (
    <div className="min-h-screen bg-black pt-16 pb-16">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white mt-8">Football Live Scores</h1>
          <div className="text-xs text-gray-400">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
        </div>
        
        <EnhancedMatchFilters onFilterChange={handleFilterChange} />
        
        <VerificationToggle onToggle={handleVerificationToggle} />
        
        {isFiltering ? (
          <div className="flex justify-center items-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FFC30B]"></div>
          </div>
        ) : (
          <>
            <LiveMatchesSection filteredData={filteredData} showVerifiedOnly={showVerifiedOnly} />
            
            <UpcomingMatchesSection filteredData={filteredData} showVerifiedOnly={showVerifiedOnly} />
            
            <FinishedMatchesSection filteredData={filteredData} showVerifiedOnly={showVerifiedOnly} />
          </>
        )}
      </div>
    </div>
  );
};

export default LiveScores;
