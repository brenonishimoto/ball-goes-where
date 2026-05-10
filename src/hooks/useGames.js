import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { gameService } from '../services/gameService';
import { predictionService } from '../services/predictionService';
import { scoringService } from '../services/scoringService';
import { rankingService } from '../services/rankingService';

export const useGames = ({ enabled = true } = {}) => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, user, loadingAuth } = useAuth();

  const storageKey = gameService.getGameStorageKey(user?.id ? `user-${user.id}` : 'guest');

  // Carregar jogos ao montar
  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return undefined;
    }

    let isActive = true;

    const loadGames = async () => {
      if (loadingAuth) {
        return;
      }

      setLoading(true);

      try {
        const allGames = gameService.getAllGames(storageKey);

        if (token) {
          const remoteGames = await predictionService.getMyPredictions({ token });

          if (!isActive) {
            return;
          }

          if (remoteGames.length > 0) {
            // Mesclar palpites remotos com dados base dos jogos (mantendo officialM/V, data, hora, etc)
            const mergedGames = allGames.map(baseGame => {
              const remoteGame = remoteGames.find(rg => rg.id === baseGame.id);
              return remoteGame 
                ? { ...baseGame, placarM: remoteGame.placarM, placarV: remoteGame.placarV }
                : baseGame;
            });
            setGames(mergedGames);
            return;
          }
        }

        if (isActive) {
          setGames(allGames);
        }
      } catch {
        const loadedGames = gameService.getAllGames(storageKey);
        if (isActive) {
          setGames(loadedGames);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadGames();

    return () => {
      isActive = false;
    };
  }, [enabled, loadingAuth, token, storageKey]);

  // Atualizar placar
  const updateScore = useCallback((id, placarM, placarV) => {
    const updated = gameService.updateGameScore(id, placarM, placarV, storageKey);
    setGames(updated);
  }, [storageKey]);

  // Adicionar jogo
  const addGame = useCallback((mandante, visitante, fase) => {
    const updated = gameService.addGame(mandante, visitante, fase, storageKey);
    setGames(updated);
  }, [storageKey]);

  // Remover jogo
  const removeGame = useCallback((id) => {
    const updated = gameService.removeGame(id, storageKey);
    setGames(updated);
  }, [storageKey]);

  // Limpar dados
  const clearData = useCallback(() => {
    const reset = gameService.clearAllData(storageKey);
    setGames(reset);
  }, [storageKey]);

  // Salvar explicitamente
  const save = useCallback(async () => {
    const savedGames = gameService.saveGames(games, storageKey);

    if (!token) {
      return {
        status: 'auth-required',
        games: savedGames,
      };
    }

    try {
      const remoteGames = await predictionService.saveMyPredictions({ token, games: savedGames });

      // Calcular e enviar score
      try {
        const scorePayload = scoringService.calculateScorePayload(remoteGames);
        await rankingService.updateMyScore({ token, score: scorePayload });
      } catch {
        // Score falha não bloqueia salvamento de palpites
      }

      return {
        status: 'saved',
        games: remoteGames,
      };
    } catch (error) {
      throw error;
    }
  }, [games, storageKey, token]);

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
