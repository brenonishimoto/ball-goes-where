import { PHASE3_MATCHES } from './phase3Bracket.js';

export const KNOCKOUT_CODE_TO_TEAM = {
  'Vencedor Grupo A': 'México',
  'Vencedor Grupo B': 'Suíça',
  'Vencedor Grupo C': 'Brasil',
  'Vencedor Grupo D': 'Estados Unidos',
  'Vencedor Grupo E': 'Alemanha',
  'Vencedor Grupo F': 'Holanda',
  'Vencedor Grupo G': 'Bélgica',
  'Vencedor Grupo H': 'Espanha',
  'Vencedor Grupo I': 'França',
  'Vencedor Grupo J': 'Argentina',
  'Vencedor Grupo K': 'Colômbia',
  'Vencedor Grupo L': 'Inglaterra',
  '2o Grupo A': 'África do Sul',
  '2o Grupo B': 'Canadá',
  '2o Grupo C': 'Paraguai',
  '2o Grupo D': 'Austrália',
  '2o Grupo E': 'Costa do Marfim',
  '2o Grupo F': 'Japão',
  '2o Grupo G': 'Egito',
  '2o Grupo H': 'Cabo Verde',
  '2o Grupo I': 'Noruega',
  '2o Grupo J': 'Áustria',
  '2o Grupo K': 'Portugal',
  '2o Grupo L': 'Croácia',
};

// Preencha aqui os classificados via regra de melhores 3os colocados,
// usando exatamente o slot presente em PHASE3_MATCHES.
export const KNOCKOUT_BEST_THIRD_BY_SLOT = {
  '3o Grupo A/D/C/F/H': 'Argélia',
  '3o Grupo C/D/F/G/H': 'Suécia',
  '3o Grupo B/E/F/I/J': 'Bósnia e Herzegovina',
  '3o Grupo A/E/H/I/J': 'Senegal',
  '3o Grupo C/E/F/H/I': 'Equador',
  '3o Grupo D/H/I/J/K': 'Rep. Democrática do Congo',
  '3o Grupo C/G/I/J': 'Marrocos',
  '3o Grupo D/E/I/J/L': 'Gana',
};

const KNOCKOUT_OFFICIAL_RESULTS = {
  // Domingo, 28 de junho de 2026
  75: { officialM: 0, officialV: 1, winner: 'B' }, // África do Sul x Canadá

  // Segunda-feira, 29 de junho de 2026
  73: { officialM: 2, officialV: 0, winner: 'A' }, // Suíça x Argélia
  76: { officialM: 1, officialV: 1, winner: 'B' }, // Alemanha x Paraguai
  81: { officialM: 2, officialV: 1, winner: 'A' }, // Brasil x Japão

  // Terça-feira, 30 de junho de 2026
  74: { officialM: 3, officialV: 0, winner: 'A' }, // França x Suécia
  82: { officialM: 1, officialV: 2, winner: 'B' }, // Costa do Marfim x Noruega
  83: { officialM: 2, officialV: 0, winner: 'A' }, // México x Equador

  // Quarta-feira, 1º de julho de 2026
  79: { officialM: 2, officialV: 0, winner: 'A' }, // Estados Unidos x Bósnia e Herzegovina
  80: { officialM: 3, officialV: 2, winner: 'A' }, // Bélgica x Senegal
  84: { officialM: 2, officialV: 1, winner: 'A' }, // Inglaterra x Rep. Democrática do Congo

  // Quinta-feira, 2 de julho de 2026
  77: { officialM: 2, officialV: 1, winner: 'A' }, // Portugal x Croácia
  78: { officialM: 3, officialV: 0, winner: 'A' }, // Espanha x Áustria
  87: { officialM: 1, officialV: 1, winner: 'B' }, // Holanda x Marrocos

  // Sexta-feira, 3 de julho de 2026
  85: { officialM: 3, officialV: 2, winner: 'A' }, // Argentina x Cabo Verde
  86: { officialM: 1, officialV: 1, winner: 'B' }, // Austrália x Egito
  88: { officialM: 1, officialV: 0, winner: 'A' }, // Colômbia x Gana

  // Oitavas de final
  // Sábado, 4 de julho de 2026
  89: { officialM: 0, officialV: 3, winner: 'B' }, // Canadá x Marrocos
  90: { officialM: 1, officialV: 0, winner: 'A' }, // França x Paraguai

  // Domingo, 5 de julho de 2026
  93: { officialM: null, officialV: null, winner: '' }, // Brasil x Noruega
  94: { officialM: null, officialV: null, winner: '' }, // México x Inglaterra

  // Segunda-feira, 6 de julho de 2026
  91: { officialM: null, officialV: null, winner: '' }, // Portugal x Espanha
  92: { officialM: null, officialV: null, winner: '' }, // Estados Unidos x Bélgica

  // Terça-feira, 7 de julho de 2026
  95: { officialM: null, officialV: null, winner: '' }, // Vencedor Jogo 85 x Vencedor Jogo 86
  96: { officialM: null, officialV: null, winner: '' }, // Suíça x Vencedor Jogo 88
};

const resolveWinnerSide = (match) => {
  if (!match) return '';

  if (match.winner === 'A' || match.winner === 'B') {
    return match.winner;
  }

  if (match.officialM === null || match.officialM === undefined || match.officialV === null || match.officialV === undefined) {
    return '';
  }

  if (Number(match.officialM) > Number(match.officialV)) return 'A';
  if (Number(match.officialM) < Number(match.officialV)) return 'B';
  return '';
};

const resolveTeamFromCode = (code, resolvedById, codeToTeam, bestThirdBySlot) => {
  const winnerMatch = code.match(/^Vencedor Jogo (\d+)$/);
  if (winnerMatch) {
    const previous = resolvedById.get(Number(winnerMatch[1]));
    const winnerSide = resolveWinnerSide(previous);
    if (winnerSide === 'A') return previous?.mandante || '';
    if (winnerSide === 'B') return previous?.visitante || '';
    return '';
  }

  const loserMatch = code.match(/^Perdedor Jogo (\d+)$/);
  if (loserMatch) {
    const previous = resolvedById.get(Number(loserMatch[1]));
    const winnerSide = resolveWinnerSide(previous);
    if (winnerSide === 'A') return previous?.visitante || '';
    if (winnerSide === 'B') return previous?.mandante || '';
    return '';
  }

  const bestThirdMatch = code.match(/^3o Grupo /);
  if (bestThirdMatch) {
    return bestThirdBySlot[code] || '';
  }

  const groupSlotMatch = code.match(/^Vencedor Grupo |^2o Grupo /);
  if (groupSlotMatch) {
    return codeToTeam[code] || '';
  }

  return codeToTeam[code] || '';
};

export const buildInitialKnockoutGames = () => PHASE3_MATCHES.map((match) => {
  const official = KNOCKOUT_OFFICIAL_RESULTS[match.id] || {};

  return {
    id: match.id,
    round: match.round,
    date: match.date,
    hora: match.hora || '',
    city: match.city,
    mandanteCode: match.slotA,
    visitanteCode: match.slotB,
    officialM: official.officialM ?? null,
    officialV: official.officialV ?? null,
    winner: official.winner === 'A' || official.winner === 'B' ? official.winner : '',
  };
});

export const INITIAL_KNOCKOUT_GAMES = buildInitialKnockoutGames();

export const resolveKnockoutGames = (
  games = INITIAL_KNOCKOUT_GAMES,
  codeToTeam = KNOCKOUT_CODE_TO_TEAM,
  bestThirdBySlot = KNOCKOUT_BEST_THIRD_BY_SLOT
) => {
  const byId = new Map();

  return games.map((game) => {
    const resolved = {
      ...game,
      mandante: resolveTeamFromCode(game.mandanteCode, byId, codeToTeam, bestThirdBySlot),
      visitante: resolveTeamFromCode(game.visitanteCode, byId, codeToTeam, bestThirdBySlot),
    };

    byId.set(resolved.id, resolved);
    return resolved;
  });
};
