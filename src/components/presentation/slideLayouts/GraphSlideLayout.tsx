import { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell,
  RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { getBrandingChartPalette } from '../../dashboard-graphs/brandingPalette';
import type { SlideData, PresentationBranding } from '../types';

interface Props {
  slide: SlideData;
  branding: PresentationBranding;
}

export function GraphSlideLayout({ slide, branding }: Props) {
  const rg = slide.graph;
  if (!rg) return null;

  const { graph, chartData, metricNames } = rg;
  const colors = useMemo(() => getBrandingChartPalette(), [branding.primaryColor]);
  const brandColor = branding.primaryColor;
  const metricNamesList = Object.values(metricNames);
  const showGrid = graph.config?.show_grid !== false;
  const showLegend = graph.config?.show_legend !== false;
  const chartHeight = 340;

  const axisStroke = 'rgba(255,255,255,0.3)';
  const gridStroke = 'rgba(255,255,255,0.08)';

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: chartHeight, color: 'rgba(255,255,255,0.4)', fontSize: 16,
        }}>
          No data available for this chart
        </div>
      );
    }

    switch (graph.chart_type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />}
              <XAxis dataKey="date" stroke={axisStroke} fontSize={12} tickLine={false} />
              <YAxis stroke={axisStroke} fontSize={12} tickLine={false} width={50} />
              {showLegend && metricNamesList.length > 1 && <Legend wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }} />}
              {metricNamesList.map((name, i) => (
                <Line key={name} type="monotone" dataKey={name} stroke={colors[i % colors.length]} strokeWidth={3} dot={false} isAnimationActive={false} />
              ))}
              {graph.goals && (
                <ReferenceLine y={graph.goals.target_value} stroke="#ef4444" strokeDasharray="4 4" label={{ value: graph.goals.label, position: 'right', fontSize: 11, fill: '#ef4444' }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />}
              <XAxis dataKey="date" stroke={axisStroke} fontSize={12} tickLine={false} />
              <YAxis stroke={axisStroke} fontSize={12} tickLine={false} width={50} />
              {showLegend && metricNamesList.length > 1 && <Legend wrapperStyle={{ fontSize: '12px' }} />}
              {metricNamesList.map((name, i) => (
                <Bar key={name} dataKey={name} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} isAnimationActive={false} />
              ))}
              {graph.goals && <ReferenceLine y={graph.goals.target_value} stroke="#ef4444" strokeDasharray="4 4" />}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />}
              <XAxis dataKey="date" stroke={axisStroke} fontSize={12} tickLine={false} />
              <YAxis stroke={axisStroke} fontSize={12} tickLine={false} width={50} />
              {showLegend && metricNamesList.length > 1 && <Legend wrapperStyle={{ fontSize: '12px' }} />}
              {metricNamesList.map((name, i) => (
                <Area key={name} type="monotone" dataKey={name} stroke={colors[i % colors.length]} fill={colors[i % colors.length]} fillOpacity={0.2} strokeWidth={2} isAnimationActive={false} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
      case 'donut': {
        const innerRadius = graph.chart_type === 'donut' ? '40%' : '0%';
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={innerRadius} outerRadius="70%" dataKey="value" nameKey="name" label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} isAnimationActive={false} fontSize={12}>
                {chartData.map((_: any, i: number) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              {showLegend && <Legend wrapperStyle={{ fontSize: '12px' }} />}
            </PieChart>
          </ResponsiveContainer>
        );
      }

      case 'progress': {
        const pct = chartData[0]?.value || 0;
        const goalLabel = graph.goals?.label || 'Goal';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: chartHeight }}>
            <ResponsiveContainer width="100%" height={240}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="55%" outerRadius="85%" data={[{ value: pct, fill: brandColor }]} startAngle={180} endAngle={0}>
                <RadialBar dataKey="value" cornerRadius={8} isAnimationActive={false} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div style={{ textAlign: 'center', marginTop: -40 }}>
              <div style={{ fontSize: 42, fontWeight: 700, color: brandColor }}>{Math.round(pct)}%</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{goalLabel}</div>
            </div>
          </div>
        );
      }

      default:
        return <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: 40 }}>Unsupported chart type</div>;
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '48px 56px',
    }}>
      <h2 style={{
        fontSize: 28,
        fontWeight: 700,
        color: '#ffffff',
        marginBottom: 24,
      }}>
        {slide.title}
      </h2>
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.06)',
        padding: '16px',
      }}>
        {renderChart()}
      </div>
    </div>
  );
}
