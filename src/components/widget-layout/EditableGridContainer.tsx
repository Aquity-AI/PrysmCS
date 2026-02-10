import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useWidgetLayout } from './WidgetLayoutContext';
import { DraggableResizableWidget } from './DraggableResizableWidget';
import { WidgetType } from './types';

interface WidgetRenderConfig {
  widgetId: string;
  widgetType: WidgetType;
  render: () => React.ReactNode;
}

interface EditableGridContainerProps {
  widgets: WidgetRenderConfig[];
  isEditing: boolean;
  brandColor?: string;
  gap?: number;
  className?: string;
}

export function EditableGridContainer({
  widgets,
  isEditing,
  brandColor = '#06b6d4',
  gap = 16,
  className = '',
}: EditableGridContainerProps) {
  const {
    widgets: widgetPositions,
    updateWidgetSize,
    reorderWidgets,
    getWidgetPosition,
  } = useWidgetLayout();

  const containerRef = useRef<HTMLDivElement>(null);
  const dragItemRef = useRef<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, widgetId: string) => {
    dragItemRef.current = widgetId;
    e.dataTransfer.effectAllowed = 'move';
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback((widgetId: string) => {
    if (dragItemRef.current && dragItemRef.current !== widgetId) {
      setDropTargetId(widgetId);
    }
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropTargetId(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    if (dragItemRef.current && dragItemRef.current !== targetId) {
      reorderWidgets(dragItemRef.current, targetId);
    }
    dragItemRef.current = null;
    setDropTargetId(null);
  }, [reorderWidgets]);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    dragItemRef.current = null;
    setDropTargetId(null);
  }, []);

  const handleSizeChange = useCallback((widgetId: string, width: number, height: number) => {
    updateWidgetSize(widgetId, width, height);
  }, [updateWidgetSize]);

  const sortedWidgets = [...widgets].sort((a, b) => {
    const posA = getWidgetPosition(a.widgetId);
    const posB = getWidgetPosition(b.widgetId);
    if (!posA || !posB) return 0;
    if (posA.row !== posB.row) return posA.row - posB.row;
    return posA.col - posB.col;
  });

  const visibleWidgets = sortedWidgets.filter(w => {
    const pos = getWidgetPosition(w.widgetId);
    return pos && pos.width > 0;
  });

  return (
    <div
      ref={containerRef}
      className={`editable-grid-container ${className}`}
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
                borderLeft: i === 0 ? `1px dashed ${brandColor}30` : 'none',
                borderRight: `1px dashed ${brandColor}30`,
                minHeight: 100,
              }}
            />
          ))}
        </div>
      )}

      {visibleWidgets.map(widget => {
        const position = getWidgetPosition(widget.widgetId);
        if (!position) return null;

        const isDropTarget = dropTargetId === widget.widgetId;

        return (
          <div
            key={widget.widgetId}
            onDragEnter={() => handleDragEnter(widget.widgetId)}
            onDragLeave={handleDragLeave}
            onDragEnd={handleDragEnd}
            style={{
              gridColumn: `span ${position.width} / span ${position.width}`,
              position: 'relative',
              transition: 'transform 0.15s ease',
              transform: isDropTarget ? 'scale(1.02)' : 'scale(1)',
            }}
          >
            {isDropTarget && isEditing && (
              <div
                style={{
                  position: 'absolute',
                  inset: -4,
                  border: `2px dashed ${brandColor}`,
                  borderRadius: 14,
                  background: `${brandColor}10`,
                  zIndex: 1,
                  pointerEvents: 'none',
                }}
              />
            )}
            <DraggableResizableWidget
              widgetId={widget.widgetId}
              widgetType={widget.widgetType}
              isEditing={isEditing}
              width={position.width}
              height={position.height}
              onSizeChange={handleSizeChange}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              brandColor={brandColor}
            >
              {widget.render()}
            </DraggableResizableWidget>
          </div>
        );
      })}
    </div>
  );
}
