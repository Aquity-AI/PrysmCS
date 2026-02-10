import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../dashboard-graphs/supabaseClient';
import { fetchAllGraphsForClient, fetchMetricDefinitions } from '../dashboard-graphs/dashboardGraphService';
import { getDateRangeFromPreset, transformToChartData } from '../time-series-chart/chartUtils';
import type { DashboardGraph, MetricDefinition } from '../dashboard-graphs/types';

const ADMIN_ONLY_TABS = new Set([
  'successPlanning', 'admin', 'users', 'deleted-accounts',
  'audit', 'portfolio', 'customization', 'notifications',
  'profile', 'metrics',
]);

const GRANULARITY_MAP: Record<string, string> = {
  day: 'daily',
  week: 'weekly',
  month: 'monthly',
  quarter: 'quarterly',
};

export interface ReportTab {
  id: string;
  label: string;
  icon: string;
  isCustom?: boolean;
  sections: ReportSection[];
  graphs: ReportGraph[];
  pageSummaries: ReportPageSummary[];
}

export interface ReportSection {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  fields: ReportField[];
  sectionType?: string;
}

export interface ReportField {
  id: string;
  label: string;
  fieldType?: string;
  prefix?: string;
  suffix?: string;
  showOnDashboard?: boolean;
  order?: number;
}

export interface ReportGraph {
  graph: DashboardGraph;
  chartData: any[];
  metricNames: Record<string, string>;
}

export interface ReportPageSummary {
  id: string;
  title: string;
  subtitle: string;
  items: ReportPageSummaryItem[];
}

export interface ReportPageSummaryItem {
  id: string;
  label: string;
  metric_value: string;
  trend_direction: 'positive' | 'negative' | 'neutral';
  description_text: string;
}

export interface ReportStory {
  id: string;
  quote: string;
  initials: string;
  context: string;
}

export interface ReportPriority {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  focus_areas: string[];
  display_order: number;
}

export interface ReportCsmInfo {
  name: string;
  email: string;
  phone: string;
  role_type: string;
}

export interface ReportClientOverview {
  company_name: string;
  address: string;
}

export interface ReportData {
  tabs: ReportTab[];
  stories: ReportStory[];
  priorities: ReportPriority[];
  csmInfo: ReportCsmInfo | null;
  clientOverview: ReportClientOverview | null;
  loading: boolean;
}

export function useReportData(
  clientId: string,
  customization: any,
  dashboardData: any,
  formSchemaGetter: (clientId?: string) => any,
  fieldTypes: any,
) {
  const [graphs, setGraphs] = useState<DashboardGraph[]>([]);
  const [metricDefs, setMetricDefs] = useState<Record<string, MetricDefinition>>({});
  const [graphChartData, setGraphChartData] = useState<Record<string, any[]>>({});
  const [pageSummaries, setPageSummaries] = useState<any[]>([]);
  const [stories, setStories] = useState<ReportStory[]>([]);
  const [priorities, setPriorities] = useState<ReportPriority[]>([]);
  const [csmInfo, setCsmInfo] = useState<ReportCsmInfo | null>(null);
  const [clientOverview, setClientOverview] = useState<ReportClientOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const enabledTabs = useMemo(() => {
    const tabs = customization?.navigation?.tabs || [];
    return tabs
      .filter((t: any) => t.enabled && !ADMIN_ONLY_TABS.has(t.id))
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  }, [customization]);

  const loadAllData = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);

    try {
      const [
        allGraphs,
        metricsArr,
        summariesResult,
        storiesResult,
        prioritiesResult,
        csmResult,
        overviewResult,
      ] = await Promise.all([
        fetchAllGraphsForClient(clientId).catch(() => []),
        fetchMetricDefinitions(clientId).catch(() => []),
        supabase
          .from('page_summaries')
          .select('*, page_summary_items(*)')
          .eq('client_id', clientId)
          .eq('enabled', true)
          .is('deleted_at', null)
          .then(r => r.data || []),
        supabase
          .from('success_stories')
          .select('id, quote, initials, context')
          .eq('client_id', clientId)
          .eq('is_visible', true)
          .order('created_at', { ascending: false })
          .then(r => r.data || []),
        supabase
          .from('strategic_priorities')
          .select('*')
          .eq('client_id', clientId)
          .eq('is_visible', true)
          .order('display_order', { ascending: true })
          .then(r => r.data || []),
        supabase
          .from('success_planning_team')
          .select('user_name, user_email, user_phone, role_type')
          .eq('client_id', clientId)
          .eq('is_primary', true)
          .limit(1)
          .maybeSingle()
          .then(r => r.data),
        supabase
          .from('success_planning_overview')
          .select('company_name, address')
          .eq('client_id', clientId)
          .is('deleted_at', null)
          .maybeSingle()
          .then(r => r.data),
      ]);

      const enabledGraphs = allGraphs.filter(g => g.enabled);
      setGraphs(enabledGraphs);

      const defMap: Record<string, MetricDefinition> = {};
      metricsArr.forEach((m: MetricDefinition) => { defMap[m.id] = m; });
      setMetricDefs(defMap);

      const chartDataMap: Record<string, any[]> = {};
      await Promise.all(
        enabledGraphs.map(async (graph) => {
          const metricIds = Array.isArray(graph.metric_ids) ? graph.metric_ids : [];
          if (metricIds.length === 0) {
            chartDataMap[graph.id] = [];
            return;
          }

          try {
            if (graph.chart_type === 'pie' || graph.chart_type === 'donut') {
              const { startDate, endDate } = getDateRangeFromPreset(graph.time_range || 'last_6_months');
              const results: { name: string; value: number }[] = [];
              for (const metricId of metricIds) {
                const { data } = await supabase
                  .from('historical_metric_data')
                  .select('value')
                  .eq('client_id', clientId)
                  .eq('metric_id', metricId)
                  .gte('data_date', startDate.toISOString().split('T')[0])
                  .lte('data_date', endDate.toISOString().split('T')[0]);
                const total = (data || []).reduce((sum: number, d: any) => sum + (d.value || 0), 0);
                results.push({ name: defMap[metricId]?.metric_name || 'Unknown', value: total });
              }
              chartDataMap[graph.id] = results;
            } else if (graph.chart_type === 'progress') {
              const metricId = metricIds[0];
              const { data } = await supabase
                .from('historical_metric_data')
                .select('value')
                .eq('client_id', clientId)
                .eq('metric_id', metricId)
                .order('data_date', { ascending: false })
                .limit(1);
              const currentValue = data?.[0]?.value || 0;
              const target = graph.goals?.target_value || 100;
              const pct = Math.min((currentValue / target) * 100, 100);
              chartDataMap[graph.id] = [{ name: 'Progress', value: pct, fill: '__BRAND__' }];
            } else {
              const { startDate, endDate } = getDateRangeFromPreset(graph.time_range || 'last_6_months');
              const { data } = await supabase
                .from('historical_metric_data')
                .select('metric_id, data_date, value')
                .eq('client_id', clientId)
                .in('metric_id', metricIds)
                .gte('data_date', startDate.toISOString().split('T')[0])
                .lte('data_date', endDate.toISOString().split('T')[0])
                .order('data_date', { ascending: true });
              const metricNames: Record<string, string> = {};
              metricIds.forEach((id: string) => {
                if (defMap[id]) metricNames[id] = defMap[id].metric_name;
              });
              const granularity = GRANULARITY_MAP[graph.group_by || 'month'] || 'monthly';
              chartDataMap[graph.id] = transformToChartData(data || [], metricNames, granularity);
            }
          } catch {
            chartDataMap[graph.id] = [];
          }
        })
      );
      setGraphChartData(chartDataMap);

      setPageSummaries(summariesResult);
      setStories((storiesResult || []) as ReportStory[]);
      setPriorities((prioritiesResult || []) as ReportPriority[]);

      if (csmResult) {
        setCsmInfo({
          name: csmResult.user_name,
          email: csmResult.user_email,
          phone: csmResult.user_phone,
          role_type: csmResult.role_type,
        });
      }

      if (overviewResult) {
        setClientOverview({
          company_name: overviewResult.company_name,
          address: overviewResult.address,
        });
      }
    } catch (err) {
      console.error('[useReportData] Error loading report data:', err);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const reportData: ReportData = useMemo(() => {
    const formSchema = formSchemaGetter(clientId);
    const rawFormData = dashboardData?.rawFormData || dashboardData || {};

    const tabs: ReportTab[] = enabledTabs.map((tab: any) => {
      const tabId = tab.id;

      const sections: ReportSection[] = (formSchema?.sections || [])
        .filter((s: any) =>
          s.linkedTabId === tabId &&
          s.enabled !== false &&
          s.sectionType !== 'builtin_chart'
        )
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
        .map((s: any) => {
          const fields = (s.fields || [])
            .filter((f: any) => f.showOnDashboard !== false && f.fieldType !== fieldTypes?.DATE)
            .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
            .map((f: any) => ({
              id: f.id,
              label: f.label,
              fieldType: f.fieldType,
              prefix: f.prefix,
              suffix: f.suffix,
              showOnDashboard: f.showOnDashboard,
              order: f.order,
              value: rawFormData[f.id] !== undefined ? rawFormData[f.id] : 0,
            }));

          return {
            id: s.id,
            title: s.title,
            subtitle: s.subtitle,
            icon: s.icon,
            iconColor: s.iconColor,
            fields,
            sectionType: s.sectionType,
          };
        })
        .filter((s: ReportSection) => s.fields.length > 0);

      const tabGraphs: ReportGraph[] = graphs
        .filter(g => g.page_id === tabId)
        .map(g => {
          const metricIds = Array.isArray(g.metric_ids) ? g.metric_ids : [];
          const metricNames: Record<string, string> = {};
          metricIds.forEach(id => {
            if (metricDefs[id]) metricNames[id] = metricDefs[id].metric_name;
          });
          return {
            graph: g,
            chartData: graphChartData[g.id] || [],
            metricNames,
          };
        });

      const tabSummaries: ReportPageSummary[] = pageSummaries
        .filter((ps: any) => ps.page_id === tabId)
        .map((ps: any) => ({
          id: ps.id,
          title: ps.title,
          subtitle: ps.subtitle,
          items: (ps.page_summary_items || [])
            .filter((item: any) => item.is_visible)
            .sort((a: any, b: any) => (a.item_order || 0) - (b.item_order || 0))
            .map((item: any) => ({
              id: item.id,
              label: item.label,
              metric_value: item.metric_value,
              trend_direction: item.trend_direction || 'neutral',
              description_text: item.description_text || '',
            })),
        }))
        .filter((ps: ReportPageSummary) => ps.items.length > 0);

      return {
        id: tab.id,
        label: tab.label,
        icon: tab.icon,
        isCustom: tab.isCustom,
        sections,
        graphs: tabGraphs,
        pageSummaries: tabSummaries,
      };
    });

    return {
      tabs,
      stories,
      priorities,
      csmInfo,
      clientOverview,
      loading,
    };
  }, [enabledTabs, graphs, metricDefs, graphChartData, pageSummaries, stories, priorities, csmInfo, clientOverview, loading, dashboardData, clientId, formSchemaGetter, fieldTypes]);

  return reportData;
}
