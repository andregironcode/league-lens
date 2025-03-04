import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from '@/pages/Index';
import MatchDetails from '@/pages/MatchDetails';
import TeamPage from '@/pages/TeamPage';
import NotFound from '@/pages/NotFound';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/contexts/AuthContext';
import LeaguePage from '@/pages/LeaguePage';
import { useToast } from '@/hooks/use-toast';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/match/:matchId" element={<MatchDetails />} />
          <Route path="/team/:teamId" element={<TeamPage />} />
          <Route path="/league/:leagueId" element={<LeaguePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Router>
        <Toaster />
      </div>
    </AuthProvider>
  );
}

export default App;
