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
  return games.reduce((total, game) => {
    if (game.placarM === null || game.placarV === null) return total;
    if (game.placarM > game.placarV) return total + 3;
    if (game.placarM < game.placarV) return total + 0;
    return total + 1;
  }, 0);
};
