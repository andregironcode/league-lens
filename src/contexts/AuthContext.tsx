
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserPreferences } from '@/types';
import { useToast } from '@/components/ui/use-toast';

interface AuthContextType {
  isLoggedIn: boolean;
  userPreferences: UserPreferences | null;
  login: () => void;
  logout: () => void;
  promptLogin: (action: string) => void;
  followTeam: (teamId: string) => void;
  unfollowTeam: (teamId: string) => void;
  followLeague: (leagueId: string) => void;
  unfollowLeague: (leagueId: string) => void;
  saveMatch: (matchId: string) => void;
  unsaveMatch: (matchId: string) => void;
  isTeamFollowed: (teamId: string) => boolean;
  isLeagueFollowed: (leagueId: string) => boolean;
  isMatchSaved: (matchId: string) => boolean;
}

const defaultUserPreferences: UserPreferences = {
  followedTeams: [],
  followedLeagues: [],
  savedMatches: []
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const { toast } = useToast();
  
  // Show login dialog for various actions
  const promptLogin = (action: string) => {
    toast({
      title: "Authentication Required",
      description: `You need to create an account to ${action}.`,
      action: (
        <button 
          onClick={() => login()}
          className="bg-[#FFC30B] text-black px-3 py-1 rounded-md font-medium text-sm"
        >
          Sign In
        </button>
      ),
      duration: 5000,
    });
  };

  const login = () => {
    // In a real app, this would authenticate with a backend
    setIsLoggedIn(true);
    setUserPreferences(defaultUserPreferences);
    
    toast({
      title: "Logged In Successfully",
      description: "Welcome to FootballHighlights!",
    });
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUserPreferences(null);
    
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
  };

  const followTeam = (teamId: string) => {
    if (!isLoggedIn) {
      promptLogin("follow teams");
      return;
    }
    
    setUserPreferences(prev => {
      if (!prev) return defaultUserPreferences;
      
      const isAlreadyFollowing = prev.followedTeams.includes(teamId);
      
      if (isAlreadyFollowing) {
        return prev;
      }
      
      return {
        ...prev,
        followedTeams: [...prev.followedTeams, teamId]
      };
    });
    
    toast({
      title: "Team Followed",
      description: "This team has been added to your followed teams.",
    });
  };

  const unfollowTeam = (teamId: string) => {
    if (!isLoggedIn || !userPreferences) return;
    
    setUserPreferences(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        followedTeams: prev.followedTeams.filter(id => id !== teamId)
      };
    });
    
    toast({
      title: "Team Unfollowed",
      description: "This team has been removed from your followed teams.",
    });
  };

  const followLeague = (leagueId: string) => {
    if (!isLoggedIn) {
      promptLogin("follow leagues");
      return;
    }
    
    setUserPreferences(prev => {
      if (!prev) return defaultUserPreferences;
      
      const isAlreadyFollowing = prev.followedLeagues.includes(leagueId);
      
      if (isAlreadyFollowing) {
        return prev;
      }
      
      return {
        ...prev,
        followedLeagues: [...prev.followedLeagues, leagueId]
      };
    });
    
    toast({
      title: "League Followed",
      description: "This league has been added to your followed leagues.",
    });
  };

  const unfollowLeague = (leagueId: string) => {
    if (!isLoggedIn || !userPreferences) return;
    
    setUserPreferences(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        followedLeagues: prev.followedLeagues.filter(id => id !== leagueId)
      };
    });
    
    toast({
      title: "League Unfollowed",
      description: "This league has been removed from your followed leagues.",
    });
  };

  const saveMatch = (matchId: string) => {
    if (!isLoggedIn) {
      promptLogin("save matches");
      return;
    }
    
    setUserPreferences(prev => {
      if (!prev) return defaultUserPreferences;
      
      const isAlreadySaved = prev.savedMatches.includes(matchId);
      
      if (isAlreadySaved) {
        return prev;
      }
      
      return {
        ...prev,
        savedMatches: [...prev.savedMatches, matchId]
      };
    });
    
    toast({
      title: "Match Saved",
      description: "This match has been saved to your favorites.",
    });
  };

  const unsaveMatch = (matchId: string) => {
    if (!isLoggedIn || !userPreferences) return;
    
    setUserPreferences(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        savedMatches: prev.savedMatches.filter(id => id !== matchId)
      };
    });
    
    toast({
      title: "Match Removed",
      description: "This match has been removed from your favorites.",
    });
  };

  // Helper functions to check status
  const isTeamFollowed = (teamId: string): boolean => {
    return !!userPreferences?.followedTeams.includes(teamId);
  };

  const isLeagueFollowed = (leagueId: string): boolean => {
    return !!userPreferences?.followedLeagues.includes(leagueId);
  };

  const isMatchSaved = (matchId: string): boolean => {
    return !!userPreferences?.savedMatches.includes(matchId);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isLoggedIn, 
        userPreferences,
        login, 
        logout, 
        promptLogin,
        followTeam,
        unfollowTeam,
        followLeague,
        unfollowLeague,
        saveMatch,
        unsaveMatch,
        isTeamFollowed,
        isLeagueFollowed,
        isMatchSaved
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
