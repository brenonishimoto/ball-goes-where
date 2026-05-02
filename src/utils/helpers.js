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

// Calcular pontos totais
export const calculateTotalPoints = (games) => {
  // Pontuação: 3 pontos apenas para placar exato igual ao resultado oficial
  return games.reduce((total, game) => {
    if (
      game.officialM === null ||
      game.officialV === null ||
      game.placarM === null ||
      game.placarV === null
    ) return total;

    return total + (Number(game.officialM) === Number(game.placarM) && Number(game.officialV) === Number(game.placarV) ? 3 : 0);
  }, 0);
};

// Gerar classificação de um grupo a partir dos resultados oficiais
export const computeGroupStandings = (games, teams) => {
  const table = teams.reduce((acc, team) => {
    acc[team] = { team, PJ: 0, V: 0, E: 0, D: 0, GM: 0, GC: 0, SG: 0, Pts: 0 };
    return acc;
  }, {});

  games.forEach((game) => {
    if (game.officialM === null || game.officialV === null) return;

    const m = Number(game.officialM);
    const v = Number(game.officialV);

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
