// Calcula pontos para a FASE 02 (Palpites de grupo)
// Acerto resultado (V/E/D): 3 pts
// Acerto placar exato: +2 pts (total 5 com resultado)
// Máximo por jogo: 5 pts
const calculatePhase02Score = (predictedM, predictedV, officialM, officialV) => {
  if (
    predictedM === null ||
    predictedV === null ||
    officialM === null ||
    officialV === null
  ) {
    return 0;
  }

  const pM = Number(predictedM);
  const pV = Number(predictedV);
  const oM = Number(officialM);
  const oV = Number(officialV);

  // Definir resultado predito e oficial
  const predictedResult = pM > pV ? 'win' : pM < pV ? 'loss' : 'draw';
  const officialResult = oM > oV ? 'win' : oM < oV ? 'loss' : 'draw';

  // Conferir acerto do resultado
  if (predictedResult !== officialResult) {
    return 0;
  }

  let points = 3;

  // Conferir acerto do placar exato
  if (pM === oM && pV === oV) {
    points += 2;
  }

  return points;
};

// Calcula pontos totais para um conjunto de palpites
const calculateTotalScore = (games) => {
  return games.reduce((total, game) => {
    const gamePoints = calculatePhase02Score(
      game.placarM,
      game.placarV,
      game.officialM,
      game.officialV
    );
    return total + gamePoints;
  }, 0);
};

export const scoringService = {
  calculatePhase02Score,
  calculateTotalScore,

  // Calcula score para envio ao backend
  calculateScorePayload(games) {
    return {
      totalScore: calculateTotalScore(games),
      phase02: calculateTotalScore(games), // FASE 02 é o único cálculo por enquanto
    };
  },
};
