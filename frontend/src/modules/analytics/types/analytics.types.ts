/**
 * Analytics Types
 */

export interface Metric {
  name: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease';
  period: string;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color: string;
  }>;
}

export interface Report {
  id: string;
  name: string;
  type: 'sales' | 'performance' | 'usage' | 'custom';
  metrics: Metric[];
  charts: ChartData[];
  generatedAt: string;
}
