import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, ChevronRight, ChevronLeft, Check, Plus } from 'lucide-react';
import { MetricFormModal } from '../metrics-management/MetricFormModal';
import { ChartTypeIcon } from './ChartTypeIcons';
import * as styles from './modalStyles';
import {
  CHART_TYPE_OPTIONS,
  SIZE_OPTIONS,
  TIME_RANGE_OPTIONS,
  GROUP_BY_OPTIONS,
  CATEGORY_COLORS,
} from './types';
import { getBrandingChartPalette } from './brandingPalette';
import type {
  ChartType,
  GraphSize,
  TimeRange,
  GroupBy,
  MetricDefinition,
  GraphConfig,
  GoalConfig,
} from './types';
import { fetchMetricDefinitions, createGraph } from './dashboardGraphService';
import type { CreateGraphInput } from './dashboardGraphService';

interface AddGraphModalProps {
  clientId: string;
  pageId: string;
  onClose: () => void;
  onCreated: () => void;
}

const TOTAL_STEPS = 4;

export function AddGraphModal({ clientId, pageId, onClose, onCreated }: AddGraphModalProps) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [chartType, setChartType] = useState<ChartType | null>(null);
  const [selectedMetricIds, setSelectedMetricIds] = useState<string[]>([]);
  const [graphSize, setGraphSize] = useState<GraphSize>('half');
  const [timeRange, setTimeRange] = useState<TimeRange>('last_6_months');
  const [groupBy, setGroupBy] = useState<GroupBy>('month');
  const [graphTitle, setGraphTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalLabel, setGoalLabel] = useState('Target');
  const [showLegend, setShowLegend] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  const [metrics, setMetrics] = useState<MetricDefinition[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateMetric, setShowCreateMetric] = useState(false);

  useEffect(() => {
    if (step === 2 && metrics.length === 0) {
      loadMetrics();
    }
  }, [step]);

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

  const toggleMetric = (id: string) => {
    if (isSingleSelect) {
      setSelectedMetricIds(prev => prev[0] === id ? [] : [id]);
    } else {
      setSelectedMetricIds(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
    }
  };

  const canContinue = (): boolean => {
    switch (step) {
      case 1: return chartType !== null;
      case 2: return selectedMetricIds.length > 0;
      case 3: return graphTitle.trim().length > 0;
      case 4: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step === 3 && !graphTitle.trim()) {
      const metricNames = selectedMetricIds
        .map(id => metrics.find(m => m.id === id)?.metric_name)
        .filter(Boolean);
      setGraphTitle(metricNames.join(' & ') || 'New Graph');
    }
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
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
        show_data_points: false,
        height: 300,
      };

      const input: CreateGraphInput = {
        client_id: clientId,
        page_id: pageId,
        title: graphTitle.trim() || 'New Graph',
        chart_type: chartType!,
        size: graphSize,
        metric_ids: selectedMetricIds,
        time_range: timeRange,
        group_by: groupBy,
        goals,
        config,
      };

      await createGraph(input);
      onCreated();
      onClose();
    } catch (err) {
      console.error('Failed to create graph:', err);
    } finally {
      setSaving(false);
    }
  };

  const stepLabels = ['Choose chart type', 'Select metrics', 'Configure appearance', 'Review & save'];

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Add Graph</h2>
          <button style={styles.closeButton} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={styles.progressBar}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} style={styles.progressSegment(i < step)} />
          ))}
        </div>

        <div style={styles.stepLabel}>Step {step} of {TOTAL_STEPS}</div>
        <h3 style={styles.stepTitle}>{stepLabels[step - 1]}</h3>

        <div style={styles.body}>
          {step === 1 && <StepChartType selected={chartType} onSelect={setChartType} />}
          {step === 2 && (
            <StepMetrics
              metrics={groupedMetrics}
              loading={metricsLoading}
              selected={selectedMetricIds}
              onToggle={toggleMetric}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              isSingleSelect={isSingleSelect}
              onCreateMetric={() => setShowCreateMetric(true)}
            />
          )}
          {step === 3 && (
            <StepAppearance
              chartType={chartType!}
              graphTitle={graphTitle}
              onTitleChange={setGraphTitle}
              graphSize={graphSize}
              onSizeChange={setGraphSize}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              groupBy={groupBy}
              onGroupByChange={setGroupBy}
              showLegend={showLegend}
              onShowLegendChange={setShowLegend}
              showGrid={showGrid}
              onShowGridChange={setShowGrid}
              goalTarget={goalTarget}
              onGoalTargetChange={setGoalTarget}
              goalLabel={goalLabel}
              onGoalLabelChange={setGoalLabel}
              selectedMetricNames={selectedMetricIds.map(id => metrics.find(m => m.id === id)?.metric_name || '')}
            />
          )}
          {step === 4 && (
            <StepReview
              chartType={chartType!}
              graphTitle={graphTitle}
              graphSize={graphSize}
              timeRange={timeRange}
              groupBy={groupBy}
              metrics={metrics}
              selectedMetricIds={selectedMetricIds}
              goalTarget={goalTarget}
              goalLabel={goalLabel}
            />
          )}
        </div>

        <div style={styles.footer}>
          {step > 1 ? (
            <button style={styles.cancelBtn} onClick={handleBack}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ChevronLeft size={14} /> Back
              </span>
            </button>
          ) : (
            <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
          )}

          {step < TOTAL_STEPS ? (
            <button
              style={styles.continueBtn(!canContinue())}
              onClick={handleNext}
              disabled={!canContinue()}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                Continue <ChevronRight size={14} />
              </span>
            </button>
          ) : (
            <button
              style={styles.continueBtn(saving)}
              onClick={handleSave}
              disabled={saving}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={14} /> {saving ? 'Saving...' : 'Save Graph'}
              </span>
            </button>
          )}
        </div>
      </div>

      {showCreateMetric && (
        <MetricFormModal
          clientId={clientId}
          metric={null}
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
    </div>
  );
}

function StepChartType({ selected, onSelect }: { selected: ChartType | null; onSelect: (t: ChartType) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
      {CHART_TYPE_OPTIONS.map(opt => (
        <button
          key={opt.type}
          onClick={() => onSelect(opt.type)}
          style={styles.chartTypeCard(selected === opt.type)}
          onMouseEnter={e => {
            if (selected !== opt.type) e.currentTarget.style.borderColor = '#475569';
          }}
          onMouseLeave={e => {
            if (selected !== opt.type) e.currentTarget.style.borderColor = '#334155';
          }}
        >
          <ChartTypeIcon type={opt.type} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
            {opt.label}
          </span>
          <span style={{ fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
            {opt.description}
          </span>
        </button>
      ))}
    </div>
  );
}

function StepMetrics({
  metrics,
  loading,
  selected,
  onToggle,
  searchQuery,
  onSearchChange,
  isSingleSelect,
  onCreateMetric,
}: {
  metrics: Record<string, MetricDefinition[]>;
  loading: boolean;
  selected: string[];
  onToggle: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isSingleSelect: boolean;
  onCreateMetric?: () => void;
}) {
  const categoryOrder = ['financial', 'enrollment', 'engagement', 'outcomes', 'custom'];
  const sortedCategories = Object.keys(metrics).sort(
    (a, b) => (categoryOrder.indexOf(a) === -1 ? 99 : categoryOrder.indexOf(a)) -
              (categoryOrder.indexOf(b) === -1 ? 99 : categoryOrder.indexOf(b))
  );

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
        <input
          type="text"
          placeholder="Search metrics..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {onCreateMetric && (
        <button
          onClick={onCreateMetric}
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
      )}

      {isSingleSelect && (
        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', margin: '0 0 12px 0' }}>
          Select one metric for this chart type
        </p>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading metrics...</div>
      ) : sortedCategories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          {searchQuery ? 'No metrics match your search' : 'No metrics available. Create metrics first.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {sortedCategories.map(category => (
            <div key={category}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {category}
                </span>
                <span style={styles.categoryBadge(CATEGORY_COLORS[category] || '#64748b')}>
                  {metrics[category].length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {metrics[category].map(metric => {
                  const isSelected = selected.includes(metric.id);
                  return (
                    <button
                      key={metric.id}
                      onClick={() => onToggle(metric.id)}
                      style={styles.metricCard(isSelected)}
                      onMouseEnter={e => {
                        if (!isSelected) e.currentTarget.style.borderColor = '#475569';
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) e.currentTarget.style.borderColor = '#334155';
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: isSingleSelect ? '50%' : '4px',
                        border: isSelected ? 'none' : '2px solid #475569',
                        background: isSelected ? 'var(--brand-primary, #06b6d4)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {isSelected && <Check size={12} style={{ color: '#fff' }} />}
                      </div>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#e2e8f0' }}>
                          {metric.metric_name}
                        </div>
                        {metric.description && (
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                            {metric.description}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: '11px', color: '#475569', flexShrink: 0 }}>
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
  );
}

function StepAppearance({
  chartType,
  graphTitle,
  onTitleChange,
  graphSize,
  onSizeChange,
  timeRange,
  onTimeRangeChange,
  groupBy,
  onGroupByChange,
  showLegend,
  onShowLegendChange,
  showGrid,
  onShowGridChange,
  goalTarget,
  onGoalTargetChange,
  goalLabel,
  onGoalLabelChange,
  selectedMetricNames,
}: {
  chartType: ChartType;
  graphTitle: string;
  onTitleChange: (t: string) => void;
  graphSize: GraphSize;
  onSizeChange: (s: GraphSize) => void;
  timeRange: TimeRange;
  onTimeRangeChange: (t: TimeRange) => void;
  groupBy: GroupBy;
  onGroupByChange: (g: GroupBy) => void;
  showLegend: boolean;
  onShowLegendChange: (v: boolean) => void;
  showGrid: boolean;
  onShowGridChange: (v: boolean) => void;
  goalTarget: string;
  onGoalTargetChange: (v: string) => void;
  goalLabel: string;
  onGoalLabelChange: (v: string) => void;
  selectedMetricNames: string[];
}) {
  useEffect(() => {
    if (!graphTitle && selectedMetricNames.length > 0) {
      onTitleChange(selectedMetricNames.filter(Boolean).join(' & '));
    }
  }, []);

  const showTimeSettings = chartType !== 'pie' && chartType !== 'donut';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <label style={styles.fieldLabel}>Graph Title</label>
        <input
          type="text"
          value={graphTitle}
          onChange={e => onTitleChange(e.target.value)}
          placeholder="Enter a title for your graph"
          style={styles.textInput}
        />
      </div>

      <div>
        <label style={styles.fieldLabel}>Size</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {SIZE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onSizeChange(opt.value)}
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
              <span style={{ fontSize: '10px', color: '#64748b' }}>{opt.description}</span>
            </button>
          ))}
        </div>
      </div>

      {showTimeSettings && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={styles.fieldLabel}>Time Range</label>
            <select
              value={timeRange}
              onChange={e => onTimeRangeChange(e.target.value as TimeRange)}
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
              onChange={e => onGroupByChange(e.target.value as GroupBy)}
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={styles.fieldLabel}>Goal Target Value</label>
            <input
              type="number"
              value={goalTarget}
              onChange={e => onGoalTargetChange(e.target.value)}
              placeholder="e.g. 100000"
              style={styles.textInput}
            />
          </div>
          <div>
            <label style={styles.fieldLabel}>Goal Label</label>
            <input
              type="text"
              value={goalLabel}
              onChange={e => onGoalLabelChange(e.target.value)}
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
            onChange={e => onShowLegendChange(e.target.checked)}
            style={{ accentColor: 'var(--brand-primary, #06b6d4)' }}
          />
          <span style={{ fontSize: '13px', color: '#cbd5e1' }}>Show Legend</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showGrid}
            onChange={e => onShowGridChange(e.target.checked)}
            style={{ accentColor: 'var(--brand-primary, #06b6d4)' }}
          />
          <span style={{ fontSize: '13px', color: '#cbd5e1' }}>Show Grid</span>
        </label>
      </div>
    </div>
  );
}

function StepReview({
  chartType,
  graphTitle,
  graphSize,
  timeRange,
  groupBy,
  metrics,
  selectedMetricIds,
  goalTarget,
  goalLabel,
}: {
  chartType: ChartType;
  graphTitle: string;
  graphSize: GraphSize;
  timeRange: TimeRange;
  groupBy: GroupBy;
  metrics: MetricDefinition[];
  selectedMetricIds: string[];
  goalTarget: string;
  goalLabel: string;
}) {
  const selectedMetrics = selectedMetricIds
    .map(id => metrics.find(m => m.id === id))
    .filter(Boolean) as MetricDefinition[];

  const chartLabel = CHART_TYPE_OPTIONS.find(o => o.type === chartType)?.label || chartType;
  const sizeLabel = SIZE_OPTIONS.find(o => o.value === graphSize)?.label || graphSize;
  const timeLabel = TIME_RANGE_OPTIONS.find(o => o.value === timeRange)?.label || timeRange;
  const groupLabel = GROUP_BY_OPTIONS.find(o => o.value === groupBy)?.label || groupBy;

  const reviewItems = [
    { label: 'Chart Type', value: chartLabel },
    { label: 'Title', value: graphTitle || 'Untitled' },
    { label: 'Size', value: sizeLabel },
    { label: 'Time Range', value: timeLabel },
    { label: 'Grouped By', value: groupLabel },
  ];

  if (chartType === 'progress' && goalTarget) {
    reviewItems.push({ label: 'Goal', value: `${goalLabel}: ${goalTarget}` });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{
        background: '#1e293b',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {reviewItems.map(item => (
          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>{item.label}</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>{item.value}</span>
          </div>
        ))}
      </div>

      <div>
        <label style={styles.fieldLabel}>Selected Metrics ({selectedMetrics.length})</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {selectedMetrics.map((metric, i) => (
            <div
              key={metric.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                background: '#1e293b',
                borderRadius: '8px',
              }}
            >
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: getBrandingChartPalette()[i % getBrandingChartPalette().length],
                flexShrink: 0,
              }} />
              <span style={{ fontSize: '13px', color: '#e2e8f0', flex: 1 }}>{metric.metric_name}</span>
              <span style={styles.categoryBadge(CATEGORY_COLORS[metric.category] || '#64748b')}>
                {metric.category}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        background: 'color-mix(in srgb, var(--brand-primary, #06b6d4) 6%, transparent)',
        border: '1px solid color-mix(in srgb, var(--brand-primary, #06b6d4) 20%, transparent)',
        borderRadius: '10px',
        padding: '14px 16px',
        fontSize: '12px',
        color: '#94a3b8',
        lineHeight: '1.5',
      }}>
        This graph will be saved to the current tab and will appear in the dashboard graphs section.
        You can resize, reorder, or remove it anytime from Edit Layout mode.
      </div>
    </div>
  );
}
