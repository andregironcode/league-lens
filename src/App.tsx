import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from '@/pages/Index';
import MatchDetails from '@/pages/MatchDetails';

import TeamPage from '@/pages/TeamPage';
import LeaguePage from '@/pages/LeaguePage';
import LeaguesPage from '@/pages/LeaguesPage';
import NotFound from '@/pages/NotFound';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/match/:id" element={<MatchDetails />} />

        <Route path="/team/:teamId" element={<TeamPage />} />
        <Route path="/league/:leagueId/:season?" element={<LeaguePage />} />
        <Route path="/leagues" element={<LeaguesPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
