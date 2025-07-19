import { useState, useEffect } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Get value from localStorage or use initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage when state changes
  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

// Specialized localStorage hooks
export function useUserPreferences() {
  return useLocalStorage('userPreferences', {
    theme: 'dark',
    notifications: true,
    soundEffects: true,
    autoSave: true,
    language: 'en',
  });
}

export function useRecentProfiles() {
  return useLocalStorage<string[]>('recentProfiles', []);
}

export function useUploadHistory() {
  return useLocalStorage<any[]>('uploadHistory', []);
}

export function useDraftCode() {
  return useLocalStorage('draftCode', {
    content: '',
    language: 'javascript',
    timestamp: null,
  });
}