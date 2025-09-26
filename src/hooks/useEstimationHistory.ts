import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { EstimationHistorySchema, type EstimationHistoryItem } from '@/schemas';
import { z } from 'zod';

const HISTORY_KEY = 'btp-estimation-history';
const HISTORY_VERSION = 1;

const EstimationHistoryArraySchema = EstimationHistorySchema;

type EstimationHistoryInput = Omit<EstimationHistoryItem, 'id' | 'createdAt'> & {
  id?: string;
  createdAt?: number;
};

export function useEstimationHistory() {
  const storage = useLocalStorage<z.infer<typeof EstimationHistoryArraySchema>>({
    key: HISTORY_KEY,
    schema: EstimationHistoryArraySchema,
    defaultValue: [],
    version: HISTORY_VERSION,
  });

  const { data, setData, ...rest } = storage;

  const addEntry = useCallback((entry: EstimationHistoryInput) => {
    const newEntry: EstimationHistoryItem = {
      id: entry.id ?? crypto.randomUUID(),
      createdAt: entry.createdAt ?? Date.now(),
      postes: entry.postes.map((poste) => ({ ...poste })),
      estimation: entry.estimation,
      targetMargin: entry.targetMargin,
    };

    const nextHistory = [...data, newEntry];
    // Garder uniquement les 20 dernières estimations pour éviter l'inflation du stockage
    const trimmedHistory = nextHistory.slice(-20);
    setData(trimmedHistory);
  }, [data, setData]);

  return {
    data,
    setData,
    ...rest,
    addEntry,
  };
}

export type { EstimationHistoryItem } from '@/schemas';
