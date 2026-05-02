import { useGames } from '../../hooks/useGames';
import { calculateTotalPoints, countPredictions } from '../../utils/helpers';
import { GROUPS } from '../../services/gameService';
import './Homepage.scss';

export default function HomePage() {
  const { games } = useGames();

  const totalPoints = calculateTotalPoints(games);
  const predictions = countPredictions(games);

  return (
    <div className="homepage">
      <section className="homepage-header">
        <div className="hero-copy">
          <span className="eyebrow">Copa do Mundo 2026</span>
          <h1>Bem-vindo ao Bolão</h1>
          <p>Veja grupos, jogos e seus pontos.</p>
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

      <section className="groups-overview">
        {GROUPS.map((group) => (
          <div key={group.fase} className="group-chip">
            <strong>{group.fase}</strong>
            <span>{group.teams.join(' · ')}</span>
          </div>
        ))}
      </section>
    </div>
  );
}