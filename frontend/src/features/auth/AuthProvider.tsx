import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, TOKEN_KEY } from '../../api/client';
import type { ApiItem, User } from '../../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  logout: () => void;
  can: (...roles: User['role'][]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY));
  const meQuery = useQuery({
    queryKey: ['auth', 'me', token],
    queryFn: async () => (await api.get<ApiItem<User>>('/auth/me')).data.data,
    enabled: Boolean(token),
    retry: false,
  });
  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) =>
      (await api.post<ApiItem<{ token: string; user: User }>>('/auth/login', credentials)).data.data,
  });

  const logout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    void queryClient.removeQueries({ queryKey: ['auth'] });
  };

  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener('tradeflow:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('tradeflow:unauthorized', handleUnauthorized);
  });

  const value = useMemo<AuthContextValue>(() => ({
    user: token ? (meQuery.data ?? null) : null,
    loading: Boolean(token) && meQuery.isPending,
    login: async (credentials) => {
      const result = await loginMutation.mutateAsync(credentials);
      sessionStorage.setItem(TOKEN_KEY, result.token);
      setToken(result.token);
      return result.user;
    },
    logout,
    can: (...roles) => Boolean(meQuery.data && roles.includes(meQuery.data.role)),
  }), [loginMutation, meQuery, queryClient, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
};
