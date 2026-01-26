import Card from '../../components/Card/Card';
import './Leaderboard.scss';

export default function LeaderboardPage() {
  return (
    <div className="leaderboard-page">
      <div className="page-header">
        <h1>🏆 Ranking</h1>
        <p>Veja os melhores palpites</p>
      </div>

      <Card>
        <div className="coming-soon">
          <span className="emoji">📊</span>
          <h2>Em Desenvolvimento</h2>
          <p>O ranking dos melhores palpites em breve.</p>
        </div>
      </Card>
    </div>
  );
}
