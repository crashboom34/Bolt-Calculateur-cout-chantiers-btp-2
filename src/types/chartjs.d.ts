import type { ChartConfiguration } from './chartjsTypes';

declare global {
  interface Window {
    Chart?: ChartConstructor;
  }
}

export interface ChartInstance {
  destroy(): void;
  update(): void;
  data: ChartConfiguration['data'];
  options: ChartConfiguration['options'];
}

export interface ChartConstructor {
  new (context: CanvasRenderingContext2D | HTMLCanvasElement, config: ChartConfiguration): ChartInstance;
}
