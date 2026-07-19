import { PHASE1_RESULTS } from './phase1Results.js';

export const PHASE1_FIELDS = [
  { key: 'champion', label: 'Campeão', points: 10 },
  { key: 'fairPlay', label: 'Fair Play', points: 7 },
  { key: 'goldenBall', label: 'Bola de Ouro', points: 10 },
  { key: 'goldenBoot', label: 'Chuteira de Ouro', points: 10 },
  { key: 'totalGoals', label: 'Nº de Gols', points: 5 },
  { key: 'assists', label: 'Garçom', points: 8 },
  { key: 'revelation', label: 'Revelação', points: 7 },
];

export const normalizeComparableValue = (value) => String(value ?? '')
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

export const calculatePhase1FieldScore = (fieldKey, predictionValue, officialResult) => {
  const normOfficial = normalizeComparableValue(officialResult);
  if (!normOfficial) {
    return { status: 'pending', points: 0 };
  }

  const isCorrect = normalizeComparableValue(predictionValue) === normOfficial;
  const fieldConfig = PHASE1_FIELDS.find((f) => f.key === fieldKey);
  const maxPoints = fieldConfig ? fieldConfig.points : 0;

  return {
    status: isCorrect ? 'correct' : 'wrong',
    points: isCorrect ? maxPoints : 0,
  };
};

export const calculatePhase1TotalScore = (predictions, results = PHASE1_RESULTS) => {
  if (!predictions || typeof predictions !== 'object') return 0;
  return PHASE1_FIELDS.reduce((total, field) => {
    const fieldScore = calculatePhase1FieldScore(field.key, predictions[field.key], results?.[field.key]);
    return total + fieldScore.points;
  }, 0);
};
