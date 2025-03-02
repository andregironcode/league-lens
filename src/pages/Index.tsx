
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import HeroCarousel from '@/components/HeroCarousel';
import LeagueSection from '@/components/LeagueSection';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { 
  getRecommendedHighlightsWithFallback, 
  getLeagueHighlightsWithFallback,
  forceRetryAPI,
  hasApiToken,
  isValidTokenFormat
} from '@/services/fallbackService';
import { MatchHighlight, League } from '@/types';
import { AlertCircle, RefreshCw, Info, AlertTriangle, HelpCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Index = () => {
  const [recommendedHighlights, setRecommendedHighlights] = useState<MatchHighlight[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState({
    recommended: true,
    leagues: true
  });
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiStatus, setApiStatus] = useState<'live' | 'demo' | 'checking'>('checking');
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  const fetchData = async () => {
    try {
      setIsRefreshing(true);
      
      console.log('Fetching recommended highlights...');
      const recommendedData = await getRecommendedHighlightsWithFallback();
      console.log('Received recommended highlights:', recommendedData.length);
      setRecommendedHighlights(recommendedData);
      setLoading(prev => ({ ...prev, recommended: false }));

      console.log('Fetching league highlights...');
      const leaguesData = await getLeagueHighlightsWithFallback();
      console.log('Received league highlights:', leaguesData.length);
      
      // Sort leagues by number of highlights (most highlights first)
      const sortedLeagues = [...leaguesData].sort(
        (a, b) => b.highlights.length - a.highlights.length
      );
      
      setLeagues(sortedLeagues);
      setLoading(prev => ({ ...prev, leagues: false }));
      setError(null);
      
      // Check if we're using live data or demo data
      // More robust detection of live data
      const isUsingLiveData = recommendedData.some(h => 
        h.title.includes('2025') || 
        h.title.includes('2024') ||
        new Date(h.date).getTime() > new Date('2023-06-01').getTime()
      );
      
      setApiStatus(isUsingLiveData ? 'live' : 'demo');
      
    } catch (error) {
      console.error('Error fetching highlights:', error);
      setError('Failed to load highlights. Please refresh the page.');
      setLoading({ recommended: false, leagues: false });
      setApiStatus('demo');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Listen for API status changes
    const apiStatusChangeHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('API status changed:', customEvent.detail);
      
      if (customEvent.detail?.status === 'connected') {
        setApiStatus('live');
      } else if (customEvent.detail?.status === 'error') {
        setApiStatus('demo');
      }
      
      // Only refresh data if there was a status change to avoid duplicate fetches
      if (customEvent.detail?.refresh !== false) {
        fetchData();
      }
    };
    
    // Listen for force refresh events
    const forceRefreshHandler = () => {
      handleRefresh();
    };
    
    // Add listeners
    window.addEventListener('scorebat-api-status-change', apiStatusChangeHandler);
    window.addEventListener('scorebat-force-refresh', forceRefreshHandler);
    window.addEventListener('scorebat-token-updated', apiStatusChangeHandler);
    
    return () => {
      // Clean up listeners
      window.removeEventListener('scorebat-api-status-change', apiStatusChangeHandler);
      window.removeEventListener('scorebat-force-refresh', forceRefreshHandler);
      window.removeEventListener('scorebat-token-updated', apiStatusChangeHandler);
    };
  }, []);

  const handleRefresh = () => {
    setLoading({ recommended: true, leagues: true });
    setApiStatus('checking');
    // Force a retry of the API even if we're in cooldown
    forceRetryAPI();
    fetchData();
  };

  const renderSkeleton = (count: number, featured = false) => {
    return Array(count)
      .fill(0)
      .map((_, i) => (
        <div
          key={i}
          className={`highlight-card ${
            featured ? 'aspect-video md:aspect-[16/9]' : 'aspect-video'
          }`}
        >
          <div className="absolute inset-0 bg-highlight-200 animate-image-shimmer bg-shimmer bg-[length:200%_100%]"></div>
        </div>
      ));
  };

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <Header />
      <Toaster position="top-center" />
      
      <main className="pt-16 pb-10">
        {/* Action bar with refresh button and API status */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className={`h-2 w-2 rounded-full mr-2 ${
              apiStatus === 'live' ? 'bg-green-500' : 
              apiStatus === 'demo' ? 'bg-amber-500' : 'bg-gray-500'
            }`}></div>
            <span className="text-xs text-gray-400">
              {apiStatus === 'live' ? 'Live API' : 
               apiStatus === 'demo' ? 'Demo Data' : 'Checking API...'}
            </span>
            
            {/* API status indicator with more info */}
            {apiStatus === 'demo' && (
              <div className="ml-2 flex items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        {!hasApiToken() ? (
                          <AlertTriangle size={14} className="text-amber-500" />
                        ) : !isValidTokenFormat() ? (
                          <AlertCircle size={14} className="text-amber-500" />
                        ) : (
                          <Info size={14} className="text-amber-500" />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {!hasApiToken() 
                        ? "No Scorebat API token configured. Visit Settings to set up your API token."
                        : !isValidTokenFormat() 
                        ? "Your Scorebat API token format appears invalid. Check your token in Settings."
                        : "Using demo data because the Scorebat API connection failed. Try refreshing or check your token."
                      }
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <Button
                  variant="link"
                  size="sm"
                  className="text-amber-500 p-0 h-auto ml-1"
                  onClick={() => window.location.href = '/settings'}
                >
                  Fix
                </Button>
              </div>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-gray-400 p-0 h-auto ml-3"
                    onClick={() => setShowDebugInfo(!showDebugInfo)}
                  >
                    <HelpCircle size={14} className="mr-1" />
                    API Help
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Show help for configuring the Scorebat API
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm" 
            className="text-white bg-highlight-800 hover:bg-highlight-700"
            disabled={isRefreshing}
          >
            <RefreshCw size={16} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Debug/Help panel */}
        {showDebugInfo && (
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 mb-6">
            <Card className="bg-highlight-900/50 border-highlight-700">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <HelpCircle className="mr-2 h-5 w-5 text-highlight-400" />
                  Scorebat API Setup Guide
                </CardTitle>
                <CardDescription className="text-gray-400">
                  How to get your website updated with new football matches
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-2">
                  <h3 className="font-medium text-white">1. Get a Scorebat API Key</h3>
                  <p className="text-gray-300">
                    You need to register for a Scorebat API key from their official site. 
                    The Hobby plan ($10/month) gives you access to their Video API v3.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-highlight-800 text-white hover:bg-highlight-700"
                    onClick={() => window.open('https://www.scorebat.com/api/', '_blank')}
                  >
                    Visit Scorebat API <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium text-white">2. Add Your API Key</h3>
                  <p className="text-gray-300">
                    Go to Settings and add your Scorebat API token to enable live data.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-highlight-800 text-white hover:bg-highlight-700"
                    onClick={() => window.location.href = '/settings'}
                  >
                    Go to Settings
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium text-white">3. Test API Connection</h3>
                  <p className="text-gray-300">
                    After adding your token, click the Refresh button above to check if your API connection works.
                    If it works, you'll see "Live API" indicator turn green and the latest football highlights will appear.
                  </p>
                </div>
                
                <div className="p-3 bg-amber-950/30 border border-amber-900/50 rounded-md">
                  <p className="text-amber-200 text-xs">
                    <strong>Note:</strong> Currently you are seeing {apiStatus === 'live' ? 'live data' : 'demo data'}.
                    {apiStatus !== 'live' && " To see real football matches, follow the steps above to connect your Scorebat API."}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="border-t border-highlight-800 pt-4 flex justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDebugInfo(false)}
                >
                  Hide Guide
                </Button>
                
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="bg-highlight-500 hover:bg-highlight-600"
                >
                  <RefreshCw size={16} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh Now'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
        
        {/* Hero section with recommended highlights */}
        <section className="mb-12">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
            {loading.recommended ? (
              <div className="w-full h-[50vh] max-h-[550px] bg-highlight-800 rounded-lg animate-pulse"></div>
            ) : error ? (
              <div className="w-full h-[30vh] flex flex-col items-center justify-center bg-highlight-800/50 rounded-lg">
                <AlertCircle size={32} className="text-red-500 mb-4" />
                <p className="text-white text-xl mb-2">Error Loading Highlights</p>
                <p className="text-gray-400 mb-6">{error}</p>
                <Button onClick={handleRefresh} variant="default">
                  <RefreshCw size={16} className="mr-2" /> Try Again
                </Button>
              </div>
            ) : (
              <HeroCarousel highlights={recommendedHighlights} />
            )}
          </div>
        </section>

        {/* League sections */}
        <section id="leagues" className="mb-16">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
            {loading.leagues 
              ? (
                <div className="space-y-10">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-8 bg-highlight-200 rounded w-48 mb-6"></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {renderSkeleton(3)}
                      </div>
                    </div>
                  ))}
                </div>
              )
              : leagues.length > 0 ? (
                leagues.map(league => (
                  <LeagueSection key={league.id} league={league} />
                ))
              ) : (
                <div className="text-center py-20">
                  <p className="text-xl text-gray-400">No leagues available at the moment.</p>
                  <p className="text-sm text-gray-500 mt-2">Try refreshing the page or check back later.</p>
                  <Button onClick={handleRefresh} variant="outline" className="mt-4">
                    <RefreshCw size={16} className="mr-2" /> Refresh
                  </Button>
                </div>
              )
            }
          </div>
        </section>
      </main>

      <footer className="bg-[#222222] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Score90. All rights reserved.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              All videos are sourced from official channels and we do not host any content.
              Highlights powered by Scorebat API (Developer - Hobby Plan).
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
