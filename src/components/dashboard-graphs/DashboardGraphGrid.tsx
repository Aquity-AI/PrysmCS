import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { DashboardGraphCard } from './DashboardGraphCard';
import { AddGraphCard } from './AddGraphCard';
import { AddGraphModal } from './AddGraphModal';
import { useEditLayout } from './EditLayoutContext';
import type { GridCallbacks } from './EditLayoutContext';
import { useDashboardGraphs } from './useDashboardGraphs';
import { SIZE_TO_GRID_UNITS } from './types';
import { getGridItemStyle } from '../utils/gridUtils';
import type { DashboardGraph, GraphSize } from './types';

interface DashboardGraphGridProps {
  clientId: string;
  pageId: string;
  brandColor?: string;
}

interface DragInfo {
  cardId: string;
  cardSize: GraphSize;
  cardTitle: string;
  chartType: string;
  offsetX: number;
  offsetY: number;
  ghostW: number;
  ghostH: number;
}

interface GapZone {
  rowIdx: number;
  cols: number;
  insertAt: number;
}

const PLACEHOLDER_ID = '__ph__';

function computeGapZones(graphs: DashboardGraph[], draggedId: string | null): GapZone[] {
  const gaps: GapZone[] = [];
  let usedCols = 0;
  let rowIdx = 0;
  let insertAt = 0;

  for (const graph of graphs) {
    if (graph.id === draggedId) continue;

    const cols = SIZE_TO_GRID_UNITS[graph.size] || 6;

    if (usedCols + cols > 12) {
      if (usedCols < 12 && usedCols > 0) {
        gaps.push({ rowIdx, cols: 12 - usedCols, insertAt });
      }
      rowIdx++;
      usedCols = 0;
    }

    usedCols += cols;
    insertAt++;
  }

  if (usedCols > 0 && usedCols < 12) {
    gaps.push({ rowIdx, cols: 12 - usedCols, insertAt });
  }

  return gaps;
}

function findInsertIdx(
  clientX: number,
  clientY: number,
  gridEl: HTMLElement | null,
  dragCardId: string | null
): number | null {
  if (!gridEl || !dragCardId) return null;

  const cards = gridEl.querySelectorAll('[data-card-id]');
  const cardRects: { id: string; rect: DOMRect; index: number }[] = [];

  let index = 0;
  cards.forEach(el => {
    const id = el.getAttribute('data-card-id');
    if (id && id !== PLACEHOLDER_ID && id !== dragCardId) {
      cardRects.push({ id, rect: el.getBoundingClientRect(), index });
      index++;
    }
  });

  if (cardRects.length === 0) return 0;

  const rows: { y: number; cards: typeof cardRects }[] = [];
  for (const card of cardRects) {
    const cardCenterY = card.rect.top + card.rect.height / 2;
    let foundRow = rows.find(r => Math.abs(r.y - cardCenterY) < 60);
    if (!foundRow) {
      foundRow = { y: cardCenterY, cards: [] };
      rows.push(foundRow);
    }
    foundRow.cards.push(card);
  }

  rows.sort((a, b) => a.y - b.y);
  rows.forEach(row => row.cards.sort((a, b) => a.rect.left - b.rect.left));

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const rowTop = Math.min(...row.cards.map(c => c.rect.top));
    const rowBottom = Math.max(...row.cards.map(c => c.rect.bottom));

    if (clientY >= rowTop - 30 && clientY <= rowBottom + 30) {
      for (let i = 0; i < row.cards.length; i++) {
        const card = row.cards[i];
        const midX = card.rect.left + card.rect.width / 2;

        if (clientX < midX) {
          return card.index;
        }
      }
      const lastCard = row.cards[row.cards.length - 1];
      return lastCard.index + 1;
    }

    if (rowIndex < rows.length - 1) {
      const nextRowTop = Math.min(...rows[rowIndex + 1].cards.map(c => c.rect.top));
      if (clientY > rowBottom && clientY < nextRowTop) {
        const lastCard = row.cards[row.cards.length - 1];
        return lastCard.index + 1;
      }
    }
  }

  if (clientY < rows[0].y) {
    return 0;
  }

  const lastRow = rows[rows.length - 1];
  const lastCard = lastRow.cards[lastRow.cards.length - 1];
  return lastCard.index + 1;
}

export function DashboardGraphGrid({ clientId, pageId, brandColor }: DashboardGraphGridProps) {
  const { isEditing, registerCallbacks, undoLastAction, notifyChange } = useEditLayout();
  const {
    graphs,
    metricDefinitions,
    loading,
    refresh,
    handleDelete,
    handleReorderByIndex,
    handleSizeChange,
    commitDeletions,
    discardDeletions,
    hasPendingDeletions,
    handleUndo,
    canUndo,
  } = useDashboardGraphs(clientId, pageId);

  const hasPendingRef = useRef(hasPendingDeletions);
  hasPendingRef.current = hasPendingDeletions;
  const canUndoRef = useRef(canUndo);
  canUndoRef.current = canUndo;
  const handleUndoRef = useRef(handleUndo);
  handleUndoRef.current = handleUndo;
  const commitRef = useRef(commitDeletions);
  commitRef.current = commitDeletions;
  const discardRef = useRef(discardDeletions);
  discardRef.current = discardDeletions;

  useEffect(() => {
    const callbacks: GridCallbacks = {
      commitDeletions: () => commitRef.current(),
      discardDeletions: () => discardRef.current(),
      hasPendingDeletions: () => hasPendingRef.current,
      handleUndo: () => handleUndoRef.current(),
      canUndo: () => canUndoRef.current,
    };
    return registerCallbacks(callbacks);
  }, [registerCallbacks]);

  useEffect(() => {
    notifyChange();
  }, [hasPendingDeletions, canUndo, notifyChange]);

  useEffect(() => {
    if (!isEditing) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undoLastAction();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isEditing, undoLastAction]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [dragInfo, setDragInfo] = useState<DragInfo | null>(null);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);
  const [insertIdx, setInsertIdx] = useState<number | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragInfo | null>(null);
  const lastInsertRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isEditing) {
      setDragInfo(null);
      setGhostPos(null);
      setInsertIdx(null);
      dragRef.current = null;
      lastInsertRef.current = null;
    }
  }, [isEditing]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!dragRef.current) return;

    setGhostPos({ x: e.clientX, y: e.clientY });

    const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
    const isOverGapZone = elementUnderCursor?.closest('.gap-zone') !== null;

    if (!isOverGapZone) {
      const newInsertIdx = findInsertIdx(e.clientX, e.clientY, gridRef.current, dragRef.current.cardId);
      if (newInsertIdx !== lastInsertRef.current) {
        lastInsertRef.current = newInsertIdx;
        setInsertIdx(newInsertIdx);
      }
    }
  }, []);

  const handlePointerUp = useCallback((_e: PointerEvent) => {
    if (!dragRef.current) return;

    const finalInsertIdx = lastInsertRef.current;

    if (finalInsertIdx !== null) {
      handleReorderByIndex(dragRef.current.cardId, finalInsertIdx);
    }

    setDragInfo(null);
    setGhostPos(null);
    setInsertIdx(null);
    dragRef.current = null;
    lastInsertRef.current = null;

    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  }, [handlePointerMove, handleReorderByIndex]);

  const handleDragPointerDown = useCallback((e: React.PointerEvent, graphId: string) => {
    if (!isEditing) return;

    const cardEl = (e.target as HTMLElement).closest('[data-card-id]') as HTMLElement;
    if (!cardEl) return;

    const graph = graphs.find(g => g.id === graphId);
    if (!graph) return;

    const rect = cardEl.getBoundingClientRect();

    const info: DragInfo = {
      cardId: graphId,
      cardSize: graph.size,
      cardTitle: graph.title,
      chartType: graph.chart_type,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      ghostW: rect.width,
      ghostH: rect.height,
    };

    setDragInfo(info);
    setGhostPos({ x: e.clientX, y: e.clientY });
    dragRef.current = info;

    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [isEditing, graphs, handlePointerMove, handlePointerUp]);

  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  const displayCards = useMemo(() => {
    if (!dragInfo) return graphs;

    if (insertIdx !== null && insertIdx >= 0) {
      const filtered = graphs.filter(g => g.id !== dragInfo.cardId);
      const result = [...filtered];
      const placeholderGraph = {
        id: PLACEHOLDER_ID,
        size: dragInfo.cardSize,
        _placeholder: true,
      } as DashboardGraph & { _placeholder: boolean };

      const clampedIdx = Math.min(insertIdx, result.length);
      result.splice(clampedIdx, 0, placeholderGraph);
      return result;
    }

    return graphs;
  }, [graphs, dragInfo, insertIdx]);

  const gapZones = useMemo(() => {
    if (!isEditing) return [];
    const excludeId = (dragInfo && insertIdx !== null) ? dragInfo.cardId : null;
    return computeGapZones(graphs, excludeId);
  }, [isEditing, graphs, dragInfo, insertIdx]);

  const draggedGraph = dragInfo ? graphs.find(g => g.id === dragInfo.cardId) : null;

  if (loading && graphs.length === 0) {
    return null;
  }

  if (!isEditing && graphs.length === 0) {
    return (
      <>
        <div style={{ marginTop: '16px' }}>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              background: 'white',
              border: '1px dashed var(--slate-300, #cbd5e1)',
              borderRadius: '10px',
              color: 'var(--slate-500, #64748b)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--brand-primary, #06b6d4)';
              e.currentTarget.style.color = 'var(--brand-primary, #06b6d4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--slate-300, #cbd5e1)';
              e.currentTarget.style.color = 'var(--slate-500, #64748b)';
            }}
          >
            <Plus size={16} />
            Add your first graph
          </button>
        </div>
        {showAddModal && (
          <AddGraphModal
            clientId={clientId}
            pageId={pageId}
            onClose={() => setShowAddModal(false)}
            onCreated={refresh}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div
        ref={gridRef}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: '16px',
          width: '100%',
          marginTop: '16px',
        }}
      >
        {displayCards.map(graph => {
          const gridUnits = SIZE_TO_GRID_UNITS[graph.size] || 6;
          const isPlaceholder = (graph as any)._placeholder === true;
          const isSource = dragInfo?.cardId === graph.id && insertIdx !== null;

          if (isPlaceholder) {
            return (
              <div
                key={PLACEHOLDER_ID}
                data-card-id={PLACEHOLDER_ID}
                className="grid-item placeholder-card"
                style={{
                  ...getGridItemStyle(gridUnits),
                  minHeight: '200px',
                  border: '2px dashed var(--brand-primary, #06b6d4)',
                  borderRadius: '16px',
                  background: 'rgba(6, 182, 212, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'pulse-border 1.5s ease-in-out infinite',
                }}
                data-width={gridUnits}
              >
                <span style={{
                  color: 'var(--brand-primary, #06b6d4)',
                  fontSize: '13px',
                  fontWeight: 500,
                }}>
                  Drop here
                </span>
              </div>
            );
          }

          return (
            <div
              key={graph.id}
              data-card-id={graph.id}
              className="grid-item"
              style={{
                ...getGridItemStyle(gridUnits),
                ...(isSource ? {
                  opacity: 0.15,
                  transform: 'scale(0.97)',
                  pointerEvents: 'none' as const,
                } : {}),
              }}
              data-width={gridUnits}
            >
              <DashboardGraphCard
                graph={graph}
                metricDefinitions={metricDefinitions}
                clientId={clientId}
                isEditing={isEditing}
                isSource={isSource}
                onDelete={handleDelete}
                onDragHandlePointerDown={handleDragPointerDown}
                onRefresh={refresh}
                onSizeChange={handleSizeChange}
                brandColor={brandColor}
              />
            </div>
          );
        })}

        {isEditing && insertIdx === null && gapZones.map((gap, idx) => {
          const isActive = dragInfo !== null;
          return (
            <div
              key={`gap-${idx}`}
              className="grid-item gap-zone"
              style={{
                ...getGridItemStyle(gap.cols),
                minHeight: '120px',
                border: isActive ? '2px dashed var(--brand-primary, #06b6d4)' : '2px dashed var(--slate-200, #e2e8f0)',
                borderRadius: '16px',
                background: isActive ? 'rgba(6, 182, 212, 0.03)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                cursor: isActive ? 'pointer' : 'default',
              }}
              data-width={gap.cols}
              onPointerEnter={() => {
                if (dragInfo) {
                  lastInsertRef.current = gap.insertAt;
                  setInsertIdx(gap.insertAt);
                }
              }}
            >
              {isActive && (
                <span style={{
                  color: 'var(--brand-primary, #06b6d4)',
                  fontSize: '12px',
                  fontWeight: 500,
                  opacity: 0.7,
                }}>
                  Fill gap
                </span>
              )}
            </div>
          );
        })}

        {isEditing && (
          <div
            className="grid-item"
            style={getGridItemStyle(6)}
            data-width={6}
          >
            <AddGraphCard onClick={() => setShowAddModal(true)} />
          </div>
        )}
      </div>

      {!isEditing && graphs.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'transparent',
              border: '1px dashed var(--slate-300, #cbd5e1)',
              borderRadius: '8px',
              color: 'var(--slate-400, #94a3b8)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--brand-primary, #06b6d4)';
              e.currentTarget.style.color = 'var(--brand-primary, #06b6d4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--slate-300, #cbd5e1)';
              e.currentTarget.style.color = 'var(--slate-400, #94a3b8)';
            }}
          >
            <Plus size={14} />
            Add Graph
          </button>
        </div>
      )}

      {dragInfo && ghostPos && draggedGraph && insertIdx !== null && (
        <div
          style={{
            position: 'fixed',
            left: ghostPos.x - dragInfo.offsetX * 0.5,
            top: ghostPos.y - dragInfo.offsetY * 0.5,
            width: dragInfo.ghostW,
            height: dragInfo.ghostH,
            pointerEvents: 'none',
            zIndex: 10000,
            opacity: 0.92,
            transform: 'scale(0.5) rotate(1.5deg)',
            transformOrigin: 'top left',
            maxWidth: '400px',
            maxHeight: '300px',
          }}
        >
          <DashboardGraphCard
            graph={draggedGraph}
            metricDefinitions={metricDefinitions}
            clientId={clientId}
            isEditing={false}
            isGhost={true}
            onDelete={() => {}}
            onDragHandlePointerDown={() => {}}
            onRefresh={() => {}}
            brandColor={brandColor}
          />
        </div>
      )}

      {showAddModal && (
        <AddGraphModal
          clientId={clientId}
          pageId={pageId}
          onClose={() => setShowAddModal(false)}
          onCreated={refresh}
        />
      )}
    </>
  );
}
