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
  if (prediction?.winner === 'A') return prediction.teamA;
  if (prediction?.winner === 'B') return prediction.teamB;
  return '';
};

const isOfficialResultReady = (official) => (
  official &&
  normalizeName(official.teamA) &&
  normalizeName(official.teamB) &&
  hasScore(official.scoreA) &&
  hasScore(official.scoreB) &&
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
  const officialWinner = normalizeName(official.winner === 'A' ? official.teamA : official.teamB);
  const classified = Boolean(predictedWinner && predictedWinner === officialWinner);

  const exactScore = hasScore(prediction?.scoreA)
    && hasScore(prediction?.scoreB)
    && Number(prediction?.scoreA) === Number(official.scoreA)
    && Number(prediction?.scoreB) === Number(official.scoreB);

  const result = regulationResult(prediction?.scoreA, prediction?.scoreB)
    === regulationResult(official.scoreA, official.scoreB);

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
