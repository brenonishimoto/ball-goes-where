import { PHASE3_MATCHES } from './phase3Bracket.js';

export const KNOCKOUT_CODE_TO_TEAM = {
  'Vencedor Grupo A': '',
  'Vencedor Grupo B': '',
  'Vencedor Grupo C': '',
  'Vencedor Grupo D': '',
  'Vencedor Grupo E': '',
  'Vencedor Grupo F': '',
  'Vencedor Grupo G': '',
  'Vencedor Grupo H': '',
  'Vencedor Grupo I': '',
  'Vencedor Grupo J': '',
  'Vencedor Grupo K': '',
  'Vencedor Grupo L': '',
  '2o Grupo A': '',
  '2o Grupo B': '',
  '2o Grupo C': '',
  '2o Grupo D': '',
  '2o Grupo E': '',
  '2o Grupo F': '',
  '2o Grupo G': '',
  '2o Grupo H': '',
  '2o Grupo I': '',
  '2o Grupo J': '',
  '2o Grupo K': '',
  '2o Grupo L': '',
};

// Preencha aqui os classificados via regra de melhores 3os colocados,
// usando exatamente o slot presente em PHASE3_MATCHES.
export const KNOCKOUT_BEST_THIRD_BY_SLOT = {
  '3o Grupo A/D/C/F/H': '',
  '3o Grupo C/D/F/G/H': '',
  '3o Grupo B/E/F/I/J': '',
  '3o Grupo A/E/H/I/J': '',
  '3o Grupo C/E/F/H/I': '',
  '3o Grupo D/H/I/J/K': '',
  '3o Grupo C/G/I/J': '',
  '3o Grupo D/E/I/J/L': '',
};

const KNOCKOUT_OFFICIAL_RESULTS = {
  // Exemplo de preenchimento:
  // 73: { officialM: 2, officialV: 1, winner: 'A' },
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
