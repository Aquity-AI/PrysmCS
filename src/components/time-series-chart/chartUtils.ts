interface HistoricalDataPoint {
  data_date: string;
  value: number;
  metric_id: string;
  metric_name?: string;
}

interface ChartDataPoint {
  date: string;
  dateKey: string;
  [metricName: string]: string | number;
}

export function getDateRangeFromPreset(preset: string, maxDate?: Date): { startDate: Date; endDate: Date } {
  const endDate = maxDate ? new Date(maxDate) : new Date();
  const startDate = new Date(endDate);

  switch (preset) {
    case 'last_3_months':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case 'last_6_months':
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case 'last_12_months':
      startDate.setMonth(startDate.getMonth() - 12);
      break;
    case 'year_to_date':
      startDate.setMonth(0);
      startDate.setDate(1);
      break;
    case 'all_time':
      startDate.setFullYear(2020, 0, 1);
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 6);
  }

  return { startDate, endDate };
}

export function formatDateByGranularity(date: Date, granularity: string): string {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  switch (granularity) {
    case 'daily':
      return `${monthNames[date.getMonth()]} ${date.getDate()}`;
    case 'weekly':
      const weekNum = Math.ceil(date.getDate() / 7);
      return `${monthNames[date.getMonth()]} W${weekNum}`;
    case 'quarterly':
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `Q${quarter} ${date.getFullYear()}`;
    case 'monthly':
    default:
      return monthNames[date.getMonth()];
  }
}

export function formatDateKeyByGranularity(date: Date, granularity: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  switch (granularity) {
    case 'daily':
      return `${year}-${month}-${day}`;
    case 'weekly':
      const weekNum = Math.ceil(date.getDate() / 7);
      return `${year}-${month}-W${weekNum}`;
    case 'quarterly':
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `${year}-Q${quarter}`;
    case 'monthly':
    default:
      return `${year}-${month}`;
  }
}

export function transformToChartData(
  dataPoints: HistoricalDataPoint[],
  metricNames: Record<string, string>,
  granularity: string,
  maxDate?: Date
): ChartDataPoint[] {
  const groupedData: Record<string, Record<string, number>> = {};

  dataPoints.forEach((point) => {
    const date = new Date(point.data_date);

    // Filter out data points after maxDate if provided
    if (maxDate && date > maxDate) {
      return;
    }

    const dateKey = formatDateKeyByGranularity(date, granularity);
    const displayDate = formatDateByGranularity(date, granularity);
    const metricName = metricNames[point.metric_id] || `Metric ${point.metric_id}`;

    if (!groupedData[dateKey]) {
      groupedData[dateKey] = { date: displayDate, dateKey };
    }

    if (!groupedData[dateKey][metricName]) {
      groupedData[dateKey][metricName] = point.value;
    } else {
      groupedData[dateKey][metricName] += point.value;
    }
  });

  return Object.values(groupedData).sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

export function formatMetricValue(value: number, dataType: string, unit: string): string {
  switch (dataType) {
    case 'currency':
      return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'decimal':
      return value.toFixed(2);
    case 'number':
    default:
      return value.toLocaleString();
  }
}

export function calculatePercentChange(current: number, previous: number): string | null {
  if (!previous || previous === 0) return null;
  const change = ((current - previous) / previous) * 100;
  return change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
}

export function generateDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day || 1);
}

export const DEFAULT_LINE_COLORS = [
  '#06b6d4',
  '#10b981',
  '#8b5cf6',
  '#f59e0b',
  '#ef4444',
  '#6366f1',
  '#ec4899',
  '#14b8a6',
];

export function getColorForIndex(index: number): string {
  return DEFAULT_LINE_COLORS[index % DEFAULT_LINE_COLORS.length];
}

export function convertMonthKeyToEndOfMonthDate(monthKey: string): Date {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month, 0);
  date.setHours(23, 59, 59, 999);
  return date;
}
