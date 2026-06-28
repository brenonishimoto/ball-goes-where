import { INITIAL_KNOCKOUT_GAMES, resolveKnockoutGames } from './mataMataService.js';

const resolvedOfficialGames = resolveKnockoutGames(INITIAL_KNOCKOUT_GAMES);

export const PHASE3_RESULTS = resolvedOfficialGames.reduce((acc, match) => {
  acc[match.id] = {
    mandante: match.mandante || '',
    visitante: match.visitante || '',
    placarM: match.officialM,
    placarV: match.officialV,
    winner: match.winner || '',
  };
  return acc;
}, {});
