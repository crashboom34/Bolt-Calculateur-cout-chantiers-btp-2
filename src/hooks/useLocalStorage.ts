import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';

interface UseLocalStorageOptions<T> {
  key: string;
  schema: z.ZodSchema<T>;
  defaultValue: T;
  version?: number;
}

interface StorageData<T> {
  data: T;
  version: number;
  timestamp: number;
}

export function useLocalStorage<T>({
  key,
  schema,
  defaultValue,
  version = 1
}: UseLocalStorageOptions<T>) {
  const [data, setData] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les données au montage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) {
        setData(defaultValue);
        setIsLoading(false);
        return;
      }

      const parsed = JSON.parse(stored) as StorageData<unknown>;
      
      // Vérifier la version
      if (parsed.version !== version) {
        console.warn(`Version mismatch for ${key}. Expected ${version}, got ${parsed.version}`);
        // Ici on pourrait implémenter une migration
        setData(defaultValue);
        setIsLoading(false);
        return;
      }

      // Valider avec Zod
      const validated = schema.parse(parsed.data);
      setData(validated);
      setError(null);
    } catch (err) {
      console.error(`Error loading ${key}:`, err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
      setData(defaultValue);
    } finally {
      setIsLoading(false);
    }
  }, [key, schema, defaultValue, version]);

  // Sauvegarder les données
  const saveData = useCallback((newData: T) => {
    try {
      const validated = schema.parse(newData);
      const toStore: StorageData<T> = {
        data: validated,
        version,
        timestamp: Date.now()
      };
      
      localStorage.setItem(key, JSON.stringify(toStore));
      setData(validated);
      setError(null);
      return true;
    } catch (err) {
      console.error(`Error saving ${key}:`, err);
      setError(err instanceof Error ? err.message : 'Erreur de sauvegarde');
      return false;
    }
  }, [key, schema, version]);

  // Réinitialiser
  const reset = useCallback(() => {
    localStorage.removeItem(key);
    setData(defaultValue);
    setError(null);
  }, [key, defaultValue]);

  // Export/Import
  const exportData = useCallback(() => {
    return {
      key,
      data,
      version,
      timestamp: Date.now()
    };
  }, [key, data, version]);

  const importData = useCallback((importedData: StorageData<unknown>) => {
    try {
      const validated = schema.parse(importedData.data);
      return saveData(validated);
    } catch (err) {
      setError('Données importées invalides');
      return false;
    }
  }, [schema, saveData]);

  return {
    data,
    setData: saveData,
    isLoading,
    error,
    reset,
    exportData,
    importData
  };
}
