import { INITIAL_KNOCKOUT_GAMES, resolveKnockoutGames } from './mataMataService.js';

const resolvedOfficialGames = resolveKnockoutGames(INITIAL_KNOCKOUT_GAMES);

export const PHASE3_RESULTS = resolvedOfficialGames.reduce((acc, match) => {
  acc[match.id] = {
    teamA: match.mandante || '',
    teamB: match.visitante || '',
    scoreA: match.officialM,
    scoreB: match.officialV,
    winner: match.winner || '',
  };
  return acc;
}, {});
