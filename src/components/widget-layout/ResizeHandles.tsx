import React from 'react';

export type ResizeDirection = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

interface ResizeHandlesProps {
  onResizeStart: (direction: ResizeDirection, e: React.MouseEvent) => void;
  brandColor?: string;
}

const handleStyles: Record<ResizeDirection, React.CSSProperties> = {
  n: { top: -4, left: '50%', transform: 'translateX(-50%)', width: 24, height: 8, cursor: 'ns-resize' },
  ne: { top: -4, right: -4, width: 10, height: 10, cursor: 'nesw-resize' },
  e: { top: '50%', right: -4, transform: 'translateY(-50%)', width: 8, height: 24, cursor: 'ew-resize' },
  se: { bottom: -4, right: -4, width: 10, height: 10, cursor: 'nwse-resize' },
  s: { bottom: -4, left: '50%', transform: 'translateX(-50%)', width: 24, height: 8, cursor: 'ns-resize' },
  sw: { bottom: -4, left: -4, width: 10, height: 10, cursor: 'nesw-resize' },
  w: { top: '50%', left: -4, transform: 'translateY(-50%)', width: 8, height: 24, cursor: 'ew-resize' },
  nw: { top: -4, left: -4, width: 10, height: 10, cursor: 'nwse-resize' },
};

export function ResizeHandles({ onResizeStart, brandColor = '#06b6d4' }: ResizeHandlesProps) {
  const directions: ResizeDirection[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

  return (
    <>
      {directions.map(dir => (
        <div
          key={dir}
          onMouseDown={e => {
            e.stopPropagation();
            onResizeStart(dir, e);
          }}
          style={{
            position: 'absolute',
            ...handleStyles[dir],
            background: brandColor,
            border: '2px solid white',
            borderRadius: dir.length === 2 ? '2px' : '1px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            zIndex: 10,
            opacity: 0.9,
            transition: 'opacity 0.15s ease',
          }}
          onMouseEnter={e => { (e.target as HTMLElement).style.opacity = '1'; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.opacity = '0.9'; }}
        />
      ))}
    </>
  );
}
