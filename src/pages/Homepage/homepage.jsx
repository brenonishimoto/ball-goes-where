import { useMemo } from 'react';
import { useGames } from '../../hooks/useGames';
import { calculateTotalPoints, countPredictions, getTodaysGames } from '../../utils/helpers';
import { INITIAL_KNOCKOUT_GAMES, resolveKnockoutGames } from '../../services/mataMataService';
import Flag from '../../components/Flag/Flag';
import './homepage.scss';

export default function HomePage() {
  const { games, loading } = useGames();

  const knockoutGames = useMemo(
    () => resolveKnockoutGames(INITIAL_KNOCKOUT_GAMES),
    []
  );

  const allGames = useMemo(() => {
    const phase2Games = games || [];
    const phase3Games = (knockoutGames || []).map((g) => ({
      ...g,
      data: `${g.date}/2026`,
    }));
    return [...phase2Games, ...phase3Games];
  }, [games, knockoutGames]);

  if (loading) {
    return <div className="homepage">Carregando...</div>;
  }

  if (!games || games.length === 0) {
    return <div className="homepage">Nenhum jogo encontrado</div>;
  }

  const totalPoints = calculateTotalPoints(games);
  const predictions = countPredictions(games);
  const todaysGames = getTodaysGames(allGames);

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
            <span className="stat-value">{games.length}</span>
            <span className="stat-label">Total de Jogos</span>
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

      {todaysGames.length > 0 && (
        <section className="todays-games">
          <div className="todays-games-banner" aria-hidden="true">
            <img src="/caio.png" alt="" />
          </div>
          <div className="save-warning" role="note">
            Warning: Deslogue e logue novamente para garantir que os placares foram salvos
          </div>
          <h2 className="section-title">Jogos de Hoje</h2>
          <div className="games-container">
            {todaysGames.map((game) => (
              <div key={game.id} className="game-card">
                <div className="game-time">{game.hora}</div>
                <div className="game-match">
                  <div className="team team-home">
                    <Flag country={game.mandante} size="lg" />
                  </div>
                  <div className="game-score">
                    <div className="score-display">
                      {game.officialM !== null && game.officialV !== null ? (
                        <>
                          <span className="score-number">{game.officialM}</span>
                          <span className="score-separator">x</span>
                          <span className="score-number">{game.officialV}</span>
                        </>
                      ) : (
                        <>
                          <span className="score-number">-</span>
                          <span className="score-separator">x</span>
                          <span className="score-number">-</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="team team-away">
                    <Flag country={game.visitante} size="lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}