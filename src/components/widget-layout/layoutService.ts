import { createClient } from '@supabase/supabase-js';
import { PageLayoutConfig, WidgetPosition, WidgetDefinition } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

interface DbLayoutConfig {
  version?: number;
  widgets?: WidgetPosition[];
  widgetOrder?: string[];
  hiddenWidgets?: string[];
  widgetPositions?: Record<string, {
    order?: number;
    gridRow?: number;
    gridColumn?: number;
    gridWidth?: number;
    gridHeight?: number;
  }>;
}

interface PageLayoutRow {
  id: string;
  client_id: string;
  page_id: string;
  layout_config: DbLayoutConfig;
  grid_density: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchPageLayout(
  clientId: string,
  pageId: string
): Promise<PageLayoutConfig | null> {
  const { data, error } = await supabase
    .from('page_layouts')
    .select('*')
    .eq('client_id', clientId)
    .eq('page_id', pageId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    console.error('Error fetching page layout:', error);
    return null;
  }

  if (!data) return null;

  const row = data as PageLayoutRow;
  const config = row.layout_config;

  if (config.version && config.widgets) {
    return {
      version: config.version,
      widgets: config.widgets,
      gridDensity: (row.grid_density as PageLayoutConfig['gridDensity']) || 'normal',
    };
  }

  if (config.widgetPositions) {
    const widgets: WidgetPosition[] = Object.entries(config.widgetPositions).map(([widgetId, pos]) => ({
      widgetId,
      widgetType: 'section-generic',
      row: pos.gridRow ?? 0,
      col: pos.gridColumn ?? 0,
      width: pos.gridWidth ?? 6,
      height: pos.gridHeight ?? 200,
    }));

    return {
      version: 0,
      widgets,
      gridDensity: (row.grid_density as PageLayoutConfig['gridDensity']) || 'normal',
    };
  }

  return null;
}

export async function savePageLayout(
  clientId: string,
  pageId: string,
  layout: PageLayoutConfig
): Promise<boolean> {
  const layoutConfig: DbLayoutConfig = {
    version: layout.version,
    widgets: layout.widgets,
    widgetPositions: layout.widgets.reduce((acc, w) => {
      acc[w.widgetId] = {
        gridRow: w.row,
        gridColumn: w.col,
        gridWidth: w.width,
        gridHeight: w.height,
      };
      return acc;
    }, {} as DbLayoutConfig['widgetPositions']),
    hiddenWidgets: layout.widgets.filter(w => w.width === 0).map(w => w.widgetId),
    widgetOrder: layout.widgets.map(w => w.widgetId),
  };

  const { data: existing } = await supabase
    .from('page_layouts')
    .select('id')
    .eq('client_id', clientId)
    .eq('page_id', pageId)
    .is('deleted_at', null)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('page_layouts')
      .update({
        layout_config: layoutConfig,
        grid_density: layout.gridDensity || 'normal',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (error) {
      console.error('Error updating page layout:', error);
      return false;
    }
  } else {
    const { error } = await supabase
      .from('page_layouts')
      .insert({
        client_id: clientId,
        page_id: pageId,
        layout_config: layoutConfig,
        grid_density: layout.gridDensity || 'normal',
      });

    if (error) {
      console.error('Error creating page layout:', error);
      return false;
    }
  }

  return true;
}

export async function resetPageLayout(
  clientId: string,
  pageId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('page_layouts')
    .delete()
    .eq('client_id', clientId)
    .eq('page_id', pageId);

  if (error) {
    console.error('Error resetting page layout:', error);
    return false;
  }

  return true;
}

export function generateDefaultLayout(
  definitions: WidgetDefinition[]
): PageLayoutConfig {
  let currentRow = 0;
  let currentCol = 0;

  const widgets: WidgetPosition[] = definitions.map(def => {
    if (currentCol + def.defaultWidth > 12) {
      currentRow++;
      currentCol = 0;
    }

    const widget: WidgetPosition = {
      widgetId: def.widgetId,
      widgetType: def.widgetType,
      row: currentRow,
      col: currentCol,
      width: def.defaultWidth,
      height: def.defaultHeight,
    };

    currentCol += def.defaultWidth;
    return widget;
  });

  return {
    version: 1,
    widgets,
    gridDensity: 'normal',
  };
}

export function mergeLayoutWithDefinitions(
  savedLayout: PageLayoutConfig | null,
  definitions: WidgetDefinition[]
): WidgetPosition[] {
  if (!savedLayout || !savedLayout.widgets || savedLayout.widgets.length === 0) {
    return generateDefaultLayout(definitions).widgets;
  }

  const savedMap = new Map(savedLayout.widgets.map(w => [w.widgetId, w]));
  const result: WidgetPosition[] = [];
  let maxRow = 0;

  for (const def of definitions) {
    const saved = savedMap.get(def.widgetId);
    if (saved) {
      result.push(saved);
      maxRow = Math.max(maxRow, saved.row);
    } else {
      result.push({
        widgetId: def.widgetId,
        widgetType: def.widgetType,
        row: maxRow + 1,
        col: 0,
        width: def.defaultWidth,
        height: def.defaultHeight,
      });
      maxRow++;
    }
  }

  return result;
}
