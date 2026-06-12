import './GameInput.scss';
import Flag from '../Flag/Flag';
import { scoringService } from '../../services/scoringService';

export default function GameInput({
  game,
  onScoreChange,
}) {
  const gamePoints = scoringService.calculatePhase02Score(
    game.placarM,
    game.placarV,
    game.officialM,
    game.officialV,
  );

  const hasOfficialResult = game.officialM !== null && game.officialV !== null;

  const parseGameStartTimestamp = (g) => {
    if (!g || typeof g !== 'object') return null;
    const { data, hora } = g;
    if (!data || !hora) return null;

    // data: "Qui, 11/06/2026" (pt-BR)
    // hora: "16h00" (ou "00h00")
    const dateMatch = String(data).match(/(\d{2}\/\d{2}\/\d{4})/);
    const timeMatch = String(hora).match(/(\d{2})h(\d{2})/);
    if (!dateMatch || !timeMatch) return null;

    const [, ddmmyyyy] = dateMatch;
    const [dd, mm, yyyy] = ddmmyyyy.split('/');
    const [, HH, mm2] = timeMatch;

    return new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(HH), Number(mm2)).getTime();
  };

  const isLocked = (() => {
    const startMs = parseGameStartTimestamp(game);
    if (!startMs) return false;
    return Date.now() >= startMs;
  })();

  const handleMandanteChange = (e) => {
    if (isLocked) return;
    onScoreChange(game.id, e.target.value, game.placarV);
  };

  const handleVisitanteChange = (e) => {
    if (isLocked) return;
    onScoreChange(game.id, game.placarM, e.target.value);
  };

  return (
    <div className={`game-input${isLocked ? ' is-locked' : ''}`}>
      <div className="game-header">
        <div className="game-meta">
          <span>{game.data}</span>
          <span>{game.hora}</span>
        </div>
        <span className="game-phase">{game.fase}</span>
      </div>

      <div className="game-content">
        <div className="teams-section">
          <div className="team" title={game.mandante}>
            <Flag country={game.mandante} size="lg" />
          </div>

          <div className="score-inputs">
            <input
              type="number"
              min="0"
              max="99"
              value={game.placarM ?? ''}
              onChange={handleMandanteChange}
              placeholder="-"
              className="score-input"
              disabled={isLocked}
              aria-disabled={isLocked}
            />
            <span className="score-separator">-</span>
            <input
              type="number"
              min="0"
              max="99"
              value={game.placarV ?? ''}
              onChange={handleVisitanteChange}
              placeholder="-"
              className="score-input"
              disabled={isLocked}
              aria-disabled={isLocked}
            />
          </div>

          <div className="team" title={game.visitante}>
            <Flag country={game.visitante} size="lg" />
          </div>
        </div>

        {game.officialM !== null && game.officialV !== null && (
          <div className="official-score">
            <span className="official-label">Resultado:</span>
            <span className="official-result">{game.officialM}-{game.officialV}</span>
          </div>
        )}

        <div className="game-points" aria-live="polite">
          <span className="game-points-label">Pontuação no jogo:</span>
          {hasOfficialResult ? (
            <span className="game-points-value">{gamePoints} pts</span>
          ) : (
            <span className="game-points-pending">Aguardando resultado</span>
          )}
        </div>
      </div>
    </div>
  );
}

