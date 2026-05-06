import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';

const AUTH_TOKEN_KEY = 'bgw_auth_token';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(AUTH_TOKEN_KEY);

    if (!storedToken) {
      setLoadingAuth(false);
      return;
    }

    const restoreSession = async () => {
      try {
        const session = await authService.me({ token: storedToken });
        setToken(storedToken);
        setUser(session.user);
      } catch {
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setLoadingAuth(false);
      }
    };

    void restoreSession();
  }, []);

  const login = async ({ email, password }) => {
    const result = await authService.login({ email, password });
    window.localStorage.setItem(AUTH_TOKEN_KEY, result.token);
    setToken(result.token);
    setUser(result.user);
    return result.user;
  };

  const register = async ({ name, email, password }) => {
    const result = await authService.register({ name, email, password });
    window.localStorage.setItem(AUTH_TOKEN_KEY, result.token);
    setToken(result.token);
    setUser(result.user);
    return result.user;
  };

  const logout = () => {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loadingAuth,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      logout,
    }),
    [user, token, loadingAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth precisa ser usado dentro de AuthProvider.');
  }

  return context;
};
