import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, GripVertical, Save, AlertCircle } from 'lucide-react';
import { supabase } from './supabaseClient';
import { DEFAULT_LINE_COLORS, getColorForIndex } from './chartUtils';
import { WidthSelector } from '../WidthSelector';

interface ChartSection {
  id: string;
  client_id: string;
  page_id: string;
  section_id: string;
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
  enabled: boolean;
}

interface ChartMetric {
  id: string;
  chart_section_id: string;
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
  metric_key: string;
  data_type: string;
  category: string;
  unit: string;
  description: string;
}

interface ChartConfigModalProps {
  chartSection: ChartSection | null;
  chartMetrics: ChartMetric[];
  metricDefinitions: Record<string, MetricDefinition>;
  clientId: string;
  pageId: string;
  sectionId: string;
  onClose: () => void;
  onSave: () => void;
}

export function ChartConfigModal({
  chartSection,
  chartMetrics,
  metricDefinitions,
  clientId,
  pageId,
  sectionId,
  onClose,
  onSave,
}: ChartConfigModalProps) {
  const [config, setConfig] = useState<Partial<ChartSection>>({
    title: chartSection?.title || 'Historical Trend',
    subtitle: chartSection?.subtitle || '',
    chart_type: chartSection?.chart_type || 'line',
    time_range_preset: chartSection?.time_range_preset || 'last_6_months',
    granularity: chartSection?.granularity || 'monthly',
    height: chartSection?.height || 300,
    width_units: chartSection?.width_units || 12,
    show_legend: chartSection?.show_legend ?? true,
    show_grid: chartSection?.show_grid ?? true,
    show_data_points: chartSection?.show_data_points ?? false,
    show_goal_line: chartSection?.show_goal_line ?? false,
    goal_value: chartSection?.goal_value || null,
    goal_label: chartSection?.goal_label || 'Goal',
  });

  const [selectedMetrics, setSelectedMetrics] = useState<ChartMetric[]>(chartMetrics);
  const [availableMetrics, setAvailableMetrics] = useState<MetricDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[ChartConfigModal] Component mounted');
    console.log('[ChartConfigModal] Props:', {
      chartSection,
      chartMetrics,
      metricDefinitions,
      clientId,
      pageId,
      sectionId,
    });
    console.log('[ChartConfigModal] Modal is now visible in DOM');
    loadAvailableMetrics();
  }, [clientId]);

  const loadAvailableMetrics = async () => {
    try {
      setLoading(true);
      const { data, error: metricsError } = await supabase
        .from('metric_definitions')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('metric_name');

      if (metricsError) throw metricsError;
      setAvailableMetrics(data || []);
    } catch (err) {
      console.error('Error loading metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMetric = (metric: MetricDefinition) => {
    const colorIndex = selectedMetrics.length % DEFAULT_LINE_COLORS.length;
    const newMetric: ChartMetric = {
      id: '',
      chart_section_id: chartSection?.id || '',
      metric_id: metric.id,
      line_color: getColorForIndex(colorIndex),
      line_style: 'solid',
      display_name_override: null,
      show_in_legend: true,
      display_order: selectedMetrics.length,
    };
    setSelectedMetrics([...selectedMetrics, newMetric]);
  };

  const handleRemoveMetric = (index: number) => {
    const updated = selectedMetrics.filter((_, i) => i !== index);
    setSelectedMetrics(updated.map((m, i) => ({ ...m, display_order: i })));
  };

  const handleUpdateMetric = (index: number, updates: Partial<ChartMetric>) => {
    const updated = [...selectedMetrics];
    updated[index] = { ...updated[index], ...updates };
    setSelectedMetrics(updated);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (selectedMetrics.length === 0) {
        setError('Please add at least one metric to the chart');
        return;
      }

      if (chartSection?.id) {
        const { error: updateError } = await supabase
          .from('chart_sections')
          .update({
            title: config.title,
            subtitle: config.subtitle,
            chart_type: config.chart_type,
            time_range_preset: config.time_range_preset,
            granularity: config.granularity,
            height: config.height,
            width_units: config.width_units,
            show_legend: config.show_legend,
            show_grid: config.show_grid,
            show_data_points: config.show_data_points,
            show_goal_line: config.show_goal_line,
            goal_value: config.goal_value,
            goal_label: config.goal_label,
            updated_at: new Date().toISOString(),
          })
          .eq('id', chartSection.id);

        if (updateError) throw updateError;

        const { error: deleteError } = await supabase
          .from('chart_metrics')
          .delete()
          .eq('chart_section_id', chartSection.id);

        if (deleteError) throw deleteError;

        const metricsToInsert = selectedMetrics.map((m, index) => ({
          chart_section_id: chartSection.id,
          metric_id: m.metric_id,
          line_color: m.line_color,
          line_style: m.line_style,
          display_name_override: m.display_name_override,
          show_in_legend: m.show_in_legend,
          display_order: index,
        }));

        const { error: insertError } = await supabase
          .from('chart_metrics')
          .insert(metricsToInsert);

        if (insertError) throw insertError;
      } else {
        const { data: newChart, error: createError } = await supabase
          .from('chart_sections')
          .insert({
            client_id: clientId,
            page_id: pageId,
            section_id: sectionId,
            title: config.title,
            subtitle: config.subtitle,
            chart_type: config.chart_type,
            time_range_preset: config.time_range_preset,
            granularity: config.granularity,
            height: config.height,
            width_units: config.width_units,
            show_legend: config.show_legend,
            show_grid: config.show_grid,
            show_data_points: config.show_data_points,
            show_goal_line: config.show_goal_line,
            goal_value: config.goal_value,
            goal_label: config.goal_label,
            enabled: true,
          })
          .select()
          .single();

        if (createError) throw createError;

        const metricsToInsert = selectedMetrics.map((m, index) => ({
          chart_section_id: newChart.id,
          metric_id: m.metric_id,
          line_color: m.line_color,
          line_style: m.line_style,
          display_name_override: m.display_name_override,
          show_in_legend: m.show_in_legend,
          display_order: index,
        }));

        const { error: insertError } = await supabase
          .from('chart_metrics')
          .insert(metricsToInsert);

        if (insertError) throw insertError;
      }

      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving chart configuration:', err);
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const isMetricSelected = (metricId: string) => {
    return selectedMetrics.some(m => m.metric_id === metricId);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '20px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid var(--slate-200)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--slate-900)' }}>
            Configure Chart
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              color: 'var(--slate-400)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {error && (
            <div
              style={{
                padding: '12px 16px',
                background: '#fee',
                border: '1px solid #fcc',
                borderRadius: '6px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#c00',
              }}
            >
              <AlertCircle size={16} />
              <span style={{ fontSize: '14px' }}>{error}</span>
            </div>
          )}

          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: 'var(--slate-900)' }}>
              Chart Settings
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--slate-700)', marginBottom: '6px' }}>
                  Title
                </label>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => setConfig({ ...config, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--slate-300)',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--slate-700)', marginBottom: '6px' }}>
                  Subtitle
                </label>
                <input
                  type="text"
                  value={config.subtitle}
                  onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--slate-300)',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--slate-700)', marginBottom: '6px' }}>
                  Chart Type
                </label>
                <select
                  value={config.chart_type}
                  onChange={(e) => setConfig({ ...config, chart_type: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--slate-300)',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  <option value="line">Line Chart</option>
                  <option value="area">Area Chart</option>
                  <option value="bar">Bar Chart</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--slate-700)', marginBottom: '6px' }}>
                  Time Range
                </label>
                <select
                  value={config.time_range_preset}
                  onChange={(e) => setConfig({ ...config, time_range_preset: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--slate-300)',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  <option value="last_3_months">Last 3 Months</option>
                  <option value="last_6_months">Last 6 Months</option>
                  <option value="last_12_months">Last 12 Months</option>
                  <option value="year_to_date">Year to Date</option>
                  <option value="all_time">All Time</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--slate-700)', marginBottom: '6px' }}>
                  Granularity
                </label>
                <select
                  value={config.granularity}
                  onChange={(e) => setConfig({ ...config, granularity: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--slate-300)',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--slate-700)', marginBottom: '6px' }}>
                  Height (pixels)
                </label>
                <input
                  type="number"
                  value={config.height}
                  onChange={(e) => setConfig({ ...config, height: parseInt(e.target.value) || 300 })}
                  min="200"
                  max="600"
                  step="50"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--slate-300)',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <WidthSelector
                value={config.width_units}
                onChange={(width) => setConfig({ ...config, width_units: width })}
                sectionType="chart"
                showAdvanced={true}
              />
            </div>

            <div style={{ marginTop: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config.show_legend}
                  onChange={(e) => setConfig({ ...config, show_legend: e.target.checked })}
                />
                Show Legend
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config.show_grid}
                  onChange={(e) => setConfig({ ...config, show_grid: e.target.checked })}
                />
                Show Grid
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config.show_data_points}
                  onChange={(e) => setConfig({ ...config, show_data_points: e.target.checked })}
                />
                Show Data Points
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config.show_goal_line}
                  onChange={(e) => setConfig({ ...config, show_goal_line: e.target.checked })}
                />
                Show Goal Line
              </label>
            </div>

            {config.show_goal_line && (
              <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--slate-700)', marginBottom: '6px' }}>
                    Goal Value
                  </label>
                  <input
                    type="number"
                    value={config.goal_value || ''}
                    onChange={(e) => setConfig({ ...config, goal_value: parseFloat(e.target.value) || null })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid var(--slate-300)',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--slate-700)', marginBottom: '6px' }}>
                    Goal Label
                  </label>
                  <input
                    type="text"
                    value={config.goal_label}
                    onChange={(e) => setConfig({ ...config, goal_label: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid var(--slate-300)',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: 'var(--slate-900)' }}>
              Selected Metrics ({selectedMetrics.length})
            </h3>
            {selectedMetrics.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', background: 'var(--slate-50)', borderRadius: '8px' }}>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--slate-500)' }}>
                  No metrics selected. Add metrics from the list below.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedMetrics.map((metric, index) => {
                  const def = Object.values(metricDefinitions).find(d => d.id === metric.metric_id);
                  if (!def) return null;

                  return (
                    <div
                      key={index}
                      style={{
                        padding: '16px',
                        background: 'var(--slate-50)',
                        borderRadius: '8px',
                        border: '1px solid var(--slate-200)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <GripVertical size={16} style={{ color: 'var(--slate-400)', cursor: 'grab' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--slate-900)' }}>
                            {def.metric_name}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: '2px' }}>
                            {def.category} • {def.data_type}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveMetric(index)}
                          style={{
                            padding: '6px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--red-500)',
                            display: 'flex',
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--slate-600)', marginBottom: '4px' }}>
                            Color
                          </label>
                          <input
                            type="color"
                            value={metric.line_color}
                            onChange={(e) => handleUpdateMetric(index, { line_color: e.target.value })}
                            style={{ width: '100%', height: '36px', border: '1px solid var(--slate-300)', borderRadius: '6px', cursor: 'pointer' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--slate-600)', marginBottom: '4px' }}>
                            Line Style
                          </label>
                          <select
                            value={metric.line_style}
                            onChange={(e) => handleUpdateMetric(index, { line_style: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid var(--slate-300)',
                              borderRadius: '6px',
                              fontSize: '13px',
                            }}
                          >
                            <option value="solid">Solid</option>
                            <option value="dashed">Dashed</option>
                            <option value="dotted">Dotted</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--slate-600)', marginBottom: '4px' }}>
                            Display Name
                          </label>
                          <input
                            type="text"
                            value={metric.display_name_override || ''}
                            onChange={(e) => handleUpdateMetric(index, { display_name_override: e.target.value || null })}
                            placeholder={def.metric_name}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid var(--slate-300)',
                              borderRadius: '6px',
                              fontSize: '13px',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: 'var(--slate-900)' }}>
              Available Metrics
            </h3>
            {loading ? (
              <div style={{ padding: '32px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--slate-500)' }}>Loading metrics...</p>
              </div>
            ) : availableMetrics.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', background: 'var(--slate-50)', borderRadius: '8px' }}>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--slate-500)' }}>
                  No metrics available. Create metrics first before configuring charts.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                {availableMetrics.map((metric) => {
                  const selected = isMetricSelected(metric.id);
                  return (
                    <div
                      key={metric.id}
                      style={{
                        padding: '12px',
                        background: selected ? 'var(--slate-100)' : 'white',
                        border: `1px solid ${selected ? 'var(--slate-300)' : 'var(--slate-200)'}`,
                        borderRadius: '6px',
                        opacity: selected ? 0.6 : 1,
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--slate-900)', marginBottom: '4px' }}>
                        {metric.metric_name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--slate-500)', marginBottom: '8px' }}>
                        {metric.category} • {metric.data_type}
                      </div>
                      {selected ? (
                        <div style={{ fontSize: '12px', color: 'var(--slate-500)', fontStyle: 'italic' }}>
                          Already added
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddMetric(metric)}
                          style={{
                            padding: '6px 12px',
                            background: 'var(--brand-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Plus size={14} /> Add
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--slate-200)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              border: '1px solid var(--slate-300)',
              borderRadius: '6px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--slate-700)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || selectedMetrics.length === 0}
            style={{
              padding: '10px 20px',
              background: saving || selectedMetrics.length === 0 ? 'var(--slate-300)' : 'var(--brand-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: saving || selectedMetrics.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}
