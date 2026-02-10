import React from 'react';
import { MoveVertical } from 'lucide-react';

interface DropPlaceholderProps {
  gridWidth: number;
  minHeight?: number;
  brandColor?: string;
}

export function DropPlaceholder({ gridWidth, minHeight = 120, brandColor }: DropPlaceholderProps) {
  const accentColor = brandColor || 'var(--brand-primary, #06b6d4)';

  return (
    <div
      className="grid-item placeholder-card"
      style={{
        gridColumn: `span ${gridWidth} / span ${gridWidth}`,
        minHeight: `${minHeight}px`,
        border: `2.5px dashed ${accentColor}`,
        borderRadius: '16px',
        background: `linear-gradient(135deg, ${accentColor}08, ${accentColor}18)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        animation: 'pulse-border 1.2s ease-in-out infinite',
        position: 'relative',
        boxShadow: `0 0 20px ${accentColor}30, inset 0 0 20px ${accentColor}15`,
      }}
    >
      <MoveVertical
        size={20}
        style={{
          color: accentColor,
          opacity: 0.7,
          animation: 'float 2s ease-in-out infinite',
        }}
      />
      <span
        style={{
          color: accentColor,
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.3px',
          textTransform: 'uppercase',
        }}
      >
        Drop here
      </span>
      <span
        style={{
          color: accentColor,
          fontSize: '11px',
          fontWeight: 400,
          opacity: 0.7,
        }}
      >
        {gridWidth} column{gridWidth !== 1 ? 's' : ''} wide
      </span>
    </div>
  );
}
