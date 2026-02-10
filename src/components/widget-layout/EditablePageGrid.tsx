import React, { useEffect, useCallback, useRef, useState } from 'react';
import { WidgetLayoutProvider, useWidgetLayout } from './WidgetLayoutContext';
import { useWidgetLayoutIntegration } from './useWidgetLayoutIntegration';
import { useEditLayout, LayoutCallbacks } from '../dashboard-graphs/EditLayoutContext';
import { fetchPageLayout } from './layoutService';
import { WidgetDefinition, WidgetPosition, WidgetType } from './types';

interface EditablePageGridProps {
  clientId: string;
  pageId: string;
  children: React.ReactNode;
  brandColor?: string;
  gap?: number;
}

function EditablePageGridInner({
  clientId,
  pageId,
  children,
  brandColor = '#06b6d4',
  gap = 20,
}: EditablePageGridProps) {
  const { isEditing, registerLayoutCallbacks, notifyChange } = useEditLayout();
  const {
    widgets,
    initializeLayout,
    hasPendingChanges,
    canUndo,
    commitChanges,
    discardChanges,
    undoLastChange,
    registerSaveCallback,
  } = useWidgetLayout();

  const [initialized, setInitialized] = useState(false);
  const childDefinitions = useRef<WidgetDefinition[]>([]);

  const hasPendingRef = useRef(hasPendingChanges);
  hasPendingRef.current = hasPendingChanges;
  const canUndoRef = useRef(canUndo);
  canUndoRef.current = canUndo;
  const commitRef = useRef(commitChanges);
  commitRef.current = commitChanges;
  const discardRef = useRef(discardChanges);
  discardRef.current = discardChanges;
  const undoRef = useRef(undoLastChange);
  undoRef.current = undoLastChange;

  useEffect(() => {
    const { savePageLayout } = require('./layoutService');
    registerSaveCallback(async (layout) => {
      await savePageLayout(clientId, pageId, layout);
    });
  }, [clientId, pageId, registerSaveCallback]);

  useEffect(() => {
    const callbacks: LayoutCallbacks = {
      commitChanges: () => commitRef.current(),
      discardChanges: () => discardRef.current(),
      hasPendingChanges: () => hasPendingRef.current,
      handleUndo: () => undoRef.current(),
      canUndo: () => canUndoRef.current,
    };
    return registerLayoutCallbacks(callbacks);
  }, [registerLayoutCallbacks]);

  useEffect(() => {
    notifyChange();
  }, [hasPendingChanges, canUndo, notifyChange]);

  const collectWidgetDefinitions = useCallback(() => {
    const definitions: WidgetDefinition[] = [];

    React.Children.forEach(children, (child, index) => {
      if (React.isValidElement(child) && child.props.widgetId) {
        definitions.push({
          widgetId: child.props.widgetId,
          widgetType: child.props.widgetType || 'section-generic',
          defaultWidth: child.props.defaultWidth || 12,
          defaultHeight: child.props.defaultHeight || 200,
        });
      }
    });

    return definitions;
  }, [children]);

  useEffect(() => {
    const loadLayout = async () => {
      const definitions = collectWidgetDefinitions();
      childDefinitions.current = definitions;

      if (definitions.length > 0) {
        const savedLayout = await fetchPageLayout(clientId, pageId);
        initializeLayout(definitions, savedLayout);
        setInitialized(true);
      }
    };

    loadLayout();
  }, [clientId, pageId, collectWidgetDefinitions, initializeLayout]);

  const sortedChildren = React.useMemo(() => {
    if (!initialized || widgets.length === 0) {
      return React.Children.toArray(children);
    }

    const childArray = React.Children.toArray(children);
    const widgetOrder = widgets.map(w => w.widgetId);

    return childArray.sort((a, b) => {
      if (!React.isValidElement(a) || !React.isValidElement(b)) return 0;
      const aId = a.props.widgetId;
      const bId = b.props.widgetId;
      if (!aId || !bId) return 0;
      const aIndex = widgetOrder.indexOf(aId);
      const bIndex = widgetOrder.indexOf(bId);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }, [children, widgets, initialized]);

  return (
    <div
      className="editable-page-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: `${gap}px`,
        width: '100%',
        position: 'relative',
      }}
    >
      {isEditing && (
        <div
          className="grid-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: `${gap}px`,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              style={{
                borderLeft: i === 0 ? `1px dashed ${brandColor}25` : 'none',
                borderRight: `1px dashed ${brandColor}25`,
                minHeight: 50,
              }}
            />
          ))}
        </div>
      )}

      {sortedChildren.map((child, index) => {
        if (!React.isValidElement(child)) return child;

        const widgetId = child.props.widgetId;
        const position = widgets.find(w => w.widgetId === widgetId);

        if (position && position.width === 0) {
          return null;
        }

        return React.cloneElement(child as React.ReactElement<any>, {
          key: widgetId || index,
          brandColor,
        });
      })}
    </div>
  );
}

export function EditablePageGrid(props: EditablePageGridProps) {
  return (
    <WidgetLayoutProvider clientId={props.clientId} pageId={props.pageId}>
      <EditablePageGridInner {...props} />
    </WidgetLayoutProvider>
  );
}
