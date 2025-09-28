export interface ChartDataset {
  label?: string;
  data: number[];
  backgroundColor?: string[];
  borderColor?: string[];
  borderWidth?: number;
  borderSkipped?: boolean | string;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartOptions {
  indexAxis?: 'x' | 'y';
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  plugins?: Record<string, unknown>;
  scales?: Record<string, unknown>;
  layout?: Record<string, unknown>;
}

export interface ChartConfiguration {
  type: string;
  data: ChartData;
  options?: ChartOptions;
}
