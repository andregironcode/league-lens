import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Eye, Share2, Shirt, BarChart4, MapPin, Bell, Target, RefreshCw, Square, Goal, User, UserX, AlertTriangle } from 'lucide-react';
import Header from '@/components/Header';
import { getMatchById, getActiveService } from '@/services/serviceAdapter';
import { highlightlyClient } from '@/integrations/highlightly/client';
import { MatchHighlight, EnhancedMatchHighlight, Player, Match } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { notificationService } from '@/services/notificationService';

// Add match actions type and mock data
interface MatchAction {
  id: string;
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'own_goal' | 'penalty' | 'var';
  team: 'home' | 'away';
  player: string;
  playerOut?: string; // For substitutions
  description: string;
}

// Mock match actions data
const getMatchActions = (homeTeam: string, awayTeam: string): MatchAction[] => {
  return [
    {
      id: '1',
      minute: 12,
      type: 'goal' as const,
      team: 'home' as const,
      player: 'Gabriel Jesus',
      description: 'Right-footed shot from the centre of the box'
    },
    {
      id: '2', 
      minute: 23,
      type: 'yellow_card' as const,
      team: 'away' as const,
      player: 'Casemiro',
      description: 'Unsporting behaviour'
    },
    {
      id: '3',
      minute: 34,
      type: 'goal' as const,
      team: 'away' as const, 
      player: 'Marcus Rashford',
      description: 'Left-footed shot from outside the box'
    },
    {
      id: '4',
      minute: 45,
      type: 'yellow_card' as const,
      team: 'home' as const,
      player: 'Thomas Partey',
      description: 'Foul'
    },
    {
      id: '5',
      minute: 67,
      type: 'substitution' as const,
      team: 'home' as const,
      player: 'Eddie Nketiah',
      playerOut: 'Gabriel Jesus',
      description: 'Tactical change'
    },
    {
      id: '6',
      minute: 73,
      type: 'goal' as const,
      team: 'home' as const,
      player: 'Martin Ødegaard',
      description: 'Penalty kick'
    },
    {
      id: '7',
      minute: 78,
      type: 'substitution' as const,
      team: 'away' as const,
      player: 'Antony',
      playerOut: 'Marcus Rashford',
      description: 'Fresh legs'
    },
    {
      id: '8',
      minute: 85,
      type: 'yellow_card' as const,
      team: 'away' as const,
      player: 'Bruno Fernandes',
      description: 'Dissent'
    },
    {
      id: '9',
      minute: 90,
      type: 'goal' as const,
      team: 'home' as const,
      player: 'Bukayo Saka',
      description: 'Counter-attack finish'
    }
  ].sort((a, b) => b.minute - a.minute); // Reverse sort: later actions first (top), earlier last (bottom)
};

// Compact Timeline component for inside the score container
const CompactMatchTimeline: React.FC<{ homeTeam: any; awayTeam: any }> = ({ homeTeam, awayTeam }) => {
  const actions = getMatchActions(homeTeam.name, awayTeam.name);
  
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'goal':
      case 'own_goal':
      case 'penalty':
        return <Goal className="w-3 h-3" />;
      case 'yellow_card':
        return <Square className="w-3 h-3 text-yellow-500" />;
      case 'red_card':
        return <Square className="w-3 h-3 text-red-500" />;
      case 'substitution':
        return <RefreshCw className="w-3 h-3" />;
      default:
        return <Target className="w-3 h-3" />;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'yellow_card':
        return 'bg-yellow-500';
      case 'red_card':
        return 'bg-red-500';
      default:
        return 'bg-gray-600'; // All other actions use neutral gray
    }
  };

  return (
    <div className="relative max-h-48 overflow-y-auto px-8">
      {/* Compact actions */}
      <div className="space-y-3 py-2 relative">
        {/* Compact timeline line with fade effects - positioned to span all actions */}
        <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 top-0 bottom-0">
          <div 
            className="w-full h-full relative"
            style={{ backgroundColor: '#1F1F1F' }}
          >
            {/* Top fade */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black to-transparent"></div>
            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black to-transparent"></div>
          </div>
        </div>
        
        {actions.map((action, index) => (
          <div key={action.id} className="relative">
            {/* Compact action card */}
            <div className={`flex ${action.team === 'home' ? 'justify-start' : 'justify-end'}`}>
              <div className={`w-56 ${action.team === 'home' ? 'mr-20 pr-4' : 'ml-20 pl-4'}`}>
                <div className={`rounded-full px-4 py-2 ${action.team === 'home' ? 'text-right' : ''}`} style={{ backgroundColor: '#1F1F1F' }}>
                  <div className={`flex items-center gap-2 text-xs ${action.team === 'home' ? 'justify-end' : ''}`}>
                    {action.team === 'home' ? (
                      <>
                        <div className="text-white flex items-center gap-1">
                          <span className="font-medium">{action.player}</span>
                          {getActionIcon(action.type)}
                        </div>
                        <span className="text-xs font-bold text-white">
                          {action.minute}'
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-bold text-white">
                          {action.minute}'
                        </span>
                        <div className="text-white flex items-center gap-1">
                          {getActionIcon(action.type)}
                          <span className="font-medium">{action.player}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Timeline component
const MatchTimeline: React.FC<{ homeTeam: any; awayTeam: any }> = ({ homeTeam, awayTeam }) => {
  const actions = getMatchActions(homeTeam.name, awayTeam.name);
  
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'goal':
      case 'own_goal':
      case 'penalty':
        return <Goal className="w-4 h-4" />;
      case 'yellow_card':
        return <Square className="w-4 h-4 text-yellow-500" />;
      case 'red_card':
        return <Square className="w-4 h-4 text-red-500" />;
      case 'substitution':
        return <RefreshCw className="w-4 h-4" />;
      case 'var':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'yellow_card':
        return 'bg-yellow-500';
      case 'red_card':
        return 'bg-red-500';
      default:
        return 'bg-gray-600'; // All other actions use neutral gray
    }
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'goal':
        return 'Goal';
      case 'own_goal':
        return 'Own Goal';
      case 'penalty':
        return 'Penalty';
      case 'yellow_card':
        return 'Yellow Card';
      case 'red_card':
        return 'Red Card';
      case 'substitution':
        return 'Substitution';
      case 'var':
        return 'VAR';
      default:
        return 'Event';
    }
  };

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gray-700 h-full"></div>
      
      {/* Match start indicator */}
      <div className="relative flex justify-center mb-8">
        <div className="bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-medium border border-gray-600">
          <Clock className="w-4 h-4 inline mr-2" />
          Kick Off
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-6">
        {actions.map((action, index) => (
          <div key={action.id} className="relative">
            {/* Timeline dot */}
            <div className={`absolute left-1/2 transform -translate-x-1/2 w-4 h-4 ${getActionColor(action.type)} rounded-full border-2 border-gray-800 z-10`}></div>
            
            {/* Action card */}
            <div className={`flex ${action.team === 'home' ? 'justify-start pr-1/2' : 'justify-end pl-1/2'}`}>
              <div className={`max-w-sm ${action.team === 'home' ? 'mr-8' : 'ml-8'}`}>
                <div className={`bg-gray-800/90 rounded-lg p-4 border border-gray-700/50 ${action.team === 'away' ? 'text-right' : ''}`}>
                  {/* Minute and action type */}
                  <div className={`flex items-center gap-2 mb-2 ${action.team === 'away' ? 'justify-end' : ''}`}>
                    <div className={`px-2 py-1 rounded text-xs font-bold text-white ${getActionColor(action.type)}`}>
                      {action.minute}'
                    </div>
                    <div className={`flex items-center gap-1 text-white text-sm font-medium ${getActionColor(action.type)} px-2 py-1 rounded`}>
                      {getActionIcon(action.type)}
                      {getActionLabel(action.type)}
                    </div>
                  </div>
                  
                  {/* Player info */}
                  <div className="text-white font-semibold text-sm mb-1">
                    {action.player}
                    {action.playerOut && (
                      <span className="text-gray-400 text-xs ml-2">
                        ↔ {action.playerOut}
                      </span>
                    )}
                  </div>
                  
                  {/* Description */}
                  <div className="text-gray-400 text-xs">
                    {action.description}
                  </div>
                  
                  {/* Team indicator */}
                  <div className={`flex items-center gap-2 mt-2 ${action.team === 'away' ? 'justify-end' : ''}`}>
                    <img 
                      src={action.team === 'home' ? homeTeam.logo : awayTeam.logo} 
                      alt={action.team === 'home' ? homeTeam.name : awayTeam.name}
                      className="w-4 h-4 object-contain" 
                    />
                    <span className="text-gray-500 text-xs">
                      {action.team === 'home' ? homeTeam.name : awayTeam.name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full-time indicator */}
      <div className="relative flex justify-center mt-8">
        <div className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium">
          <Square className="w-4 h-4 inline mr-2" />
          Full Time
        </div>
      </div>
    </div>
  );
};

const FullTimeSummary = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<EnhancedMatchHighlight | null>(null);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [formattedDate, setFormattedDate] = useState('');
  const [exactDate, setExactDate] = useState('');
  const [summaryEnabled, setSummaryEnabled] = useState(false);
  
  // State for consistent mock data
  const [homeTeamForm, setHomeTeamForm] = useState<any>(null);
  const [awayTeamForm, setAwayTeamForm] = useState<any>(null);
  const [homeLeaguePosition, setHomeLeaguePosition] = useState<any>(null);
  const [awayLeaguePosition, setAwayLeaguePosition] = useState<any>(null);
  const [headToHeadData, setHeadToHeadData] = useState<any[]>([]);
  const [impressiveStats, setImpressiveStats] = useState<any[]>([]);
  
  // State for real API data
  const [realLeagueStandings, setRealLeagueStandings] = useState<any>(null);
  const [realHomeTeamStats, setRealHomeTeamStats] = useState<any>(null);
  const [realAwayTeamStats, setRealAwayTeamStats] = useState<any>(null);
  const [realHeadToHead, setRealHeadToHead] = useState<any>(null);
  const [apiDataLoading, setApiDataLoading] = useState(false);
  
  const { toast } = useToast();

  // Check if Full-time summary is enabled
  useEffect(() => {
    const fullTimeConfig = notificationService.getSummaryConfig('full_time');
    setSummaryEnabled(fullTimeConfig?.enabled || false);
  }, []);

  useEffect(() => {
    const fetchMatch = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        console.log(`[FullTimeSummary] Fetching match with ID: ${id}`);
        
        const matchData = await getMatchById(id) as EnhancedMatchHighlight;
        
        if (matchData) {
          setMatch(matchData);
          console.log(`[FullTimeSummary] Match loaded:`, matchData);
          
          // Set formatted dates
          const date = new Date(matchData.date);
          setFormattedDate(formatDistanceToNow(date, { addSuffix: true }));
          setExactDate(date.toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long', 
            day: 'numeric'
          }));
        } else {
          console.error('[FullTimeSummary] No match data found');
          navigate('/');
        }
      } catch (error) {
        console.error('[FullTimeSummary] Error fetching match:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
  }, [id, navigate]);

  // Get match season from match date
  const getMatchSeason = () => {
    if (!match) return new Date().getFullYear().toString();
    
    const matchDate = new Date(match.date);
    const matchYear = matchDate.getFullYear();
    const matchMonth = matchDate.getMonth();
    
    // European football season runs from August to May
    // If match is between August and December, it's the current year season
    // If match is between January and May, it's the previous year season
    if (matchMonth >= 7) { // August or later
      return matchYear.toString();
    } else { // Before August
      return (matchYear - 1).toString(); 
    }
  };

  const matchSeason = getMatchSeason();

  // Check if this appears to be a pre-season match
  const isPreSeasonMatch = () => {
    if (!match) return false;
    
    const matchDate = new Date(match.date);
    const matchMonth = matchDate.getMonth();
    const matchYear = matchDate.getFullYear();
    
    // Pre-season is typically June-July, sometimes early August
    const isPreSeasonTime = matchMonth >= 5 && matchMonth <= 7; // June, July, August
    
    // Also check if it's very early in the season (first few weeks of official season)
    const isEarlySeason = matchMonth === 7 && matchDate.getDate() < 15; // Early August
    
    return isPreSeasonTime || isEarlySeason;
  };

  const getNoDataMessage = (dataType: 'form' | 'standings' | 'h2h') => {
    const serviceMessages = {
      highlightly: {
        form: "Team form data not available in the Highlightly API for this match.",
        standings: "League standings not available in the Highlightly API for this competition.",
        h2h: "Head-to-head history not available in the Highlightly API for these teams."
      },
      supabase: {
        form: "Team form data not available in our database for this match.",
        standings: "League standings not available in our database for this competition.", 
        h2h: "Head-to-head history not available in our database for these teams."
      }
    };
    
    const service = getActiveService();
    return serviceMessages[service]?.[dataType] || `${dataType} data not available.`;
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleShare = () => {
    if (navigator.share && match) {
      navigator.share({
        title: `${match.homeTeam.name} vs ${match.awayTeam.name} - Full Time Summary`,
        text: `Final result: ${match.homeTeam.name} ${match.score?.home || 0} - ${match.score?.away || 0} ${match.awayTeam.name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Match summary link copied to clipboard",
      });
    }
  };

  const toggleSummaryNotification = () => {
    notificationService.toggleSummaryConfig('full_time');
    const newState = !summaryEnabled;
    setSummaryEnabled(newState);
    
    toast({
      title: newState ? "Full-time Summary Enabled" : "Full-time Summary Disabled",
      description: newState 
        ? "You'll receive notifications when matches finish" 
        : "Full-time notifications have been turned off",
    });
  };

  // Get result text for display
  const getMatchResult = () => {
    if (!match?.score) return 'Match Finished';
    
    const homeScore = match.score.home || 0;
    const awayScore = match.score.away || 0;
    
    if (homeScore > awayScore) {
      return `${match.homeTeam.name} Wins!`;
    } else if (awayScore > homeScore) {
      return `${match.awayTeam.name} Wins!`;
    } else {
      return 'Match Ends in Draw!';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#FFC30B] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white">Loading Full-time Summary...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white mb-4">Match not found</p>
          <button 
            onClick={() => navigate('/')} 
            className="bg-[#FFC30B] text-black px-4 py-2 rounded font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111]">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleGoBack}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
            disabled={navigating}
          >
            <ArrowLeft className="mr-2" size={20} />
            Back
          </button>
          
          <h1 className="text-2xl font-bold text-white">Full-time Summary</h1>
          
          <button
            onClick={handleShare}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <Share2 className="mr-2" size={20} />
            Share
          </button>
        </div>

        {/* Full-time Summary Content */}
        <div className="mb-8 w-full space-y-6">
          {/* Teams and Final Result - Main Box */}
          <div 
            className="rounded-xl overflow-hidden p-6 relative"
            style={{
              background: 'linear-gradient(15deg, #000000 0%, #000000 60%, #1F1F1F 100%)',
              border: '1px solid #1B1B1B',
              minHeight: '200px'
            }}
          >
            {/* Country and League/Tournament Info - Top Left */}
            <div className="absolute top-4 left-4 flex items-center gap-3">
              <img
                src={match.competition.logo}
                alt={match.competition.name}
                className="w-5 h-5 object-contain rounded-full bg-white p-0.5"
                style={{ minWidth: '20px', minHeight: '20px' }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{match.competition.name}</div>
                <div className="text-xs text-gray-400">Final Result</div>
              </div>
            </div>

            {/* Summary Toggle - Top Right */}
            <div className="absolute top-4 right-4">
              <button
                onClick={toggleSummaryNotification}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-transparent ${
                  summaryEnabled ? 'bg-[#FFC30B]' : 'bg-black/30 backdrop-blur-sm border border-white/20'
                }`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center transform rounded-full bg-white transition-transform shadow-sm ${
                    summaryEnabled ? 'translate-x-9' : 'translate-x-1'
                  }`}
                >
                  <Bell 
                    className={`h-3 w-3 ${summaryEnabled ? 'text-[#FFC30B]' : 'text-gray-400'}`}
                  />
                </span>
              </button>
            </div>

            {/* Teams Section - Centered */}
            <div className="flex items-center justify-center mt-16 mb-6">
              {/* Home Team */}
              <div className="text-center flex-1">
                <img 
                  src={match.homeTeam.logo} 
                  alt={match.homeTeam.name}
                  className="w-20 h-20 object-contain mx-auto mb-3" 
                />
                <div className="text-white font-medium text-lg">{match.homeTeam.name}</div>
              </div>

              {/* Final Score and Result - Centered */}
              <div className="text-center px-8">
                <div className="text-base font-bold mb-4" style={{ color: '#FF4C4C' }}>
                  FULL TIME
                </div>
                <div className="text-white text-6xl font-bold mb-2">
                  {match.score?.home || 0} - {match.score?.away || 0}
                </div>
                <div className="text-gray-400 text-sm mb-3">FINAL SCORE</div>
                <div className="text-yellow-400 text-lg font-semibold mb-2">
                  {getMatchResult()}
                </div>
              </div>

              {/* Away Team */}
              <div className="text-center flex-1">
                <img 
                  src={match.awayTeam.logo} 
                  alt={match.awayTeam.name}
                  className="w-20 h-20 object-contain mx-auto mb-3" 
                />
                <div className="text-white font-medium text-lg">{match.awayTeam.name}</div>
              </div>
            </div>

            {/* Match Date - Bottom */}
            <div className="text-center text-gray-400 text-sm">
              <Clock size={14} className="inline mr-1" />
              {new Date(match.date).toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long', 
                day: 'numeric'
              })} • {new Date(match.date).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: false 
              })}
            </div>

            {/* Match Timeline - Below everything but in same container */}
            <div className="mt-8 pt-6 border-t border-gray-700/30">
              <div className="max-w-lg mx-auto relative">
                {/* Fade overlay for top */}
                <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none"></div>
                
                <CompactMatchTimeline homeTeam={match.homeTeam} awayTeam={match.awayTeam} />
                
                {/* Fade overlay for bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none"></div>
              </div>
            </div>
          </div>

          {/* League Standings */}
          <div 
            className="rounded-xl p-6 border overflow-hidden"
            style={{
              background: '#000000',
              border: '1px solid #1B1B1B'
            }}
          >
            <h4 className="text-lg font-semibold mb-4 text-center text-white">LEAGUE STANDINGS</h4>
            
            {apiDataLoading ? (
              <div className="text-center text-gray-400 py-8">
                <div className="animate-spin w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                {getActiveService() === 'highlightly' ? 'Loading real standings from Highlightly API...' : 'Loading standings...'}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {/* Home Team Position */}
                  {homeLeaguePosition ? (
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-400">
                        {homeLeaguePosition.position}
                      </div>
                      <div className="text-sm text-gray-400">Position</div>
                      <div className="text-lg font-semibold text-white mt-2">
                        {match.homeTeam.name}
                      </div>
                      <div className="text-sm text-gray-400">
                        {homeLeaguePosition.points} pts • {homeLeaguePosition.played} games
                      </div>
                      <div className="flex justify-center space-x-1 mt-2">
                        {(homeLeaguePosition.form || []).map((result: string, idx: number) => (
                          <div key={idx} className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                            result === 'W' ? 'bg-green-500 text-white' : 
                            result === 'L' ? 'bg-red-500 text-white' : 'bg-gray-500 text-white'
                          }`}>
                            {result}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <div className="text-gray-400 text-sm">
                        <div className="mb-2">📊</div>
                        <div className="text-white font-medium text-sm mb-1">{match.homeTeam.name}</div>
                        <div className="text-xs">
                          {isPreSeasonMatch() 
                            ? "Season hasn't started yet" 
                            : "No standings data available"}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Away Team Position */}
                  {awayLeaguePosition ? (
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-400">
                        {awayLeaguePosition.position}
                      </div>
                      <div className="text-sm text-gray-400">Position</div>
                      <div className="text-lg font-semibold text-white mt-2">
                        {match.awayTeam.name}
                      </div>
                      <div className="text-sm text-gray-400">
                        {awayLeaguePosition.points} pts • {awayLeaguePosition.played} games
                      </div>
                      <div className="flex justify-center space-x-1 mt-2">
                        {(awayLeaguePosition.form || []).map((result: string, idx: number) => (
                          <div key={idx} className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                            result === 'W' ? 'bg-green-500 text-white' : 
                            result === 'L' ? 'bg-red-500 text-white' : 'bg-gray-500 text-white'
                          }`}>
                            {result}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <div className="text-gray-400 text-sm">
                        <div className="mb-2">📊</div>
                        <div className="text-white font-medium text-sm mb-1">{match.awayTeam.name}</div>
                        <div className="text-xs">
                          {isPreSeasonMatch() 
                            ? "Season hasn't started yet" 
                            : "No standings data available"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Show comprehensive empty state if neither team has standings */}
                {!homeLeaguePosition && !awayLeaguePosition && (
                  <div className="text-center py-4 mt-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                    <div className="text-gray-400 text-sm">
                      <div className="mb-2">📋</div>
                      <p className="text-white font-medium text-sm mb-2">League Standings Unavailable</p>
                      <p className="text-xs px-4">
                        {getNoDataMessage('standings')}
                      </p>
                      {isPreSeasonMatch() && (
                        <p className="text-gray-500 text-xs mt-3 px-4">
                          📅 League tables will be updated once the {match.competition.name} {matchSeason} season begins and teams have played matches.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Recent Form with Integrated Head-to-Head */}
          <div 
            className="rounded-xl p-6 border overflow-hidden"
            style={{
              background: '#000000',
              border: '1px solid #1B1B1B'
            }}
          >
            {/* Team Headers */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-center">
                <h4 className="text-white font-semibold text-sm uppercase tracking-wide">
                  {match.homeTeam.name}: RECENT FORM
                </h4>
              </div>
              <div className="text-center">
                <h4 className="text-white font-semibold text-sm uppercase tracking-wide">
                  {match.awayTeam.name}: RECENT FORM
                </h4>
              </div>
            </div>
            
            {apiDataLoading ? (
              <div className="text-center text-gray-400 py-8">
                <div className="animate-spin w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                {getActiveService() === 'highlightly' ? 'Loading real team data from Highlightly API...' : 'Loading form data...'}
              </div>
            ) : (
              <>
                {/* Pre-season context banner */}
                {isPreSeasonMatch() && (homeTeamForm || awayTeamForm) && (
                  <div className="mb-4 bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                    <p className="text-center text-xs text-orange-300">
                      🏆 Match completed: Form data shown is from the previous season ({parseInt(matchSeason) - 1})
                    </p>
                  </div>
                )}
                
                {homeTeamForm || awayTeamForm ? (
                  <>
                    {/* Form circles */}
                    <div className="flex justify-between items-center mb-8">
                      <div className="flex space-x-1.5">
                        {Array.from({ length: 10 }, (_, index) => {
                          const result = homeTeamForm?.form?.[index];
                          return (
                            <div key={index} className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
                              result === 'W' ? 'bg-green-500 text-white' : 
                              result === 'L' ? 'bg-red-500 text-white' : 
                              result === 'D' ? 'bg-yellow-500 text-black' : 'bg-gray-800 border border-gray-400 text-gray-400'
                            }`}>
                              {result || '-'}
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="text-center px-8">
                        <div className="text-white text-sm font-medium">OUTCOME</div>
                      </div>
                      
                      <div className="flex space-x-1.5">
                        {Array.from({ length: 10 }, (_, index) => {
                          const result = awayTeamForm?.form?.[index];
                          return (
                            <div key={index} className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
                              result === 'W' ? 'bg-green-500 text-white' : 
                              result === 'L' ? 'bg-red-500 text-white' : 
                              result === 'D' ? 'bg-yellow-500 text-black' : 'bg-gray-800 border border-gray-400 text-gray-400'
                            }`}>
                              {result || '-'}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 gap-4 mb-8">
                      {/* Over 2.5 Goals */}
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-1.5">
                          {Array.from({ length: 10 }, (_, index) => {
                            const match = homeTeamForm?.recentMatches?.[index];
                            const over25 = match ? (match.homeScore + match.awayScore) > 2.5 : false;
                            return (
                              <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                                {match && over25 && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="text-center px-8">
                          <div className="text-white text-sm font-medium">OVER 2.5</div>
                        </div>
                        
                        <div className="flex space-x-1.5">
                          {Array.from({ length: 10 }, (_, index) => {
                            const match = awayTeamForm?.recentMatches?.[index];
                            const over25 = match ? (match.homeScore + match.awayScore) > 2.5 : false;
                            return (
                              <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                                {match && over25 && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Under 2.5 Goals */}
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-1.5">
                          {Array.from({ length: 10 }, (_, index) => {
                            const match = homeTeamForm?.recentMatches?.[index];
                            const under25 = match ? (match.homeScore + match.awayScore) <= 2.5 : false;
                            return (
                              <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                                {match && under25 && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="text-center px-8">
                          <div className="text-white text-sm font-medium">UNDER 2.5</div>
                        </div>
                        
                        <div className="flex space-x-1.5">
                          {Array.from({ length: 10 }, (_, index) => {
                            const match = awayTeamForm?.recentMatches?.[index];
                            const under25 = match ? (match.homeScore + match.awayScore) <= 2.5 : false;
                            return (
                              <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                                {match && under25 && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Clean Sheet */}
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-1.5">
                          {Array.from({ length: 10 }, (_, index) => {
                            const match = homeTeamForm?.recentMatches?.[index];
                            const cleanSheet = match ? (match.isHome ? match.awayScore === 0 : match.homeScore === 0) : false;
                            return (
                              <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                                {match && cleanSheet && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="text-center px-8">
                          <div className="text-white text-sm font-medium">CLEAN SHEET</div>
                        </div>
                        
                        <div className="flex space-x-1.5">
                          {Array.from({ length: 10 }, (_, index) => {
                            const match = awayTeamForm?.recentMatches?.[index];
                            const cleanSheet = match ? (match.isHome ? match.awayScore === 0 : match.homeScore === 0) : false;
                            return (
                              <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                                {match && cleanSheet && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Failed to Score */}
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-1.5">
                          {Array.from({ length: 10 }, (_, index) => {
                            const match = homeTeamForm?.recentMatches?.[index];
                            const failedToScore = match ? (match.isHome ? match.homeScore === 0 : match.awayScore === 0) : false;
                            return (
                              <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                                {match && failedToScore && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="text-center px-8">
                          <div className="text-white text-sm font-medium">FAILED TO SCORE</div>
                        </div>
                        
                        <div className="flex space-x-1.5">
                          {Array.from({ length: 10 }, (_, index) => {
                            const match = awayTeamForm?.recentMatches?.[index];
                            const failedToScore = match ? (match.isHome ? match.homeScore === 0 : match.awayScore === 0) : false;
                            return (
                              <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                                {match && failedToScore && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Conceded */}
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-1.5">
                          {Array.from({ length: 10 }, (_, index) => {
                            const match = homeTeamForm?.recentMatches?.[index];
                            const conceded = match ? (match.isHome ? match.awayScore > 0 : match.homeScore > 0) : false;
                            return (
                              <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                                {match && conceded && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="text-center px-8">
                          <div className="text-white text-sm font-medium">CONCEDED</div>
                        </div>
                        
                        <div className="flex space-x-1.5">
                          {Array.from({ length: 10 }, (_, index) => {
                            const match = awayTeamForm?.recentMatches?.[index];
                            const conceded = match ? (match.isHome ? match.awayScore > 0 : match.homeScore > 0) : false;
                            return (
                              <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                                {match && conceded && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Conceded Two */}
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-1.5">
                          {Array.from({ length: 10 }, (_, index) => {
                            const match = homeTeamForm?.recentMatches?.[index];
                            const concededTwo = match ? (match.isHome ? match.awayScore >= 2 : match.homeScore >= 2) : false;
                            return (
                              <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                                {match && concededTwo && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="text-center px-8">
                          <div className="text-white text-sm font-medium">CONCEDED TWO</div>
                        </div>
                        
                        <div className="flex space-x-1.5">
                          {Array.from({ length: 10 }, (_, index) => {
                            const match = awayTeamForm?.recentMatches?.[index];
                            const concededTwo = match ? (match.isHome ? match.awayScore >= 2 : match.homeScore >= 2) : false;
                            return (
                              <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                                {match && concededTwo && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Head-to-Head Section */}
                    {headToHeadData.length > 0 && (
                      <>
                        <div className="border-t border-white/10 pt-6 mb-4">
                          <h4 className="text-lg font-semibold text-center text-white mb-4">HEAD-TO-HEAD</h4>
                        </div>
                        
                        <div className="space-y-3">
                          {headToHeadData.map((encounter, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-800/50 rounded-lg p-4">
                              <div className="text-sm text-gray-400 min-w-[100px]">{encounter.date}</div>
                              <div className="flex items-center justify-center flex-1">
                                <div className="text-center">
                                  <div className="text-white font-medium text-sm">
                                    {encounter.homeTeam} <span className="text-yellow-400 font-bold mx-3">{encounter.score}</span> {encounter.awayTeam}
                                  </div>
                                </div>
                              </div>
                              <div className="text-sm text-gray-400 min-w-[120px] text-right">{encounter.competition}</div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6">
                    <div className="text-gray-400 text-sm">
                      <div className="mb-2">📊</div>
                      <p className="text-white font-medium text-sm mb-2">Team Form Data Unavailable</p>
                      <p className="text-xs px-4">
                        {getNoDataMessage('form')}
                      </p>
                      {isPreSeasonMatch() && (
                        <p className="text-gray-500 text-xs mt-3 px-4">
                          📅 Form data will be updated once teams have played matches in the {match.competition.name} {matchSeason} season.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate(`/match/${match.id}`)}
            className="bg-[#FFC30B] text-black px-6 py-3 rounded-lg font-medium hover:bg-[#FFD700] transition-colors"
          >
            View Full Match Details
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="bg-gray-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors border border-gray-600"
          >
            Back to Matches
          </button>
        </div>
      </div>
    </div>
  );
};

export default FullTimeSummary; 