import { createContext, useContext, useEffect, useState } from 'react';

import { api } from '../api/client';

const AuthContext = createContext(null);
const STORAGE_KEY = 'calorie-tracker-auth-token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    let ignore = false;

    async function restore() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const me = await api.me(token);
        if (!ignore) {
          setUser(me);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        if (!ignore) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    restore();

    return () => {
      ignore = true;
    };
  }, [token]);

  const signIn = async (newToken) => {
    const result = await api.signIn(newToken);
    localStorage.setItem(STORAGE_KEY, newToken);
    setToken(newToken);
    setUser(result.user);
    return result.user;
  };

  const signOut = async () => {
    if (token) {
      try {
        await api.signOut(token);
      } catch {
        // Ignore signout failures and clear local state.
      }
    }
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }
  return context;
}
