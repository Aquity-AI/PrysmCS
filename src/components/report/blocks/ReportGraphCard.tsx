import React, { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell,
  RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { getBrandingChartPalette } from '../../dashboard-graphs/brandingPalette';
import type { ReportGraph } from '../useReportData';
import type { GraphSize } from '../../dashboard-graphs/types';

interface ReportGraphCardProps {
  reportGraph: ReportGraph;
  brandColor: string;
}

const SIZE_WIDTH_MAP: Record<GraphSize, number> = {
  quarter: 160,
  half: 330,
  large: 500,
  full: 680,
};

export function ReportGraphCard({ reportGraph, brandColor }: ReportGraphCardProps) {
  const { graph, chartData, metricNames } = reportGraph;
  const colors = useMemo(() => getBrandingChartPalette(), [brandColor]);
  const chartHeight = Math.min(graph.config?.height || 220, 250);
  const chartWidth = SIZE_WIDTH_MAP[graph.size] || 330;

  const metricNamesList = Object.values(metricNames);
  const showGrid = graph.config?.show_grid !== false;
  const showLegend = graph.config?.show_legend !== false;

  const gridStroke = '#e2e8f0';
  const axisStroke = '#94a3b8';

  if (chartData.length === 0) {
    return (
      <div className="rpt-graph-card" style={{ width: chartWidth }}>
        <h4 className="rpt-graph-title">{graph.title}</h4>
        <div className="rpt-graph-empty">No data available</div>
      </div>
    );
  }

  const renderChart = () => {
    switch (graph.chart_type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={chartData} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />}
              <XAxis dataKey="date" stroke={axisStroke} fontSize={9} tickLine={false} />
              <YAxis stroke={axisStroke} fontSize={9} tickLine={false} width={35} />
              {showLegend && metricNamesList.length > 1 && <Legend wrapperStyle={{ fontSize: '9px' }} />}
              {metricNamesList.map((name, i) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={colors[i % colors.length]}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
              {graph.goals && (
                <ReferenceLine
                  y={graph.goals.target_value}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{ value: graph.goals.label, position: 'right', fontSize: 9 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={chartData} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />}
              <XAxis dataKey="date" stroke={axisStroke} fontSize={9} tickLine={false} />
              <YAxis stroke={axisStroke} fontSize={9} tickLine={false} width={35} />
              {showLegend && metricNamesList.length > 1 && <Legend wrapperStyle={{ fontSize: '9px' }} />}
              {metricNamesList.map((name, i) => (
                <Bar
                  key={name}
                  dataKey={name}
                  fill={colors[i % colors.length]}
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={false}
                />
              ))}
              {graph.goals && (
                <ReferenceLine
                  y={graph.goals.target_value}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <AreaChart data={chartData} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />}
              <XAxis dataKey="date" stroke={axisStroke} fontSize={9} tickLine={false} />
              <YAxis stroke={axisStroke} fontSize={9} tickLine={false} width={35} />
              {showLegend && metricNamesList.length > 1 && <Legend wrapperStyle={{ fontSize: '9px' }} />}
              {metricNamesList.map((name, i) => (
                <Area
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={colors[i % colors.length]}
                  fill={colors[i % colors.length]}
                  fillOpacity={0.15}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
      case 'donut': {
        const innerRadius = graph.chart_type === 'donut' ? '45%' : '0%';
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius="75%"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
                isAnimationActive={false}
                fontSize={9}
              >
                {chartData.map((_: any, i: number) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              {showLegend && <Legend wrapperStyle={{ fontSize: '9px' }} />}
            </PieChart>
          </ResponsiveContainer>
        );
      }

      case 'progress': {
        const pct = chartData[0]?.value || 0;
        const goalLabel = graph.goals?.label || 'Goal';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height={Math.min(chartHeight, 180)}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="90%"
                data={[{ value: pct, fill: brandColor }]}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar
                  dataKey="value"
                  cornerRadius={8}
                  isAnimationActive={false}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div style={{ textAlign: 'center', marginTop: -30 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#1e293b' }}>
                {Math.round(pct)}%
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{goalLabel}</div>
            </div>
          </div>
        );
      }

      default:
        return <div className="rpt-graph-empty">Unsupported chart type</div>;
    }
  };

  const sizeClass = `rpt-graph-size-${graph.size}`;

  return (
    <div className={`rpt-graph-card ${sizeClass}`}>
      <h4 className="rpt-graph-title">{graph.title}</h4>
      {renderChart()}
    </div>
  );
}
