import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { highlightlyClient } from '@/integrations/highlightly/client';
import { LeagueResponseItem } from '@/types';
import Header from '@/components/Header';

const LeaguesPage: React.FC = () => {
  const [leaguesByCountry, setLeaguesByCountry] = useState<Record<string, LeagueResponseItem[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        setLoading(true);
        const response = await highlightlyClient.getLeagues();
        
        if (response && response.data) {
          const groupedLeagues = response.data.reduce((acc: Record<string, LeagueResponseItem[]>, league: LeagueResponseItem) => {
            const countryName = league.country.name || 'International';
            if (!acc[countryName]) {
              acc[countryName] = [];
            }
            acc[countryName].push(league);
            return acc;
          }, {});
          setLeaguesByCountry(groupedLeagues);
        }
      } catch (err) {
        setError('Failed to load leagues.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeagues();
  }, []);

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <Header />
      <main className="flex-1 pb-10 pt-24 max-w-7xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-white mb-8">All Leagues & Tournaments</h1>
        
        {loading && <p>Loading leagues...</p>}
        {error && <p className="text-red-500">{error}</p>}
        
        {!loading && !error && (
          <div className="space-y-8">
            {Object.entries(leaguesByCountry).sort(([a], [b]) => a.localeCompare(b)).map(([country, leagues]) => (
              <div key={country}>
                <h2 className="text-2xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">{country}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {leagues.map(({ league }) => (
                    <Link to={`/league/${league.id}`} key={league.id} className="bg-[#222222] p-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-4">
                      <img src={league.logo} alt={league.name} className="w-10 h-10" />
                      <span className="font-medium">{league.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default LeaguesPage; 