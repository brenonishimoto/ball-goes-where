export const PHASE3_ROUNDS = [
  { key: 'round32', label: '16 avos', matchLabel: 'Jogo', maxPoints: 8 },
  { key: 'round16', label: 'Oitavas', matchLabel: 'Jogo', maxPoints: 8 },
  { key: 'quarterfinals', label: 'Quartas', matchLabel: 'Jogo', maxPoints: 8 },
  { key: 'semifinals', label: 'Semifinais', matchLabel: 'Jogo', maxPoints: 8 },
  { key: 'thirdPlace', label: '3o Lugar', matchLabel: 'Jogo', maxPoints: 8 },
  { key: 'final', label: 'Final', matchLabel: 'Jogo', maxPoints: 8 },
];

export const PHASE3_MATCHES = [
  { id: 73, round: 'round32', date: '29/06', city: 'Foxborough', slotA: 'Vencedor Grupo B', slotB: '3o Grupo A/D/C/F/H', next: 89 },
  { id: 74, round: 'round32', date: '30/06', city: 'East Rutherford', slotA: 'Vencedor Grupo I', slotB: '3o Grupo C/D/F/G/H', next: 90 },
  { id: 75, round: 'round32', date: '28/06', city: 'Inglewood', slotA: '2o Grupo A', slotB: '2o Grupo B', next: 89 },
  { id: 76, round: 'round32', date: '29/06', city: 'Guadalupe', slotA: 'Vencedor Grupo E', slotB: '2o Grupo C', next: 90 },
  { id: 77, round: 'round32', date: '02/07', city: 'Toronto', slotA: '2o Grupo K', slotB: '2o Grupo L', next: 91 },
  { id: 78, round: 'round32', date: '02/07', city: 'Inglewood', slotA: 'Vencedor Grupo H', slotB: '2o Grupo J', next: 91 },
  { id: 79, round: 'round32', date: '01/07', city: 'Santa Clara', slotA: 'Vencedor Grupo D', slotB: '3o Grupo B/E/F/I/J', next: 92 },
  { id: 80, round: 'round32', date: '01/07', city: 'Seattle', slotA: 'Vencedor Grupo G', slotB: '3o Grupo A/E/H/I/J', next: 92 },
  { id: 81, round: 'round32', date: '29/06', city: 'Houston', slotA: 'Vencedor Grupo C', slotB: '2o Grupo F', next: 93 },
  { id: 82, round: 'round32', date: '30/06', city: 'Arlington', slotA: '2o Grupo E', slotB: '2o Grupo I', next: 93 },
  { id: 83, round: 'round32', date: '30/06', city: 'Mexico City', slotA: 'Vencedor Grupo A', slotB: '3o Grupo C/E/F/H/I', next: 94 },
  { id: 84, round: 'round32', date: '01/07', city: 'Atlanta', slotA: 'Vencedor Grupo L', slotB: '3o Grupo D/H/I/J/K', next: 94 },
  { id: 85, round: 'round32', date: '03/07', city: 'Miami Gardens', slotA: 'Vencedor Grupo J', slotB: '2o Grupo H', next: 95 },
  { id: 86, round: 'round32', date: '03/07', city: 'Arlington', slotA: '2o Grupo D', slotB: '2o Grupo G', next: 95 },
  { id: 87, round: 'round32', date: '02/07', city: 'Vancouver', slotA: 'Vencedor Grupo F', slotB: '3o Grupo C/G/I/J', next: 96 },
  { id: 88, round: 'round32', date: '03/07', city: 'Kansas City', slotA: 'Vencedor Grupo K', slotB: '3o Grupo D/E/I/J/L', next: 96 },

  { id: 89, round: 'round16', date: '04/07', city: 'Philadelphia', slotA: 'Vencedor Jogo 73', slotB: 'Vencedor Jogo 75', next: 97 },
  { id: 90, round: 'round16', date: '04/07', city: 'Houston', slotA: 'Vencedor Jogo 74', slotB: 'Vencedor Jogo 76', next: 97 },
  { id: 91, round: 'round16', date: '06/07', city: 'Arlington', slotA: 'Vencedor Jogo 77', slotB: 'Vencedor Jogo 78', next: 98 },
  { id: 92, round: 'round16', date: '06/07', city: 'Seattle', slotA: 'Vencedor Jogo 79', slotB: 'Vencedor Jogo 80', next: 98 },
  { id: 93, round: 'round16', date: '05/07', city: 'East Rutherford', slotA: 'Vencedor Jogo 81', slotB: 'Vencedor Jogo 82', next: 99 },
  { id: 94, round: 'round16', date: '05/07', city: 'Mexico City', slotA: 'Vencedor Jogo 83', slotB: 'Vencedor Jogo 84', next: 99 },
  { id: 95, round: 'round16', date: '07/07', city: 'Atlanta', slotA: 'Vencedor Jogo 85', slotB: 'Vencedor Jogo 86', next: 100 },
  { id: 96, round: 'round16', date: '07/07', city: 'Vancouver', slotA: 'Vencedor Jogo 87', slotB: 'Vencedor Jogo 88', next: 100 },

  { id: 97, round: 'quarterfinals', date: '09/07', city: 'Foxborough', slotA: 'Vencedor Jogo 89', slotB: 'Vencedor Jogo 90', next: 101 },
  { id: 98, round: 'quarterfinals', date: '10/07', city: 'Inglewood', slotA: 'Vencedor Jogo 91', slotB: 'Vencedor Jogo 92', next: 101 },
  { id: 99, round: 'quarterfinals', date: '11/07', city: 'Miami Gardens', slotA: 'Vencedor Jogo 93', slotB: 'Vencedor Jogo 94', next: 102 },
  { id: 100, round: 'quarterfinals', date: '11/07', city: 'Kansas City', slotA: 'Vencedor Jogo 95', slotB: 'Vencedor Jogo 96', next: 102 },

  { id: 101, round: 'semifinals', date: '14/07', city: 'Arlington', slotA: 'Vencedor Jogo 97', slotB: 'Vencedor Jogo 98', next: 103, loserNext: 104 },
  { id: 102, round: 'semifinals', date: '15/07', city: 'Atlanta', slotA: 'Vencedor Jogo 99', slotB: 'Vencedor Jogo 100', next: 103, loserNext: 104 },
  { id: 104, round: 'thirdPlace', date: '18/07', city: 'Miami Gardens', slotA: 'Perdedor Jogo 101', slotB: 'Perdedor Jogo 102' },
  { id: 103, round: 'final', date: '19/07', city: 'East Rutherford', slotA: 'Vencedor Jogo 101', slotB: 'Vencedor Jogo 102' },
];

export const EMPTY_PHASE3_MATCH = {
  teamA: '',
  teamB: '',
  scoreA: '',
  scoreB: '',
  winner: '',
};

export const buildEmptyPhase3Predictions = () => PHASE3_MATCHES.reduce((acc, match) => {
  acc[match.id] = { ...EMPTY_PHASE3_MATCH };
  return acc;
}, {});

export const normalizePhase3Predictions = (value) => {
  if (typeof value === 'string' && value.trim()) {
    try {
      return normalizePhase3Predictions(JSON.parse(value));
    } catch {
      return buildEmptyPhase3Predictions();
    }
  }

  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};

  return PHASE3_MATCHES.reduce((acc, match) => {
    const prediction = source[match.id] || source[String(match.id)] || {};

    acc[match.id] = {
      teamA: String(prediction.teamA ?? ''),
      teamB: String(prediction.teamB ?? ''),
      scoreA: prediction.scoreA === null || prediction.scoreA === undefined ? '' : String(prediction.scoreA),
      scoreB: prediction.scoreB === null || prediction.scoreB === undefined ? '' : String(prediction.scoreB),
      winner: prediction.winner === 'A' || prediction.winner === 'B' ? prediction.winner : '',
    };

    return acc;
  }, {});
};
