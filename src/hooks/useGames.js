import { useState, useEffect, useCallback } from 'react';
import { gameService } from '../services/gameService';

export const useGames = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carregar jogos ao montar
  useEffect(() => {
    const loadedGames = gameService.getAllGames();
    setGames(loadedGames);
    setLoading(false);
  }, []);

  // Atualizar placar
  const updateScore = useCallback((id, placarM, placarV) => {
    const updated = gameService.updateGameScore(id, placarM, placarV);
    setGames(updated);
  }, []);

  // Adicionar jogo
  const addGame = useCallback((mandante, visitante, fase) => {
    const updated = gameService.addGame(mandante, visitante, fase);
    setGames(updated);
  }, []);

  // Remover jogo
  const removeGame = useCallback((id) => {
    const updated = gameService.removeGame(id);
    setGames(updated);
  }, []);

  // Limpar dados
  const clearData = useCallback(() => {
    const reset = gameService.clearAllData();
    setGames(reset);
  }, []);

  // Salvar explicitamente
  const save = useCallback(() => {
    gameService.saveGames(games);
  }, [games]);

  return {
    games,
    loading,
    updateScore,
    addGame,
    removeGame,
    clearData,
    save,
  };
};
