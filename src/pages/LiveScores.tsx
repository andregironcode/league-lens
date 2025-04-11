
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import LiveMatchesSection from '@/components/LiveMatchesSection';
import UpcomingMatchesSection from '@/components/UpcomingMatchesSection';
import FinishedMatchesSection from '@/components/FinishedMatchesSection';
import MatchFilters from '@/components/MatchFilters';
import VerificationToggle from '@/components/VerificationToggle';

const LiveScores = () => {
  const [filters, setFilters] = useState<{
    league?: string;
    country?: string;
    date?: Date;
  }>({});
  
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

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
        <h1 className="text-3xl font-bold mb-6 text-white mt-8">Football Live Scores</h1>
        
        <MatchFilters onFilterChange={handleFilterChange} />
        
        <VerificationToggle onToggle={handleVerificationToggle} />
        
        <LiveMatchesSection />
        
        <UpcomingMatchesSection />
        
        <FinishedMatchesSection />
      </div>
    </div>
  );
};

export default LiveScores;
