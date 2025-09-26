import { useState, useCallback } from 'react';

interface UseUndoOptions<T> {
  maxHistory?: number;
}

export function useUndo<T>(initialState: T, options: UseUndoOptions<T> = {}) {
  const { maxHistory = 10 } = options;
  
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentState = history[currentIndex];
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const setState = useCallback((newState: T | ((prev: T) => T)) => {
    const state = typeof newState === 'function' 
      ? (newState as (prev: T) => T)(currentState)
      : newState;

    setHistory(prev => {
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(state);
      
      // Limiter l'historique
      if (newHistory.length > maxHistory) {
        newHistory.shift();
        setCurrentIndex(maxHistory - 1);
      } else {
        setCurrentIndex(newHistory.length - 1);
      }
      
      return newHistory;
    });
  }, [currentState, currentIndex, maxHistory]);

  const undo = useCallback(() => {
    if (canUndo) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [canUndo]);

  const redo = useCallback(() => {
    if (canRedo) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [canRedo]);

  const reset = useCallback(() => {
    setHistory([initialState]);
    setCurrentIndex(0);
  }, [initialState]);

  return {
    state: currentState,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
    history: history.length
  };
}
