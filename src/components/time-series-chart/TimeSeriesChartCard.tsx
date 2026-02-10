import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Settings, Download, RefreshCw, Loader } from 'lucide-react';
import { supabase } from './supabaseClient';
import {
  getDateRangeFromPreset,
  transformToChartData,
  formatMetricValue,
  calculatePercentChange,
  convertMonthKeyToEndOfMonthDate,
} from './chartUtils';

interface ChartSection {
  id: string;
  title: string;
  subtitle: string;
  chart_type: 'line' | 'area' | 'bar';
  time_range_preset: string;
  custom_start_date: string | null;
  custom_end_date: string | null;
  granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  height: number;
  width_units: number;
  show_legend: boolean;
  show_grid: boolean;
  show_data_points: boolean;
  show_goal_line: boolean;
  goal_value: number | null;
  goal_label: string;
}

interface ChartMetric {
  metric_id: string;
  line_color: string;
  line_style: string;
  display_name_override: string | null;
  show_in_legend: boolean;
  display_order: number;
}

interface MetricDefinition {
  id: string;
  metric_name: string;
  data_type: string;
  unit: string;
}

interface TimeSeriesChartCardProps {
  chartSection: ChartSection;
  chartMetrics: ChartMetric[];
  metricDefinitions: Record<string, MetricDefinition>;
  clientId: string;
  selectedMonth?: string;
  showEditControls?: boolean;
  onConfigure: () => void;
}

interface HistoricalDataPoint {
  data_date: string;
  value: number;
  metric_id: string;
}

export function TimeSeriesChartCard({
  chartSection,
  chartMetrics,
  metricDefinitions,
  clientId,
  selectedMonth,
  showEditControls = true,
  onConfigure,
}: TimeSeriesChartCardProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChartData();
  }, [chartSection, chartMetrics, selectedMonth]);

  const loadChartData = async () => {
    try {
      setLoading(true);
      setError(null);

      const metricIds = chartMetrics.map(m => m.metric_id);
      if (metricIds.length === 0) {
        setChartData([]);
        setLoading(false);
        return;
      }

      const maxDate = selectedMonth ? convertMonthKeyToEndOfMonthDate(selectedMonth) : undefined;

      const { startDate, endDate } = chartSection.custom_start_date && chartSection.custom_end_date
        ? { startDate: new Date(chartSection.custom_start_date), endDate: new Date(chartSection.custom_end_date) }
        : getDateRangeFromPreset(chartSection.time_range_preset, maxDate);

      const finalEndDate = maxDate && endDate > maxDate ? maxDate : endDate;

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = finalEndDate.toISOString().split('T')[0];

      console.log('[TimeSeriesChartCard] Fetching data:', {
        metricIds,
        startDate: startDateStr,
        endDate: endDateStr,
      });

      const { data: historicalData, error: dataError } = await supabase
        .from('historical_metric_data')
        .select('metric_id, data_date, value')
        .eq('client_id', clientId)
        .in('metric_id', metricIds)
        .gte('data_date', startDateStr)
        .lte('data_date', endDateStr)
        .order('data_date', { ascending: true });

      if (dataError) throw dataError;

      console.log('[TimeSeriesChartCard] Loaded data points:', historicalData?.length || 0);

      const metricNames: Record<string, string> = {};
      chartMetrics.forEach(cm => {
        const def = metricDefinitions[cm.metric_id];
        if (def) {
          metricNames[cm.metric_id] = cm.display_name_override || def.metric_name;
        }
      });

      const transformedData = transformToChartData(
        historicalData || [],
        metricNames,
        chartSection.granularity,
        maxDate
      );

      console.log('[TimeSeriesChartCard] Transformed data:', transformedData);
      setChartData(transformedData);
    } catch (err) {
      console.error('Error loading chart data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div
        style={{
          background: 'var(--slate-800)',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          border: '1px solid var(--slate-700)',
        }}
      >
        <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 600, color: 'white' }}>
          {label}
        </p>
        {payload.map((entry: any, index: number) => {
          const metric = chartMetrics.find(m => {
            const def = metricDefinitions[m.metric_id];
            const name = m.display_name_override || def?.metric_name;
            return name === entry.name;
          });
          const metricDef = metric ? metricDefinitions[metric.metric_id] : null;

          return (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: entry.color,
                }}
              />
              <span style={{ fontSize: '12px', color: 'var(--slate-300)' }}>
                {entry.name}:
              </span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>
                {metricDef
                  ? formatMetricValue(entry.value, metricDef.data_type, metricDef.unit)
                  : entry.value}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderChart = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: chartSection.height }}>
          <Loader size={32} className="animate-spin" style={{ color: 'var(--brand-primary)' }} />
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: chartSection.height, color: 'var(--red-600)' }}>
          <p>{error}</p>
        </div>
      );
    }

    if (chartData.length === 0) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: chartSection.height, color: 'var(--slate-400)' }}>
          <p>No data available for the selected time range</p>
        </div>
      );
    }

    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    const metricLines = chartMetrics
      .filter(m => metricDefinitions[m.metric_id])
      .map(metric => {
        const def = metricDefinitions[metric.metric_id];
        const dataKey = metric.display_name_override || def.metric_name;
        return {
          dataKey,
          stroke: metric.line_color,
          name: dataKey,
          strokeDasharray: metric.line_style === 'dashed' ? '5 5' : metric.line_style === 'dotted' ? '2 2' : undefined,
        };
      });

    const ChartComponent = chartSection.chart_type === 'area' ? AreaChart : chartSection.chart_type === 'bar' ? BarChart : LineChart;

    return (
      <ResponsiveContainer width="100%" height={chartSection.height}>
        <ChartComponent {...commonProps}>
          {chartSection.show_grid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          )}
          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          {chartSection.show_legend && (
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="line"
            />
          )}
          {chartSection.show_goal_line && chartSection.goal_value !== null && (
            <ReferenceLine
              y={chartSection.goal_value}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{
                value: chartSection.goal_label || 'Goal',
                position: 'right',
                fontSize: 11,
                fill: '#ef4444',
              }}
            />
          )}
          {metricLines.map((line, index) => {
            if (chartSection.chart_type === 'area') {
              return (
                <Area
                  key={index}
                  type="monotone"
                  dataKey={line.dataKey}
                  stroke={line.stroke}
                  fill={line.stroke}
                  fillOpacity={0.2}
                  strokeWidth={2}
                  name={line.name}
                  dot={chartSection.show_data_points ? { r: 3 } : false}
                />
              );
            } else if (chartSection.chart_type === 'bar') {
              return (
                <Bar
                  key={index}
                  dataKey={line.dataKey}
                  fill={line.stroke}
                  name={line.name}
                  radius={[4, 4, 0, 0]}
                />
              );
            } else {
              return (
                <Line
                  key={index}
                  type="monotone"
                  dataKey={line.dataKey}
                  stroke={line.stroke}
                  strokeWidth={2}
                  name={line.name}
                  dot={chartSection.show_data_points ? { r: 3 } : false}
                  strokeDasharray={line.strokeDasharray}
                />
              );
            }
          })}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
        border: '1px solid var(--slate-100)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--slate-900)' }}>
            {chartSection.title}
          </h3>
          {chartSection.subtitle && (
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--slate-500)' }}>
              {chartSection.subtitle}
            </p>
          )}
        </div>
        {showEditControls && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={loadChartData}
              style={{
                padding: '8px',
                background: 'transparent',
                border: '1px solid var(--slate-200)',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--slate-600)',
              }}
              title="Refresh data"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={() => {
                console.log('[TimeSeriesChartCard] Configure button clicked');
                onConfigure();
              }}
              style={{
                padding: '8px',
                background: 'transparent',
                border: '1px solid var(--slate-200)',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--slate-600)',
              }}
              title="Configure chart"
            >
              <Settings size={16} />
            </button>
          </div>
        )}
      </div>

      {renderChart()}

      {!loading && !error && chartData.length > 0 && (
        <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--slate-400)' }}>
          <strong>Showing:</strong> {chartData.length} data points •{' '}
          <strong>Granularity:</strong> {chartSection.granularity.charAt(0).toUpperCase() + chartSection.granularity.slice(1)} •{' '}
          <strong>Range:</strong> {chartSection.time_range_preset.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </div>
      )}
    </div>
  );
}
