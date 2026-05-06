import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header/header';
import HomePage from './pages/Homepage/homepage';
import CupTablePage from './pages/CupTable/cupTable';
import PredictionsPage from './pages/Predictions/Predictions';
import LeaderboardPage from './pages/Leaderboard/Leaderboard';
import './App.scss';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Header />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/table" element={<CupTablePage />} />
            <Route path="/predictions" element={<PredictionsPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
          </Routes>
        </main>
        <footer className="app-footer">
          <p>⚽ Bolão Copa do Mundo 2026</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;