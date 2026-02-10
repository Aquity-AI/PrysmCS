export type ChartType = 'line' | 'bar' | 'pie' | 'donut' | 'area' | 'progress';
export type GraphSize = 'quarter' | 'half' | 'large' | 'full';
export type TimeRange = 'last_3_months' | 'last_6_months' | 'last_12_months' | 'year_to_date' | 'all_time';
export type Aggregation = 'sum' | 'avg' | 'min' | 'max' | 'count';
export type GroupBy = 'day' | 'week' | 'month' | 'quarter';

export interface DashboardGraph {
  id: string;
  client_id: string;
  page_id: string;
  title: string;
  chart_type: ChartType;
  size: GraphSize;
  metric_ids: string[];
  time_range: TimeRange | null;
  aggregation: Aggregation | null;
  group_by: GroupBy | null;
  goals: GoalConfig | null;
  display_order: number;
  enabled: boolean;
  config: GraphConfig;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface GoalConfig {
  target_value: number;
  label: string;
}

export interface GraphConfig {
  show_legend?: boolean;
  show_grid?: boolean;
  show_data_points?: boolean;
  colors?: string[];
  height?: number;
}

export interface MetricDefinition {
  id: string;
  client_id: string;
  metric_key: string;
  metric_name: string;
  category: string;
  data_type: string;
  unit: string;
  description: string;
  is_active: boolean;
  icon: string | null;
}

export interface HistoricalDataPoint {
  metric_id: string;
  data_date: string;
  value: number;
}

export const SIZE_TO_GRID_UNITS: Record<GraphSize, number> = {
  quarter: 3,
  half: 6,
  large: 8,
  full: 12,
};

export const CHART_TYPE_OPTIONS: { type: ChartType; label: string; description: string; icon: string }[] = [
  { type: 'line', label: 'Line Chart', description: 'Track trends over time', icon: 'TrendingUp' },
  { type: 'bar', label: 'Bar Chart', description: 'Compare across categories', icon: 'BarChart3' },
  { type: 'pie', label: 'Pie Chart', description: 'Show distribution', icon: 'PieChart' },
  { type: 'donut', label: 'Donut Chart', description: 'Proportions with center KPI', icon: 'Donut' },
  { type: 'area', label: 'Area Chart', description: 'Volume trends over time', icon: 'AreaChart' },
  { type: 'progress', label: 'Progress / Goal', description: 'Track progress toward targets', icon: 'Target' },
];

export const SIZE_OPTIONS: { value: GraphSize; label: string; description: string; gridUnits: number }[] = [
  { value: 'quarter', label: 'Quarter', description: '4 per row', gridUnits: 3 },
  { value: 'half', label: 'Half', description: '2 per row', gridUnits: 6 },
  { value: 'large', label: 'Large (2/3)', description: '1-2 per row', gridUnits: 8 },
  { value: 'full', label: 'Full Width', description: '1 per row', gridUnits: 12 },
];

export const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'last_6_months', label: 'Last 6 Months' },
  { value: 'last_12_months', label: 'Last 12 Months' },
  { value: 'year_to_date', label: 'Year to Date' },
  { value: 'all_time', label: 'All Time' },
];

export const AGGREGATION_OPTIONS: { value: Aggregation; label: string }[] = [
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Average' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
  { value: 'count', label: 'Count' },
];

export const GROUP_BY_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'quarter', label: 'Quarterly' },
];

export const CATEGORY_COLORS: Record<string, string> = {
  enrollment: '#06b6d4',
  financial: '#10b981',
  engagement: '#f59e0b',
  outcomes: '#ef4444',
  custom: '#8b5cf6',
};

export const DEFAULT_CHART_COLORS = [
  '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
  '#3b82f6', '#14b8a6', '#ec4899', '#8b5cf6',
];
