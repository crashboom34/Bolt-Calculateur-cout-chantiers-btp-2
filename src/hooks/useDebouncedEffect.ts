import { DependencyList, useEffect, useRef } from 'react';

export const useDebouncedEffect = (callback: () => void, deps: DependencyList, delay: number): void => {
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      callback();
    }, delay);

    return () => {
      window.clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
};
