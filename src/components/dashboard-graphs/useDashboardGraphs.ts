import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { fetchGraphsForPage, fetchMetricDefinitions, updateGraph, deleteGraph as deleteGraphService, reorderGraphs } from './dashboardGraphService';
import type { DashboardGraph, MetricDefinition } from './types';

interface UndoAction {
  type: 'delete';
  graphId: string;
  timestamp: number;
}

interface UseDashboardGraphsReturn {
  graphs: DashboardGraph[];
  metricDefinitions: Record<string, MetricDefinition>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  handleDelete: (id: string) => void;
  handleReorder: (draggedId: string, targetId: string) => Promise<void>;
  handleReorderByIndex: (draggedId: string, newIndex: number) => Promise<void>;
  handleSizeChange: (id: string, size: string) => Promise<void>;
  commitDeletions: () => Promise<void>;
  discardDeletions: () => void;
  hasPendingDeletions: boolean;
  handleUndo: () => void;
  canUndo: boolean;
}

export function useDashboardGraphs(clientId: string, pageId: string): UseDashboardGraphsReturn {
  const [allGraphs, setAllGraphs] = useState<DashboardGraph[]>([]);
  const [pendingDeletions, setPendingDeletions] = useState<Set<string>>(new Set());
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);
  const [metricDefinitions, setMetricDefinitions] = useState<Record<string, MetricDefinition>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const graphs = useMemo(
    () => allGraphs.filter(g => !pendingDeletions.has(g.id)),
    [allGraphs, pendingDeletions]
  );

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const loadData = useCallback(async () => {
    if (!clientId || !pageId) return;

    try {
      setLoading(true);
      setError(null);

      const [graphsData, metricsData] = await Promise.all([
        fetchGraphsForPage(clientId, pageId),
        fetchMetricDefinitions(clientId),
      ]);

      if (!isMounted.current) return;

      setAllGraphs(graphsData);

      const defMap: Record<string, MetricDefinition> = {};
      metricsData.forEach(m => { defMap[m.id] = m; });
      setMetricDefinitions(defMap);
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to load graphs');
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [clientId, pageId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!clientId || !pageId) return;

    const channel = supabase
      .channel(`dashboard-graphs-${clientId}-${pageId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'dashboard_graphs',
        filter: `client_id=eq.${clientId}`,
      }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, pageId, loadData]);

  const handleDelete = useCallback((id: string) => {
    setPendingDeletions(prev => new Set(prev).add(id));
    setUndoStack(prev => [...prev, { type: 'delete', graphId: id, timestamp: Date.now() }]);
  }, []);

  const handleUndo = useCallback(() => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev;
      const newStack = [...prev];
      const action = newStack.pop()!;
      if (action.type === 'delete') {
        setPendingDeletions(current => {
          const next = new Set(current);
          next.delete(action.graphId);
          return next;
        });
      }
      return newStack;
    });
  }, []);

  const commitDeletions = useCallback(async () => {
    if (pendingDeletions.size === 0) {
      setUndoStack([]);
      return;
    }

    const idsToDelete = Array.from(pendingDeletions);
    try {
      await Promise.all(idsToDelete.map(id => deleteGraphService(id)));
      setAllGraphs(prev => prev.filter(g => !pendingDeletions.has(g.id)));
      setPendingDeletions(new Set());
      setUndoStack([]);
    } catch (err) {
      console.error('Failed to commit deletions:', err);
    }
  }, [pendingDeletions]);

  const discardDeletions = useCallback(() => {
    setPendingDeletions(new Set());
    setUndoStack([]);
  }, []);

  const handleReorder = useCallback(async (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;

    setAllGraphs(prev => {
      const items = [...prev];
      const dragIndex = items.findIndex(g => g.id === draggedId);
      const targetIndex = items.findIndex(g => g.id === targetId);
      if (dragIndex === -1 || targetIndex === -1) return prev;

      const [dragged] = items.splice(dragIndex, 1);
      items.splice(targetIndex, 0, dragged);
      return items;
    });

    const newOrder = graphs.map(g => g.id);
    const dragIdx = newOrder.indexOf(draggedId);
    const targetIdx = newOrder.indexOf(targetId);
    if (dragIdx !== -1 && targetIdx !== -1) {
      newOrder.splice(dragIdx, 1);
      newOrder.splice(targetIdx, 0, draggedId);
    }

    try {
      await reorderGraphs(newOrder);
    } catch (err) {
      console.error('Failed to reorder:', err);
      loadData();
    }
  }, [graphs, loadData]);

  const handleReorderByIndex = useCallback(async (draggedId: string, newIndex: number) => {
    const currentIndex = graphs.findIndex(g => g.id === draggedId);
    if (currentIndex === -1 || currentIndex === newIndex) return;

    setAllGraphs(prev => {
      const items = [...prev];
      const dragIndex = items.findIndex(g => g.id === draggedId);
      if (dragIndex === -1) return prev;

      const [dragged] = items.splice(dragIndex, 1);
      const adjustedIndex = dragIndex < newIndex ? newIndex - 1 : newIndex;
      const clampedIndex = Math.max(0, Math.min(adjustedIndex, items.length));
      items.splice(clampedIndex, 0, dragged);
      return items;
    });

    const newOrder = graphs.map(g => g.id);
    const dragIdx = newOrder.indexOf(draggedId);
    if (dragIdx !== -1) {
      newOrder.splice(dragIdx, 1);
      const adjustedIndex = dragIdx < newIndex ? newIndex - 1 : newIndex;
      const clampedIndex = Math.max(0, Math.min(adjustedIndex, newOrder.length));
      newOrder.splice(clampedIndex, 0, draggedId);
    }

    try {
      await reorderGraphs(newOrder);
    } catch (err) {
      console.error('Failed to reorder by index:', err);
      loadData();
    }
  }, [graphs, loadData]);

  const handleSizeChange = useCallback(async (id: string, size: string) => {
    setAllGraphs(prev => prev.map(g => g.id === id ? { ...g, size: size as any } : g));
    try {
      await updateGraph(id, { size: size as any });
    } catch (err) {
      console.error('Failed to update size:', err);
      loadData();
    }
  }, [loadData]);

  return {
    graphs,
    metricDefinitions,
    loading,
    error,
    refresh: loadData,
    handleDelete,
    handleReorder,
    handleReorderByIndex,
    handleSizeChange,
    commitDeletions,
    discardDeletions,
    hasPendingDeletions: pendingDeletions.size > 0,
    handleUndo,
    canUndo: undoStack.length > 0,
  };
}
