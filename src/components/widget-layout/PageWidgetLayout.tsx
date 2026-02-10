import React, { useEffect, useCallback } from 'react';
import { WidgetLayoutProvider, useWidgetLayout } from './WidgetLayoutContext';
import { EditableGridContainer } from './EditableGridContainer';
import { useWidgetLayoutIntegration } from './useWidgetLayoutIntegration';
import { useEditLayout } from '../dashboard-graphs/EditLayoutContext';
import { fetchPageLayout, mergeLayoutWithDefinitions } from './layoutService';
import { WidgetDefinition, WidgetType, PageLayoutConfig } from './types';

interface WidgetConfig {
  widgetId: string;
  widgetType: WidgetType;
  defaultWidth: number;
  defaultHeight: number;
  render: () => React.ReactNode;
}

interface PageWidgetLayoutInnerProps {
  clientId: string;
  pageId: string;
  widgets: WidgetConfig[];
  brandColor?: string;
  gap?: number;
}

function PageWidgetLayoutInner({
  clientId,
  pageId,
  widgets,
  brandColor = '#06b6d4',
  gap = 16,
}: PageWidgetLayoutInnerProps) {
  const { isEditing } = useEditLayout();
  const { initializeLayout } = useWidgetLayout();
  useWidgetLayoutIntegration(clientId, pageId);

  const loadLayout = useCallback(async () => {
    const definitions: WidgetDefinition[] = widgets.map(w => ({
      widgetId: w.widgetId,
      widgetType: w.widgetType,
      defaultWidth: w.defaultWidth,
      defaultHeight: w.defaultHeight,
    }));

    const savedLayout = await fetchPageLayout(clientId, pageId);
    initializeLayout(definitions, savedLayout);
  }, [clientId, pageId, widgets, initializeLayout]);

  useEffect(() => {
    loadLayout();
  }, [loadLayout]);

  const widgetRenderConfigs = widgets.map(w => ({
    widgetId: w.widgetId,
    widgetType: w.widgetType,
    render: w.render,
  }));

  return (
    <EditableGridContainer
      widgets={widgetRenderConfigs}
      isEditing={isEditing}
      brandColor={brandColor}
      gap={gap}
    />
  );
}

interface PageWidgetLayoutProps {
  clientId: string;
  pageId: string;
  widgets: WidgetConfig[];
  brandColor?: string;
  gap?: number;
}

export function PageWidgetLayout({
  clientId,
  pageId,
  widgets,
  brandColor,
  gap,
}: PageWidgetLayoutProps) {
  return (
    <WidgetLayoutProvider clientId={clientId} pageId={pageId}>
      <PageWidgetLayoutInner
        clientId={clientId}
        pageId={pageId}
        widgets={widgets}
        brandColor={brandColor}
        gap={gap}
      />
    </WidgetLayoutProvider>
  );
}

export type { WidgetConfig };
