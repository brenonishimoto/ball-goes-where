import { useGames } from '../../hooks/useGames';
import { useState } from 'react';
import Card from '../../components/Card/Card';
import GameInput from '../../components/GameInput/GameInput';
import Flag from '../../components/Flag/Flag';
import { GROUPS, ROUNDS, gameService } from '../../services/gameService';
import { computeGroupStandings } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import './cupTable.scss';

export default function CupTablePage({
  editable = false,
  games: externalGames,
  updateScore: externalUpdateScore,
  save: externalSave,
  clearData: externalClearData,
}) {
  const useHookGames = editable && !externalGames;
  const {
    games: hookGames,
    updateScore: hookUpdateScore,
    save: hookSave,
    clearData: hookClearData,
  } = useGames({ enabled: useHookGames });

  const officialGames = gameService.getAllGames(gameService.getGameStorageKey('guest'));
  const games = editable ? (externalGames ?? hookGames) : officialGames;
  const updateScore = externalUpdateScore ?? hookUpdateScore;
  const save = externalSave ?? hookSave;
  const clearData = externalClearData ?? hookClearData;
  const { pushToast } = useToast();
  const [saving, setSaving] = useState(false);

  const totalGames = games.length;
  const finishedGames = games.filter((game) => game.officialM !== null && game.officialV !== null).length;
  const totalGroups = GROUPS.length;

  const handleSave = async () => {
    setSaving(true);
    try {
      // Como CupTable não recebe o storageKey via props, não fazemos "save local" aqui.
      // O sincronismo real acontece via hook (backend + merge) e o usuário recarrega/visualiza o estado atualizado.
      pushToast({ type: 'success', message: 'Salvando e sincronizando...' });

      const result = await save();

      if (result?.status === 'auth-required') {
        pushToast({
          type: 'warning',
          message: 'Faça login para salvar a Fase 2 no banco.',
        });
        return;
      }

      pushToast({ type: 'success', message: 'Fase 2 sincronizada com o servidor.' });
    } catch (err) {
      pushToast({
        type: 'error',
        message: 'Não foi possível salvar a Fase 2. Tente novamente.',
      });
    } finally {
      setSaving(false);
    }
  };

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
        <section className="table-header">
          <div className="hero-copy">
            <span className="eyebrow">TABELA OFICIAL</span>
            <h1>Tabela da Copa</h1>
            <p>Acompanhe os jogos da fase de grupos e a classificacao atualizada.</p>
          </div>

          <div className="table-stats" aria-live="polite">
            <div className="table-stat-card">
              <span className="table-stat-value">{totalGroups}</span>
              <span className="table-stat-label">Grupos</span>
            </div>
            <div className="table-stat-card">
              <span className="table-stat-value">{finishedGames}</span>
              <span className="table-stat-label">Finalizados</span>
            </div>
            <div className="table-stat-card">
              <span className="table-stat-value">{totalGames}</span>
              <span className="table-stat-label">Jogos</span>
            </div>
          </div>
        </section>
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
                          <td><span className="team-with-flag"><Flag country={row.team} size="md" /> {row.team}</span></td>
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
                                <div className="team-col team-home" title={game.mandante}>
                                  <Flag country={game.mandante} size="lg" />
                                </div>
                                <div className="score-col">
                                  {game.officialM !== null && game.officialV !== null ? (
                                    <span className="score-result">{game.officialM}-{game.officialV}</span>
                                  ) : (
                                    <span className="score-empty">-</span>
                                  )}
                                </div>
                                <div className="team-col team-away" title={game.visitante}>
                                  <Flag country={game.visitante} size="lg" />
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
                  <button type="button" className="btn btn-success" onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Resultados'}</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
