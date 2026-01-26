import Card from '../../components/Card/Card';
import './Predictions.scss';

export default function PredictionsPage() {
  return (
    <div className="predictions-page">
      <div className="page-header">
        <h1>🎯 Meus Palpites</h1>
        <p>Gerenciador de palpites e apostas</p>
      </div>

      <Card>
        <div className="coming-soon">
          <span className="emoji">🚀</span>
          <h2>Em Desenvolvimento</h2>
          <p>Esta página será usada para gerenciar seus palpites em detalhes.</p>
        </div>
      </Card>
    </div>
  );
}
