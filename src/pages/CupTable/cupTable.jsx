import { useGames } from '../../hooks/useGames';
import Card from '../../components/Card/Card';
import GameInput from '../../components/GameInput/GameInput';
import { GROUPS, ROUNDS } from '../../services/gameService';
import { computeGroupStandings } from '../../utils/helpers';
import './cupTable.scss';

export default function CupTablePage({
  editable = false,
  games: externalGames,
  updateScore: externalUpdateScore,
  save: externalSave,
  clearData: externalClearData,
}) {
  const {
    games: hookGames,
    updateScore: hookUpdateScore,
    save: hookSave,
    clearData: hookClearData,
  } = useGames();

  const games = externalGames ?? hookGames;
  const updateScore = externalUpdateScore ?? hookUpdateScore;
  const save = externalSave ?? hookSave;
  const clearData = externalClearData ?? hookClearData;

  const gamesByPhase = GROUPS.reduce((acc, group) => {
    acc[group.fase] = ROUNDS.map((round) => ({
      ...round,
      games: games.filter((game) => game.fase === group.fase && game.rodada === round.rodada),
    })).filter((round) => round.games.length > 0);
    return acc;
  }, {});

  return (
    <div className="cup-table-page">
      {!editable && (
        <div className="page-header">
          <h1>📊 Tabela da Copa</h1>
          <p>Acompanhe todos os jogos e resultados</p>
        </div>
      )}

      <div className="phases-container">
        {games.length === 0 ? (
          <Card>
            <p className="empty-message">Nenhum jogo adicionado ainda</p>
          </Card>
        ) : (
          GROUPS.map((group) => (
            <div key={group.fase} className="phase-section">
              <h2 className="phase-title">
                {group.fase}
                <span className="phase-teams">{group.teams.join(' · ')}</span>
              </h2>

              <div className="phase-layout">
                <div className="standings-container">
                  <table className="standings-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Pts</th>
                        <th>PJ</th>
                        <th>V</th>
                        <th>E</th>
                        <th>D</th>
                        <th>GM</th>
                        <th>GC</th>
                        <th>SG</th>
                      </tr>
                    </thead>
                    <tbody>
                      {computeGroupStandings(
                        games.filter((game) => game.fase === group.fase),
                        group.teams,
                        editable ? 'prediction' : 'official',
                      ).map((row) => (
                        <tr key={row.team}>
                          <td>{row.team}</td>
                          <td>{row.Pts}</td>
                          <td>{row.PJ}</td>
                          <td>{row.V}</td>
                          <td>{row.E}</td>
                          <td>{row.D}</td>
                          <td>{row.GM}</td>
                          <td>{row.GC}</td>
                          <td>{row.SG}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="rounds-wrap">
                  {gamesByPhase[group.fase].map((round) => (
                    <div key={round.rodada} className="round-block">
                      <div className="round-header">
                        <strong>{round.label}</strong>
                        <span>{round.dateRange}</span>
                      </div>

                      <div className="table-grid">
                        {round.games.map((game) => (
                          editable ? (
                            <GameInput key={game.id} game={game} onScoreChange={updateScore} />
                          ) : (
                            <div key={game.id} className="table-row">
                              <div className="match-meta">
                                <span>{game.data}</span>
                                <span>{game.hora}</span>
                              </div>
                              <div className="match-line">
                                <div className="team-col team-home">
                                  <span>{game.mandante}</span>
                                </div>
                                <div className="score-col">
                                  {game.officialM !== null && game.officialV !== null ? (
                                    <span className="score-result">{game.officialM}-{game.officialV}</span>
                                  ) : (
                                    <span className="score-empty">-</span>
                                  )}
                                </div>
                                <div className="team-col team-away">
                                  <span>{game.visitante}</span>
                                </div>
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {editable && (
                <div className="phase-actions">
                  <button className="btn btn-success" onClick={save}>Salvar palpites</button>
                  <button className="btn btn-secondary" onClick={clearData}>Recarregar padrão</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
