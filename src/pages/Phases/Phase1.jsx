import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PHASE1_RESULTS } from '../../services/phase1Results';
import { phase1Service } from '../../services/phase1Service';
import './phase1.scss';

const phase1Sections = [
  {
    title: 'Troféus e Prêmios de Equipes',
    fields: [
      { key: 'champion', label: 'Campeão', placeholder: 'País campeão', points: 10, type: 'text' },
      { key: 'fairPlay', label: 'Fair Play', placeholder: 'Melhor comportamento', points: 7, type: 'text' },
    ],
  },
  {
    title: 'Troféus e Prêmios de Jogadores',
    fields: [
      { key: 'goldenBall', label: 'Bola de Ouro', placeholder: 'Melhor jogador', points: 10, type: 'text' },
      { key: 'goldenBoot', label: 'Chuteira de Ouro', placeholder: 'Artilheiro', points: 10, type: 'text' },
      { key: 'totalGoals', label: 'Nº de Gols', placeholder: 'Total de gols', points: 5, type: 'number' },
      { key: 'assists', label: 'Garçom', placeholder: 'Mais assistências', points: 8, type: 'text' },
      { key: 'revelation', label: 'Revelação', placeholder: 'Melhor revelação', points: 7, type: 'text' },
    ],
  },
];

const phase1Fields = phase1Sections.flatMap((section) => section.fields);
const totalAvailablePoints = phase1Fields.reduce((total, field) => total + field.points, 0);

const emptyPredictions = {
  champion: '',
  goldenBall: '',
  goldenBoot: '',
  totalGoals: '',
  assists: '',
  fairPlay: '',
  revelation: '',
};

const normalizePredictions = (value) => {
  if (typeof value === 'string' && value.trim()) {
    try {
      return normalizePredictions(JSON.parse(value));
    } catch {
      return { ...emptyPredictions };
    }
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const predictionValues = { ...value };
    delete predictionValues[0];
    delete predictionValues[1];
    return { ...emptyPredictions, ...predictionValues };
  }

  return { ...emptyPredictions };
};

const normalizeComparableValue = (value) => String(value ?? '')
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

const getFieldStatus = (field, predictions) => {
  const officialResult = PHASE1_RESULTS[field.key];

  if (!normalizeComparableValue(officialResult)) {
    return {
      status: 'pending',
      label: 'Resultado: ---',
      points: 0,
    };
  }

  const isCorrect = normalizeComparableValue(predictions[field.key]) === normalizeComparableValue(officialResult);

  return {
    status: isCorrect ? 'correct' : 'wrong',
    label: `Resultado: ${officialResult}`,
    points: isCorrect ? field.points : 0,
  };
};

const calculatePhase1Points = (predictions) => phase1Fields.reduce(
  (total, field) => total + getFieldStatus(field, predictions).points,
  0
);

export default function Phase1Page() {
  const { user, token } = useAuth();
  const { pushToast } = useToast();
  const [predictions, setPredictions] = useState(emptyPredictions);

  const [localStorageKey] = useState('phase1-predictions');
  const [isSaving, setIsSaving] = useState(false);
  const earnedPoints = calculatePhase1Points(predictions);

  // Load predictions on mount / when auth changes
  useEffect(() => {
    const loadPredictions = async () => {
      // If user is authenticated, load from server
      if (token && user?.id) {
        const serverData = await phase1Service.getPredictions(token);
        if (serverData?.phase1_predictions && Object.keys(serverData.phase1_predictions).length > 0) {
          const normalizedPredictions = normalizePredictions(serverData.phase1_predictions);
          setPredictions(normalizedPredictions);
          localStorage.setItem(localStorageKey, JSON.stringify(normalizedPredictions));
          return;
        }
      }

      // Otherwise, try to load from localStorage
      const saved = localStorage.getItem(localStorageKey);
      if (saved) {
        try {
          setPredictions(normalizePredictions(saved));
        } catch (error) {
          console.error('Erro ao carregar previsões do localStorage:', error);
        }
      } else {
        setPredictions(emptyPredictions);
      }
    };

    loadPredictions();
  }, [token, user?.id, localStorageKey]);

  // Quando deslogar enquanto está na página da Phase 1, limpar os campos imediatamente
  useEffect(() => {
    if (!token || !user?.id) {
      setPredictions(emptyPredictions);
      try {
        localStorage.removeItem(localStorageKey);
      } catch {
        // ignore
      }
    }
  }, [token, user?.id, localStorageKey]);

  // Save predictions locally while typing
  const handleChange = (field, value) => {
    const updated = { ...normalizePredictions(predictions), [field]: value };
    setPredictions(updated);

    localStorage.setItem(localStorageKey, JSON.stringify(updated));
  };

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    const normalizedPredictions = normalizePredictions(predictions);
    localStorage.setItem(localStorageKey, JSON.stringify(normalizedPredictions));

    if (!token || !user?.id) {
      pushToast({ type: 'warning', message: 'Faça login para salvar no banco.' });
      return;
    }

    setIsSaving(true);

    try {
      const success = await phase1Service.savePredictions(token, normalizedPredictions);

      if (success) {
        pushToast({ type: 'success', message: 'Salvo no banco com sucesso.' });
        return;
      }

      pushToast({ type: 'error', message: 'Não foi possível salvar no banco.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    const cleared = { ...emptyPredictions };
    setPredictions(cleared);
    localStorage.setItem(localStorageKey, JSON.stringify(cleared));
  };

  return (
    <div className="phase1-page">
      <section className="phase1-header">
        <div className="hero-copy">
          <span className="eyebrow">FASE 01: PRÉ-COPA</span>
          <h1>Antes da Bola Rolar, Já Tem Pontos em Jogo</h1>
          <p>Faça suas previsões sobre os troféus e prêmios individuais antes do início do torneio.</p>
        </div>

        <div className="phase1-score-card" aria-live="polite">
          <span className="phase1-score-value">{earnedPoints}/{totalAvailablePoints}</span>
          <span className="phase1-score-label">Pontos</span>
        </div>
      </section>

      <section className="phase1-content">
        <div className="phase1-container">
          {phase1Sections.map((section) => (
            <div className="prediction-section" key={section.title}>
              <h2 className="section-title">{section.title}</h2>
              <div className="predictions-grid">
                {section.fields.map((field) => {
                  const result = getFieldStatus(field, predictions);

                  return (
                    <div className="prediction-card" key={field.key}>
                      <div className="card-header">
                        <span className="card-title">{field.label}</span>
                        <span className="card-points">{field.points} pts</span>
                      </div>
                      <input
                        type={field.type}
                        placeholder={field.placeholder}
                        value={predictions[field.key]}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        className="prediction-input"
                      />
                      <div className={`prediction-result prediction-result-${result.status}`}>
                        <span className="prediction-result-label">{result.label}</span>
                        {result.status !== 'pending' ? (
                          <span className="prediction-result-points">{result.points} pts</span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Botões de Ação */}
          <div className="phase1-actions">
            <button type="button" className="btn-save" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
