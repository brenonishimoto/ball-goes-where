import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useGames } from '../../hooks/useGames';
import { GROUPS } from '../../services/gameService';
import {
  PHASE3_MATCHES,
  PHASE3_ROUNDS,
  normalizePhase3Predictions,
} from '../../services/phase3Bracket';
import { PHASE3_RESULTS } from '../../services/phase3Results';
import { calculatePhase3MatchScore, calculatePhase3TotalScore } from '../../services/phase3Scoring';
import { phase3Service } from '../../services/phase3Service';
import { computeGroupStandings } from '../../utils/helpers';
import './phase3.scss';

const LOCAL_STORAGE_KEY = 'phase3-predictions';

const isFilledMatch = (prediction) => (
  prediction?.teamA?.trim()
  && prediction?.teamB?.trim()
  && prediction?.scoreA !== ''
  && prediction?.scoreB !== ''
  && prediction?.winner
);

const formatOfficialResult = (official) => {
  if (!official?.teamA || !official?.teamB || official.scoreA === null || official.scoreB === null) {
    return 'Resultado oficial pendente';
  }

  const decidedOnPenalties = Number(official.scoreA) === Number(official.scoreB);
  return `${official.teamA} ${official.scoreA} x ${official.scoreB} ${official.teamB}${decidedOnPenalties ? ' (pen.)' : ''}`;
};

export default function Phase3Page() {
  const { user, token } = useAuth();
  const { pushToast } = useToast();
  const { games: phase2Games } = useGames();
  const [predictions, setPredictions] = useState(() => normalizePhase3Predictions({}));
  const [activeRound, setActiveRound] = useState('round32');
  const [isSaving, setIsSaving] = useState(false);

  const earnedPoints = useMemo(
    () => calculatePhase3TotalScore(predictions, PHASE3_RESULTS),
    [predictions]
  );

  const standingsByGroup = useMemo(() => GROUPS.reduce((acc, group) => {
    acc[group.fase] = computeGroupStandings(
      phase2Games.filter((game) => game.fase === group.fase),
      group.teams,
      'prediction'
    );
    return acc;
  }, {}), [phase2Games]);

  const matchById = useMemo(
    () => new Map(PHASE3_MATCHES.map((match) => [match.id, match])),
    []
  );

  const getPredictedWinnerTeam = useCallback((matchId) => {
    const prediction = predictions[matchId];
    if (prediction?.winner === 'A') return prediction.teamA;
    if (prediction?.winner === 'B') return prediction.teamB;
    return '';
  }, [predictions]);

  const getPredictedLoserTeam = useCallback((matchId) => {
    const prediction = predictions[matchId];
    if (prediction?.winner === 'A') return prediction.teamB;
    if (prediction?.winner === 'B') return prediction.teamA;
    return '';
  }, [predictions]);

  const getTeamByGroupPosition = useCallback((groupLetter, position) => {
    const standings = standingsByGroup[`Grupo ${groupLetter}`] || [];
    return standings[position - 1]?.team || '';
  }, [standingsByGroup]);

  const resolveSlotOptions = useCallback((slot) => {
    const groupWinnerMatch = slot.match(/^Vencedor Grupo ([A-L])$/);
    if (groupWinnerMatch) {
      const team = getTeamByGroupPosition(groupWinnerMatch[1], 1);
      return team ? [{ value: team, label: team }] : [];
    }

    const runnerUpMatch = slot.match(/^2o Grupo ([A-L])$/);
    if (runnerUpMatch) {
      const team = getTeamByGroupPosition(runnerUpMatch[1], 2);
      return team ? [{ value: team, label: team }] : [];
    }

    const thirdPlaceMatch = slot.match(/^3o Grupo ([A-L/]+)$/);
    if (thirdPlaceMatch) {
      return thirdPlaceMatch[1].split('/').map((groupLetter) => {
        const team = getTeamByGroupPosition(groupLetter, 3);
        return team ? { value: team, label: `${team} (${groupLetter})` } : null;
      }).filter(Boolean);
    }

    const previousWinnerMatch = slot.match(/^Vencedor Jogo (\d+)$/);
    if (previousWinnerMatch) {
      const previousMatchId = Number(previousWinnerMatch[1]);
      const team = getPredictedWinnerTeam(previousMatchId);
      const previousMatch = matchById.get(previousMatchId);
      return team ? [{ value: team, label: team }] : [{ value: '', label: `Defina o classificado de ${previousMatch?.date || 'jogo anterior'}` }];
    }

    const previousLoserMatch = slot.match(/^Perdedor Jogo (\d+)$/);
    if (previousLoserMatch) {
      const previousMatchId = Number(previousLoserMatch[1]);
      const team = getPredictedLoserTeam(previousMatchId);
      return team ? [{ value: team, label: team }] : [{ value: '', label: 'Defina a semifinal primeiro' }];
    }

    return [];
  }, [getPredictedLoserTeam, getPredictedWinnerTeam, getTeamByGroupPosition, matchById]);

  const formatSlotLabel = useCallback((slot) => {
    const previousMatch = slot.match(/^(Vencedor|Perdedor) Jogo (\d+)$/);

    if (!previousMatch) {
      return slot;
    }

    const match = matchById.get(Number(previousMatch[2]));
    const prefix = previousMatch[1] === 'Vencedor' ? 'Vencedor' : 'Perdedor';

    return match ? `${prefix}: ${match.date} - ${match.city}` : prefix;
  }, [matchById]);

  useEffect(() => {
    setPredictions((current) => {
      const normalized = normalizePhase3Predictions(current);
      let changed = false;

      const nextPredictions = PHASE3_MATCHES.reduce((acc, match) => {
        const prediction = { ...normalized[match.id] };

        [
          { field: 'teamA', options: resolveSlotOptions(match.slotA) },
          { field: 'teamB', options: resolveSlotOptions(match.slotB) },
        ].forEach(({ field, options }) => {
          const validValues = options.map((option) => option.value).filter(Boolean);

          if (validValues.length === 1 && prediction[field] !== validValues[0]) {
            prediction[field] = validValues[0];
            changed = true;
            return;
          }

          if (prediction[field] && options.length > 0 && validValues.length === 0) {
            prediction[field] = '';
            changed = true;
          }

          if (prediction[field] && validValues.length > 0 && !validValues.includes(prediction[field])) {
            prediction[field] = '';
            changed = true;
          }
        });

        if (prediction.winner === 'A' && !prediction.teamA) {
          prediction.winner = '';
          changed = true;
        }

        if (prediction.winner === 'B' && !prediction.teamB) {
          prediction.winner = '';
          changed = true;
        }

        acc[match.id] = prediction;
        return acc;
      }, {});

      if (!changed) {
        return current;
      }

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextPredictions));
      return nextPredictions;
    });
  }, [resolveSlotOptions]);

  const filledMatches = useMemo(
    () => Object.values(predictions).filter(isFilledMatch).length,
    [predictions]
  );

  useEffect(() => {
    const loadPredictions = async () => {
      if (token && user?.id) {
        const serverData = await phase3Service.getPredictions(token);

        if (serverData?.phase3_predictions && Object.keys(serverData.phase3_predictions).length > 0) {
          const normalized = normalizePhase3Predictions(serverData.phase3_predictions);
          setPredictions(normalized);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
          return;
        }
      }

      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);

      if (saved) {
        setPredictions(normalizePhase3Predictions(saved));
      }
    };

    loadPredictions();
  }, [token, user?.id]);

  const updatePrediction = (matchId, field, value) => {
    setPredictions((current) => {
      const normalized = normalizePhase3Predictions(current);
      const updated = {
        ...normalized,
        [matchId]: {
          ...normalized[matchId],
          [field]: value,
        },
      };

      if (field === 'scoreA' || field === 'scoreB') {
        const scoreA = field === 'scoreA' ? value : updated[matchId].scoreA;
        const scoreB = field === 'scoreB' ? value : updated[matchId].scoreB;

        if (scoreA !== '' && scoreB !== '' && Number(scoreA) !== Number(scoreB)) {
          updated[matchId].winner = Number(scoreA) > Number(scoreB) ? 'A' : 'B';
        }

      }

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    const normalized = normalizePhase3Predictions(predictions);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));

    if (!token || !user?.id) {
      pushToast({ type: 'warning', message: 'Faca login para salvar no banco.' });
      return;
    }

    setIsSaving(true);

    try {
      const success = await phase3Service.savePredictions(token, normalized);
      pushToast({
        type: success ? 'success' : 'error',
        message: success ? 'Fase 3 salva no banco com sucesso.' : 'Nao foi possivel salvar a Fase 3.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    const cleared = normalizePhase3Predictions({});
    setPredictions(cleared);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleared));
  };

  return (
    <div className="phase3-page">
      <section className="phase3-header">
        <div className="hero-copy">
          <span className="eyebrow">FASE 03: MATA-MATA</span>
          <h1>Monte o Caminho Ate a Final</h1>
          <p>Preencha os times que voce acredita que vao ocupar cada vaga do chaveamento, o placar no tempo normal e o classificado.</p>
        </div>

        <div className="phase3-stats" aria-live="polite">
          <div className="phase3-stat-card">
            <span className="phase3-stat-value">{earnedPoints}</span>
            <span className="phase3-stat-label">Pontos</span>
          </div>
          <div className="phase3-stat-card">
            <span className="phase3-stat-value phase3-stat-value-small">{filledMatches}/{PHASE3_MATCHES.length}</span>
            <span className="phase3-stat-label">Jogos</span>
          </div>
        </div>
      </section>

      <section className="phase3-rules">
        <div><strong>4 pts</strong><span>Classificado</span></div>
        <div><strong>3 pts</strong><span>Placar exato</span></div>
        <div><strong>1 pt</strong><span>Resultado no tempo normal</span></div>
        <div><strong>8 pts</strong><span>Cravada</span></div>
      </section>

      <div className="phase3-tabs" role="tablist" aria-label="Rodadas da fase 3">
        {PHASE3_ROUNDS.map((round) => (
          <button
            key={round.key}
            type="button"
            className={`phase3-tab ${activeRound === round.key ? 'is-active' : ''}`}
            onClick={() => setActiveRound(round.key)}
          >
            {round.label}
          </button>
        ))}
      </div>

      <section className="phase3-match-grid">
        {PHASE3_MATCHES.filter((match) => match.round === activeRound).map((match) => {
          const prediction = predictions[match.id];
          const official = PHASE3_RESULTS[match.id];
          const score = calculatePhase3MatchScore(prediction, official);
          const slotAOptions = resolveSlotOptions(match.slotA);
          const slotBOptions = resolveSlotOptions(match.slotB);

          return (
            <article className="phase3-match-card" key={match.id}>
              <header className="phase3-match-header">
                <div>
                  <span className="phase3-match-kicker">{match.date}</span>
                  <h2>{match.date} - {match.city}</h2>
                </div>
                <span className={`phase3-match-points phase3-match-points-${score.status}`}>
                  {score.points} pts
                </span>
              </header>

              <div className="phase3-team-row">
                <label>
                  <span>{formatSlotLabel(match.slotA)}</span>
                  <select
                    value={prediction.teamA}
                    onChange={(event) => updatePrediction(match.id, 'teamA', event.target.value)}
                  >
                    <option value="">Selecione</option>
                    {slotAOptions.map((option) => (
                      <option key={option.value || option.label} value={option.value} disabled={!option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <input
                  className="phase3-score-input"
                  type="number"
                  min="0"
                  value={prediction.scoreA}
                  onChange={(event) => updatePrediction(match.id, 'scoreA', event.target.value)}
                  aria-label={`Placar de ${prediction.teamA || match.slotA}`}
                />
              </div>

              <div className="phase3-team-row">
                <label>
                  <span>{formatSlotLabel(match.slotB)}</span>
                  <select
                    value={prediction.teamB}
                    onChange={(event) => updatePrediction(match.id, 'teamB', event.target.value)}
                  >
                    <option value="">Selecione</option>
                    {slotBOptions.map((option) => (
                      <option key={option.value || option.label} value={option.value} disabled={!option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <input
                  className="phase3-score-input"
                  type="number"
                  min="0"
                  value={prediction.scoreB}
                  onChange={(event) => updatePrediction(match.id, 'scoreB', event.target.value)}
                  aria-label={`Placar de ${prediction.teamB || match.slotB}`}
                />
              </div>

              <div className="phase3-winner-group">
                <span>Classificado</span>
                <div className="phase3-segmented">
                  <button
                    type="button"
                    className={prediction.winner === 'A' ? 'is-active' : ''}
                    onClick={() => updatePrediction(match.id, 'winner', 'A')}
                  >
                    {prediction.teamA || 'Time A'}
                  </button>
                  <button
                    type="button"
                    className={prediction.winner === 'B' ? 'is-active' : ''}
                    onClick={() => updatePrediction(match.id, 'winner', 'B')}
                  >
                    {prediction.teamB || 'Time B'}
                  </button>
                </div>
              </div>

              <footer className="phase3-result">
                <span>{formatOfficialResult(official)}</span>
                <span>
                  Classificado {score.classified ? '+4' : '+0'} | Placar {score.exactScore ? '+3' : '+0'} | Resultado {score.result ? '+1' : '+0'}
                </span>
              </footer>
            </article>
          );
        })}
      </section>

      <div className="phase3-actions">
        <button type="button" className="btn-save" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Salvando...' : 'Salvar Fase 3'}
        </button>
        <button type="button" className="btn-clear" onClick={handleClear}>
          Limpar Tudo
        </button>
      </div>
    </div>
  );
}
