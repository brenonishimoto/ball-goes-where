import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { gameService } from '../services/gameService';
import { predictionService } from '../services/predictionService';

export const useGames = ({ enabled = true } = {}) => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, user, loadingAuth } = useAuth();
  const didApplyRemoteForTokenRef = useRef(false);

  const storageKey = gameService.getGameStorageKey(user?.id ? `user-${user.id}` : 'guest');
  // Cópia imutável (do backend) usada como base para renderização durante alterações não salvas.
  const copyStorageKey = `${storageKey}:phase2_predictions_copy`;

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return undefined;
    }

    let isActive = true;

    // Reseta ao trocar de token/login
    didApplyRemoteForTokenRef.current = false;

    const loadGames = async () => {
      if (loadingAuth) {
        return;
      }

      setLoading(true);

      try {
        const allGames = gameService.getAllGames(storageKey);

        if (token && !didApplyRemoteForTokenRef.current) {
          try {
            const remoteGames = await predictionService.getMyPredictions({ token });

            if (!isActive) {
              return;
            }

            didApplyRemoteForTokenRef.current = true;

            // Cria/atualiza a "cópia" dos palpites recebidos (base imutável do backend).
            // As alterações do usuário SEM salvar mexem só no state `games`, não na cópia.
            try {
              localStorage.setItem(copyStorageKey, JSON.stringify(remoteGames));
            } catch {
              // ignore write errors
            }

            // Renderiza usando a cópia/remote como base, mas preserva shape completo (ids, fase, rodada etc).
            const mergedGames = allGames.map((baseGame) => {
              const remoteGame = remoteGames.find((rg) => rg.id === baseGame.id);

              if (!remoteGame) return baseGame;

              return {
                ...baseGame,
                placarM: remoteGame.placarM ?? baseGame.placarM ?? null,
                placarV: remoteGame.placarV ?? baseGame.placarV ?? null,
              };
            });

            setGames(mergedGames);
            return;
          } catch {
            // se o GET da API falhar, cai no fallback local via catch externo
          }
        }

        // Fallback: se existir cópia do backend, use ela como base para o state atual.
        if (isActive && !token) {
          try {
            const rawCopy = localStorage.getItem(copyStorageKey);
            if (rawCopy) {
              const copyGames = JSON.parse(rawCopy);
              if (Array.isArray(copyGames)) {
                const mergedFromCopy = allGames.map((baseGame) => {
                  const copyGame = copyGames.find((cg) => cg?.id === baseGame.id);
                  if (!copyGame) return baseGame;
                  return {
                    ...baseGame,
                    placarM: copyGame.placarM ?? baseGame.placarM ?? null,
                    placarV: copyGame.placarV ?? baseGame.placarV ?? null,
                  };
                });
                setGames(mergedFromCopy);
                return;
              }
            }
          } catch {
            // ignore
          }
        }

        // Se já aplicamos a API no login, não sobrescrevemos mais com snapshot local.
        if (isActive && !(token && didApplyRemoteForTokenRef.current)) {
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

    // Se houver logout, limpamos estados/cópias locais para não manter palpites "fantasmas".
    if (!token) {
      try {
        // limpa também o storage principal (guest) para garantir inputs vazios
        gameService.clearAllData(storageKey);
      } catch {
        // ignore
      }

      try {
        localStorage.removeItem(copyStorageKey);
      } catch {
        // ignore
      }
    }

    void loadGames();

    return () => {
      isActive = false;
    };
  }, [enabled, loadingAuth, token, storageKey]);

  const updateScore = useCallback((id, placarM, placarV) => {
    // Debug: ajuda a entender o primeiro delete (timing/shape do state)
    // eslint-disable-next-line no-console
    console.debug('[phase2] updateScore', { id, placarM, placarV });

    const toNullableNumber = (v) => {
      if (v === '' || v === null || v === undefined) return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    setGames((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      return list.map((g) => {
        if (!g || typeof g !== 'object' || g.id !== id) return g;
        return {
          ...g,
          placarM: toNullableNumber(placarM),
          placarV: toNullableNumber(placarV),
        };
      });
    });
  }, []);

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
    try {
      localStorage.removeItem(copyStorageKey);
    } catch {
      // ignore
    }
    setGames(reset);
  }, [storageKey, copyStorageKey]);

  const save = useCallback(async () => {
    // Backend sobrescreve phase2_predictions inteiro.
    // Para nunca "apagar tudo" por causa de state parcial, montamos o payload
    // a partir de baseGames (lista completa) + somente os placares do state atual.
    const baseGames = gameService.getAllGames(storageKey);

    const currentGames = Array.isArray(games) ? games : [];
    const byId = new Map(
      currentGames
        .filter((g) => g && typeof g === 'object' && typeof g.id === 'number')
        .map((g) => [g.id, g])
    );

    // Mapa apenas dos campos de placar vindos do estado atual (evita depender do shape completo do objeto).
    const placaresAtualPorId = new Map(
      currentGames
        .filter((g) => g && typeof g === 'object' && typeof g.id === 'number')
        .map((g) => [
          g.id,
          {
            placarM: g.placarM === undefined ? null : g.placarM ?? null,
            placarV: g.placarV === undefined ? null : g.placarV ?? null,
          },
        ])
    );

    const mergedGames = baseGames.map((baseGame) => {
      const placaresAtual = placaresAtualPorId.get(baseGame.id);

      // Se por algum motivo o jogo não existe no state atual, preserva baseGame.
      // Isso impede que o PUT apague outros jogos no backend.
      if (!placaresAtual) return baseGame;

      return {
        ...baseGame,
        placarM: placaresAtual.placarM,
        placarV: placaresAtual.placarV,
      };
    });

    const savedGames = gameService.saveGames(mergedGames, storageKey);

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
