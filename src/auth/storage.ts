import { TokenStorage } from './types';

export const createLocalStorageTokenStorage = (tokenStorageKey: string): TokenStorage => {
  const hasWindow = typeof window !== 'undefined' && !!window.localStorage;

  return {
    getAccessToken: () => {
      if (!hasWindow) return null;
      return window.localStorage.getItem(tokenStorageKey);
    },
    setAccessToken: (token: string) => {
      if (!hasWindow) return;
      window.localStorage.setItem(tokenStorageKey, token);
    },
    removeAccessToken: () => {
      if (!hasWindow) return;
      window.localStorage.removeItem(tokenStorageKey);
    }
  };
};

