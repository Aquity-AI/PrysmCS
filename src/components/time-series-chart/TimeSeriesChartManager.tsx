import React, { useState, useEffect } from 'react';
import { LineChart, TrendingUp, AlertCircle, Loader, Settings } from 'lucide-react';
import { supabase } from './supabaseClient';
import { TimeSeriesChartCard } from './TimeSeriesChartCard';
import { ChartConfigModal } from './ChartConfigModal';
import { getGridItemStyle } from '../utils/gridUtils';

interface TimeSeriesChartManagerProps {
  section: {
    id: string;
    title: string;
    subtitle?: string;
    linkedTabId?: string;
  };
  clientId: string;
  pageId: string;
  selectedMonth?: string;
  showEditControls?: boolean;
}

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

export function TimeSeriesChartManager({
  section,
  clientId,
  pageId,
  selectedMonth,
  showEditControls = true,
}: TimeSeriesChartManagerProps) {
  const [chartSection, setChartSection] = useState<ChartSection | null>(null);
  const [chartMetrics, setChartMetrics] = useState<ChartMetric[]>([]);
  const [metricDefinitions, setMetricDefinitions] = useState<Record<string, MetricDefinition>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  useEffect(() => {
    console.log('[TimeSeriesChartManager] useEffect triggered - loading chart data');
    loadChartData();
  }, [clientId, pageId, section.id]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    console.log('[TimeSeriesChartManager] showConfigModal state changed to:', showConfigModal);
  }, [showConfigModal]);

  const loadChartData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[TimeSeriesChartManager] Loading chart data:', {
        clientId,
        pageId,
        sectionId: section.id,
      });

      const { data: chart, error: chartError } = await supabase
        .from('chart_sections')
        .select('*')
        .eq('client_id', clientId)
        .eq('page_id', pageId)
        .eq('section_id', section.id)
        .is('deleted_at', null)
        .maybeSingle();

      if (chartError) throw chartError;

      if (chart) {
        setChartSection(chart);

        const { data: metricsData, error: metricsError } = await supabase
          .from('chart_metrics')
          .select('*')
          .eq('chart_section_id', chart.id)
          .order('display_order', { ascending: true });

        if (metricsError) throw metricsError;

        if (metricsData && metricsData.length > 0) {
          setChartMetrics(metricsData);

          const metricIds = metricsData.map(m => m.metric_id);
          const { data: defsData, error: defsError } = await supabase
            .from('metric_definitions')
            .select('id, metric_name, metric_key, data_type, category, unit, description')
            .in('id', metricIds);

          if (defsError) throw defsError;

          const defsMap: Record<string, MetricDefinition> = {};
          defsData?.forEach(def => {
            defsMap[def.id] = def;
          });
          setMetricDefinitions(defsMap);
        }

        console.log('[TimeSeriesChartManager] Loaded chart:', chart);
        console.log('[TimeSeriesChartManager] Loaded metrics:', metricsData);
      } else {
        console.log('[TimeSeriesChartManager] No chart section found');
        setChartSection(null);
        setChartMetrics([]);
      }
    } catch (err) {
      console.error('Error loading chart data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigureChart = () => {
    console.log('[TimeSeriesChartManager] Opening config modal');
    console.log('[TimeSeriesChartManager] Current state:', {
      chartSection,
      chartMetrics,
      metricDefinitions,
      clientId,
      pageId,
      sectionId: section.id,
    });
    setShowConfigModal(true);
  };

  const handleSaveConfig = async () => {
    await loadChartData();
    setNotification({ type: 'success', message: 'Chart configuration saved successfully!' });
  };

  if (loading) {
    return (
      <div
        className="time-series-chart-manager grid-item"
        style={{ ...getGridItemStyle(12), padding: '20px', textAlign: 'center' }}
        data-width="12"
      >
        <Loader size={24} className="animate-spin" style={{ margin: '0 auto', color: 'var(--brand-primary)' }} />
        <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--slate-500)' }}>Loading chart data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="time-series-chart-manager grid-item"
        style={{ ...getGridItemStyle(12), padding: '20px' }}
        data-width="12"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--red-600)' }}>
          <AlertCircle size={20} />
          <p style={{ margin: 0, fontSize: '14px' }}>{error}</p>
        </div>
        <button
          onClick={loadChartData}
          style={{
            marginTop: '12px',
            padding: '8px 16px',
            background: 'var(--brand-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  console.log('[TimeSeriesChartManager] Render state:', {
    hasChartSection: !!chartSection,
    chartSection,
    chartMetricsCount: chartMetrics.length,
    showEditControls,
    loading,
    showConfigModal,
  });

  if (!chartSection || chartMetrics.length === 0) {
    console.log('[TimeSeriesChartManager] Showing empty state');
    if (!showEditControls) {
      return null;
    }

    return (
      <>
        <div
          className="time-series-chart-manager grid-item"
          style={{
            ...getGridItemStyle(12),
            padding: '20px',
            background: 'var(--slate-50)',
            borderRadius: '8px',
            marginTop: '12px'
          }}
          data-width="12"
        >
          <div
            style={{
              padding: '32px',
              background: 'white',
              borderRadius: '6px',
              border: '1px dashed var(--slate-300)',
              textAlign: 'center',
            }}
          >
            <LineChart size={32} style={{ color: 'var(--slate-300)', margin: '0 auto 12px' }} />
            <p style={{ fontSize: '14px', color: 'var(--slate-600)', margin: '0 0 16px 0' }}>
              No chart configured yet. Click below to set up your first time-series chart.
            </p>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[TimeSeriesChartManager] Empty state Configure button clicked - event:', e);
                console.log('[TimeSeriesChartManager] Current showConfigModal state:', showConfigModal);
                handleConfigureChart();
              }}
              onMouseDown={(e) => {
                console.log('[TimeSeriesChartManager] Button mousedown event');
              }}
              onMouseUp={(e) => {
                console.log('[TimeSeriesChartManager] Button mouseup event');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 20px',
                background: 'var(--brand-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                position: 'relative',
                zIndex: 1000,
              }}
            >
              <Settings size={16} /> Configure Chart
            </button>
          </div>
        </div>

        {showConfigModal && (
          <>
            {console.log('[TimeSeriesChartManager] Rendering modal in empty state, showConfigModal =', showConfigModal)}
            <ChartConfigModal
              chartSection={chartSection}
              chartMetrics={chartMetrics}
              metricDefinitions={metricDefinitions}
              clientId={clientId}
              pageId={pageId}
              sectionId={section.id}
              onClose={() => setShowConfigModal(false)}
              onSave={handleSaveConfig}
            />
          </>
        )}
      </>
    );
  }

  console.log('[TimeSeriesChartManager] Rendering chart card with data');

  const gridStyle = chartSection?.width_units ? getGridItemStyle(chartSection.width_units) : {};

  return (
    <div
      className="time-series-chart-manager grid-item"
      style={{
        ...gridStyle,
        padding: '20px'
      }}
      data-width={chartSection?.width_units || 12}
    >
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '16px 24px',
            background: notification.type === 'success' ? '#16a34a' : '#dc2626',
            color: 'white',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            zIndex: 99999,
            fontSize: '14px',
            fontWeight: 600,
            border: `2px solid ${notification.type === 'success' ? '#15803d' : '#b91c1c'}`,
          }}
        >
          {notification.message}
        </div>
      )}

      <TimeSeriesChartCard
        chartSection={chartSection}
        chartMetrics={chartMetrics}
        metricDefinitions={metricDefinitions}
        clientId={clientId}
        selectedMonth={selectedMonth}
        showEditControls={showEditControls}
        onConfigure={handleConfigureChart}
      />

      {showConfigModal && (
        <>
          {console.log('[TimeSeriesChartManager] Rendering modal, showConfigModal =', showConfigModal)}
          <ChartConfigModal
            chartSection={chartSection}
            chartMetrics={chartMetrics}
            metricDefinitions={metricDefinitions}
            clientId={clientId}
            pageId={pageId}
            sectionId={section.id}
            onClose={() => setShowConfigModal(false)}
            onSave={handleSaveConfig}
          />
        </>
      )}
    </div>
  );
}
