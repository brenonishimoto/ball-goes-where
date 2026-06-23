const STORAGE_KEY = 'bolao-copa-2026-v2';

const resolveStorageKey = (scope = 'guest') => `${STORAGE_KEY}:${scope}`;

export const GROUPS = [
  { fase: 'Grupo A', teams: ['México', 'África do Sul', 'Coreia do Sul', 'República Tcheca'] },
  { fase: 'Grupo B', teams: ['Canadá', 'Bósnia e Herzegovina', 'Catar', 'Suíça'] },
  { fase: 'Grupo C', teams: ['Brasil', 'Marrocos', 'Haiti', 'Escócia'] },
  { fase: 'Grupo D', teams: ['Estados Unidos', 'Paraguai', 'Austrália', 'Turquia'] },
  { fase: 'Grupo E', teams: ['Alemanha', 'Curaçau', 'Costa do Marfim', 'Equador'] },
  { fase: 'Grupo F', teams: ['Holanda', 'Japão', 'Suécia', 'Tunísia'] },
  { fase: 'Grupo G', teams: ['Bélgica', 'Egito', 'Irã', 'Nova Zelândia'] },
  { fase: 'Grupo H', teams: ['Espanha', 'Cabo Verde', 'Arábia Saudita', 'Uruguai'] },
  { fase: 'Grupo I', teams: ['França', 'Senegal', 'Iraque', 'Noruega'] },
  { fase: 'Grupo J', teams: ['Argentina', 'Argélia', 'Áustria', 'Jordânia'] },
  { fase: 'Grupo K', teams: ['Portugal', 'Rep. Democrática do Congo', 'Uzbequistão', 'Colômbia'] },
  { fase: 'Grupo L', teams: ['Inglaterra', 'Croácia', 'Gana', 'Panamá'] },
];

export const ROUNDS = [
  { rodada: 1, label: '1ª Rodada', dateRange: '11 a 17 de junho de 2026' },
  { rodada: 2, label: '2ª Rodada', dateRange: '18 a 23 de junho de 2026' },
  { rodada: 3, label: '3ª Rodada', dateRange: '24 a 27 de junho de 2026' },
];

const buildInitialGames = () => ([
  { id: 1, mandante: 'México', visitante: 'África do Sul', placarM: null, placarV: null, officialM: 2, officialV: 0, fase: 'Grupo A', rodada: 1, data: 'Qui, 11/06/2026', hora: '16h00' },
  { id: 2, mandante: 'Coreia do Sul', visitante: 'República Tcheca', placarM: null, placarV: null, officialM: 2, officialV: 1, fase: 'Grupo A', rodada: 1, data: 'Qui, 11/06/2026', hora: '23h00' },
  { id: 3, mandante: 'Canadá', visitante: 'Bósnia e Herzegovina', placarM: null, placarV: null, officialM: 1, officialV: 1, fase: 'Grupo B', rodada: 1, data: 'Sex, 12/06/2026', hora: '16h00' },
  { id: 4, mandante: 'Estados Unidos', visitante: 'Paraguai', placarM: null, placarV: null, officialM: 4, officialV: 1, fase: 'Grupo D', rodada: 1, data: 'Sex, 12/06/2026', hora: '22h00' },
  { id: 5, mandante: 'Catar', visitante: 'Suíça', placarM: null, placarV: null, officialM: 1, officialV: 1, fase: 'Grupo B', rodada: 1, data: 'Sáb, 13/06/2026', hora: '16h00' },
  { id: 6, mandante: 'Brasil', visitante: 'Marrocos', placarM: null, placarV: null, officialM: 1, officialV: 1, fase: 'Grupo C', rodada: 1, data: 'Sáb, 13/06/2026', hora: '19h00' },
  { id: 7, mandante: 'Haiti', visitante: 'Escócia', placarM: null, placarV: null, officialM: 0, officialV: 1, fase: 'Grupo C', rodada: 1, data: 'Sáb, 13/06/2026', hora: '22h00' },
  { id: 8, mandante: 'Austrália', visitante: 'Turquia', placarM: null, placarV: null, officialM: 2, officialV: 0, fase: 'Grupo D', rodada: 1, data: 'Dom, 14/06/2026', hora: '01h00' },
  { id: 9, mandante: 'Alemanha', visitante: 'Curaçau', placarM: null, placarV: null, officialM: 7, officialV: 1, fase: 'Grupo E', rodada: 1, data: 'Dom, 14/06/2026', hora: '14h00' },
  { id: 10, mandante: 'Holanda', visitante: 'Japão', placarM: null, placarV: null, officialM: 2, officialV: 2, fase: 'Grupo F', rodada: 1, data: 'Dom, 14/06/2026', hora: '17h00' },
  { id: 11, mandante: 'Costa do Marfim', visitante: 'Equador', placarM: null, placarV: null, officialM: 1, officialV: 0, fase: 'Grupo E', rodada: 1, data: 'Dom, 14/06/2026', hora: '20h00' },
  { id: 12, mandante: 'Suécia', visitante: 'Tunísia', placarM: null, placarV: null, officialM: 5, officialV: 1, fase: 'Grupo F', rodada: 1, data: 'Dom, 14/06/2026', hora: '22h00' },
  { id: 13, mandante: 'Espanha', visitante: 'Cabo Verde', placarM: null, placarV: null, officialM: 0, officialV: 0, fase: 'Grupo H', rodada: 1, data: 'Seg, 15/06/2026', hora: '13h00' },
  { id: 14, mandante: 'Bélgica', visitante: 'Egito', placarM: null, placarV: null, officialM: 1, officialV: 1, fase: 'Grupo G', rodada: 1, data: 'Seg, 15/06/2026', hora: '16h00' },
  { id: 15, mandante: 'Arábia Saudita', visitante: 'Uruguai', placarM: null, placarV: null, officialM: 1, officialV: 1, fase: 'Grupo H', rodada: 1, data: 'Seg, 15/06/2026', hora: '19h00' },
  { id: 16, mandante: 'Irã', visitante: 'Nova Zelândia', placarM: null, placarV: null, officialM: 2, officialV: 2, fase: 'Grupo G', rodada: 1, data: 'Seg, 15/06/2026', hora: '22h00' },
  { id: 17, mandante: 'França', visitante: 'Senegal', placarM: null, placarV: null, officialM: 3, officialV: 1, fase: 'Grupo I', rodada: 1, data: 'Ter, 16/06/2026', hora: '16h00' },
  { id: 18, mandante: 'Iraque', visitante: 'Noruega', placarM: null, placarV: null, officialM: 1, officialV: 4, fase: 'Grupo I', rodada: 1, data: 'Ter, 16/06/2026', hora: '19h00' },
  { id: 19, mandante: 'Argentina', visitante: 'Argélia', placarM: null, placarV: null, officialM: 3, officialV: 0, fase: 'Grupo J', rodada: 1, data: 'Ter, 16/06/2026', hora: '22h00' },
  { id: 20, mandante: 'Áustria', visitante: 'Jordânia', placarM: null, placarV: null, officialM: 3, officialV: 1, fase: 'Grupo J', rodada: 1, data: 'Ter, 17/06/2026', hora: '01h00' },
  { id: 21, mandante: 'Portugal', visitante: 'Rep. Democrática do Congo', placarM: null, placarV: null, officialM: 1, officialV: 1, fase: 'Grupo K', rodada: 1, data: 'Qua, 17/06/2026', hora: '14h00' },
  { id: 22, mandante: 'Inglaterra', visitante: 'Croácia', placarM: null, placarV: null, officialM: 4, officialV: 2, fase: 'Grupo L', rodada: 1, data: 'Qua, 17/06/2026', hora: '17h00' },
  { id: 23, mandante: 'Gana', visitante: 'Panamá', placarM: null, placarV: null, officialM: 1, officialV: 0, fase: 'Grupo L', rodada: 1, data: 'Qua, 17/06/2026', hora: '20h00' },
  { id: 24, mandante: 'Uzbequistão', visitante: 'Colômbia', placarM: null, placarV: null, officialM: 1, officialV: 3, fase: 'Grupo K', rodada: 1, data: 'Qua, 17/06/2026', hora: '23h00' },
  { id: 25, mandante: 'República Tcheca', visitante: 'África do Sul', placarM: null, placarV: null, officialM: 1, officialV: 1, fase: 'Grupo A', rodada: 2, data: 'Qui, 18/06/2026', hora: '13h00' },
  { id: 26, mandante: 'Suíça', visitante: 'Bósnia e Herzegovina', placarM: null, placarV: null, officialM: 4, officialV: 1, fase: 'Grupo B', rodada: 2, data: 'Qui, 18/06/2026', hora: '16h00' },
  { id: 27, mandante: 'Canadá', visitante: 'Catar', placarM: null, placarV: null, officialM: 6, officialV: 0, fase: 'Grupo B', rodada: 2, data: 'Qui, 18/06/2026', hora: '19h00' },
  { id: 28, mandante: 'México', visitante: 'Coreia do Sul', placarM: null, placarV: null, officialM: 1, officialV: 0, fase: 'Grupo A', rodada: 2, data: 'Qui, 18/06/2026', hora: '22h00' },
  { id: 29, mandante: 'Estados Unidos', visitante: 'Austrália', placarM: null, placarV: null, officialM: 2, officialV: 0, fase: 'Grupo D', rodada: 2, data: 'Sex, 19/06/2026', hora: '16h00' },
  { id: 30, mandante: 'Escócia', visitante: 'Marrocos', placarM: null, placarV: null, officialM: 0, officialV: 1, fase: 'Grupo C', rodada: 2, data: 'Sex, 19/06/2026', hora: '19h00' },
  { id: 31, mandante: 'Brasil', visitante: 'Haiti', placarM: null, placarV: null, officialM: 3, officialV: 0, fase: 'Grupo C', rodada: 2, data: 'Sex, 19/06/2026', hora: '21h30' },
  { id: 32, mandante: 'Turquia', visitante: 'Paraguai', placarM: null, placarV: null, officialM: 0, officialV: 1, fase: 'Grupo D', rodada: 2, data: 'Sex, 20/06/2026', hora: '00h00' },
  { id: 33, mandante: 'Holanda', visitante: 'Suécia', placarM: null, placarV: null, officialM: 5, officialV: 1, fase: 'Grupo F', rodada: 2, data: 'Sáb, 20/06/2026', hora: '14h00' },
  { id: 34, mandante: 'Alemanha', visitante: 'Costa do Marfim', placarM: null, placarV: null, officialM: 2, officialV: 1, fase: 'Grupo E', rodada: 2, data: 'Sáb, 20/06/2026', hora: '17h00' },
  { id: 35, mandante: 'Equador', visitante: 'Curaçau', placarM: null, placarV: null, officialM: 0, officialV: 0, fase: 'Grupo E', rodada: 2, data: 'Sáb, 20/06/2026', hora: '21h00' },
  { id: 36, mandante: 'Tunísia', visitante: 'Japão', placarM: null, placarV: null, officialM: 0, officialV: 4, fase: 'Grupo F', rodada: 2, data: 'Dom, 21/06/2026', hora: '01h00' },
  { id: 37, mandante: 'Espanha', visitante: 'Arábia Saudita', placarM: null, placarV: null, officialM: 4, officialV: 0, fase: 'Grupo H', rodada: 2, data: 'Dom, 21/06/2026', hora: '13h00' },
  { id: 38, mandante: 'Bélgica', visitante: 'Irã', placarM: null, placarV: null, officialM: 0, officialV: 0, fase: 'Grupo G', rodada: 2, data: 'Dom, 21/06/2026', hora: '16h00' },
  { id: 39, mandante: 'Uruguai', visitante: 'Cabo Verde', placarM: null, placarV: null, officialM: 2, officialV: 2, fase: 'Grupo H', rodada: 2, data: 'Dom, 21/06/2026', hora: '19h00' },
  { id: 40, mandante: 'Nova Zelândia', visitante: 'Egito', placarM: null, placarV: null, officialM: 1, officialV: 3, fase: 'Grupo G', rodada: 2, data: 'Dom, 21/06/2026', hora: '22h00' },
  { id: 41, mandante: 'Argentina', visitante: 'Áustria', placarM: null, placarV: null, officialM: 2, officialV: 0, fase: 'Grupo J', rodada: 2, data: 'Seg, 22/06/2026', hora: '14h00' },
  { id: 42, mandante: 'França', visitante: 'Iraque', placarM: null, placarV: null, officialM: 3, officialV: 0, fase: 'Grupo I', rodada: 2, data: 'Seg, 22/06/2026', hora: '18h00' },
  { id: 43, mandante: 'Noruega', visitante: 'Senegal', placarM: null, placarV: null, officialM: 3, officialV: 2, fase: 'Grupo I', rodada: 2, data: 'Seg, 22/06/2026', hora: '21h00' },
  { id: 44, mandante: 'Jordânia', visitante: 'Argélia', placarM: null, placarV: null, officialM: 1, officialV: 2, fase: 'Grupo J', rodada: 2, data: 'Seg, 23/06/2026', hora: '00h00' },
  { id: 45, mandante: 'Portugal', visitante: 'Uzbequistão', placarM: null, placarV: null, officialM: 5, officialV: 0, fase: 'Grupo K', rodada: 2, data: 'Ter, 23/06/2026', hora: '14h00' },
  { id: 46, mandante: 'Inglaterra', visitante: 'Gana', placarM: null, placarV: null, officialM: null, officialV: null, fase: 'Grupo L', rodada: 2, data: 'Ter, 23/06/2026', hora: '17h00' },
  { id: 47, mandante: 'Panamá', visitante: 'Croácia', placarM: null, placarV: null, officialM: null, officialV: null, fase: 'Grupo L', rodada: 2, data: 'Ter, 23/06/2026', hora: '20h00' },
  { id: 48, mandante: 'Colômbia', visitante: 'Rep. Democrática do Congo', placarM: null, placarV: null, officialM: null, officialV: null, fase: 'Grupo K', rodada: 2, data: 'Ter, 23/06/2026', hora: '23h00' },
  { id: 49, mandante: 'Suíça', visitante: 'Canadá', placarM: null, placarV: null, officialM: null, officialV: null, fase: 'Grupo B', rodada: 3, data: 'Qua, 24/06/2026', hora: '16h00' },
  { id: 50, mandante: 'Bósnia e Herzegovina', visitante: 'Catar', placarM: null, placarV: null, officialM: null, officialV: null, fase: 'Grupo B', rodada: 3, data: 'Qua, 24/06/2026', hora: '16h00' },
  { id: 51, mandante: 'Escócia', visitante: 'Brasil', placarM: null, placarV: null, officialM: null, officialV: null, fase: 'Grupo C', rodada: 3, data: 'Qua, 24/06/2026', hora: '19h00' },
  { id: 52, mandante: 'Marrocos', visitante: 'Haiti', placarM: null, placarV: null, officialM: null, officialV: null, fase: 'Grupo C', rodada: 3, data: 'Qua, 24/06/2026', hora: '19h00' },
  { id: 53, mandante: 'República Tcheca', visitante: 'México', placarM: null, placarV: null, officialM: null, officialV: null, fase: 'Grupo A', rodada: 3, data: 'Qua, 24/06/2026', hora: '22h00' },
  { id: 54, mandante: 'África do Sul', visitante: 'Coreia do Sul', placarM: null, placarV: null, officialM: null, officialV: null, fase: 'Grupo A', rodada: 3, data: 'Qua, 24/06/2026', hora: '22h00' },
  { id: 55, mandante: 'Equador', visitante: 'Alemanha', placarM: null, placarV: null, officialM: null, officialV: null, fase: 'Grupo E', rodada: 3, data: 'Qui, 25/06/2026', hora: '17h00' },
  { id: 56, mandante: 'Curaçau', visitante: 'Costa do Marfim', placarM: null, placarV: null, officialM: null, officialV: null, fase: 'Grupo E', rodada: 3, data: 'Qui, 25/06/2026', hora: '17h00' },
  { id: 57, mandante: 'Japão', visitante: 'Suécia', placarM: null, placarV: null, officialM: null, officialV: null, fase: 'Grupo F', rodada: 3, data: 'Qui, 25/06/2026', hora: '20h00' },
  { id: 58, mandante: 'Tunísia', visitante: 'Holanda', placarM: null, placarV: null, officialM: null, officialV: null, fase: 'Grupo F', rodada: 3, data: 'Qui, 25/06/2026', hora: '20h00' },
  { id: 59, mandante: 'Turquia', visitante: 'Estados Unidos', placarM: null, placarV: null, officialM: null, officialV: null, fase: 'Grupo D', rodada: 3, data: 'Qui, 25/06/2026', hora: '23h00' },
  { id: 60, mandante: 'Paraguai', visitante: 'Austrália', placarM: null, placarV: null, officialM: null, officialV: null, fase: 'Grupo D', rodada: 3, data: 'Qui, 25/06/2026', hora: '23h00' },
  { id: 61, mandante: 'Noruega', visitante: 'França', placarM: null, placarV: null, officialM: null, officialV: null, fase: 'Grupo I', rodada: 3, data: 'Sex, 26/06/2026', hora: '16h00' },
  { id: 62, mandante: 'Senegal', visitante: 'Iraque', placarM: null, placarV: null, officialM: null, officialV: null, fase: 'Grupo I', rodada: 3, data: 'Sex, 26/06/2026', hora: '16h00' },
  { id: 63, mandante: 'Cabo Verde', visitante: 'Arábia Saudita', placarM: null, placarV: null, officialM: null, officialV: null, fase: 'Grupo H', rodada: 3, data: 'Sex, 26/06/2026', hora: '21h00' },
  { id: 64, mandante: 'Uruguai', visitante: 'Espanha', placarM: null, placarV: null, officialM: null, officialV: null, fase: 'Grupo H', rodada: 3, data: 'Sex, 26/06/2026', hora: '21h00' },
  { id: 65, mandante: 'Egito', visitante: 'Irã', placarM: null, placarV: null, officialM: null, officialV: null, fase: 'Grupo G', rodada: 3, data: 'Sex, 26/06/2026', hora: '00h00' },
  { id: 66, mandante: 'Nova Zelândia', visitante: 'Bélgica', placarM: null, placarV: null, officialM: null, officialV: null, fase: 'Grupo G', rodada: 3, data: 'Sex, 27/06/2026', hora: '00h00' },
  { id: 67, mandante: 'Panamá', visitante: 'Inglaterra', placarM: null, placarV: null, officialM: null, officialV: null, fase: 'Grupo L', rodada: 3, data: 'Sáb, 27/06/2026', hora: '18h00' },
  { id: 68, mandante: 'Croácia', visitante: 'Gana', placarM: null, placarV: null, officialM: null, officialV: null, fase: 'Grupo L', rodada: 3, data: 'Sáb, 27/06/2026', hora: '18h00' },
  { id: 69, mandante: 'Colômbia', visitante: 'Portugal', placarM: null, placarV: null, officialM: null, officialV: null, fase: 'Grupo K', rodada: 3, data: 'Sáb, 27/06/2026', hora: '20h30' },
  { id: 70, mandante: 'Rep. Democrática do Congo', visitante: 'Uzbequistão', placarM: null, placarV: null, officialM: null, officialV: null, fase: 'Grupo K', rodada: 3, data: 'Sáb, 27/06/2026', hora: '20h30' },
  { id: 71, mandante: 'Argélia', visitante: 'Áustria', placarM: null, placarV: null, officialM: null, officialV: null, fase: 'Grupo J', rodada: 3, data: 'Sáb, 27/06/2026', hora: '23h00' },
  { id: 72, mandante: 'Jordânia', visitante: 'Argentina', placarM: null, placarV: null, officialM: null, officialV: null, fase: 'Grupo J', rodada: 3, data: 'Sáb, 27/06/2026', hora: '23h00' },
]);

export const INITIAL_GAMES = buildInitialGames().map(g => ({
  ...g,
  officialM: g.officialM ?? null,
  officialV: g.officialV ?? null,
}));

const cloneInitialGames = () => INITIAL_GAMES.map(game => ({ ...game }));

const enrichWithInitialGames = (games) => {
  // Reconstrói a lista completa com base em INITIAL_GAMES.
  // Protege contra um localStorage “parcial”/malformado.
  const savedArray = Array.isArray(games) ? games : [];

  // Se o storage veio incompleto (muito menor que o esperado), ignoramos para não
  // “zerar” placares de vários jogos ao recriar a lista.
  const expectedCount = INITIAL_GAMES.length;
  if (savedArray.length > 0 && savedArray.length < expectedCount) {
    return cloneInitialGames();
  }

  const normalized = savedArray
    .filter((g) => g && typeof g === 'object' && typeof g.id === 'number');

  const savedById = new Map(normalized.map((g) => [g.id, g]));

  return INITIAL_GAMES.map((baseGame) => {
    const savedGame = savedById.get(baseGame.id);

    if (!savedGame) {
      return { ...baseGame };
    }

    return {
      ...baseGame,
      placarM: savedGame.placarM ?? baseGame.placarM ?? null,
      placarV: savedGame.placarV ?? baseGame.placarV ?? null,
      officialM: savedGame.officialM ?? baseGame.officialM ?? null,
      officialV: savedGame.officialV ?? baseGame.officialV ?? null,
    };
  });
};

export const gameService = {
  // Obter todos os jogos
  getGameStorageKey: (scope = 'guest') => resolveStorageKey(scope),

  getAllGames: (storageKey = STORAGE_KEY) => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) {
      return cloneInitialGames();
    }

    const games = enrichWithInitialGames(JSON.parse(saved));
    return games.length > 0 ? games : cloneInitialGames();
  },

  // Obter um jogo por ID
  getGameById: (id, storageKey = STORAGE_KEY) => {
    const games = gameService.getAllGames(storageKey);
    return games.find(game => game.id === id);
  },

  // Salvar todos os jogos
  saveGames: (games, storageKey = STORAGE_KEY) => {
    const sanitizedGames = enrichWithInitialGames(games);
    localStorage.setItem(storageKey, JSON.stringify(sanitizedGames));
    return sanitizedGames;
  },

  // Atualizar placar de um jogo
  updateGameScore: (id, placarM, placarV, storageKey = STORAGE_KEY) => {
    const toNullableNumber = (v) => {
      if (v === '' || v === null || v === undefined) return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const games = gameService.getAllGames(storageKey);
    const updatedGames = games.map((game) => {
      if (game.id !== id) return game;

      return {
        ...game,
        placarM: toNullableNumber(placarM),
        placarV: toNullableNumber(placarV),
      };
    });

    return gameService.saveGames(updatedGames, storageKey);
  },

  // Adicionar novo jogo
  addGame: (mandante, visitante, fase, storageKey = STORAGE_KEY) => {
    const games = gameService.getAllGames(storageKey);
    const newGame = {
      id: Math.max(...games.map(g => g.id), 0) + 1,
      mandante,
      visitante,
      placarM: null,
      placarV: null,
      officialM: null,
      officialV: null,
      fase,
    };
    return gameService.saveGames([...games, newGame], storageKey);
  },

  // Remover jogo
  removeGame: (id, storageKey = STORAGE_KEY) => {
    const games = gameService.getAllGames(storageKey);
    const filtered = games.filter(game => game.id !== id);
    return gameService.saveGames(filtered, storageKey);
  },

  // Limpar todos os dados
  clearAllData: (storageKey = STORAGE_KEY) => {
    localStorage.removeItem(storageKey);
    return cloneInitialGames();
  },

  // Obter jogos por fase
  getGamesByPhase: (phase, storageKey = STORAGE_KEY) => {
    const games = gameService.getAllGames(storageKey);
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
