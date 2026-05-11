import { useEffect, useState } from 'react';
import Card from '../../components/Card/Card';
import { useAuth } from '../../context/AuthContext';
import { rankingService } from '../../services/rankingService';
import './leaderboard.scss';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const leaderboardData = await rankingService.getLeaderboard(100);
      setLeaderboard(leaderboardData || []);
    } catch (err) {
      console.error('Erro ao carregar ranking:', err);
      setError(err.message || 'Erro ao carregar ranking');
    } finally {
      setLoading(false);
    }
  };

  const refreshLeaderboard = async () => {
    try {
      setRefreshing(true);
      setError(null);
      await rankingService.refreshLeaderboard({ token });
      await loadLeaderboard();
    } catch (err) {
      console.error('Erro ao atualizar ranking:', err);
      setError(err.message || 'Erro ao atualizar ranking');
    } finally {
      setRefreshing(false);
    }
  };

  const getMedalEmoji = (position) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return '•';
  };

  return (
    <div className="leaderboard-page">
      <div className="page-header">
        <h1>🏆 Ranking</h1>
        <p>Veja os melhores palpites</p>
        {isAuthenticated && (
          <button className="btn btn-secondary leaderboard-refresh" onClick={refreshLeaderboard} disabled={refreshing || loading}>
            {refreshing ? 'Atualizando...' : 'Atualizar ranking'}
          </button>
        )}
      </div>

      {loading && (
        <Card>
          <div className="loading-state">
            <p>Carregando ranking...</p>
          </div>
        </Card>
      )}

      {error && (
        <Card>
          <div className="error-state">
            <p>Erro ao carregar ranking: {error}</p>
            <button className="btn btn-primary" onClick={loadLeaderboard}>
              Tentar novamente
            </button>
          </div>
        </Card>
      )}

      {!loading && !error && leaderboard.length === 0 && (
        <Card>
          <div className="empty-state">
            <span className="emoji">📊</span>
            <h2>Nenhum ranking ainda</h2>
            <p>Comece a fazer palpites para aparecer no ranking!</p>
          </div>
        </Card>
      )}

      {!loading && !error && leaderboard.length > 0 && (
        <Card>
          <div className="leaderboard-table-wrapper">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th className="col-rank">Posição</th>
                  <th className="col-name">Nome</th>
                  <th className="col-phase">F1</th>
                  <th className="col-phase">F2</th>
                  <th className="col-phase">F3</th>
                  <th className="col-score">Pontuação</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => (
                  <tr key={entry.userId} className={`rank-${entry.position}`}>
                    <td className="col-rank">
                      <span className="medal">{getMedalEmoji(entry.position)}</span>
                      <span className="position">#{entry.position}</span>
                    </td>
                    <td className="col-name">{entry.name}</td>
                    <td className="col-phase">{entry.phase1Score}</td>
                    <td className="col-phase">{entry.phase2Score}</td>
                    <td className="col-phase">{entry.phase3Score}</td>
                    <td className="col-score">
                      <strong>{entry.totalScore}</strong> pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
