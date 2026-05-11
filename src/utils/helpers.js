import { scoringService } from '../services/scoringService';

// Formatar resultado (ex: 2-1)
export const formatScore = (placarM, placarV) => {
  if (placarM === null || placarV === null) return '-';
  return `${placarM}-${placarV}`;
};

// Obter resultado textual
export const getResult = (placarM, placarV) => {
  if (placarM === null || placarV === null) return 'Não jogado';
  if (placarM > placarV) return 'Vitória';
  if (placarM < placarV) return 'Derrota';
  return 'Empate';
};

// Contar acertos (todos os jogos com placar definido)
export const countPredictions = (games) => {
  return games.filter(game => game.placarM !== null && game.placarV !== null).length;
};

// Contar cravadas fase 2 (placar exato correto = 5 pontos)
export const countPhase02Slams = (games) => {
  return games.filter(game => {
    if (
      game.placarM === null ||
      game.placarV === null ||
      game.officialM === null ||
      game.officialV === null
    ) {
      return false;
    }

    const pM = Number(game.placarM);
    const pV = Number(game.placarV);
    const oM = Number(game.officialM);
    const oV = Number(game.officialV);

    // Placar exato correto
    return pM === oM && pV === oV;
  }).length;
};

// Calcular pontos totais
export const calculateTotalPoints = (games) => {
  // Usa a mesma regra do ranking: 3 pontos pelo resultado e +2 pelo placar exato.
  return games.reduce((total, game) => {
    return total + scoringService.calculatePhase02Score(
      game.placarM,
      game.placarV,
      game.officialM,
      game.officialV,
    );
  }, 0);
};

// Gerar classificação de um grupo a partir dos resultados oficiais ou palpites
export const computeGroupStandings = (games, teams, scoreSource = 'official') => {
  const table = teams.reduce((acc, team) => {
    acc[team] = { team, PJ: 0, V: 0, E: 0, D: 0, GM: 0, GC: 0, SG: 0, Pts: 0 };
    return acc;
  }, {});

  games.forEach((game) => {
    const homeScore = scoreSource === 'prediction' ? game.placarM : game.officialM;
    const awayScore = scoreSource === 'prediction' ? game.placarV : game.officialV;

    if (homeScore === null || awayScore === null) return;

    const m = Number(homeScore);
    const v = Number(awayScore);

    // mandante
    if (table[game.mandante]) {
      table[game.mandante].PJ += 1;
      table[game.mandante].GM += m;
      table[game.mandante].GC += v;
      if (m > v) table[game.mandante].V += 1;
      else if (m < v) table[game.mandante].D += 1;
      else table[game.mandante].E += 1;
    }

    // visitante
    if (table[game.visitante]) {
      table[game.visitante].PJ += 1;
      table[game.visitante].GM += v;
      table[game.visitante].GC += m;
      if (v > m) table[game.visitante].V += 1;
      else if (v < m) table[game.visitante].D += 1;
      else table[game.visitante].E += 1;
    }
  });

  // calcular SG e Pts (Vitória 3, Empate 1, Derrota 0) para a tabela oficial
  const rows = Object.values(table).map((t) => {
    const SG = t.GM - t.GC;
    const Pts = t.V * 3 + t.E * 1;
    return { ...t, SG, Pts };
  });

  // ordenar
  rows.sort((a, b) => {
    if (b.Pts !== a.Pts) return b.Pts - a.Pts;
    if (b.SG !== a.SG) return b.SG - a.SG;
    if (b.GM !== a.GM) return b.GM - a.GM;
    return a.team.localeCompare(b.team);
  });

  return rows;
};

// Obter data atual em fuso horário de Brasília
export const getTodayInBrasilia = () => {
  const brazilDate = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const [datePart] = brazilDate.split(' ');
  const cleanedDate = datePart.replace(',', ''); // Remove vírgula se existir
  return cleanedDate;
};

// Filtrar jogos do dia em fuso horário de Brasília
export const getTodaysGames = (games) => {
  const todayBrasilia = getTodayInBrasilia();
  
  const todaysGames = games.filter(game => {
    const gameDatePart = (game.data.split(', ')[1] || game.data).trim();
    return gameDatePart === todayBrasilia;
  }).sort((a, b) => {
    const timeA = a.hora.replace('h', ':');
    const timeB = b.hora.replace('h', ':');
    return timeA.localeCompare(timeB);
  });
  
  return todaysGames;
};
