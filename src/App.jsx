import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/react';
import Header from './components/Header/header';
import NeonUserCard from './components/NeonUserCard/NeonUserCard';
import HomePage from './pages/Homepage/homepage';
import CupTablePage from './pages/CupTable/cupTable';
import PredictionsPage from './pages/Predictions/Predictions';
import LeaderboardPage from './pages/Leaderboard/Leaderboard';
import './App.scss';

function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="auth-header">
          <Show when="signed-out">
            <div className="auth-actions">
              <SignInButton>
                <button className="auth-btn auth-btn-outline">Entrar</button>
              </SignInButton>
              <SignUpButton>
                <button className="auth-btn auth-btn-solid">Criar conta</button>
              </SignUpButton>
            </div>
          </Show>

          <Show when="signed-in">
            <div className="auth-user">
              <UserButton />
            </div>
          </Show>
        </header>

        <Show when="signed-in">
          <section className="neon-panel">
            <NeonUserCard />
          </section>
        </Show>

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