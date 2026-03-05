import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  Play, X, Plus, Type, Image, Eye, EyeOff, GripVertical,
  Trash2, RefreshCw, Layers, ChevronDown,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { SlideEditorCanvas } from './SlideEditorCanvas';
import { slideTypeRegistry } from './slideTypeRegistry';
import { BackgroundPicker } from './BackgroundPicker';
import type { SlideData, PresentationBranding, OverlayElement } from './types';

const ANIMATION_OPTIONS = [
  { value: 'fade', label: 'Fade' },
  { value: 'slide', label: 'Slide' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'none', label: 'None' },
];

function AnimationDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const label = ANIMATION_OPTIONS.find(o => o.value === value)?.label ?? value;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
          borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)',
          cursor: 'pointer', fontSize: 12, minWidth: 88,
        }}
      >
        <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
        <ChevronDown size={12} style={{ opacity: 0.6, flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 200,
          background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8, overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)', minWidth: 120,
        }}>
          {ANIMATION_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 14px', fontSize: 12, cursor: 'pointer', border: 'none',
                background: opt.value === value ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: opt.value === value ? '#fff' : 'rgba(255,255,255,0.65)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface PresentationEditorProps {
  slides: SlideData[];
  branding: PresentationBranding;
  animation: string;
  compactMode: boolean;
  dataTimestamp: number;
  clientId: string;
  onSlidesChange: (updater: (prev: SlideData[]) => SlideData[]) => void;
  onAnimationChange: (anim: string) => void;
  onCompactModeChange: (compact: boolean) => void;
  onPresent: () => void;
  onRefresh: () => void;
  onClose: () => void;
}

export function PresentationEditor({
  slides,
  branding,
  animation,
  compactMode,
  dataTimestamp,
  clientId,
  onSlidesChange,
  onAnimationChange,
  onCompactModeChange,
  onPresent,
  onRefresh,
  onClose,
}: PresentationEditorProps) {
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [autoEditElementId, setAutoEditElementId] = useState<string | null>(null);
  const [draggedSlide, setDraggedSlide] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const slideListRef = useRef<HTMLDivElement>(null);

  const defaultBg = branding.slideBg || 'linear-gradient(135deg, #0a2540 0%, #0f172a 50%, #1e293b 100%)';
  const sortedSlides = useMemo(() => [...slides].sort((a, b) => a.order - b.order), [slides]);
  const enabledSlides = useMemo(() => sortedSlides.filter(s => s.enabled), [sortedSlides]);
  const currentEditingSlide = useMemo(() => slides.find(s => s.id === editingSlideId), [slides, editingSlideId]);

  const minutesAgo = Math.floor((Date.now() - dataTimestamp) / 60000);

  const navigateSlide = useCallback((direction: 'up' | 'down') => {
    const currentIdx = sortedSlides.findIndex(s => s.id === editingSlideId);
    if (direction === 'up' && currentIdx > 0) {
      setEditingSlideId(sortedSlides[currentIdx - 1].id);
      setSelectedElement(null);
    } else if (direction === 'down' && currentIdx < sortedSlides.length - 1) {
      setEditingSlideId(sortedSlides[currentIdx + 1].id);
      setSelectedElement(null);
    } else if (currentIdx === -1 && sortedSlides.length > 0) {
      setEditingSlideId(sortedSlides[0].id);
      setSelectedElement(null);
    }
  }, [sortedSlides, editingSlideId]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowUp') { e.preventDefault(); navigateSlide('up'); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); navigateSlide('down'); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [navigateSlide]);

  useEffect(() => {
    if (!editingSlideId || !slideListRef.current) return;
    const el = slideListRef.current.querySelector<HTMLElement>(`[data-slide-id="${editingSlideId}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [editingSlideId]);

  const toggleSlide = (slideId: string) => {
    onSlidesChange(prev => prev.map(s => s.id === slideId ? { ...s, enabled: !s.enabled } : s));
  };

  const updateSlideBackground = (slideId: string, background: string) => {
    onSlidesChange(prev => prev.map(s => s.id === slideId ? { ...s, background } : s));
  };

  const updateElement = (slideId: string, elementId: string, updates: Partial<OverlayElement>) => {
    onSlidesChange(prev => prev.map(s => {
      if (s.id === slideId) {
        const updatedSlide: typeof s = {
          ...s,
          overlayElements: s.overlayElements.map(el => el.id === elementId ? { ...el, ...updates } : el),
        };
        if (elementId === '__title__' && 'content' in updates) {
          updatedSlide.title = updates.content ?? s.title;
        }
        if (elementId === '__subtitle__' && 'content' in updates) {
          updatedSlide.subtitle = updates.content ?? s.subtitle;
        }
        if (elementId === '__meta__' && 'content' in updates) {
          updatedSlide.meta = updates.content ?? s.meta;
        }
        return updatedSlide;
      }
      return s;
    }));
  };

  const deleteElement = (slideId: string, elementId: string) => {
    const slide = slides.find(s => s.id === slideId);
    if (slide) {
      const elem = slide.overlayElements.find(el => el.id === elementId);
      if (elem?.isBuiltIn) return;
    }
    onSlidesChange(prev => prev.map(s => {
      if (s.id === slideId) {
        return { ...s, overlayElements: s.overlayElements.filter(el => el.id !== elementId) };
      }
      return s;
    }));
    setSelectedElement(null);
  };

  const updateContentLayout = (slideId: string, layout: Partial<SlideData['contentLayout']>) => {
    onSlidesChange(prev => prev.map(s => {
      if (s.id === slideId) {
        return { ...s, contentLayout: { ...s.contentLayout, ...layout } };
      }
      return s;
    }));
  };

  const addTextElement = () => {
    if (!editingSlideId) return;
    const elemId = `elem-${Date.now()}`;
    const newElem: OverlayElement = {
      id: elemId,
      type: 'text',
      content: '',
      x: 50, y: 50, width: 200, height: 60,
      fontSize: 18, color: '#ffffff', fontWeight: 'normal',
    };
    onSlidesChange(prev => prev.map(s => {
      if (s.id === editingSlideId) {
        return { ...s, overlayElements: [...s.overlayElements, newElem] };
      }
      return s;
    }));
    setSelectedElement(elemId);
    setAutoEditElementId(elemId);
    requestAnimationFrame(() => setAutoEditElementId(null));
  };

  const addImageElement = () => fileInputRef.current?.click();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingSlideId) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const newElem: OverlayElement = {
        id: `elem-${Date.now()}`,
        type: 'image',
        src: event.target?.result as string,
        x: 50, y: 50, width: 200, height: 150,
      };
      onSlidesChange(prev => prev.map(s => {
        if (s.id === editingSlideId) {
          return { ...s, overlayElements: [...s.overlayElements, newElem] };
        }
        return s;
      }));
      setSelectedElement(newElem.id);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const addCustomSlide = () => {
    const slideId = `custom-${Date.now()}`;
    const newSlide: SlideData = {
      id: slideId,
      type: 'custom',
      title: 'Custom Slide',
      enabled: true,
      order: slides.length,
      isCustom: true,
      contentLayout: { x: 0, y: 0, width: 100, height: 100 },
      overlayElements: [
        { id: `elem-${Date.now()}-t`, type: 'text', content: 'New Slide', x: 60, y: 60, width: 600, fontSize: 42, color: '#ffffff', fontWeight: 'bold' },
        { id: `elem-${Date.now()}-s`, type: 'text', content: 'Click to edit or add more elements', x: 60, y: 130, width: 500, fontSize: 20, color: 'rgba(255,255,255,0.7)', fontWeight: 'normal' },
      ],
    };
    onSlidesChange(prev => [...prev, newSlide]);
    setEditingSlideId(slideId);
    setSelectedElement(null);
  };

  const deleteSlide = (slideId: string) => {
    onSlidesChange(prev => prev.filter(s => s.id !== slideId));
    if (editingSlideId === slideId) {
      setEditingSlideId(null);
      setSelectedElement(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, slideId: string) => {
    setDraggedSlide(slideId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedSlide || draggedSlide === targetId) return;

    onSlidesChange(prev => {
      const dragIdx = prev.findIndex(s => s.id === draggedSlide);
      const targetIdx = prev.findIndex(s => s.id === targetId);
      if (dragIdx < 0 || targetIdx < 0) return prev;

      const newSlides = [...prev];
      const [removed] = newSlides.splice(dragIdx, 1);
      newSlides.splice(targetIdx, 0, removed);
      return newSlides.map((s, i) => ({ ...s, order: i }));
    });
  };

  const handleDragEnd = () => setDraggedSlide(null);

  const getSlideThumbIcon = (slide: SlideData) => {
    const config = slideTypeRegistry[slide.type];
    if (!config) return null;
    const Icon = (LucideIcons as any)[config.thumbIcon];
    return Icon ? <Icon size={16} /> : null;
  };

  return (
    <div className="pres-editor-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pres-editor" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(0,0,0,0.2)',
        }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff', margin: 0 }}>Presentation Editor</h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0 0' }}>
              {enabledSlides.length} slides active
              {minutesAgo > 0 && <span> &middot; Data loaded {minutesAgo}m ago</span>}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={onRefresh}
              title="Refresh data"
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
                borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer', fontSize: 12,
              }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <label
              title="Compact mode merges smaller sections"
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
                borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)',
                background: compactMode ? `${branding.primaryColor}20` : 'rgba(255,255,255,0.06)',
                color: compactMode ? branding.primaryColor : 'rgba(255,255,255,0.7)',
                cursor: 'pointer', fontSize: 12, userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={compactMode}
                onChange={(e) => onCompactModeChange(e.target.checked)}
                style={{ display: 'none' }}
              />
              <Layers size={14} /> Compact
            </label>
            <AnimationDropdown value={animation} onChange={onAnimationChange} />
            <button
              onClick={onPresent}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px',
                borderRadius: 8, border: 'none', background: branding.primaryColor,
                color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}
            >
              <Play size={15} /> Present
            </button>
            <button
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Slide list sidebar */}
          <div style={{
            width: 260, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.15)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Slides
              </h3>
              <button
                onClick={addCustomSlide}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                  borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)',
                  background: 'transparent', color: branding.primaryColor,
                  cursor: 'pointer', fontSize: 11, fontWeight: 600,
                }}
              >
                <Plus size={12} /> Add
              </button>
            </div>

            <div ref={slideListRef} style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
              {sortedSlides.map((slide) => {
                const isSelected = editingSlideId === slide.id;
                const config = slideTypeRegistry[slide.type];

                return (
                  <div
                    key={slide.id}
                    data-slide-id={slide.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, slide.id)}
                    onDragOver={(e) => handleDragOver(e, slide.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => { setEditingSlideId(slide.id); setSelectedElement(null); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                      borderRadius: 8, cursor: 'pointer', marginBottom: 2,
                      background: isSelected ? `${branding.primaryColor}18` : 'transparent',
                      border: isSelected ? `1px solid ${branding.primaryColor}40` : '1px solid transparent',
                      opacity: slide.enabled ? 1 : 0.4,
                      transition: 'all 0.15s',
                    }}
                  >
                    <GripVertical size={12} style={{ color: 'rgba(255,255,255,0.2)', cursor: 'grab', flexShrink: 0 }} />
                    <div style={{
                      width: 28, height: 28, borderRadius: 6,
                      background: 'rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isSelected ? branding.primaryColor : 'rgba(255,255,255,0.4)',
                      flexShrink: 0, fontSize: 12,
                    }}>
                      {getSlideThumbIcon(slide)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12, fontWeight: 500, color: isSelected ? '#fff' : 'rgba(255,255,255,0.7)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {slide.title?.substring(0, 28) || 'Untitled'}
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                        {config?.label || slide.type}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSlide(slide.id); }}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                          color: slide.enabled ? branding.primaryColor : 'rgba(255,255,255,0.2)',
                        }}
                      >
                        {slide.enabled ? <Eye size={13} /> : <EyeOff size={13} />}
                      </button>
                      {slide.isCustom && (
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteSlide(slide.id); }}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                            color: 'rgba(255,255,255,0.3)',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preview area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24, overflow: 'auto' }}>
            {currentEditingSlide ? (
              <>
                {/* Toolbar for current slide */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
                  flexWrap: 'wrap',
                }}>
                  <button
                    onClick={addTextElement}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px',
                      borderRadius: 7, border: '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)',
                      cursor: 'pointer', fontSize: 12,
                    }}
                  >
                    <Type size={13} /> Add Text
                  </button>
                  <button
                    onClick={addImageElement}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px',
                      borderRadius: 7, border: '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)',
                      cursor: 'pointer', fontSize: 12,
                    }}
                  >
                    <Image size={13} /> Add Image
                  </button>
                  <BackgroundPicker
                    currentBackground={currentEditingSlide.background}
                    defaultBackground={defaultBg}
                    slideId={currentEditingSlide.id}
                    clientId={clientId}
                    branding={branding}
                    onApply={updateSlideBackground}
                  />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 8 }}>
                    Click slide content to select, drag to move, double-click text to edit
                  </span>
                </div>

                <SlideEditorCanvas
                  slide={currentEditingSlide}
                  branding={branding}
                  selectedElement={selectedElement}
                  autoEditElementId={autoEditElementId}
                  onSelectElement={setSelectedElement}
                  onUpdateElement={updateElement}
                  onDeleteElement={deleteElement}
                  onUpdateContentLayout={updateContentLayout}
                />
              </>
            ) : (
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.3)', fontSize: 15,
              }}>
                Select a slide to preview and edit
              </div>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageUpload}
        />
      </div>
    </div>
  );
}
