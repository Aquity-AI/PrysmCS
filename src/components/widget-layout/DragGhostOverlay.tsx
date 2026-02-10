import React from 'react';
import type { DragInfo, GhostPosition } from './usePointerDrag';

interface DragGhostOverlayProps {
  dragInfo: DragInfo;
  ghostPos: GhostPosition;
  children: React.ReactNode;
}

export function DragGhostOverlay({ dragInfo, ghostPos, children }: DragGhostOverlayProps) {
  const scale = 0.5;
  const maxWidth = 400;
  const maxHeight = 300;

  return (
    <div
      style={{
        position: 'fixed',
        left: ghostPos.x - dragInfo.offsetX * scale,
        top: ghostPos.y - dragInfo.offsetY * scale,
        width: Math.min(dragInfo.width, maxWidth / scale),
        height: Math.min(dragInfo.height, maxHeight / scale),
        pointerEvents: 'none',
        zIndex: 10000,
        opacity: 0.95,
        transform: `scale(${scale}) rotate(1.5deg)`,
        transformOrigin: 'top left',
        maxWidth: `${maxWidth}px`,
        maxHeight: `${maxHeight}px`,
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(6, 182, 212, 0.35), 0 12px 40px rgba(0, 0, 0, 0.25), 0 4px 12px rgba(0, 0, 0, 0.15)',
        border: '2px solid rgba(6, 182, 212, 0.5)',
        animation: 'lift 0.15s ease-out forwards',
        filter: 'brightness(1.05) saturate(1.1)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <div style={{ position: 'relative', zIndex: 2 }}>
        {children}
      </div>
    </div>
  );
}
