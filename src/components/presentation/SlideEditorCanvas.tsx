import { useState, useRef, useCallback, useEffect } from 'react';
import { SlideContentRenderer } from './SlideContent';
import type { SlideData, PresentationBranding, OverlayElement } from './types';

interface SlideEditorCanvasProps {
  slide: SlideData;
  branding: PresentationBranding;
  selectedElement: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (slideId: string, elementId: string, updates: Partial<OverlayElement>) => void;
  onDeleteElement: (slideId: string, elementId: string) => void;
  onUpdateContentLayout: (slideId: string, layout: Partial<SlideData['contentLayout']>) => void;
}

export function SlideEditorCanvas({
  slide,
  branding,
  selectedElement,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
}: SlideEditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [resizing, setResizing] = useState<{ elemId: string; startW: number; startH: number; startX: number; startY: number } | null>(null);
  const [editingText, setEditingText] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const defaultBg = branding.slideBg || 'linear-gradient(135deg, #0a2540 0%, #0f172a 50%, #1e293b 100%)';
  const slideBg = slide.background || defaultBg;

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.pres-editor-canvas-inner')) {
      onSelectElement(null);
      setEditingText(null);
    }
  };

  const handleElemMouseDown = useCallback((e: React.MouseEvent, elemId: string) => {
    e.stopPropagation();
    if (editingText === elemId) return;

    const elem = slide.overlayElements.find(el => el.id === elemId);
    if (!elem) return;

    setDragging(elemId);
    onSelectElement(elemId);
    dragOffset.current = { x: e.clientX - elem.x, y: e.clientY - elem.y };
  }, [slide.overlayElements, editingText, onSelectElement]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, elemId: string) => {
    e.stopPropagation();
    const elem = slide.overlayElements.find(el => el.id === elemId);
    if (!elem) return;

    setResizing({
      elemId,
      startW: elem.width,
      startH: elem.height || 60,
      startX: e.clientX,
      startY: e.clientY,
    });
  }, [slide.overlayElements]);

  useEffect(() => {
    if (!dragging && !resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (dragging) {
        const x = Math.max(0, e.clientX - dragOffset.current.x);
        const y = Math.max(0, e.clientY - dragOffset.current.y);
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
      setDragging(null);
      setResizing(null);
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
      }}>
        <SlideContentRenderer slide={slide} branding={branding} showOverlays={false} />
      </div>

      {slide.overlayElements.map(elem => {
        const isSelected = selectedElement === elem.id;
        const isDragging = dragging === elem.id;

        return (
          <div
            key={elem.id}
            style={{
              position: 'absolute',
              left: elem.x,
              top: elem.y,
              width: elem.width,
              height: elem.height || 'auto',
              cursor: isDragging ? 'grabbing' : 'grab',
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
            {elem.type === 'text' && editingText === elem.id ? (
              <textarea
                autoFocus
                value={elem.content || ''}
                onChange={(e) => onUpdateElement(slide.id, elem.id, { content: e.target.value })}
                onBlur={() => setEditingText(null)}
                style={{
                  width: '100%',
                  minHeight: 40,
                  fontSize: elem.fontSize || 18,
                  color: elem.color || '#ffffff',
                  fontWeight: elem.fontWeight || 'normal',
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
                color: elem.color || '#ffffff',
                fontWeight: elem.fontWeight || 'normal',
                display: 'block',
                whiteSpace: 'pre-wrap',
              }}>
                {elem.content}
              </span>
            ) : (
              <img
                src={elem.src}
                alt=""
                style={{
                  width: '100%',
                  height: elem.height || 'auto',
                  objectFit: elem.id === '__logo__' ? 'contain' : 'cover',
                  borderRadius: elem.id === '__logo__' ? 0 : 8,
                  pointerEvents: 'none',
                }}
              />
            )}

            {isSelected && (
              <div
                onMouseDown={(e) => handleResizeMouseDown(e, elem.id)}
                style={{
                  position: 'absolute',
                  right: -5,
                  bottom: -5,
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: branding.primaryColor,
                  cursor: 'nwse-resize',
                  border: '2px solid #fff',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
