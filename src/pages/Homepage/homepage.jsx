import { useState } from 'react';
import { useGames } from '../../hooks/useGames';
import { calculateTotalPoints, countPredictions } from '../../utils/helpers';
import GameInput from '../../components/GameInput/GameInput';
import Button from '../../components/Button/Button';
import './Homepage.scss';

export default function HomePage() {
  const { games, addGame, updateScore, removeGame, save, clearData } = useGames();
  const [showForm, setShowForm] = useState(false);
  const [newGame, setNewGame] = useState({
    mandante: '',
    visitante: '',
    fase: 'Grupos',
  });

  const handleAddGame = (e) => {
    e.preventDefault();
    if (newGame.mandante.trim() && newGame.visitante.trim()) {
      addGame(newGame.mandante, newGame.visitante, newGame.fase);
      setNewGame({ mandante: '', visitante: '', fase: 'Grupos' });
      setShowForm(false);
    }
  };

  const totalPoints = calculateTotalPoints(games);
  const predictions = countPredictions(games);

  return (
    <div className="homepage">
      <div className="homepage-header">
        <div>
          <h1>⚽ Meus Palpites</h1>
          <p>Copa do Mundo 2026</p>
        </div>
        <div className="stats">
          <div className="stat">
            <span className="stat-value">{predictions}</span>
            <span className="stat-label">Palpites</span>
          </div>
          <div className="stat">
            <span className="stat-value">{totalPoints}</span>
            <span className="stat-label">Pontos</span>
          </div>
        </div>
      </div>

      {games.length === 0 ? (
        <div className="empty-state">
          <p>😴 Nenhum jogo adicionado ainda</p>
          <Button onClick={() => setShowForm(true)}>Adicionar Primeiro Jogo</Button>
        </div>
      ) : (
        <div className="games-grid">
          {games.map((game) => (
            <GameInput
              key={game.id}
              game={game}
              onScoreChange={updateScore}
              onRemove={removeGame}
            />
          ))}
        </div>
      )}

      {showForm && (
        <form className="add-game-form" onSubmit={handleAddGame}>
          <div className="form-group">
            <label htmlFor="mandante">Time Mandante</label>
            <input
              id="mandante"
              type="text"
              value={newGame.mandante}
              onChange={(e) => setNewGame({ ...newGame, mandante: e.target.value })}
              placeholder="Ex: Brasil"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="visitante">Time Visitante</label>
            <input
              id="visitante"
              type="text"
              value={newGame.visitante}
              onChange={(e) => setNewGame({ ...newGame, visitante: e.target.value })}
              placeholder="Ex: França"
            />
          </div>

          <div className="form-group">
            <label htmlFor="fase">Fase</label>
            <select
              id="fase"
              value={newGame.fase}
              onChange={(e) => setNewGame({ ...newGame, fase: e.target.value })}
            >
              <option>Grupos</option>
              <option>Oitavas</option>
              <option>Quartas</option>
              <option>Semifinal</option>
              <option>Final</option>
            </select>
          </div>

          <div className="form-actions">
            <Button type="submit" variant="success">
              ✓ Adicionar
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              ✕ Cancelar
            </Button>
          </div>
        </form>
      )}

      {!showForm && games.length > 0 && (
        <div className="homepage-actions">
          <Button onClick={() => setShowForm(true)} variant="outline">
            + Adicionar Jogo
          </Button>
          <Button onClick={save} variant="success">
            💾 Salvar
          </Button>
          <Button onClick={clearData} variant="danger">
            🗑️ Limpar Tudo
          </Button>
        </div>
      )}
    </div>
  );
}