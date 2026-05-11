import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  PHASE3_MATCHES,
  PHASE3_ROUNDS,
  normalizePhase3Predictions,
} from '../../services/phase3Bracket';
import { INITIAL_KNOCKOUT_GAMES, resolveKnockoutGames } from '../../services/mataMataService';
import { PHASE3_RESULTS } from '../../services/phase3Results';
import { calculatePhase3MatchScore, calculatePhase3TotalScore, calculatePhase3SlamsCount } from '../../services/phase3Scoring';
import { phase3Service } from '../../services/phase3Service';
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
  const [predictions, setPredictions] = useState(() => normalizePhase3Predictions({}));
  const [activeRound, setActiveRound] = useState('round32');
  const [isSaving, setIsSaving] = useState(false);

  const knockoutGames = useMemo(
    () => resolveKnockoutGames(INITIAL_KNOCKOUT_GAMES),
    []
  );

  const knockoutById = useMemo(
    () => new Map(knockoutGames.map((match) => [match.id, match])),
    [knockoutGames]
  );

  const earnedPoints = useMemo(
    () => calculatePhase3TotalScore(predictions, PHASE3_RESULTS),
    [predictions]
  );

  const slamsCount = useMemo(
    () => calculatePhase3SlamsCount(predictions, PHASE3_RESULTS),
    [predictions]
  );

  const matchById = useMemo(
    () => new Map(PHASE3_MATCHES.map((match) => [match.id, match])),
    []
  );

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

        const knockoutMatch = knockoutById.get(match.id);
        const fixedTeamA = knockoutMatch?.mandante || '';
        const fixedTeamB = knockoutMatch?.visitante || '';

        if (prediction.teamA !== fixedTeamA) {
          prediction.teamA = fixedTeamA;
          changed = true;
        }

        if (prediction.teamB !== fixedTeamB) {
          prediction.teamB = fixedTeamB;
          changed = true;
        }

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
  }, [knockoutById]);

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
            <span className="phase3-stat-value">{slamsCount}</span>
            <span className="phase3-stat-label">Cravadas</span>
          </div>
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

      <section className="phase3-scores-wrap">
        <div className="phase3-match-grid">
          {PHASE3_MATCHES.filter((match) => match.round === activeRound).map((match) => {
            const prediction = predictions[match.id];
            const official = PHASE3_RESULTS[match.id];
            const score = calculatePhase3MatchScore(prediction, official);

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

              <div className="phase3-score-box">
                <div className="phase3-team-row">
                  <label>
                    <span>{formatSlotLabel(match.slotA)}</span>
                    <div className="phase3-team-value">{prediction.teamA || 'A definir'}</div>
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
                    <div className="phase3-team-value">{prediction.teamB || 'A definir'}</div>
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
        </div>
      </section>

      <div className="phase3-actions">
        <button type="button" className="btn-save" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Salvando...' : 'Salvar palpites'}
        </button>
      </div>
    </div>
  );
}
