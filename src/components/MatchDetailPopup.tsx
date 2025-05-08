
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchStatistics, fetchLineups, fetchHighlights } from '@/services/highlightService';
import { ArrowLeft, BarChart4, Shirt, Video } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface MatchDetailPopupProps {
  matchId: string;
  isOpen: boolean;
  onClose: () => void;
  match: any;
}

const MatchDetailPopup = ({ matchId, isOpen, onClose, match }: MatchDetailPopupProps) => {
  const [statistics, setStatistics] = useState<any>(null);
  const [lineups, setLineups] = useState<any>(null);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [loading, setLoading] = useState({
    stats: false,
    lineups: false,
    highlights: false
  });
  const [activeTab, setActiveTab] = useState('stats');

  useEffect(() => {
    if (isOpen && matchId) {
      loadMatchDetails();
    }
  }, [isOpen, matchId]);

  const loadMatchDetails = async () => {
    if (!matchId) return;
    
    // Load statistics
    setLoading(prev => ({ ...prev, stats: true }));
    try {
      const statsData = await fetchStatistics(matchId);
      setStatistics(statsData);
    } catch (error) {
      console.error('Failed to load statistics:', error);
      toast.error('Could not load match statistics');
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
    
    // Load lineups
    setLoading(prev => ({ ...prev, lineups: true }));
    try {
      const lineupsData = await fetchLineups(matchId);
      setLineups(lineupsData);
    } catch (error) {
      console.error('Failed to load lineups:', error);
      toast.error('Could not load match lineups');
    } finally {
      setLoading(prev => ({ ...prev, lineups: false }));
    }
    
    // Load highlights
    setLoading(prev => ({ ...prev, highlights: true }));
    try {
      const highlightsData = await fetchHighlights(matchId);
      setHighlights(highlightsData || []);
    } catch (error) {
      console.error('Failed to load highlights:', error);
    } finally {
      setLoading(prev => ({ ...prev, highlights: false }));
    }
  };

  if (!match) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl bg-black border-highlight-800 text-white">
        <DialogHeader>
          <div className="flex items-center mb-2">
            <button 
              onClick={onClose}
              className="flex items-center text-sm font-medium hover:underline transition-colors text-white"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back
            </button>
          </div>
          <DialogTitle className="text-2xl font-bold text-white flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <img 
                src={match.homeTeam?.logo}
                alt={match.homeTeam?.name}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                }}
              />
              <span className="mx-2">{match.homeTeam?.name}</span>
            </div>
            
            <div className="bg-highlight-800 px-3 py-1 rounded-lg">
              {match.score ? (
                <span>{match.score.home} - {match.score.away}</span>
              ) : (
                <span>vs</span>
              )}
            </div>
            
            <div className="flex items-center">
              <span className="mx-2">{match.awayTeam?.name}</span>
              <img 
                src={match.awayTeam?.logo}
                alt={match.awayTeam?.name}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                }}
              />
            </div>
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            {match.competition?.name} • {new Date(match.date).toLocaleDateString('en-US', {
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric'
            })}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="stats" value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-3 bg-highlight-800 rounded-lg mb-4">
            <TabsTrigger value="stats" className="data-[state=active]:bg-[#FFC30B] data-[state=active]:text-black">
              <BarChart4 className="w-4 h-4 mr-2" />
              Statistics
            </TabsTrigger>
            <TabsTrigger value="lineups" className="data-[state=active]:bg-[#FFC30B] data-[state=active]:text-black">
              <Shirt className="w-4 h-4 mr-2" />
              Lineups
            </TabsTrigger>
            <TabsTrigger value="highlights" className="data-[state=active]:bg-[#FFC30B] data-[state=active]:text-black">
              <Video className="w-4 h-4 mr-2" />
              Highlights
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="stats" className="bg-highlight-800 rounded-lg p-4">
            {loading.stats ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-8 bg-highlight-700 rounded"></div>
                ))}
              </div>
            ) : statistics ? (
              <div className="space-y-6">
                {statistics.stats?.map((stat: any, index: number) => (
                  <div key={index} className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-white">{stat.home}</span>
                      <span className="text-sm font-medium text-center text-white">{stat.name}</span>
                      <span className="text-sm text-white">{stat.away}</span>
                    </div>
                    <div className="w-full h-2 bg-[#191919] rounded-full overflow-hidden">
                      <div className="flex h-full">
                        <div 
                          className="bg-[#FFC30B] h-full" 
                          style={{ 
                            width: `${stat.homePercentage || 50}%` 
                          }}
                        ></div>
                        <div 
                          className="bg-white h-full" 
                          style={{ 
                            width: `${stat.awayPercentage || 50}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-400">
                No statistics available for this match
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="lineups" className="bg-highlight-800 rounded-lg p-4">
            {loading.lineups ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-8 bg-highlight-700 rounded"></div>
                ))}
              </div>
            ) : lineups ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-3 text-white flex items-center">
                    <img 
                      src={match.homeTeam?.logo} 
                      alt={match.homeTeam?.name}
                      className="w-5 h-5 mr-2"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                      }}
                    />
                    {match.homeTeam?.name}
                  </h4>
                  
                  <div className="space-y-1">
                    {lineups.home?.startingXI?.map((player: any, index: number) => (
                      <div key={index} className="bg-[#191919] px-3 py-2 rounded text-sm flex items-center">
                        <span className="w-6 text-gray-400">{player.number}</span>
                        <span className="text-white">{player.name}</span>
                        {player.captain && <span className="ml-1 text-[#FFC30B] text-xs">(C)</span>}
                      </div>
                    ))}
                    
                    {lineups.home?.substitutes?.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-sm text-gray-400 mb-2">Substitutes</h5>
                        {lineups.home.substitutes.map((player: any, index: number) => (
                          <div key={index} className="bg-[#191919] px-3 py-2 rounded text-sm flex items-center opacity-75">
                            <span className="w-6 text-gray-400">{player.number}</span>
                            <span className="text-white">{player.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3 text-white flex items-center">
                    <img 
                      src={match.awayTeam?.logo} 
                      alt={match.awayTeam?.name}
                      className="w-5 h-5 mr-2"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                      }}
                    />
                    {match.awayTeam?.name}
                  </h4>
                  
                  <div className="space-y-1">
                    {lineups.away?.startingXI?.map((player: any, index: number) => (
                      <div key={index} className="bg-[#191919] px-3 py-2 rounded text-sm flex items-center">
                        <span className="w-6 text-gray-400">{player.number}</span>
                        <span className="text-white">{player.name}</span>
                        {player.captain && <span className="ml-1 text-[#FFC30B] text-xs">(C)</span>}
                      </div>
                    ))}
                    
                    {lineups.away?.substitutes?.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-sm text-gray-400 mb-2">Substitutes</h5>
                        {lineups.away.substitutes.map((player: any, index: number) => (
                          <div key={index} className="bg-[#191919] px-3 py-2 rounded text-sm flex items-center opacity-75">
                            <span className="w-6 text-gray-400">{player.number}</span>
                            <span className="text-white">{player.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-400">
                No lineup information available for this match
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="highlights" className="bg-highlight-800 rounded-lg p-4">
            {loading.highlights ? (
              <div className="animate-pulse space-y-4">
                <div className="h-40 bg-highlight-700 rounded"></div>
              </div>
            ) : highlights.length > 0 ? (
              <div className="space-y-4">
                {highlights.map((highlight, index) => (
                  <div key={index} className="relative">
                    {highlight.embedUrl ? (
                      <div className="aspect-video rounded-lg overflow-hidden">
                        <iframe
                          className="w-full h-full"
                          src={highlight.embedUrl}
                          title={highlight.title || `Match Highlight ${index + 1}`}
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        ></iframe>
                      </div>
                    ) : highlight.thumbnailUrl ? (
                      <div 
                        className="aspect-video rounded-lg bg-cover bg-center flex items-center justify-center"
                        style={{ backgroundImage: `url(${highlight.thumbnailUrl})` }}
                      >
                        <div className="bg-black bg-opacity-50 p-3 rounded-full">
                          <Video className="h-8 w-8 text-[#FFC30B]" />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#191919] aspect-video rounded-lg flex items-center justify-center">
                        <Video className="h-12 w-12 text-[#FFC30B] opacity-50" />
                      </div>
                    )}
                    <h5 className="text-sm font-medium mt-2">{highlight.title || `Match Highlight ${index + 1}`}</h5>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-400">
                No highlights available for this match yet
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default MatchDetailPopup;
