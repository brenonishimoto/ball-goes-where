import { useGames } from '../../hooks/useGames';
import { calculateTotalPoints, countPredictions, countPhase02Slams } from '../../utils/helpers';
import { GROUPS } from '../../services/gameService';
import CupTablePage from '../CupTable/cupTable';
import './predictions.scss';

export default function PredictionsPage() {
  const { games, updateScore, save, clearData } = useGames();
  const totalPoints = calculateTotalPoints(games);
  const predictions = countPredictions(games);
  const slams = countPhase02Slams(games);

  return (
    <div className="predictions-page">
      <section className="predictions-header">
        <div className="hero-copy">
          <span className="eyebrow">FASE 02: GRUPOS</span>
          <h1>Acerte o Caminho das Nações</h1>
          <p>Preencha os placares dos jogos da fase de grupos e acompanhe sua pontuação em tempo real.</p>
        </div>

        <div className="predictions-stats" aria-live="polite">
          <div className="predictions-stat-card">
            <span className="predictions-stat-value">{slams}</span>
            <span className="predictions-stat-label">Cravadas</span>
          </div>
          <div className="predictions-stat-card">
            <span className="predictions-stat-value">{totalPoints}</span>
            <span className="predictions-stat-label">Pontos</span>
          </div>
          <div className="predictions-stat-card">
            <span className="predictions-stat-value predictions-stat-value-small">{predictions}/{games.length}</span>
            <span className="predictions-stat-label">Preenchidos</span>
          </div>
        </div>
      </section>

      <section className="predictions-rules">
        <div><strong>3 pts</strong><span>Resultado Correto</span></div>
        <div><strong>+2 pts</strong><span>Placar Exato</span></div>
        <div><strong>5 pts</strong><span>Cravada</span></div>
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
