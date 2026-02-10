import { supabase } from './supabaseClient';
import type { DashboardGraph, ChartType, GraphSize, TimeRange, Aggregation, GroupBy, GoalConfig, GraphConfig, MetricDefinition, HistoricalDataPoint } from './types';

export interface CreateGraphInput {
  client_id: string;
  page_id: string;
  title: string;
  chart_type: ChartType;
  size: GraphSize;
  metric_ids: string[];
  time_range?: TimeRange;
  aggregation?: Aggregation;
  group_by?: GroupBy;
  goals?: GoalConfig;
  config?: GraphConfig;
}

export async function fetchGraphsForPage(clientId: string, pageId: string): Promise<DashboardGraph[]> {
  const { data, error } = await supabase
    .from('dashboard_graphs')
    .select('*')
    .eq('client_id', clientId)
    .eq('page_id', pageId)
    .eq('enabled', true)
    .is('deleted_at', null)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return (data || []) as DashboardGraph[];
}

export async function fetchAllGraphsForClient(clientId: string): Promise<DashboardGraph[]> {
  const { data, error } = await supabase
    .from('dashboard_graphs')
    .select('*')
    .eq('client_id', clientId)
    .is('deleted_at', null)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return (data || []) as DashboardGraph[];
}

export async function createGraph(input: CreateGraphInput): Promise<DashboardGraph> {
  const { data: existing } = await supabase
    .from('dashboard_graphs')
    .select('display_order')
    .eq('client_id', input.client_id)
    .eq('page_id', input.page_id)
    .is('deleted_at', null)
    .order('display_order', { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? (existing[0].display_order || 0) + 1 : 0;

  const { data, error } = await supabase
    .from('dashboard_graphs')
    .insert({
      ...input,
      display_order: nextOrder,
      enabled: true,
      config: input.config || {},
    })
    .select()
    .single();

  if (error) throw error;
  return data as DashboardGraph;
}

export async function updateGraph(id: string, updates: Partial<DashboardGraph>): Promise<DashboardGraph> {
  const { data, error } = await supabase
    .from('dashboard_graphs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as DashboardGraph;
}

export async function deleteGraph(id: string, deletedBy: string = 'user'): Promise<void> {
  const now = new Date();
  const purgeAt = new Date(now);
  purgeAt.setDate(purgeAt.getDate() + 90);

  const { error } = await supabase
    .from('dashboard_graphs')
    .update({
      deleted_at: now.toISOString(),
      deleted_by: deletedBy,
      purge_at: purgeAt.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}

export async function reorderGraphs(graphIds: string[]): Promise<void> {
  const updates = graphIds.map((id, index) => ({
    id,
    display_order: index,
    updated_at: new Date().toISOString(),
  }));

  for (const update of updates) {
    const { error } = await supabase
      .from('dashboard_graphs')
      .update({ display_order: update.display_order, updated_at: update.updated_at })
      .eq('id', update.id);
    if (error) throw error;
  }
}

export async function fetchMetricDefinitions(clientId: string): Promise<MetricDefinition[]> {
  const { data, error } = await supabase
    .from('metric_definitions')
    .select('*')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('category', { ascending: true });

  if (error) throw error;
  return (data || []) as MetricDefinition[];
}

export async function fetchHistoricalData(
  clientId: string,
  metricIds: string[],
  startDate: string,
  endDate: string
): Promise<HistoricalDataPoint[]> {
  if (metricIds.length === 0) return [];

  const { data, error } = await supabase
    .from('historical_metric_data')
    .select('metric_id, data_date, value')
    .eq('client_id', clientId)
    .in('metric_id', metricIds)
    .gte('data_date', startDate)
    .lte('data_date', endDate)
    .order('data_date', { ascending: true });

  if (error) throw error;
  return (data || []) as HistoricalDataPoint[];
}
