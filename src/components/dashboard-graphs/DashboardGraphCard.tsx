import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell,
  RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Trash2, GripVertical, Loader, ChevronDown, Check, Settings } from 'lucide-react';
import { EditGraphModal } from './EditGraphModal';
import { supabase } from './supabaseClient';
import { getDateRangeFromPreset, transformToChartData } from '../time-series-chart/chartUtils';
import { SIZE_OPTIONS } from './types';
import { getBrandingChartPalette } from './brandingPalette';
import type { DashboardGraph, MetricDefinition, GraphSize } from './types';

interface DashboardGraphCardProps {
  graph: DashboardGraph;
  metricDefinitions: Record<string, MetricDefinition>;
  clientId: string;
  isEditing: boolean;
  isSource?: boolean;
  isGhost?: boolean;
  onDelete: (id: string) => void;
  onDragHandlePointerDown: (e: React.PointerEvent, id: string) => void;
  onRefresh?: () => void;
  onSizeChange?: (id: string, size: GraphSize) => void;
  brandColor?: string;
}

const GRANULARITY_MAP: Record<string, string> = {
  day: 'daily',
  week: 'weekly',
  month: 'monthly',
  quarter: 'quarterly',
};

export function DashboardGraphCard({
  graph,
  metricDefinitions,
  clientId,
  isEditing,
  isSource = false,
  isGhost = false,
  onDelete,
  onDragHandlePointerDown,
  onRefresh,
  onSizeChange,
  brandColor,
}: DashboardGraphCardProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const sizeDropdownRef = React.useRef<HTMLDivElement>(null);

  const metricIds = useMemo(() => {
    if (!graph.metric_ids) return [];
    return Array.isArray(graph.metric_ids) ? graph.metric_ids : [];
  }, [graph.metric_ids]);

  const chartHeight = graph.config?.height || 280;
  const colors = useMemo(() => getBrandingChartPalette(), [brandColor]);

  useEffect(() => {
    loadData();
  }, [graph.id, metricIds, graph.time_range, graph.group_by]);

  useEffect(() => {
    if (!showSizeDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (sizeDropdownRef.current && !sizeDropdownRef.current.contains(e.target as Node)) {
        setShowSizeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSizeDropdown]);

  const loadData = async () => {
    if (metricIds.length === 0) {
      setChartData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      if (graph.chart_type === 'pie' || graph.chart_type === 'donut') {
        await loadAggregateData();
      } else if (graph.chart_type === 'progress') {
        await loadProgressData();
      } else {
        await loadTimeSeriesData();
      }
    } catch (err) {
      console.error('Error loading graph data:', err);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeSeriesData = async () => {
    const { startDate, endDate } = getDateRangeFromPreset(graph.time_range || 'last_6_months');
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('historical_metric_data')
      .select('metric_id, data_date, value')
      .eq('client_id', clientId)
      .in('metric_id', metricIds)
      .gte('data_date', startStr)
      .lte('data_date', endStr)
      .order('data_date', { ascending: true });

    if (error) throw error;

    const metricNames: Record<string, string> = {};
    metricIds.forEach(id => {
      const def = metricDefinitions[id];
      if (def) metricNames[id] = def.metric_name;
    });

    const granularity = GRANULARITY_MAP[graph.group_by || 'month'] || 'monthly';
    const transformed = transformToChartData(data || [], metricNames, granularity);
    setChartData(transformed);
  };

  const loadAggregateData = async () => {
    const { startDate, endDate } = getDateRangeFromPreset(graph.time_range || 'last_6_months');
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const results: { name: string; value: number }[] = [];

    for (const metricId of metricIds) {
      const { data, error } = await supabase
        .from('historical_metric_data')
        .select('value')
        .eq('client_id', clientId)
        .eq('metric_id', metricId)
        .gte('data_date', startStr)
        .lte('data_date', endStr);

      if (error) throw error;

      const total = (data || []).reduce((sum, d) => sum + (d.value || 0), 0);
      const def = metricDefinitions[metricId];
      results.push({ name: def?.metric_name || 'Unknown', value: total });
    }

    setChartData(results);
  };

  const loadProgressData = async () => {
    if (metricIds.length === 0) return;
    const metricId = metricIds[0];

    const { data, error } = await supabase
      .from('historical_metric_data')
      .select('value')
      .eq('client_id', clientId)
      .eq('metric_id', metricId)
      .order('data_date', { ascending: false })
      .limit(1);

    if (error) throw error;

    const currentValue = data?.[0]?.value || 0;
    const target = graph.goals?.target_value || 100;
    const pct = Math.min((currentValue / target) * 100, 100);

    setChartData([{ name: 'Progress', value: pct, fill: '__BRAND__' }]);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div style={{
        background: 'white',
        padding: '10px 14px',
        borderRadius: '8px',
        border: '1px solid var(--slate-200, #e2e8f0)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}>
        {label && (
          <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 600, color: 'var(--slate-800, #1e293b)' }}>
            {label}
          </p>
        )}
        {payload.map((entry: any, idx: number) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: entry.color }} />
            <span style={{ fontSize: '11px', color: 'var(--slate-500, #64748b)' }}>{entry.name}:</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--slate-800, #1e293b)' }}>
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const gridStroke = 'var(--slate-100, #f1f5f9)';
  const axisStroke = 'var(--slate-400, #94a3b8)';

  const renderChart = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: chartHeight }}>
          <Loader size={24} className="animate-spin" style={{ color: 'var(--brand-primary, #06b6d4)' }} />
        </div>
      );
    }

    if (chartData.length === 0) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: chartHeight, color: 'var(--slate-400, #94a3b8)', fontSize: '13px' }}>
          No data available
        </div>
      );
    }

    const metricNames = metricIds
      .map(id => metricDefinitions[id]?.metric_name)
      .filter(Boolean);

    const showGridLines = graph.config?.show_grid !== false;
    const showLegendProp = graph.config?.show_legend !== false;

    switch (graph.chart_type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              {showGridLines && <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />}
              <XAxis dataKey="date" stroke={axisStroke} fontSize={11} tickLine={false} />
              <YAxis stroke={axisStroke} fontSize={11} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {showLegendProp && metricNames.length > 1 && <Legend wrapperStyle={{ fontSize: '11px' }} />}
              {metricNames.map((name, i) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={colors[i % colors.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              {showGridLines && <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />}
              <XAxis dataKey="date" stroke={axisStroke} fontSize={11} tickLine={false} />
              <YAxis stroke={axisStroke} fontSize={11} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {showLegendProp && metricNames.length > 1 && <Legend wrapperStyle={{ fontSize: '11px' }} />}
              {metricNames.map((name, i) => (
                <Bar key={name} dataKey={name} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <defs>
                {metricNames.map((name, i) => (
                  <linearGradient key={name} id={`areaFill-${graph.id}-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors[i % colors.length]} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={colors[i % colors.length]} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              {showGridLines && <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />}
              <XAxis dataKey="date" stroke={axisStroke} fontSize={11} tickLine={false} />
              <YAxis stroke={axisStroke} fontSize={11} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {showLegendProp && metricNames.length > 1 && <Legend wrapperStyle={{ fontSize: '11px' }} />}
              {metricNames.map((name, i) => (
                <Area
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={colors[i % colors.length]}
                  fill={`url(#areaFill-${graph.id}-${i})`}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={chartHeight / 3}
                strokeWidth={2}
                stroke="#ffffff"
              >
                {chartData.map((_: any, i: number) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              {showLegendProp && <Legend wrapperStyle={{ fontSize: '11px' }} />}
            </PieChart>
          </ResponsiveContainer>
        );

      case 'donut':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={chartHeight / 5}
                outerRadius={chartHeight / 3}
                strokeWidth={2}
                stroke="#ffffff"
              >
                {chartData.map((_: any, i: number) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              {showLegendProp && <Legend wrapperStyle={{ fontSize: '11px' }} />}
            </PieChart>
          </ResponsiveContainer>
        );

      case 'progress': {
        const pct = chartData[0]?.value || 0;
        const target = graph.goals?.target_value || 100;
        const label = graph.goals?.label || 'Target';

        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: chartHeight, gap: '16px' }}>
            <ResponsiveContainer width="100%" height={160}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="70%"
                outerRadius="100%"
                barSize={14}
                data={chartData}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar
                  dataKey="value"
                  cornerRadius={10}
                  fill={colors[0]}
                  background={{ fill: 'var(--slate-100, #f1f5f9)' }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div style={{ textAlign: 'center', marginTop: '-40px' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: colors[0] }}>
                {pct.toFixed(0)}%
              </div>
              <div style={{ fontSize: '12px', color: 'var(--slate-500, #64748b)', marginTop: '4px' }}>
                {label}: {target.toLocaleString()}
              </div>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  const shouldJiggle = isEditing && !isSource && !isGhost;
  const classNames = [
    shouldJiggle && 'editing',
    isSource && 'dragging-source',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classNames}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'white',
        borderRadius: '16px',
        border: isGhost
          ? '1.5px solid var(--brand-primary, #06b6d4)'
          : isEditing
            ? '1px solid transparent'
            : '1px solid var(--slate-100, #f1f5f9)',
        boxShadow: isGhost
          ? '0 8px 32px rgba(6, 182, 212, 0.25), 0 4px 16px rgba(0,0,0,0.15)'
          : isEditing
            ? hovered
              ? '0 0 0 2px var(--brand-primary, #06b6d4), 0 0 24px rgba(6, 182, 212, 0.25), 0 2px 12px rgba(6, 182, 212, 0.13)'
              : '0 0 0 2px rgba(6, 182, 212, 0.31), 0 0 12px rgba(6, 182, 212, 0.13)'
            : hovered
              ? '0 4px 20px rgba(0,0,0,0.08)'
              : '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
        overflow: 'hidden',
        transition: isGhost ? 'none' : 'box-shadow 0.3s ease, border-color 0.2s ease',
        position: 'relative',
        height: '100%',
      }}
    >
      {isEditing && !isGhost && (
        <div
          className="widget-drag-handle-box"
          onPointerDown={e => {
            e.preventDefault();
            onDragHandlePointerDown(e, graph.id);
          }}
          style={{ touchAction: 'none' }}
        >
          <GripVertical size={16} />
        </div>
      )}

      {isEditing && !isGhost && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <button
            onClick={() => setShowEditModal(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(4px)',
              border: '1px solid var(--slate-200, #e2e8f0)',
              borderRadius: '6px',
              padding: '5px 8px',
              cursor: 'pointer',
              color: 'var(--slate-600, #475569)',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Edit graph settings"
          >
            <Settings size={13} />
          </button>
          <button
            onClick={() => onDelete(graph.id)}
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(4px)',
              border: '1px solid var(--slate-200, #e2e8f0)',
              borderRadius: '6px',
              padding: '5px 8px',
              cursor: 'pointer',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Delete graph"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}

      {isEditing && !isGhost && (
        <div
          ref={sizeDropdownRef}
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            zIndex: 10,
          }}
        >
          <button
            onClick={() => setShowSizeDropdown(!showSizeDropdown)}
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(4px)',
              border: '1px solid var(--slate-200, #e2e8f0)',
              borderRadius: '6px',
              padding: '4px 10px',
              cursor: 'pointer',
              color: 'var(--slate-600, #475569)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {SIZE_OPTIONS.find(o => o.value === graph.size)?.label || 'Half'}
            <ChevronDown size={12} style={{ opacity: 0.6 }} />
          </button>

          {showSizeDropdown && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                right: 0,
                marginBottom: '4px',
                background: 'white',
                border: '1px solid var(--slate-200, #e2e8f0)',
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                minWidth: '140px',
                overflow: 'hidden',
              }}
            >
              {SIZE_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSizeChange?.(graph.id, option.value);
                    setShowSizeDropdown(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: 'none',
                    background: graph.size === option.value ? 'var(--slate-50, #f8fafc)' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    fontSize: '12px',
                    color: graph.size === option.value ? 'var(--brand-primary, #06b6d4)' : 'var(--slate-600, #475569)',
                    fontWeight: graph.size === option.value ? 600 : 400,
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    if (graph.size !== option.value) {
                      e.currentTarget.style.background = 'var(--slate-50, #f8fafc)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (graph.size !== option.value) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <span>{option.label}</span>
                  {graph.size === option.value && <Check size={14} />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{
        padding: '16px 20px 8px',
        paddingLeft: isEditing && !isGhost ? '44px' : '20px',
        transition: 'padding 0.2s ease',
      }}>
        <h4 style={{
          margin: 0,
          fontSize: '15px',
          fontWeight: 600,
          color: 'var(--slate-800, #1e293b)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {graph.title}
        </h4>
        <p style={{
          margin: '2px 0 0',
          fontSize: '11px',
          color: 'var(--slate-400, #94a3b8)',
        }}>
          {metricIds.length} metric{metricIds.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div style={{ padding: '0 12px 16px' }}>
        {renderChart()}
      </div>

      {showEditModal && (
        <EditGraphModal
          graph={graph}
          clientId={clientId}
          onClose={() => setShowEditModal(false)}
          onUpdated={() => {
            setShowEditModal(false);
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
}
