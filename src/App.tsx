import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from '@/pages/Index';
import MatchDetails from '@/pages/MatchDetails';
import TeamPage from '@/pages/TeamPage';
import LeaguePage from '@/pages/LeaguePage';
import LeaguesPage from '@/pages/LeaguesPage';
import NotFound from '@/pages/NotFound';

import MainLayout from '@/components/layout/MainLayout';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <MainLayout>
            <Index />
          </MainLayout>
        } />
        <Route path="/match/:id" element={
          <MainLayout>
            <MatchDetails />
          </MainLayout>
        } />
        <Route path="/team/:teamId" element={
          <MainLayout>
            <TeamPage />
          </MainLayout>
        } />
        <Route path="/league/:leagueId/:season?" element={
          <MainLayout>
            <LeaguePage />
          </MainLayout>
        } />
        <Route path="/leagues" element={
          <MainLayout>
            <LeaguesPage />
          </MainLayout>
        } />
        <Route path="*" element={
          <MainLayout>
            <NotFound />
          </MainLayout>
        } />
      </Routes>
    </Router>
  );
}

export default App;
