import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  PHASE3_MATCHES,
  PHASE3_ROUNDS,
  normalizePhase3Predictions,
  isPhase3MatchStarted,
} from '../../services/phase3Bracket';
import { INITIAL_KNOCKOUT_GAMES, resolveKnockoutGames } from '../../services/mataMataService';
import { PHASE3_RESULTS } from '../../services/phase3Results';
import { calculatePhase3MatchScore, calculatePhase3TotalScore, calculatePhase3SlamsCount } from '../../services/phase3Scoring';
import { phase3Service } from '../../services/phase3Service';
import Flag from '../../components/Flag/Flag';
import './phase3.scss';

const LOCAL_STORAGE_KEY = 'phase3-predictions';

const isFilledMatch = (prediction) => (
  prediction?.mandante?.trim()
  && prediction?.visitante?.trim()
  && prediction?.placarM !== ''
  && prediction?.placarV !== ''
  && prediction?.winner
);

const formatOfficialResult = (official) => {
  if (!official?.mandante || !official?.visitante || official.placarM === null || official.placarV === null) {
    return 'Resultado oficial pendente';
  }

  const decidedOnPenalties = Number(official.placarM) === Number(official.placarV);
  return `${official.mandante} ${official.placarM} x ${official.placarV} ${official.visitante}${decidedOnPenalties ? ' (pen.)' : ''}`;
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

  const sortedMatches = useMemo(() => {
    return [...PHASE3_MATCHES].sort((a, b) => {
      const dateA = a.date.split('/').reverse().join('/');
      const dateB = b.date.split('/').reverse().join('/');
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }
      return a.id - b.id;
    });
  }, []);

  const formatSlotLabel = useCallback((slot) => {
    return slot;
  }, []);

  useEffect(() => {
    setPredictions((current) => {
      const normalized = normalizePhase3Predictions(current);
      let changed = false;

      const nextPredictions = PHASE3_MATCHES.reduce((acc, match) => {
        const prediction = { ...normalized[match.id] };

        const knockoutMatch = knockoutById.get(match.id);
        const fixedTeamA = knockoutMatch?.mandante || '';
        const fixedTeamB = knockoutMatch?.visitante || '';

        if (prediction.mandante !== fixedTeamA) {
          prediction.mandante = fixedTeamA;
          changed = true;
        }

        if (prediction.visitante !== fixedTeamB) {
          prediction.visitante = fixedTeamB;
          changed = true;
        }

        if (prediction.winner === 'A' && !prediction.mandante) {
          prediction.winner = '';
          changed = true;
        }

        if (prediction.winner === 'B' && !prediction.visitante) {
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
  }, [knockoutById, predictions]);

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
    const match = matchById.get(matchId);
    if (isPhase3MatchStarted(match)) {
      pushToast({ type: 'error', message: 'Esse jogo já começou. Não é possível alterar o palpite.' });
      return;
    }

    setPredictions((current) => {
      const normalized = normalizePhase3Predictions(current);
      const updated = {
        ...normalized,
        [matchId]: {
          ...normalized[matchId],
          [field]: value,
        },
      };

      if (field === 'placarM' || field === 'placarV') {
        const placarM = field === 'placarM' ? value : updated[matchId].placarM;
        const placarV = field === 'placarV' ? value : updated[matchId].placarV;

        if (placarM !== '' && placarV !== '' && Number(placarM) !== Number(placarV)) {
          updated[matchId].winner = Number(placarM) > Number(placarV) ? 'A' : 'B';
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
          {sortedMatches.filter((match) => match.round === activeRound).map((match) => {
            const prediction = predictions[match.id];
            const official = PHASE3_RESULTS[match.id];
            const score = calculatePhase3MatchScore(prediction, official);
            const started = isPhase3MatchStarted(match);

            return (
              <article className={`phase3-match-card ${started ? 'is-started' : ''}`} key={match.id}>
              <header className="phase3-match-header">
                <div>
                  <h2>
                    {match.date}{match.hora ? ` - ${match.hora}` : ''} - {match.city}
                  </h2>
                </div>
                <span className={`phase3-match-points phase3-match-points-${score.status}`}>
                  {score.points} pts
                </span>
              </header>

              <div className="phase3-score-box">
                <div className="phase3-team-row">
                  <label>
                    <span>{formatSlotLabel(match.slotA)}</span>
                    <div className="phase3-team-value" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      {prediction.mandante && <Flag country={prediction.mandante} size="sm" />}
                      <span>{prediction.mandante || 'A definir'}</span>
                    </div>
                  </label>
                  <input
                    className="phase3-score-input"
                    type="number"
                    min="0"
                    value={prediction.placarM}
                    disabled={started}
                    onChange={(event) => updatePrediction(match.id, 'placarM', event.target.value)}
                    aria-label={`Placar de ${prediction.mandante || match.slotA}`}
                  />
                </div>

                <div className="phase3-team-row">
                  <label>
                    <span>{formatSlotLabel(match.slotB)}</span>
                    <div className="phase3-team-value" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      {prediction.visitante && <Flag country={prediction.visitante} size="sm" />}
                      <span>{prediction.visitante || 'A definir'}</span>
                    </div>
                  </label>
                  <input
                    className="phase3-score-input"
                    type="number"
                    min="0"
                    value={prediction.placarV}
                    disabled={started}
                    onChange={(event) => updatePrediction(match.id, 'placarV', event.target.value)}
                    aria-label={`Placar de ${prediction.visitante || match.slotB}`}
                  />
                </div>
              </div>

              <div className="phase3-winner-group">
                <span>Classificado</span>
                <div className="phase3-segmented">
                  <button
                    type="button"
                    className={prediction.winner === 'A' ? 'is-active' : ''}
                    disabled={started}
                    onClick={() => updatePrediction(match.id, 'winner', 'A')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    {prediction.mandante && <Flag country={prediction.mandante} size="sm" />}
                    <span>{prediction.mandante || 'Time A'}</span>
                  </button>
                  <button
                    type="button"
                    className={prediction.winner === 'B' ? 'is-active' : ''}
                    disabled={started}
                    onClick={() => updatePrediction(match.id, 'winner', 'B')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    {prediction.visitante && <Flag country={prediction.visitante} size="sm" />}
                    <span>{prediction.visitante || 'Time B'}</span>
                  </button>
                </div>
              </div>

              {score.status === 'pending' ? (
                <footer className="phase3-result is-pending">
                  <span className="result-title">Placar Oficial</span>
                  <span className="result-pending-tag">Aguardando</span>
                </footer>
              ) : (
                <footer className="phase3-result is-ready">
                  <div className="result-header">
                    <span className="result-label">Placar Oficial</span>
                    {Number(official.placarM) === Number(official.placarV) && (
                      <span className="penalty-badge">Pênaltis</span>
                    )}
                  </div>
                  <div className="result-scoreboard">
                    <div className={`result-team ${official.winner === 'A' ? 'is-winner' : ''}`}>
                      {official.mandante && <Flag country={official.mandante} size="sm" />}
                      <span className="team-name">{official.mandante}</span>
                    </div>
                    <div className="result-score">
                      <span className="score-num">{official.placarM}</span>
                      <span className="score-divider">x</span>
                      <span className="score-num">{official.placarV}</span>
                    </div>
                    <div className={`result-team ${official.winner === 'B' ? 'is-winner' : ''}`}>
                      <span className="team-name">{official.visitante}</span>
                      {official.visitante && <Flag country={official.visitante} size="sm" />}
                    </div>
                  </div>
                  {Number(official.placarM) === Number(official.placarV) && (
                    <div className="penalty-winner">
                      Classificado: <strong>{official.winner === 'A' ? official.mandante : official.visitante}</strong>
                    </div>
                  )}
                  <div className="points-breakdown">
                    <div className={`breakdown-chip ${score.classified ? 'is-correct' : 'is-incorrect'}`}>
                      <span className="chip-label">Classificado</span>
                      <span className="chip-value">{score.classified ? '+4' : '+0'}</span>
                    </div>
                    <div className={`breakdown-chip ${score.exactScore ? 'is-correct' : 'is-incorrect'}`}>
                      <span className="chip-label">Placar</span>
                      <span className="chip-value">{score.exactScore ? '+3' : '+0'}</span>
                    </div>
                    <div className={`breakdown-chip ${score.result ? 'is-correct' : 'is-incorrect'}`}>
                      <span className="chip-label">Resultado</span>
                      <span className="chip-value">{score.result ? '+1' : '+0'}</span>
                    </div>
                  </div>
                </footer>
              )}
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
