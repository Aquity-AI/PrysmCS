import { useState, useCallback, useRef, useEffect } from 'react';

export interface DragInfo {
  widgetId: string;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

export interface GhostPosition {
  x: number;
  y: number;
}

export interface GapZone {
  index: number;
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface UsePointerDragOptions {
  onReorder: (draggedId: string, targetIndex: number) => void;
  gridContainerRef: React.RefObject<HTMLElement>;
  isEnabled: boolean;
}

export interface UsePointerDragReturn {
  dragInfo: DragInfo | null;
  ghostPos: GhostPosition | null;
  insertIdx: number | null;
  gapZones: GapZone[];
  handlePointerDown: (e: React.PointerEvent, widgetId: string, width: number, height: number) => void;
  isDragging: boolean;
}

export function computeGapZones(
  containerRef: React.RefObject<HTMLElement>,
  widgetSelector: string,
  gridGap: number = 20
): GapZone[] {
  const container = containerRef.current;
  if (!container) return [];

  const widgets = Array.from(container.querySelectorAll(widgetSelector)) as HTMLElement[];
  if (widgets.length === 0) return [];

  const zones: GapZone[] = [];
  const containerRect = container.getBoundingClientRect();

  widgets.forEach((widget, i) => {
    const rect = widget.getBoundingClientRect();
    const relLeft = rect.left - containerRect.left;
    const relTop = rect.top - containerRect.top;

    zones.push({
      index: i,
      left: relLeft - gridGap / 2,
      top: relTop,
      width: gridGap,
      height: rect.height,
    });

    if (i === widgets.length - 1) {
      zones.push({
        index: i + 1,
        left: relLeft + rect.width,
        top: relTop,
        width: gridGap,
        height: rect.height,
      });
    }
  });

  return zones;
}

export function findInsertIndex(
  mouseX: number,
  mouseY: number,
  containerRef: React.RefObject<HTMLElement>,
  widgetSelector: string,
  draggedId: string | null
): number | null {
  const container = containerRef.current;
  if (!container) return null;

  const widgets = Array.from(container.querySelectorAll(widgetSelector)) as HTMLElement[];
  if (widgets.length === 0) return 0;

  const containerRect = container.getBoundingClientRect();
  const relX = mouseX - containerRect.left;
  const relY = mouseY - containerRect.top + container.scrollTop;

  let closestIdx = 0;
  let closestDist = Infinity;
  let adjustedIndex = 0;

  widgets.forEach((widget) => {
    const widgetId = widget.dataset.widgetId;
    if (widgetId === draggedId) return;

    const rect = widget.getBoundingClientRect();
    const widgetRelLeft = rect.left - containerRect.left;
    const widgetRelTop = rect.top - containerRect.top + container.scrollTop;
    const widgetCenterX = widgetRelLeft + rect.width / 2;
    const widgetCenterY = widgetRelTop + rect.height / 2;

    const dist = Math.sqrt(Math.pow(relX - widgetCenterX, 2) + Math.pow(relY - widgetCenterY, 2));

    if (dist < closestDist) {
      closestDist = dist;
      closestIdx = relX < widgetCenterX ? adjustedIndex : adjustedIndex + 1;
    }

    adjustedIndex++;
  });

  return closestIdx;
}

export function usePointerDrag({
  onReorder,
  gridContainerRef,
  isEnabled,
}: UsePointerDragOptions): UsePointerDragReturn {
  const [dragInfo, setDragInfo] = useState<DragInfo | null>(null);
  const [ghostPos, setGhostPos] = useState<GhostPosition | null>(null);
  const [insertIdx, setInsertIdx] = useState<number | null>(null);
  const [gapZones, setGapZones] = useState<GapZone[]>([]);
  const dragInfoRef = useRef<DragInfo | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, widgetId: string, width: number, height: number) => {
      if (!isEnabled) return;

      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('select') || target.closest('input')) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const info: DragInfo = {
        widgetId,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        width: rect.width,
        height: rect.height,
      };

      setDragInfo(info);
      dragInfoRef.current = info;
      setGhostPos({ x: e.clientX - info.offsetX, y: e.clientY - info.offsetY });
      setGapZones(computeGapZones(gridContainerRef, '[data-widget-id]'));
    },
    [isEnabled, gridContainerRef]
  );

  useEffect(() => {
    if (!dragInfo) return;

    let rafId: number | null = null;
    let lastPointerEvent: PointerEvent | null = null;

    const updateDragPosition = () => {
      if (!lastPointerEvent) return;

      const info = dragInfoRef.current;
      if (!info) return;

      setGhostPos({
        x: lastPointerEvent.clientX - info.offsetX,
        y: lastPointerEvent.clientY - info.offsetY
      });

      const idx = findInsertIndex(
        lastPointerEvent.clientX,
        lastPointerEvent.clientY,
        gridContainerRef,
        '[data-widget-id]',
        info.widgetId
      );
      setInsertIdx(idx);

      rafId = null;
    };

    const handlePointerMove = (e: PointerEvent) => {
      lastPointerEvent = e;

      if (rafId === null) {
        rafId = requestAnimationFrame(updateDragPosition);
      }
    };

    const handlePointerUp = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }

      const info = dragInfoRef.current;
      if (info && insertIdx !== null) {
        onReorder(info.widgetId, insertIdx);
      }

      setDragInfo(null);
      dragInfoRef.current = null;
      setGhostPos(null);
      setInsertIdx(null);
      setGapZones([]);
      lastPointerEvent = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragInfo, insertIdx, onReorder, gridContainerRef]);

  return {
    dragInfo,
    ghostPos,
    insertIdx,
    gapZones,
    handlePointerDown,
    isDragging: dragInfo !== null,
  };
}
