export const PHASE3_ROUNDS = [
  { key: 'round32', label: '16 avos', matchLabel: 'Jogo', maxPoints: 8 },
  { key: 'round16', label: 'Oitavas', matchLabel: 'Jogo', maxPoints: 8 },
  { key: 'quarterfinals', label: 'Quartas', matchLabel: 'Jogo', maxPoints: 8 },
  { key: 'semifinals', label: 'Semifinais', matchLabel: 'Jogo', maxPoints: 8 },
  { key: 'thirdPlace', label: '3o Lugar', matchLabel: 'Jogo', maxPoints: 8 },
  { key: 'final', label: 'Final', matchLabel: 'Jogo', maxPoints: 8 },
];

export const PHASE3_MATCHES = [
  { id: 73, round: 'round32', date: '03/07', hora: '00h00', city: 'Foxborough', slotA: 'Vencedor Grupo B', slotB: '3o Grupo A/D/C/F/H', next: 96 },
  { id: 74, round: 'round32', date: '30/06', hora: '18h00', city: 'East Rutherford', slotA: 'Vencedor Grupo I', slotB: '3o Grupo C/D/F/G/H', next: 90 },
  { id: 75, round: 'round32', date: '28/06', hora: '16h00', city: 'Inglewood', slotA: '2o Grupo A', slotB: '2o Grupo B', next: 89 },
  { id: 76, round: 'round32', date: '29/06', hora: '17h30', city: 'Guadalupe', slotA: 'Vencedor Grupo E', slotB: '2o Grupo C', next: 90 },
  { id: 77, round: 'round32', date: '02/07', hora: '20h00', city: 'Toronto', slotA: '2o Grupo K', slotB: '2o Grupo L', next: 91 },
  { id: 78, round: 'round32', date: '02/07', hora: '16h00', city: 'Inglewood', slotA: 'Vencedor Grupo H', slotB: '2o Grupo J', next: 91 },
  { id: 79, round: 'round32', date: '01/07', hora: '21h00', city: 'Santa Clara', slotA: 'Vencedor Grupo D', slotB: '3o Grupo B/E/F/I/J', next: 92 },
  { id: 80, round: 'round32', date: '01/07', hora: '17h00', city: 'Seattle', slotA: 'Vencedor Grupo G', slotB: '3o Grupo A/E/H/I/J', next: 92 },
  { id: 81, round: 'round32', date: '29/06', hora: '14h00', city: 'Houston', slotA: 'Vencedor Grupo C', slotB: '2o Grupo F', next: 93 },
  { id: 82, round: 'round32', date: '30/06', hora: '14h00', city: 'Arlington', slotA: '2o Grupo E', slotB: '2o Grupo I', next: 93 },
  { id: 83, round: 'round32', date: '30/06', hora: '22h00', city: 'Mexico City', slotA: 'Vencedor Grupo A', slotB: '3o Grupo C/E/F/H/I', next: 94 },
  { id: 84, round: 'round32', date: '01/07', hora: '13h00', city: 'Atlanta', slotA: 'Vencedor Grupo L', slotB: '3o Grupo D/H/I/J/K', next: 94 },
  { id: 85, round: 'round32', date: '03/07', hora: '19h00', city: 'Miami Gardens', slotA: 'Vencedor Grupo J', slotB: '2o Grupo H', next: 95 },
  { id: 86, round: 'round32', date: '03/07', hora: '15h00', city: 'Arlington', slotA: '2o Grupo D', slotB: '2o Grupo G', next: 95 },
  { id: 87, round: 'round32', date: '29/06', hora: '22h00', city: 'Vancouver', slotA: 'Vencedor Grupo F', slotB: '3o Grupo C/G/I/J', next: 89 },
  { id: 88, round: 'round32', date: '03/07', hora: '22h30', city: 'Kansas City', slotA: 'Vencedor Grupo K', slotB: '3o Grupo D/E/I/J/L', next: 96 },

  { id: 89, round: 'round16', date: '04/07', hora: '14h00', city: 'Philadelphia', slotA: 'Vencedor Jogo 75', slotB: 'Vencedor Jogo 87', next: 97 },
  { id: 90, round: 'round16', date: '04/07', hora: '18h00', city: 'Houston', slotA: 'Vencedor Jogo 74', slotB: 'Vencedor Jogo 76', next: 97 },
  { id: 91, round: 'round16', date: '06/07', hora: '16h00', city: 'Arlington', slotA: 'Vencedor Jogo 77', slotB: 'Vencedor Jogo 78', next: 98 },
  { id: 92, round: 'round16', date: '06/07', hora: '21h00', city: 'Seattle', slotA: 'Vencedor Jogo 79', slotB: 'Vencedor Jogo 80', next: 98 },
  { id: 93, round: 'round16', date: '05/07', hora: '17h00', city: 'East Rutherford', slotA: 'Vencedor Jogo 81', slotB: 'Vencedor Jogo 82', next: 99 },
  { id: 94, round: 'round16', date: '05/07', hora: '21h00', city: 'Mexico City', slotA: 'Vencedor Jogo 83', slotB: 'Vencedor Jogo 84', next: 99 },
  { id: 95, round: 'round16', date: '07/07', hora: '13h00', city: 'Atlanta', slotA: 'Vencedor Jogo 85', slotB: 'Vencedor Jogo 86', next: 100 },
  { id: 96, round: 'round16', date: '07/07', hora: '17h00', city: 'Vancouver', slotA: 'Vencedor Jogo 73', slotB: 'Vencedor Jogo 88', next: 100 },

  { id: 97, round: 'quarterfinals', date: '09/07', hora: '17h00', city: 'Foxborough', slotA: 'Vencedor Jogo 89', slotB: 'Vencedor Jogo 90', next: 101 },
  { id: 98, round: 'quarterfinals', date: '10/07', hora: '16h00', city: 'Inglewood', slotA: 'Vencedor Jogo 91', slotB: 'Vencedor Jogo 92', next: 101 },
  { id: 99, round: 'quarterfinals', date: '11/07', hora: '18h00', city: 'Miami Gardens', slotA: 'Vencedor Jogo 93', slotB: 'Vencedor Jogo 94', next: 102 },
  { id: 100, round: 'quarterfinals', date: '11/07', hora: '22h00', city: 'Kansas City', slotA: 'Vencedor Jogo 95', slotB: 'Vencedor Jogo 96', next: 102 },

  { id: 101, round: 'semifinals', date: '14/07', city: 'Arlington', slotA: 'Vencedor Jogo 97', slotB: 'Vencedor Jogo 98', next: 103, loserNext: 104 },
  { id: 102, round: 'semifinals', date: '15/07', city: 'Atlanta', slotA: 'Vencedor Jogo 99', slotB: 'Vencedor Jogo 100', next: 103, loserNext: 104 },
  { id: 104, round: 'thirdPlace', date: '18/07', city: 'Miami Gardens', slotA: 'Perdedor Jogo 101', slotB: 'Perdedor Jogo 102' },
  { id: 103, round: 'final', date: '19/07', city: 'East Rutherford', slotA: 'Vencedor Jogo 101', slotB: 'Vencedor Jogo 102' },
];

export const EMPTY_PHASE3_MATCH = {
  mandante: '',
  visitante: '',
  placarM: '',
  placarV: '',
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

    const mandante = prediction.mandante ?? prediction.teamA ?? '';
    const visitante = prediction.visitante ?? prediction.teamB ?? '';
    const placarM = prediction.placarM ?? prediction.scoreA ?? '';
    const placarV = prediction.placarV ?? prediction.scoreB ?? '';

    acc[match.id] = {
      mandante: String(mandante),
      visitante: String(visitante),
      placarM: placarM === null || placarM === undefined ? '' : String(placarM),
      placarV: placarV === null || placarV === undefined ? '' : String(placarV),
      winner: prediction.winner === 'A' || prediction.winner === 'B' ? prediction.winner : '',
    };

    return acc;
  }, {});
};

export const isPhase3MatchStarted = (match) => {
  if (!match || !match.date) return false;

  const [day, month] = match.date.split('/').map(Number);
  let hour = 0;
  let minute = 0;

  if (match.hora) {
    const timeMatch = match.hora.match(/(\d{2})h(\d{2})?/);
    if (timeMatch) {
      hour = Number(timeMatch[1]);
      minute = timeMatch[2] ? Number(timeMatch[2]) : 0;
    }
  }

  // Compara com a data/hora local
  const matchDate = new Date(2026, month - 1, day, hour, minute);
  return Date.now() >= matchDate.getTime();
};
