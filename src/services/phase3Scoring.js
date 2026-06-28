const normalizeName = (value) => String(value ?? '')
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

const hasScore = (value) => value !== '' && value !== null && value !== undefined;

const regulationResult = (scoreA, scoreB) => {
  if (!hasScore(scoreA) || !hasScore(scoreB)) {
    return '';
  }

  const a = Number(scoreA);
  const b = Number(scoreB);

  if (Number.isNaN(a) || Number.isNaN(b)) {
    return '';
  }

  if (a > b) return 'A';
  if (a < b) return 'B';
  return 'D';
};

const getPredictedWinnerName = (prediction) => {
  if (prediction?.winner === 'A') return prediction.mandante;
  if (prediction?.winner === 'B') return prediction.visitante;
  return '';
};

const isOfficialResultReady = (official) => (
  official &&
  normalizeName(official.mandante) &&
  normalizeName(official.visitante) &&
  hasScore(official.placarM) &&
  hasScore(official.placarV) &&
  (official.winner === 'A' || official.winner === 'B')
);

export const calculatePhase3MatchScore = (prediction, official) => {
  if (!isOfficialResultReady(official)) {
    return {
      points: 0,
      status: 'pending',
      classified: false,
      exactScore: false,
      result: false,
    };
  }

  const predictedWinner = normalizeName(getPredictedWinnerName(prediction));
  const officialWinner = normalizeName(official.winner === 'A' ? official.mandante : official.visitante);
  const classified = Boolean(predictedWinner && predictedWinner === officialWinner);

  const exactScore = hasScore(prediction?.placarM)
    && hasScore(prediction?.placarV)
    && Number(prediction?.placarM) === Number(official.placarM)
    && Number(prediction?.placarV) === Number(official.placarV);

  const result = regulationResult(prediction?.placarM, prediction?.placarV)
    === regulationResult(official.placarM, official.placarV);

  const points = (classified ? 4 : 0) + (exactScore ? 3 : 0) + (result ? 1 : 0);

  return {
    points,
    status: points > 0 ? 'scored' : 'wrong',
    classified,
    exactScore,
    result,
  };
};

export const calculatePhase3TotalScore = (predictions, results) => Object.entries(results).reduce(
  (total, [matchId, official]) => total + calculatePhase3MatchScore(predictions?.[matchId], official).points,
  0
);

export const calculatePhase3SlamsCount = (predictions, results) => Object.entries(results).reduce(
  (count, [matchId, official]) => {
    const score = calculatePhase3MatchScore(predictions?.[matchId], official);
    // Cravada = todos os critérios perfeitos (8 pontos = 4 + 3 + 1)
    return count + (score.classified && score.exactScore && score.result ? 1 : 0);
  },
  0
);
