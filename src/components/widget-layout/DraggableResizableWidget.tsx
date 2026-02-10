import React, { useRef, useState, useCallback, useEffect } from 'react';
import { GripVertical } from 'lucide-react';
import { ResizeHandles, ResizeDirection } from './ResizeHandles';
import { WidgetType, WIDGET_MIN_SIZES } from './types';

interface DraggableResizableWidgetProps {
  widgetId: string;
  widgetType: WidgetType;
  children: React.ReactNode;
  isEditing: boolean;
  width: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  onPositionChange?: (widgetId: string, row: number, col: number) => void;
  onSizeChange?: (widgetId: string, width: number, height: number) => void;
  onDragStart?: (e: React.DragEvent, widgetId: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, widgetId: string) => void;
  brandColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function DraggableResizableWidget({
  widgetId,
  widgetType,
  children,
  isEditing,
  width,
  height,
  minWidth,
  minHeight,
  onSizeChange,
  onDragStart,
  onDragOver,
  onDrop,
  brandColor = '#06b6d4',
  className = '',
  style = {},
}: DraggableResizableWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizePreview, setResizePreview] = useState<{ width: number; height: number } | null>(null);
  const [contentOverflow, setContentOverflow] = useState(false);

  const effectiveMinWidth = minWidth ?? WIDGET_MIN_SIZES[widgetType].minWidth;
  const effectiveMinHeight = minHeight ?? WIDGET_MIN_SIZES[widgetType].minHeight;

  const checkContentOverflow = useCallback(() => {
    if (containerRef.current) {
      const content = containerRef.current.querySelector('.widget-content');
      if (content) {
        const hasOverflow = content.scrollHeight > content.clientHeight ||
                           content.scrollWidth > content.clientWidth;
        setContentOverflow(hasOverflow);
      }
    }
  }, []);

  useEffect(() => {
    checkContentOverflow();
    const observer = new ResizeObserver(checkContentOverflow);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, [checkContentOverflow, width, height]);

  const handleResizeStart = useCallback((direction: ResizeDirection, e: React.MouseEvent) => {
    if (!isEditing || !onSizeChange) return;

    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = width;
    const startHeight = height || 300;
    const containerWidth = containerRef.current?.parentElement?.clientWidth || 1200;
    const gridUnitWidth = containerWidth / 12;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      if (direction.includes('e')) {
        const pixelWidth = (startWidth * gridUnitWidth) + deltaX;
        newWidth = Math.round(pixelWidth / gridUnitWidth);
      } else if (direction.includes('w')) {
        const pixelWidth = (startWidth * gridUnitWidth) - deltaX;
        newWidth = Math.round(pixelWidth / gridUnitWidth);
      }

      if (direction.includes('s')) {
        newHeight = startHeight + deltaY;
      } else if (direction.includes('n')) {
        newHeight = startHeight - deltaY;
      }

      newWidth = Math.max(effectiveMinWidth, Math.min(12, newWidth));
      newHeight = Math.max(effectiveMinHeight, newHeight);

      setResizePreview({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      if (resizePreview) {
        onSizeChange(widgetId, resizePreview.width, resizePreview.height);
      }
      setResizePreview(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isEditing, onSizeChange, width, height, widgetId, effectiveMinWidth, effectiveMinHeight, resizePreview]);

  const displayWidth = resizePreview?.width ?? width;
  const displayHeight = resizePreview?.height ?? height;

  return (
    <div
      ref={containerRef}
      className={`draggable-resizable-widget ${className} ${isEditing ? 'editing' : ''}`}
      draggable={isEditing}
      onDragStart={e => onDragStart?.(e, widgetId)}
      onDragOver={onDragOver}
      onDrop={e => onDrop?.(e, widgetId)}
      style={{
        position: 'relative',
        gridColumn: `span ${displayWidth} / span ${displayWidth}`,
        minHeight: displayHeight ? `${displayHeight}px` : undefined,
        border: isEditing ? `2px dashed ${brandColor}` : '2px solid transparent',
        borderRadius: '12px',
        transition: isResizing ? 'none' : 'border-color 0.2s ease, box-shadow 0.2s ease',
        boxShadow: isEditing ? `0 0 0 2px ${brandColor}20` : 'none',
        background: 'white',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div className="widget-drag-handle-box">
        <GripVertical size={16} />
      </div>

      {isEditing && (
        <>
          <ResizeHandles onResizeStart={handleResizeStart} brandColor={brandColor} />

          {isResizing && resizePreview && (
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                padding: '4px 8px',
                background: 'rgba(0,0,0,0.75)',
                borderRadius: 4,
                color: 'white',
                fontSize: 11,
                fontWeight: 500,
                zIndex: 15,
              }}
            >
              {resizePreview.width}/12 cols &middot; {resizePreview.height}px
            </div>
          )}
        </>
      )}

      <div
        className="widget-content"
        style={{
          width: '100%',
          height: '100%',
          overflow: contentOverflow ? 'auto' : 'visible',
          paddingTop: isEditing ? '40px' : '0',
          boxSizing: 'border-box',
        }}
      >
        {children}
      </div>

      {contentOverflow && !isEditing && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 24,
            background: 'linear-gradient(transparent, rgba(255,255,255,0.9))',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingBottom: 4,
          }}
        >
          <span style={{ fontSize: 10, color: '#94a3b8' }}>Scroll for more</span>
        </div>
      )}
    </div>
  );
}
