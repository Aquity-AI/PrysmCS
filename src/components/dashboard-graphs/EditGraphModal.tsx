import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Check, Plus } from 'lucide-react';
import { ChartTypeIcon } from './ChartTypeIcons';
import { CreateMetricModal } from './CreateMetricModal';
import * as styles from './modalStyles';
import {
  CHART_TYPE_OPTIONS,
  SIZE_OPTIONS,
  TIME_RANGE_OPTIONS,
  GROUP_BY_OPTIONS,
  CATEGORY_COLORS,
} from './types';
import type {
  ChartType,
  GraphSize,
  TimeRange,
  GroupBy,
  MetricDefinition,
  GraphConfig,
  GoalConfig,
  DashboardGraph,
} from './types';
import { fetchMetricDefinitions, updateGraph } from './dashboardGraphService';

interface EditGraphModalProps {
  graph: DashboardGraph;
  clientId: string;
  onClose: () => void;
  onUpdated: () => void;
}

const sectionHeader: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '14px',
};

export function EditGraphModal({ graph, clientId, onClose, onUpdated }: EditGraphModalProps) {
  const [saving, setSaving] = useState(false);
  const [chartType, setChartType] = useState<ChartType>(graph.chart_type);
  const [selectedMetricIds, setSelectedMetricIds] = useState<string[]>(
    Array.isArray(graph.metric_ids) ? graph.metric_ids : []
  );
  const [graphSize, setGraphSize] = useState<GraphSize>(graph.size);
  const [timeRange, setTimeRange] = useState<TimeRange>(graph.time_range || 'last_6_months');
  const [groupBy, setGroupBy] = useState<GroupBy>(graph.group_by || 'month');
  const [graphTitle, setGraphTitle] = useState(graph.title);
  const [goalTarget, setGoalTarget] = useState(graph.goals?.target_value?.toString() || '');
  const [goalLabel, setGoalLabel] = useState(graph.goals?.label || 'Target');
  const [showLegend, setShowLegend] = useState(graph.config?.show_legend !== false);
  const [showGrid, setShowGrid] = useState(graph.config?.show_grid !== false);

  const [metrics, setMetrics] = useState<MetricDefinition[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateMetric, setShowCreateMetric] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setMetricsLoading(true);
    try {
      const data = await fetchMetricDefinitions(clientId);
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setMetricsLoading(false);
    }
  };

  const isSingleSelect = chartType === 'pie' || chartType === 'donut' || chartType === 'progress';

  const groupedMetrics = useMemo(() => {
    const filtered = metrics.filter(m =>
      m.metric_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const groups: Record<string, MetricDefinition[]> = {};
    filtered.forEach(m => {
      const cat = m.category || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(m);
    });
    return groups;
  }, [metrics, searchQuery]);

  const categoryOrder = ['financial', 'enrollment', 'engagement', 'outcomes', 'custom'];
  const sortedCategories = Object.keys(groupedMetrics).sort(
    (a, b) => (categoryOrder.indexOf(a) === -1 ? 99 : categoryOrder.indexOf(a)) -
              (categoryOrder.indexOf(b) === -1 ? 99 : categoryOrder.indexOf(b))
  );

  const handleChartTypeChange = (type: ChartType) => {
    setChartType(type);
    const newIsSingle = type === 'pie' || type === 'donut' || type === 'progress';
    if (newIsSingle && selectedMetricIds.length > 1) {
      setSelectedMetricIds([selectedMetricIds[0]]);
    }
  };

  const toggleMetric = (id: string) => {
    if (isSingleSelect) {
      setSelectedMetricIds(prev => prev[0] === id ? [] : [id]);
    } else {
      setSelectedMetricIds(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
    }
  };

  const showTimeSettings = chartType !== 'pie' && chartType !== 'donut';

  const hasChanges = (): boolean => {
    const origMetrics = Array.isArray(graph.metric_ids) ? graph.metric_ids : [];
    return (
      chartType !== graph.chart_type ||
      graphTitle !== graph.title ||
      graphSize !== graph.size ||
      timeRange !== (graph.time_range || 'last_6_months') ||
      groupBy !== (graph.group_by || 'month') ||
      showLegend !== (graph.config?.show_legend !== false) ||
      showGrid !== (graph.config?.show_grid !== false) ||
      JSON.stringify(selectedMetricIds.sort()) !== JSON.stringify([...origMetrics].sort()) ||
      goalTarget !== (graph.goals?.target_value?.toString() || '') ||
      goalLabel !== (graph.goals?.label || 'Target')
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const goals: GoalConfig | undefined = chartType === 'progress' && goalTarget
        ? { target_value: parseFloat(goalTarget), label: goalLabel || 'Target' }
        : undefined;

      const config: GraphConfig = {
        show_legend: showLegend,
        show_grid: showGrid,
        show_data_points: graph.config?.show_data_points || false,
        height: graph.config?.height || 300,
      };

      await updateGraph(graph.id, {
        title: graphTitle.trim() || 'Untitled Graph',
        chart_type: chartType,
        size: graphSize,
        metric_ids: selectedMetricIds,
        time_range: timeRange,
        group_by: groupBy,
        goals: goals || null,
        config,
      });

      onUpdated();
      onClose();
    } catch (err) {
      console.error('Failed to update graph:', err);
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ ...styles.modal, maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Graph Settings</h2>
          <button style={styles.closeButton} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
          <div style={sectionHeader}>Display</div>

          <div style={{ marginBottom: '18px' }}>
            <label style={styles.fieldLabel}>Title</label>
            <input
              type="text"
              value={graphTitle}
              onChange={e => setGraphTitle(e.target.value)}
              placeholder="Enter a title for your graph"
              style={styles.textInput}
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={styles.fieldLabel}>Card Size</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {SIZE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setGraphSize(opt.value)}
                  style={styles.sizeCard(graphSize === opt.value)}
                >
                  <div style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    background: '#0f172a',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${(opt.gridUnits / 12) * 100}%`,
                      height: '100%',
                      borderRadius: '3px',
                      background: graphSize === opt.value ? 'var(--brand-primary, #06b6d4)' : '#475569',
                      transition: 'all 0.15s ease',
                    }} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: graphSize === opt.value ? '#e2e8f0' : '#94a3b8' }}>
                    {opt.label}
                  </span>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>
                    {Math.round((opt.gridUnits / 12) * 100)}%
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div style={sectionHeader}>Chart Type</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '28px' }}>
            {CHART_TYPE_OPTIONS.map(opt => (
              <button
                key={opt.type}
                onClick={() => handleChartTypeChange(opt.type)}
                style={{
                  ...styles.chartTypeCard(chartType === opt.type),
                  padding: '16px 10px',
                }}
                onMouseEnter={e => {
                  if (chartType !== opt.type) e.currentTarget.style.borderColor = '#475569';
                }}
                onMouseLeave={e => {
                  if (chartType !== opt.type) e.currentTarget.style.borderColor = '#334155';
                }}
              >
                <ChartTypeIcon type={opt.type} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>

          <div style={sectionHeader}>Data</div>
          <button
            onClick={() => setShowCreateMetric(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              background: 'color-mix(in srgb, var(--brand-primary, #06b6d4) 8%, transparent)',
              border: '1px dashed color-mix(in srgb, var(--brand-primary, #06b6d4) 40%, transparent)',
              borderRadius: '8px',
              color: 'var(--brand-primary, #06b6d4)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%',
              marginBottom: '12px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'color-mix(in srgb, var(--brand-primary, #06b6d4) 15%, transparent)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'color-mix(in srgb, var(--brand-primary, #06b6d4) 8%, transparent)'; }}
          >
            <Plus size={15} />
            Create New Metric
          </button>
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search metrics..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          {isSingleSelect && (
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>
              Select one metric for this chart type
            </p>
          )}

          <div style={{ marginBottom: '28px' }}>
            {metricsLoading ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '13px' }}>Loading metrics...</div>
            ) : sortedCategories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '13px' }}>
                {searchQuery ? 'No metrics match your search' : 'No metrics available.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sortedCategories.map(category => (
                  <div key={category}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {category}
                      </span>
                      <span style={styles.categoryBadge(CATEGORY_COLORS[category] || '#64748b')}>
                        {groupedMetrics[category].length}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {groupedMetrics[category].map(metric => {
                        const isSelected = selectedMetricIds.includes(metric.id);
                        return (
                          <button
                            key={metric.id}
                            onClick={() => toggleMetric(metric.id)}
                            style={styles.metricCard(isSelected)}
                            onMouseEnter={e => {
                              if (!isSelected) e.currentTarget.style.borderColor = '#475569';
                            }}
                            onMouseLeave={e => {
                              if (!isSelected) e.currentTarget.style.borderColor = '#334155';
                            }}
                          >
                            <div style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: isSingleSelect ? '50%' : '4px',
                              border: isSelected ? 'none' : '2px solid #475569',
                              background: isSelected ? 'var(--brand-primary, #06b6d4)' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              {isSelected && <Check size={11} style={{ color: '#fff' }} />}
                            </div>
                            <div style={{ flex: 1, textAlign: 'left' }}>
                              <div style={{ fontSize: '13px', fontWeight: 500, color: '#e2e8f0' }}>
                                {metric.metric_name}
                              </div>
                            </div>
                            <span style={{ fontSize: '10px', color: '#475569', flexShrink: 0 }}>
                              {metric.data_type}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={sectionHeader}>Options</div>
          {showTimeSettings && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={styles.fieldLabel}>Time Range</label>
                <select
                  value={timeRange}
                  onChange={e => setTimeRange(e.target.value as TimeRange)}
                  style={styles.selectInput}
                >
                  {TIME_RANGE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={styles.fieldLabel}>Group By</label>
                <select
                  value={groupBy}
                  onChange={e => setGroupBy(e.target.value as GroupBy)}
                  style={styles.selectInput}
                >
                  {GROUP_BY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {chartType === 'progress' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={styles.fieldLabel}>Goal Target</label>
                <input
                  type="number"
                  value={goalTarget}
                  onChange={e => setGoalTarget(e.target.value)}
                  placeholder="e.g. 100000"
                  style={styles.textInput}
                />
              </div>
              <div>
                <label style={styles.fieldLabel}>Goal Label</label>
                <input
                  type="text"
                  value={goalLabel}
                  onChange={e => setGoalLabel(e.target.value)}
                  placeholder="e.g. Target"
                  style={styles.textInput}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showLegend}
                onChange={e => setShowLegend(e.target.checked)}
                style={{ accentColor: 'var(--brand-primary, #06b6d4)' }}
              />
              <span style={{ fontSize: '13px', color: '#cbd5e1' }}>Show Legend</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showGrid}
                onChange={e => setShowGrid(e.target.checked)}
                style={{ accentColor: 'var(--brand-primary, #06b6d4)' }}
              />
              <span style={{ fontSize: '13px', color: '#cbd5e1' }}>Show Grid</span>
            </label>
          </div>
        </div>

        <div style={styles.footer}>
          <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button
            style={styles.continueBtn(saving || !hasChanges())}
            onClick={handleSave}
            disabled={saving || !hasChanges()}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Check size={14} /> {saving ? 'Saving...' : 'Save Changes'}
            </span>
          </button>
        </div>
      </div>

      {showCreateMetric && (
        <CreateMetricModal
          clientId={clientId}
          onClose={() => setShowCreateMetric(false)}
          onSave={(savedMetric) => {
            setShowCreateMetric(false);
            loadMetrics();
            if (savedMetric?.id) {
              setSelectedMetricIds(prev => {
                if (isSingleSelect) return [savedMetric.id];
                return prev.includes(savedMetric.id) ? prev : [...prev, savedMetric.id];
              });
            }
          }}
        />
      )}
    </div>,
    document.body
  );
}
