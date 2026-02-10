import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { WidgetPosition, WidgetDefinition, PageLayoutConfig, WidgetType } from './types';

interface LayoutChange {
  type: 'move' | 'resize' | 'hide' | 'show' | 'reorder';
  widgetId: string;
  previousValue: Partial<WidgetPosition>;
  newValue: Partial<WidgetPosition>;
}

interface LayoutSnapshot {
  widgets: WidgetPosition[];
}

interface WidgetLayoutContextValue {
  widgets: WidgetPosition[];
  pendingChanges: LayoutChange[];
  hasPendingChanges: boolean;
  canUndo: boolean;
  updateWidgetPosition: (widgetId: string, row: number, col: number) => void;
  updateWidgetSize: (widgetId: string, width: number, height: number) => void;
  reorderWidgets: (draggedId: string, targetId: string) => void;
  reorderWidgetsByIndex: (draggedId: string, targetIndex: number) => void;
  hideWidget: (widgetId: string) => void;
  showWidget: (widgetId: string) => void;
  undoLastChange: () => void;
  commitChanges: () => Promise<void>;
  discardChanges: () => void;
  initializeLayout: (definitions: WidgetDefinition[], savedLayout?: PageLayoutConfig | null) => void;
  getWidgetPosition: (widgetId: string) => WidgetPosition | undefined;
  registerSaveCallback: (callback: (layout: PageLayoutConfig) => Promise<void>) => void;
}

const WidgetLayoutContext = createContext<WidgetLayoutContextValue | null>(null);

interface WidgetLayoutProviderProps {
  children: React.ReactNode;
  clientId: string;
  pageId: string;
}

const MAX_UNDO_STACK_SIZE = 20;

export function WidgetLayoutProvider({ children, clientId, pageId }: WidgetLayoutProviderProps) {
  const [widgets, setWidgets] = useState<WidgetPosition[]>([]);
  const [originalWidgets, setOriginalWidgets] = useState<WidgetPosition[]>([]);
  const [pendingChanges, setPendingChanges] = useState<LayoutChange[]>([]);
  const [undoStack, setUndoStack] = useState<LayoutSnapshot[]>([]);
  const saveCallbackRef = useRef<((layout: PageLayoutConfig) => Promise<void>) | null>(null);

  const pushUndoSnapshot = useCallback((currentWidgets: WidgetPosition[]) => {
    const snapshot: LayoutSnapshot = {
      widgets: JSON.parse(JSON.stringify(currentWidgets)),
    };
    setUndoStack(stack => {
      const newStack = [...stack, snapshot];
      if (newStack.length > MAX_UNDO_STACK_SIZE) {
        return newStack.slice(-MAX_UNDO_STACK_SIZE);
      }
      return newStack;
    });
  }, []);

  const hasPendingChanges = pendingChanges.length > 0;
  const canUndo = undoStack.length > 0;

  const initializeLayout = useCallback((definitions: WidgetDefinition[], savedLayout?: PageLayoutConfig | null) => {
    let initialWidgets: WidgetPosition[];

    if (savedLayout?.widgets && savedLayout.widgets.length > 0) {
      const savedMap = new Map(savedLayout.widgets.map(w => [w.widgetId, w]));
      initialWidgets = definitions.map((def, index) => {
        const saved = savedMap.get(def.widgetId);
        if (saved) {
          return saved;
        }
        return {
          widgetId: def.widgetId,
          widgetType: def.widgetType,
          row: Math.floor(index / 2),
          col: (index % 2) * 6,
          width: def.defaultWidth,
          height: def.defaultHeight,
        };
      });
    } else {
      let currentRow = 0;
      let currentCol = 0;
      initialWidgets = definitions.map(def => {
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
    }

    setWidgets(initialWidgets);
    setOriginalWidgets(JSON.parse(JSON.stringify(initialWidgets)));
    setPendingChanges([]);
    setUndoStack([]);
  }, []);

  const updateWidgetPosition = useCallback((widgetId: string, row: number, col: number) => {
    setWidgets(prev => {
      const widget = prev.find(w => w.widgetId === widgetId);
      if (!widget) return prev;

      pushUndoSnapshot(prev);

      const change: LayoutChange = {
        type: 'move',
        widgetId,
        previousValue: { row: widget.row, col: widget.col },
        newValue: { row, col },
      };

      setPendingChanges(changes => [...changes, change]);

      return prev.map(w =>
        w.widgetId === widgetId ? { ...w, row, col } : w
      );
    });
  }, [pushUndoSnapshot]);

  const updateWidgetSize = useCallback((widgetId: string, width: number, height: number) => {
    setWidgets(prev => {
      const widget = prev.find(w => w.widgetId === widgetId);
      if (!widget) return prev;

      pushUndoSnapshot(prev);

      const change: LayoutChange = {
        type: 'resize',
        widgetId,
        previousValue: { width: widget.width, height: widget.height },
        newValue: { width, height },
      };

      setPendingChanges(changes => [...changes, change]);

      return prev.map(w =>
        w.widgetId === widgetId ? { ...w, width, height } : w
      );
    });
  }, [pushUndoSnapshot]);

  const reorderWidgets = useCallback((draggedId: string, targetId: string) => {
    setWidgets(prev => {
      const draggedIndex = prev.findIndex(w => w.widgetId === draggedId);
      const targetIndex = prev.findIndex(w => w.widgetId === targetId);
      if (draggedIndex === -1 || targetIndex === -1) return prev;

      pushUndoSnapshot(prev);

      const newWidgets = [...prev];
      const [dragged] = newWidgets.splice(draggedIndex, 1);
      newWidgets.splice(targetIndex, 0, dragged);

      let currentRow = 0;
      let currentCol = 0;
      const repositioned = newWidgets.map(w => {
        if (currentCol + w.width > 12) {
          currentRow++;
          currentCol = 0;
        }
        const updated = { ...w, row: currentRow, col: currentCol };
        currentCol += w.width;
        return updated;
      });

      const change: LayoutChange = {
        type: 'reorder',
        widgetId: draggedId,
        previousValue: { row: prev[draggedIndex].row, col: prev[draggedIndex].col },
        newValue: { row: repositioned.find(w => w.widgetId === draggedId)?.row ?? 0, col: repositioned.find(w => w.widgetId === draggedId)?.col ?? 0 },
      };

      setPendingChanges(changes => [...changes, change]);

      return repositioned;
    });
  }, [pushUndoSnapshot]);

  const reorderWidgetsByIndex = useCallback((draggedId: string, targetIndex: number) => {
    setWidgets(prev => {
      const visibleWidgets = prev.filter(w => w.width > 0);
      const draggedIndex = visibleWidgets.findIndex(w => w.widgetId === draggedId);
      if (draggedIndex === -1) return prev;
      if (draggedIndex === targetIndex) return prev;

      pushUndoSnapshot(prev);

      const newVisibleWidgets = [...visibleWidgets];
      const [dragged] = newVisibleWidgets.splice(draggedIndex, 1);

      const adjustedIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
      const clampedIndex = Math.max(0, Math.min(adjustedIndex, newVisibleWidgets.length));
      newVisibleWidgets.splice(clampedIndex, 0, dragged);

      let currentRow = 0;
      let currentCol = 0;
      const repositioned = newVisibleWidgets.map(w => {
        if (currentCol + w.width > 12) {
          currentRow++;
          currentCol = 0;
        }
        const updated = { ...w, row: currentRow, col: currentCol };
        currentCol += w.width;
        return updated;
      });

      const hiddenWidgets = prev.filter(w => w.width === 0);
      const finalWidgets = [...repositioned, ...hiddenWidgets];

      const change: LayoutChange = {
        type: 'reorder',
        widgetId: draggedId,
        previousValue: { row: prev.find(w => w.widgetId === draggedId)?.row ?? 0, col: prev.find(w => w.widgetId === draggedId)?.col ?? 0 },
        newValue: { row: repositioned.find(w => w.widgetId === draggedId)?.row ?? 0, col: repositioned.find(w => w.widgetId === draggedId)?.col ?? 0 },
      };

      setPendingChanges(changes => [...changes, change]);

      return finalWidgets;
    });
  }, [pushUndoSnapshot]);

  const hideWidget = useCallback((widgetId: string) => {
    setWidgets(prev => {
      const widget = prev.find(w => w.widgetId === widgetId);
      if (!widget) return prev;

      pushUndoSnapshot(prev);

      const change: LayoutChange = {
        type: 'hide',
        widgetId,
        previousValue: { width: widget.width },
        newValue: { width: 0 },
      };

      setPendingChanges(changes => [...changes, change]);

      return prev.map(w =>
        w.widgetId === widgetId ? { ...w, width: 0 } : w
      );
    });
  }, [pushUndoSnapshot]);

  const showWidget = useCallback((widgetId: string) => {
    setWidgets(prev => {
      const original = originalWidgets.find(w => w.widgetId === widgetId);
      const widget = prev.find(w => w.widgetId === widgetId);
      if (!widget || !original) return prev;

      pushUndoSnapshot(prev);

      const change: LayoutChange = {
        type: 'show',
        widgetId,
        previousValue: { width: 0 },
        newValue: { width: original.width },
      };

      setPendingChanges(changes => [...changes, change]);

      return prev.map(w =>
        w.widgetId === widgetId ? { ...w, width: original.width } : w
      );
    });
  }, [originalWidgets, pushUndoSnapshot]);

  const undoLastChange = useCallback(() => {
    if (undoStack.length === 0) return;

    const lastSnapshot = undoStack[undoStack.length - 1];
    setUndoStack(stack => stack.slice(0, -1));
    setPendingChanges(changes => changes.length > 0 ? changes.slice(0, -1) : changes);
    setWidgets(JSON.parse(JSON.stringify(lastSnapshot.widgets)));
  }, [undoStack]);

  const commitChanges = useCallback(async () => {
    if (!saveCallbackRef.current) return;

    const layout: PageLayoutConfig = {
      version: 1,
      widgets: widgets.filter(w => w.width > 0),
    };

    await saveCallbackRef.current(layout);
    setOriginalWidgets(JSON.parse(JSON.stringify(widgets)));
    setPendingChanges([]);
    setUndoStack([]);
  }, [widgets]);

  const discardChanges = useCallback(() => {
    setWidgets(JSON.parse(JSON.stringify(originalWidgets)));
    setPendingChanges([]);
    setUndoStack([]);
  }, [originalWidgets]);

  const getWidgetPosition = useCallback((widgetId: string) => {
    return widgets.find(w => w.widgetId === widgetId);
  }, [widgets]);

  const registerSaveCallback = useCallback((callback: (layout: PageLayoutConfig) => Promise<void>) => {
    saveCallbackRef.current = callback;
  }, []);

  const value: WidgetLayoutContextValue = {
    widgets,
    pendingChanges,
    hasPendingChanges,
    canUndo,
    updateWidgetPosition,
    updateWidgetSize,
    reorderWidgets,
    reorderWidgetsByIndex,
    hideWidget,
    showWidget,
    undoLastChange,
    commitChanges,
    discardChanges,
    initializeLayout,
    getWidgetPosition,
    registerSaveCallback,
  };

  return (
    <WidgetLayoutContext.Provider value={value}>
      {children}
    </WidgetLayoutContext.Provider>
  );
}

export function useWidgetLayout() {
  const context = useContext(WidgetLayoutContext);
  if (!context) {
    throw new Error('useWidgetLayout must be used within WidgetLayoutProvider');
  }
  return context;
}
