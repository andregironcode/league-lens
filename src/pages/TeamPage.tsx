import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Calendar } from 'lucide-react';
import Header from '@/components/Header';
import HighlightCard from '@/components/HighlightCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTeamHighlights, getTeamDetails } from '@/services/highlightService';
import { MatchHighlight, Team, TeamDetails } from '@/types';

const TeamPage = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [highlights, setHighlights] = useState<MatchHighlight[]>([]);
  const [teamDetails, setTeamDetails] = useState<TeamDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("highlights");

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        if (teamId) {
          const [highlightsData, details] = await Promise.all([
            getTeamHighlights(teamId),
            getTeamDetails(teamId)
          ]);
          setHighlights(highlightsData);
          setTeamDetails(details);
        }
      } catch (error) {
        console.error('Error fetching team data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleViewFixtures = () => {
    // Navigate to fixtures tab
    setActiveTab("fixtures");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-20 px-4 sm:px-6">
        <Header />
        <div className="max-w-7xl mx-auto animate-pulse">
          <div className="h-8 bg-highlight-800 rounded w-48 mb-6"></div>
          <div className="h-40 bg-highlight-800 rounded mb-6"></div>
          <div className="h-64 bg-highlight-800 rounded mb-8"></div>
        </div>
      </div>
    );
  }

  if (!teamDetails) {
    return (
      <div className="min-h-screen bg-black pt-20 px-4 sm:px-6">
        <Header />
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-semibold text-white">Team not found</h1>
          <button 
            onClick={handleGoBack}
            className="mt-4 flex items-center mx-auto text-sm font-medium px-4 py-2 rounded-md bg-highlight-800 hover:bg-highlight-700 transition-colors text-white"
          >
            <ArrowLeft size={16} className="mr-2" />
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-16 pb-16">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <button 
          onClick={handleGoBack}
          className="flex items-center mb-6 text-sm font-medium hover:underline transition-colors text-white"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Home
        </button>

        {/* Team Header */}
        <div className="bg-[#222222] rounded-xl p-6 mb-8 flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="w-32 h-32 flex items-center justify-center">
            <img 
              src={teamDetails.team.logo} 
              alt={teamDetails.team.name}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
              }}
            />
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-white mb-2">{teamDetails.team.name}</h1>
            
            <div className="flex flex-col md:flex-row gap-4 mt-4">
              <div className="bg-[#333333] p-3 rounded-lg flex items-center">
                <Trophy className="text-[#FFC30B] mr-2" size={20} />
                <div>
                  <p className="text-gray-400 text-xs">League Position</p>
                  <p className="text-white font-bold">{teamDetails.leagueStanding}</p>
                </div>
              </div>
              
              {teamDetails.europeanCompetition && (
                <div className="bg-[#333333] p-3 rounded-lg flex items-center">
                  <Trophy className="text-[#FFC30B] mr-2" size={20} />
                  <div>
                    <p className="text-gray-400 text-xs">{teamDetails.europeanCompetition}</p>
                    <p className="text-white font-bold">{teamDetails.europeanStanding || 'Group Stage'}</p>
                  </div>
                </div>
              )}
              
              <Button 
                variant="default" 
                className="md:ml-auto"
                onClick={handleViewFixtures}
              >
                <Calendar className="mr-2" size={18} />
                View Fixtures
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="highlights" value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="highlights">Highlights</TabsTrigger>
            <TabsTrigger value="standings">Standings</TabsTrigger>
            <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
          </TabsList>
          
          <TabsContent value="highlights" className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">Latest Highlights</h2>
            {highlights.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {highlights.map(highlight => (
                  <HighlightCard key={highlight.id} highlight={highlight} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-400">
                No highlights available for this team
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="standings">
            <div className="bg-[#222222] rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">League Table</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-white">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="py-3 px-2 text-left">Pos</th>
                      <th className="py-3 px-2 text-left">Team</th>
                      <th className="py-3 px-2 text-center">P</th>
                      <th className="py-3 px-2 text-center">W</th>
                      <th className="py-3 px-2 text-center">D</th>
                      <th className="py-3 px-2 text-center">L</th>
                      <th className="py-3 px-2 text-center">GD</th>
                      <th className="py-3 px-2 text-center">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamDetails.leagueTable.map((row, index) => (
                      <tr 
                        key={index} 
                        className={`border-b border-gray-700 ${row.team.id === teamId ? 'bg-[#FFC30B]/10' : ''}`}
                      >
                        <td className="py-3 px-2">{row.position}</td>
                        <td className="py-3 px-2 flex items-center">
                          <img 
                            src={row.team.logo} 
                            alt={row.team.name} 
                            className="w-6 h-6 mr-2 object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                            }}
                          />
                          <span>{row.team.name}</span>
                        </td>
                        <td className="py-3 px-2 text-center">{row.played}</td>
                        <td className="py-3 px-2 text-center">{row.won}</td>
                        <td className="py-3 px-2 text-center">{row.drawn}</td>
                        <td className="py-3 px-2 text-center">{row.lost}</td>
                        <td className="py-3 px-2 text-center">{row.goalDifference}</td>
                        <td className="py-3 px-2 text-center font-bold">{row.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {teamDetails.europeanCompetition && (
                <div className="mt-8">
                  <h2 className="text-xl font-bold text-white mb-4">{teamDetails.europeanCompetition}</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-white">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="py-3 px-2 text-left">Pos</th>
                          <th className="py-3 px-2 text-left">Team</th>
                          <th className="py-3 px-2 text-center">P</th>
                          <th className="py-3 px-2 text-center">W</th>
                          <th className="py-3 px-2 text-center">D</th>
                          <th className="py-3 px-2 text-center">L</th>
                          <th className="py-3 px-2 text-center">GD</th>
                          <th className="py-3 px-2 text-center">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamDetails.europeanTable.map((row, index) => (
                          <tr 
                            key={index} 
                            className={`border-b border-gray-700 ${row.team.id === teamId ? 'bg-[#FFC30B]/10' : ''}`}
                          >
                            <td className="py-3 px-2">{row.position}</td>
                            <td className="py-3 px-2 flex items-center">
                              <img 
                                src={row.team.logo} 
                                alt={row.team.name} 
                                className="w-6 h-6 mr-2 object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                                }}
                              />
                              <span>{row.team.name}</span>
                            </td>
                            <td className="py-3 px-2 text-center">{row.played}</td>
                            <td className="py-3 px-2 text-center">{row.won}</td>
                            <td className="py-3 px-2 text-center">{row.drawn}</td>
                            <td className="py-3 px-2 text-center">{row.lost}</td>
                            <td className="py-3 px-2 text-center">{row.goalDifference}</td>
                            <td className="py-3 px-2 text-center font-bold">{row.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="fixtures">
            <div className="bg-[#222222] rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Upcoming Fixtures</h2>
              
              {teamDetails.fixtures.length > 0 ? (
                <div className="space-y-4">
                  {teamDetails.fixtures.map((fixture, index) => (
                    <div key={index} className="bg-[#333333] p-4 rounded-lg">
                      <div className="text-gray-400 text-sm mb-2">{fixture.competition}</div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <img 
                            src={fixture.homeTeam.logo} 
                            alt={fixture.homeTeam.name} 
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                            }}
                          />
                          <span className={`ml-2 font-medium ${fixture.homeTeam.id === teamId ? 'text-[#FFC30B]' : 'text-white'}`}>
                            {fixture.homeTeam.name}
                          </span>
                        </div>
                        
                        <span className="text-white px-3 py-1 bg-[#222222] rounded">
                          vs
                        </span>
                        
                        <div className="flex items-center">
                          <span className={`mr-2 font-medium ${fixture.awayTeam.id === teamId ? 'text-[#FFC30B]' : 'text-white'}`}>
                            {fixture.awayTeam.name}
                          </span>
                          <img 
                            src={fixture.awayTeam.logo} 
                            alt={fixture.awayTeam.name} 
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-3 text-sm">
                        <div className="text-gray-400">
                          <Calendar size={14} className="inline mr-1" />
                          {new Date(fixture.date).toLocaleDateString('en-US', {
                            weekday: 'short', day: 'numeric', month: 'short'
                          })}
                        </div>
                        <div className="text-gray-400">
                          {new Date(fixture.date).toLocaleTimeString('en-US', {
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400">
                  No upcoming fixtures available
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TeamPage;
