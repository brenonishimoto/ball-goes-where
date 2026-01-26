import { useGames } from '../../hooks/useGames';
import Card from '../../components/Card/Card';
import './CupTable.scss';

export default function CupTablePage() {
  const { games } = useGames();

  const phases = [...new Set(games.map(g => g.fase))];
  const gamesByPhase = phases.reduce((acc, phase) => {
    acc[phase] = games.filter(g => g.fase === phase);
    return acc;
  }, {});

  return (
    <div className="cup-table-page">
      <div className="page-header">
        <h1>📊 Tabela da Copa</h1>
        <p>Acompanhe todos os jogos e resultados</p>
      </div>

      <div className="phases-container">
        {phases.length === 0 ? (
          <Card>
            <p className="empty-message">Nenhum jogo adicionado ainda</p>
          </Card>
        ) : (
          phases.map((phase) => (
            <div key={phase} className="phase-section">
              <h2 className="phase-title">{phase}</h2>
              <div className="table-grid">
                {gamesByPhase[phase].map((game) => (
                  <div key={game.id} className="table-row">
                    <div className="team-col">
                      <span>{game.mandante}</span>
                    </div>
                    <div className="score-col">
                      {game.placarM !== null && game.placarV !== null ? (
                        <span className="score-result">{game.placarM}-{game.placarV}</span>
                      ) : (
                        <span className="score-empty">-</span>
                      )}
                    </div>
                    <div className="team-col">
                      <span>{game.visitante}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
