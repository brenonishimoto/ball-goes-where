import { useGames } from '../../hooks/useGames';
import { calculateTotalPoints, countPredictions } from '../../utils/helpers';
import { GROUPS } from '../../services/gameService';
import CupTablePage from '../CupTable/cupTable';
import './Predictions.scss';

export default function PredictionsPage() {
  const { games } = useGames();
  const totalPoints = calculateTotalPoints(games);
  const predictions = countPredictions(games);

  return (
    <div className="predictions-page">
      <section className="predictions-header">
        <div className="hero-copy">
          <span className="eyebrow">Copa do Mundo 2026</span>
          <h1>Área de Palpites</h1>
          <p>Preencha apenas os placares e acompanhe sua pontuação em tempo real.</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{GROUPS.length}</span>
            <span className="stat-label">Grupos</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{games.length}</span>
            <span className="stat-label">Jogos</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{predictions}</span>
            <span className="stat-label">Preenchidos</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{totalPoints}</span>
            <span className="stat-label">Pontos</span>
          </div>
        </div>
      </section>

      <CupTablePage editable />
    </div>
  );
}
