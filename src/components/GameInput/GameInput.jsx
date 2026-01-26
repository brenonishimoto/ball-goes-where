import './GameInput.scss';

export default function GameInput({
  game,
  onScoreChange,
  onRemove,
  showRemove = true,
}) {
  const handleMandanteChange = (e) => {
    onScoreChange(game.id, e.target.value, game.placarV);
  };

  const handleVisitanteChange = (e) => {
    onScoreChange(game.id, game.placarM, e.target.value);
  };

  return (
    <div className="game-input">
      <div className="game-header">
        <span className="game-phase">{game.fase}</span>
      </div>

      <div className="game-content">
        <div className="teams-section">
          <div className="team">
            <span className="team-name">{game.mandante}</span>
            <span className="team-label">Mandante</span>
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
            <span className="team-label">Visitante</span>
          </div>
        </div>

        {showRemove && (
          <button
            onClick={() => onRemove(game.id)}
            className="btn-remove"
            title="Remover jogo"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
