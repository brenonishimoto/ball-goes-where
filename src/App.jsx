import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header/header';
import HomePage from './pages/Homepage/homepage';
import CupTablePage from './pages/CupTable/cupTable';
import PredictionsPage from './pages/Predictions/Predictions';
import LeaderboardPage from './pages/Leaderboard/Leaderboard';
import Phase1Page from './pages/Phases/Phase1';
import Phase3Page from './pages/Phases/Phase3';
import MataMataPage from './pages/MataMata/MataMata';
import { ToastProvider } from './context/ToastContext.jsx';
import './App.scss';

function App() {
  return (
    <Router>
      <ToastProvider>
        <div className="app-container">
          <Header />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/table" element={<CupTablePage />} />
              <Route path="/phase1" element={<Phase1Page />} />
              <Route path="/phase2" element={<PredictionsPage />} />
              <Route path="/phase3" element={<Phase3Page />} />
              <Route path="/mata-mata" element={<MataMataPage />} />
              <Route path="/predictions" element={<Navigate to="/phase2" replace />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
            </Routes>
          </main>
          <footer className="app-footer">
            <p>⚽ Bolão Copa do Mundo 2026</p>
          </footer>
        </div>
      </ToastProvider>
    </Router>
  );
}

export default App;
