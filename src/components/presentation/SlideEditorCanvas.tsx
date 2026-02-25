import { useState, useRef, useCallback, useEffect } from 'react';
import { SlideContentRenderer } from './SlideContent';
import type { SlideData, PresentationBranding, OverlayElement } from './types';

interface SlideEditorCanvasProps {
  slide: SlideData;
  branding: PresentationBranding;
  selectedElement: string | null;
  autoEditElementId?: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (slideId: string, elementId: string, updates: Partial<OverlayElement>) => void;
  onDeleteElement: (slideId: string, elementId: string) => void;
  onUpdateContentLayout: (slideId: string, layout: Partial<SlideData['contentLayout']>) => void;
}

export function SlideEditorCanvas({
  slide,
  branding,
  selectedElement,
  autoEditElementId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
}: SlideEditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [resizing, setResizing] = useState<{ elemId: string; startW: number; startH: number; startX: number; startY: number } | null>(null);
  const [editingText, setEditingText] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const canvasRectRef = useRef<DOMRect | null>(null);
  const justFinishedInteraction = useRef(false);

  const defaultBg = branding.slideBg || 'linear-gradient(135deg, #0a2540 0%, #0f172a 50%, #1e293b 100%)';
  const slideBg = slide.background || defaultBg;

  useEffect(() => {
    if (autoEditElementId) {
      setEditingText(autoEditElementId);
    }
  }, [autoEditElementId]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (justFinishedInteraction.current) return;
    if ((e.target as HTMLElement).closest('[data-overlay-elem]')) return;
    onSelectElement(null);
    setEditingText(null);
  };

  const handleElemMouseDown = useCallback((e: React.MouseEvent, elemId: string) => {
    e.stopPropagation();
    if (editingText === elemId) return;

    const elem = slide.overlayElements.find(el => el.id === elemId);
    if (!elem || !containerRef.current) return;

    canvasRectRef.current = containerRef.current.getBoundingClientRect();
    const rect = canvasRectRef.current;

    setDragging(elemId);
    onSelectElement(elemId);
    dragOffset.current = {
      x: e.clientX - rect.left - elem.x,
      y: e.clientY - rect.top - elem.y,
    };
  }, [slide.overlayElements, editingText, onSelectElement]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, elemId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const elem = slide.overlayElements.find(el => el.id === elemId);
    if (!elem) return;

    onSelectElement(elemId);
    setResizing({
      elemId,
      startW: elem.width,
      startH: elem.height || 60,
      startX: e.clientX,
      startY: e.clientY,
    });
  }, [slide.overlayElements, onSelectElement]);

  useEffect(() => {
    if (!dragging && !resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (dragging && canvasRectRef.current) {
        const rect = canvasRectRef.current;
        const x = Math.max(0, e.clientX - rect.left - dragOffset.current.x);
        const y = Math.max(0, e.clientY - rect.top - dragOffset.current.y);
        onUpdateElement(slide.id, dragging, { x, y });
      }
      if (resizing) {
        const dw = e.clientX - resizing.startX;
        const dh = e.clientY - resizing.startY;
        onUpdateElement(slide.id, resizing.elemId, {
          width: Math.max(40, resizing.startW + dw),
          height: Math.max(30, resizing.startH + dh),
        });
      }
    };

    const handleMouseUp = () => {
      justFinishedInteraction.current = true;
      setDragging(null);
      setResizing(null);
      requestAnimationFrame(() => {
        justFinishedInteraction.current = false;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, resizing, slide.id, onUpdateElement]);

  useEffect(() => {
    if (!selectedElement) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT') return;
      if (editingText) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onDeleteElement(slide.id, selectedElement);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, editingText, slide.id, onDeleteElement]);

  if (!slide) return null;

  return (
    <div
      ref={containerRef}
      className="pres-editor-canvas-inner"
      onClick={handleCanvasClick}
      style={{
        background: slideBg,
        borderRadius: 12,
        width: '100%',
        aspectRatio: '16 / 9',
        maxHeight: 540,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}
    >
      <div style={{
        position: 'absolute',
        inset: 0,
        transform: `translate(${slide.contentLayout.x}%, ${slide.contentLayout.y}%)`,
        width: `${slide.contentLayout.width}%`,
        height: `${slide.contentLayout.height}%`,
        pointerEvents: 'none',
      }}>
        <SlideContentRenderer slide={slide} branding={branding} showOverlays={false} />
      </div>

      {slide.overlayElements.map(elem => {
        const isSelected = selectedElement === elem.id;
        const isDragging = dragging === elem.id;
        const isEditing = editingText === elem.id;

        return (
          <div
            key={elem.id}
            data-overlay-elem={elem.id}
            style={{
              position: 'absolute',
              left: elem.x,
              top: elem.y,
              width: elem.width,
              height: elem.height || 'auto',
              cursor: isEditing ? 'text' : isDragging ? 'grabbing' : 'grab',
              outline: isSelected ? `2px solid ${branding.primaryColor}` : '1px solid transparent',
              outlineOffset: 2,
              borderRadius: 4,
              zIndex: isSelected ? 20 : 10,
              transition: isDragging ? 'none' : 'outline 0.15s',
            }}
            onMouseDown={(e) => handleElemMouseDown(e, elem.id)}
            onDoubleClick={() => {
              if (elem.type === 'text') setEditingText(elem.id);
            }}
          >
            {elem.type === 'text' && isEditing ? (
              <textarea
                autoFocus
                value={elem.content || ''}
                onChange={(e) => onUpdateElement(slide.id, elem.id, { content: e.target.value })}
                onBlur={() => setEditingText(null)}
                onKeyDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: 40,
                  fontSize: elem.fontSize || 18,
                  color: elem.color || '#ffffff',
                  fontWeight: elem.fontWeight || 'normal',
                  fontStyle: elem.fontStyle || 'normal',
                  background: 'rgba(0,0,0,0.3)',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'inherit',
                  padding: 4,
                  borderRadius: 4,
                }}
              />
            ) : elem.type === 'text' ? (
              <span style={{
                fontSize: elem.fontSize || 18,
                color: !elem.content ? 'rgba(255,255,255,0.3)' : (elem.color || '#ffffff'),
                fontWeight: elem.fontWeight || 'normal',
                fontStyle: !elem.content ? 'italic' : (elem.fontStyle || 'normal'),
                display: 'block',
                whiteSpace: 'pre-wrap',
              }}>
                {elem.content || 'Click to add text'}
              </span>
            ) : (
              <img
                src={elem.src}
                alt=""
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                style={{
                  width: '100%',
                  height: elem.height || 'auto',
                  objectFit: elem.id === '__logo__' ? 'contain' : 'cover',
                  borderRadius: elem.id === '__logo__' ? 0 : 8,
                  userSelect: 'none',
                }}
              />
            )}

            {isSelected && !isEditing && (
              <div
                onMouseDown={(e) => handleResizeMouseDown(e, elem.id)}
                style={{
                  position: 'absolute',
                  right: -6,
                  bottom: -6,
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: branding.primaryColor,
                  cursor: 'nwse-resize',
                  border: '2px solid #fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
