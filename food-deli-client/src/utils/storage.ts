import { STORAGE_KEYS } from '@/constants';
import type { User } from '@/types';

export const storage = {
  get: <T>(key: string, defaultValue: T | null = null): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading key "${key}" from localStorage`, error);
      return defaultValue;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving key "${key}" to localStorage`, error);
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing key "${key}" from localStorage`, error);
    }
  },

  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage', error);
    }
  },

  // Auth Helpers
  getToken: (): string | null => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)?.replace(/"/g, '') || null;
    } catch {
      return null;
    }
  },

  setToken: (token: string): void => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  },

  removeToken: (): void => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  getUser: (): User | null => {
    return storage.get<User>(STORAGE_KEYS.USER_INFO);
  },

  setUser: (user: User): void => {
    storage.set(STORAGE_KEYS.USER_INFO, user);
  },

  removeUser: (): void => {
    storage.remove(STORAGE_KEYS.USER_INFO);
  },
};
