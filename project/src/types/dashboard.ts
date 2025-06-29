export interface SalesData {
  date: string;
  sales: number;
  region: string;
  product: string;
  category: string;
  [key: string]: string | number; // Allow dynamic CSV columns
}

export interface MetricCard {
  title: string;
  value: string;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: string;
}

export interface AIInsight {
  id: string;
  title: string;
  summary: string;
  confidence: number;
  type: 'trend' | 'anomaly' | 'opportunity' | 'warning';
  timestamp: string;
  isGenerating?: boolean;
}

export interface FilterState {
  dateRange: {
    start: Date;
    end: Date;
  };
  regions: string[];
  products: string[];
  categories: string[];
}

export interface CSVColumn {
  name: string;
  type: 'string' | 'number' | 'date';
  samples: (string | number)[];
}

export interface DatasetInfo {
  fileName: string;
  rowCount: number;
  columns: CSVColumn[];
  uploadDate: Date;
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'scatter';
  xAxis: string;
  yAxis: string;
  groupBy?: string;
  title: string;
}