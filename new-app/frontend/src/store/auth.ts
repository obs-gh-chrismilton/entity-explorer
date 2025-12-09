import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  observeUrl: string;
  username: string;
  token: string;
  login: (url: string, username: string, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      observeUrl: '',
      username: '',
      token: '',
      login: (url: string, username: string, token: string) =>
        set({
          isAuthenticated: true,
          observeUrl: url,
          username,
          token,
        }),
      logout: () =>
        set({
          isAuthenticated: false,
          observeUrl: '',
          username: '',
          token: '',
        }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
