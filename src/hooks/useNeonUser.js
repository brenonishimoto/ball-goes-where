import { useUser } from '@clerk/react';
import { useCallback, useEffect, useState } from 'react';
import { neonUserService } from '../services/neonUserService';

export const useNeonUser = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const [neonUser, setNeonUser] = useState(null);
  const [loadingNeonUser, setLoadingNeonUser] = useState(false);
  const [error, setError] = useState(null);

  const refreshNeonUser = useCallback(async () => {
    if (!isSignedIn || !user) {
      setNeonUser(null);
      setError(null);
      return null;
    }

    setLoadingNeonUser(true);
    setError(null);

    try {
      const syncedUser = await neonUserService.upsertClerkUser({ clerkUser: user });
      const neonRecord = await neonUserService.getClerkUser({ clerkUserId: user.id });

      setNeonUser(neonRecord ?? syncedUser);
      return neonRecord ?? syncedUser;
    } catch (caughtError) {
      setNeonUser(null);
      setError(caughtError instanceof Error ? caughtError.message : 'Falha ao carregar usuário do Neon.');
      return null;
    } finally {
      setLoadingNeonUser(false);
    }
  }, [isSignedIn, user]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    void refreshNeonUser();
  }, [isLoaded, refreshNeonUser]);

  return {
    user,
    neonUser,
    loadingNeonUser,
    error,
    neonConfigured: neonUserService.isConfigured,
    refreshNeonUser,
  };
};