const STORAGE_KEY = 'bolao-copa-2026';

// Dados iniciais dos jogos
const INITIAL_GAMES = [
  { id: 1, mandante: 'Brasil', visitante: 'México', placarM: null, placarV: null, fase: 'Grupo A' },
  { id: 2, mandante: 'Espanha', visitante: 'Japão', placarM: null, placarV: null, fase: 'Grupo E' },
  { id: 3, mandante: 'Argentina', visitante: 'França', placarM: null, placarV: null, fase: 'Grupo C' },
  { id: 4, mandante: 'Alemanha', visitante: 'Holanda', placarM: null, placarV: null, fase: 'Grupo D' },
  { id: 5, mandante: 'Inglaterra', visitante: 'Itália', placarM: null, placarV: null, fase: 'Grupo B' },
];

export const gameService = {
  // Obter todos os jogos
  getAllGames: () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_GAMES;
  },

  // Obter um jogo por ID
  getGameById: (id) => {
    const games = gameService.getAllGames();
    return games.find(game => game.id === id);
  },

  // Salvar todos os jogos
  saveGames: (games) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
    return games;
  },

  // Atualizar placar de um jogo
  updateGameScore: (id, placarM, placarV) => {
    const games = gameService.getAllGames();
    const updatedGames = games.map(game =>
      game.id === id ? { ...game, placarM: parseInt(placarM) || null, placarV: parseInt(placarV) || null } : game
    );
    return gameService.saveGames(updatedGames);
  },

  // Adicionar novo jogo
  addGame: (mandante, visitante, fase) => {
    const games = gameService.getAllGames();
    const newGame = {
      id: Math.max(...games.map(g => g.id), 0) + 1,
      mandante,
      visitante,
      placarM: null,
      placarV: null,
      fase,
    };
    return gameService.saveGames([...games, newGame]);
  },

  // Remover jogo
  removeGame: (id) => {
    const games = gameService.getAllGames();
    const filtered = games.filter(game => game.id !== id);
    return gameService.saveGames(filtered);
  },

  // Limpar todos os dados
  clearAllData: () => {
    localStorage.removeItem(STORAGE_KEY);
    return INITIAL_GAMES;
  },

  // Obter jogos por fase
  getGamesByPhase: (phase) => {
    const games = gameService.getAllGames();
    return games.filter(game => game.fase === phase);
  },

  // Calcular pontuação (vitória = 3 pontos, empate = 1)
  calculateScore: (game) => {
    if (game.placarM === null || game.placarV === null) return 0;
    if (game.placarM > game.placarV) return 3;
    if (game.placarM < game.placarV) return 0;
    return 1;
  },
};
