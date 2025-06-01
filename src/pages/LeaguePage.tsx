import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '@/components/Header';
import LeaguePage from '@/components/LeaguePage';
import { highlightlyClient } from '@/integrations/highlightly/client';

const LeaguePageRoute: React.FC = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const [league, setLeague] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeagueDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!leagueId) {
          setError('No league ID provided');
          return;
        }

        console.log(`[LeaguePageRoute] Fetching details for league ${leagueId}`);

        // Try to get league details from the API
        try {
          const leagueDetails = await highlightlyClient.getLeagueById(leagueId);
          console.log('[LeaguePageRoute] League details from API:', leagueDetails);
          console.log('[LeaguePageRoute] League details type:', typeof leagueDetails);
          console.log('[LeaguePageRoute] League details is array:', Array.isArray(leagueDetails));
          if (Array.isArray(leagueDetails)) {
            console.log('[LeaguePageRoute] First item in array:', leagueDetails[0]);
          }
          
          if (leagueDetails) {
            // Handle both direct response and wrapped response
            let leagueData;
            if (Array.isArray(leagueDetails)) {
              // If it's an array, take the first item
              leagueData = leagueDetails[0];
            } else if (leagueDetails.data) {
              // If it's wrapped, extract the data
              if (Array.isArray(leagueDetails.data)) {
                leagueData = leagueDetails.data[0];
              } else {
                leagueData = leagueDetails.data;
              }
            } else {
              // Direct response
              leagueData = leagueDetails;
            }
            
            // Ensure we have the league ID
            if (leagueData && !leagueData.id) {
              leagueData.id = leagueId;
            }
            
            console.log('[LeaguePageRoute] Processed league data:', leagueData);
            setLeague(leagueData);
          } else {
            // Fallback: create league object from URL params
            setLeague({
              id: leagueId,
              name: `League ${leagueId}`,
              logo: null,
              country: null
            });
          }
        } catch (err) {
          console.log('[LeaguePageRoute] Could not fetch league details, using fallback');
          // Fallback: create league object from URL params
          setLeague({
            id: leagueId,
            name: `League ${leagueId}`,
            logo: null,
            country: null
          });
        }
      } catch (err) {
        console.error('[LeaguePageRoute] Error:', err);
        setError('Failed to load league details');
      } finally {
        setLoading(false);
      }
    };

    fetchLeagueDetails();
  }, [leagueId]);

  const handleBack = () => {
    // Go back to the previous page or home
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] text-white">
        <Header />
        <div className="pt-16 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading league details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#111111] text-white">
        <Header />
        <div className="pt-16 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Error</h1>
            <p className="text-gray-400 mb-6">{error}</p>
            <button 
              onClick={handleBack}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="min-h-screen bg-[#111111] text-white">
        <Header />
        <div className="pt-16 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">League Not Found</h1>
            <p className="text-gray-400 mb-6">The requested league could not be found.</p>
            <button 
              onClick={handleBack}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <Header />
      <div className="pt-16">
        <LeaguePage league={league} onBack={handleBack} />
      </div>
    </div>
  );
};

export default LeaguePageRoute;
