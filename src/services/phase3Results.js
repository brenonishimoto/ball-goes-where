import { PHASE3_MATCHES } from './phase3Bracket.js';

// Preencha aqui os resultados oficiais da Fase 3 para validar os palpites.
// scoreA/scoreB representam o placar usado na regra "resultado no tempo normal".
// Em empate, defina winner como 'A' ou 'B' para indicar o classificado nos penaltis.
const emptyResult = {
  teamA: '',
  teamB: '',
  scoreA: null,
  scoreB: null,
  winner: '',
};

export const PHASE3_RESULTS = PHASE3_MATCHES.reduce((acc, match) => {
  acc[match.id] = { ...emptyResult };
  return acc;
}, {});
