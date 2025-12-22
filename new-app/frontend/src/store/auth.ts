import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  observeUrl: string;
  username: string;
  token: string;
  password: string;
  login: (url: string, username: string, token: string, password?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      observeUrl: '',
      username: '',
      token: '',
      password: '',
      login: (url: string, username: string, token: string, password?: string) =>
        set({
          isAuthenticated: true,
          observeUrl: url,
          username,
          token,
          password: password || '',
        }),
      logout: () =>
        set({
          isAuthenticated: false,
          observeUrl: '',
          username: '',
          token: '',
          password: '',
        }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
