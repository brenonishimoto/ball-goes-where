import './GameInput.scss';
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
  const handleMandanteChange = (e) => {
    onScoreChange(game.id, e.target.value, game.placarV);
  };

  const handleVisitanteChange = (e) => {
    onScoreChange(game.id, game.placarM, e.target.value);
  };

  return (
    <div className="game-input">
      <div className="game-header">
        <div className="game-meta">
          <span>{game.data}</span>
          <span>{game.hora}</span>
        </div>
        <span className="game-phase">{game.fase}</span>
      </div>

      <div className="game-content">
        <div className="teams-section">
          <div className="team">
            <span className="team-name">{game.mandante}</span>
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
            />
          </div>

          <div className="team">
            <span className="team-name">{game.visitante}</span>
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
