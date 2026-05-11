import { useGames } from '../../hooks/useGames';
import { calculateTotalPoints, countPredictions } from '../../utils/helpers';
import { GROUPS } from '../../services/gameService';
import CupTablePage from '../CupTable/cupTable';
import './predictions.scss';

export default function PredictionsPage() {
  const { games, updateScore, save, clearData } = useGames();
  const totalPoints = calculateTotalPoints(games);
  const predictions = countPredictions(games);

  return (
    <div className="predictions-page">
      <section className="predictions-header">
        <div className="hero-copy">
          <span className="eyebrow">Copa do Mundo 2026</span>
          <h1>Fase 2</h1>
          <p>Preencha apenas os placares e acompanhe sua pontuação em tempo real.</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{predictions}</span>
            <span className="stat-label">Cravadas</span>
          </div>
          <div className="stat-card">
            <span className="stat-value stat-value-compact">{predictions}/{games.length}</span>
            <span className="stat-label">Preenchidos</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{totalPoints}</span>
            <span className="stat-label">Pontos</span>
          </div>
        </div>
      </section>

      <CupTablePage
        editable
        games={games}
        updateScore={updateScore}
        save={save}
        clearData={clearData}
      />
    </div>
  );
}
