import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { SlideContentRenderer } from './SlideContent';
import type { SlideData, PresentationBranding } from './types';

interface PresentationViewerProps {
  slides: SlideData[];
  branding: PresentationBranding;
  animation: string;
  onClose: () => void;
}

export function PresentationViewer({ slides, branding, animation, onClose }: PresentationViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const defaultBg = branding.slideBg || 'linear-gradient(135deg, #0a2540 0%, #0f172a 50%, #1e293b 100%)';

  const next = useCallback(() => {
    setCurrentIndex(prev => Math.min(prev + 1, slides.length - 1));
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      else if (e.key === 'Escape') { onClose(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [next, prev, onClose]);

  const slide = slides[currentIndex];
  if (!slide) return null;

  const slideBg = slide.background || defaultBg;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: branding.fontFamily || 'Inter, sans-serif',
      }}
    >
      <div
        className={`pres-slide pres-anim-${animation}`}
        key={currentIndex}
        style={{
          background: slideBg,
          borderRadius: 12,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          width: '92vw',
          height: '88vh',
          maxWidth: 1280,
          maxHeight: 720,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute',
          inset: 0,
          transform: `translate(${slide.contentLayout.x}%, ${slide.contentLayout.y}%)`,
          width: `${slide.contentLayout.width}%`,
          height: `${slide.contentLayout.height}%`,
        }}>
          <SlideContentRenderer slide={slide} branding={branding} />
        </div>
      </div>

      <button
        onClick={prev}
        disabled={currentIndex === 0}
        style={{
          position: 'absolute',
          left: 20,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 48,
          height: 48,
          borderRadius: 12,
          background: currentIndex === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
          border: 'none',
          cursor: currentIndex === 0 ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: currentIndex === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
          transition: 'all 0.2s',
        }}
      >
        <ChevronLeft size={24} />
      </button>

      <button
        onClick={next}
        disabled={currentIndex === slides.length - 1}
        style={{
          position: 'absolute',
          right: 20,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 48,
          height: 48,
          borderRadius: 12,
          background: currentIndex === slides.length - 1 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
          border: 'none',
          cursor: currentIndex === slides.length - 1 ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: currentIndex === slides.length - 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
          transition: 'all 0.2s',
        }}
      >
        <ChevronRight size={24} />
      </button>

      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          width: 40,
          height: 40,
          borderRadius: 10,
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.7)',
        }}
      >
        <X size={18} />
      </button>

      <div style={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 16px',
        borderRadius: 10,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(8px)',
      }}>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
          {currentIndex + 1} / {slides.length}
        </span>
        <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              style={{
                width: i === currentIndex ? 20 : 8,
                height: 8,
                borderRadius: 4,
                border: 'none',
                background: i === currentIndex ? branding.primaryColor : 'rgba(255,255,255,0.2)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
