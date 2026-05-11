import { useMemo, useState } from 'react';
import { PHASE3_ROUNDS } from '../../services/phase3Bracket';
import { INITIAL_KNOCKOUT_GAMES, resolveKnockoutGames } from '../../services/mataMataService';
import './mataMata.scss';

const isFinished = (match) => (
  match.officialM !== null
  && match.officialV !== null
  && (match.winner === 'A' || match.winner === 'B')
);

const formatResult = (match) => {
  if (match.officialM === null || match.officialV === null) {
    return '- x -';
  }
  return `${match.officialM} x ${match.officialV}`;
};

const getQualified = (match) => {
  if (match.winner === 'A') return match.mandante || 'A definir';
  if (match.winner === 'B') return match.visitante || 'A definir';
  return 'Pendente';
};

export default function MataMataPage() {
  const [activeRound, setActiveRound] = useState('round32');

  const officialMatches = useMemo(
    () => resolveKnockoutGames(INITIAL_KNOCKOUT_GAMES),
    []
  );

  const finishedCount = useMemo(
    () => officialMatches.filter(isFinished).length,
    [officialMatches]
  );

  return (
    <div className="mata-page">
      <section className="mata-header">
        <div className="hero-copy">
          <span className="eyebrow">MATA-MATA OFICIAL</span>
          <h1>Tabela do Mata-mata</h1>
          <p>Resultados oficiais do chaveamento com propagacao automatica para as fases seguintes.</p>
        </div>

        <div className="mata-stats" aria-live="polite">
          <div className="mata-stat-card">
            <span className="mata-stat-value">{finishedCount}</span>
            <span className="mata-stat-label">Finalizados</span>
          </div>
          <div className="mata-stat-card">
            <span className="mata-stat-value">{officialMatches.length - finishedCount}</span>
            <span className="mata-stat-label">Pendentes</span>
          </div>
          <div className="mata-stat-card">
            <span className="mata-stat-value">{officialMatches.length}</span>
            <span className="mata-stat-label">Jogos</span>
          </div>
        </div>
      </section>

      <div className="mata-tabs" role="tablist" aria-label="Rodadas do mata-mata">
        {PHASE3_ROUNDS.map((round) => (
          <button
            key={round.key}
            type="button"
            className={`mata-tab ${activeRound === round.key ? 'is-active' : ''}`}
            onClick={() => setActiveRound(round.key)}
          >
            {round.label}
          </button>
        ))}
      </div>

      <section className="mata-grid">
        {officialMatches.filter((match) => match.round === activeRound).map((match) => (
          <article className="mata-card" key={match.id}>
            <header className="mata-card-header">
              <div>
                <span className="mata-kicker">Jogo {match.id}</span>
                <h2>{match.date} - {match.city}</h2>
              </div>
              <span className={`mata-status ${isFinished(match) ? 'is-done' : 'is-pending'}`}>
                {isFinished(match) ? 'Finalizado' : 'Pendente'}
              </span>
            </header>

            <div className="mata-teams">
              <span>{match.mandante || 'A definir'}</span>
              <strong>{formatResult(match)}</strong>
              <span>{match.visitante || 'A definir'}</span>
            </div>

            <footer className="mata-footer">
              <span>Classificado: {getQualified(match)}</span>
            </footer>
          </article>
        ))}
      </section>
    </div>
  );
}
