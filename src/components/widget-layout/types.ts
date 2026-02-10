export type WidgetType =
  | 'kpi-card'
  | 'kpi-section'
  | 'funnel-chart'
  | 'campaign-section'
  | 'graph-card'
  | 'page-summary'
  | 'time-series-chart'
  | 'success-stories'
  | 'strategic-priorities'
  | 'outcomes-section'
  | 'section-generic';

export interface WidgetMinSize {
  minWidth: number;
  minHeight: number;
}

export const WIDGET_MIN_SIZES: Record<WidgetType, WidgetMinSize> = {
  'kpi-card': { minWidth: 2, minHeight: 80 },
  'kpi-section': { minWidth: 4, minHeight: 100 },
  'funnel-chart': { minWidth: 4, minHeight: 200 },
  'campaign-section': { minWidth: 4, minHeight: 150 },
  'graph-card': { minWidth: 3, minHeight: 150 },
  'page-summary': { minWidth: 4, minHeight: 120 },
  'time-series-chart': { minWidth: 4, minHeight: 180 },
  'success-stories': { minWidth: 4, minHeight: 150 },
  'strategic-priorities': { minWidth: 4, minHeight: 150 },
  'outcomes-section': { minWidth: 4, minHeight: 150 },
  'section-generic': { minWidth: 3, minHeight: 100 },
};

export interface WidgetPosition {
  widgetId: string;
  widgetType: WidgetType;
  row: number;
  col: number;
  width: number;
  height: number;
}

export interface PageLayoutConfig {
  version: number;
  widgets: WidgetPosition[];
  gridDensity?: 'compact' | 'normal' | 'spacious';
}

export interface WidgetDefinition {
  widgetId: string;
  widgetType: WidgetType;
  defaultWidth: number;
  defaultHeight: number;
}
