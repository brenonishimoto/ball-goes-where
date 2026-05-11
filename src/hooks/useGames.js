import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { gameService } from '../services/gameService';
import { predictionService } from '../services/predictionService';

export const useGames = ({ enabled = true } = {}) => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, user, loadingAuth } = useAuth();

  const storageKey = gameService.getGameStorageKey(user?.id ? `user-${user.id}` : 'guest');

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
            const mergedGames = allGames.map((baseGame) => {
              const remoteGame = remoteGames.find((rg) => rg.id === baseGame.id);
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

  const updateScore = useCallback((id, placarM, placarV) => {
    const updated = gameService.updateGameScore(id, placarM, placarV, storageKey);
    setGames(updated);
  }, [storageKey]);

  const addGame = useCallback((mandante, visitante, fase) => {
    const updated = gameService.addGame(mandante, visitante, fase, storageKey);
    setGames(updated);
  }, [storageKey]);

  const removeGame = useCallback((id) => {
    const updated = gameService.removeGame(id, storageKey);
    setGames(updated);
  }, [storageKey]);

  const clearData = useCallback(() => {
    const reset = gameService.clearAllData(storageKey);
    setGames(reset);
  }, [storageKey]);

  const save = useCallback(async () => {
    const savedGames = gameService.saveGames(games, storageKey);

    if (!token) {
      return {
        status: 'auth-required',
        games: savedGames,
      };
    }

    const remoteGames = await predictionService.saveMyPredictions({ token, games: savedGames });

    return {
      status: 'saved',
      games: remoteGames,
    };
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
