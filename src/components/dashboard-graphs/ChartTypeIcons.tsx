import React from 'react';
import type { ChartType } from './types';

const iconStyles: React.CSSProperties = {
  width: '32px',
  height: '32px',
};

function LineIcon() {
  return (
    <svg style={iconStyles} viewBox="0 0 32 32" fill="none">
      <polyline
        points="4,24 10,16 16,20 22,8 28,12"
        stroke="var(--brand-primary, #06b6d4)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="10" cy="16" r="2" fill="var(--brand-primary, #06b6d4)" />
      <circle cx="16" cy="20" r="2" fill="var(--brand-primary, #06b6d4)" />
      <circle cx="22" cy="8" r="2" fill="var(--brand-primary, #06b6d4)" />
    </svg>
  );
}

function BarIcon() {
  return (
    <svg style={iconStyles} viewBox="0 0 32 32" fill="none">
      <rect x="3" y="18" width="5" height="10" rx="1.5" fill="var(--brand-primary, #06b6d4)" opacity="0.6" />
      <rect x="10.5" y="12" width="5" height="16" rx="1.5" fill="var(--brand-primary, #06b6d4)" opacity="0.8" />
      <rect x="18" y="6" width="5" height="22" rx="1.5" fill="var(--brand-primary, #06b6d4)" />
      <rect x="25.5" y="14" width="5" height="14" rx="1.5" fill="var(--brand-primary, #06b6d4)" opacity="0.7" />
    </svg>
  );
}

function PieIcon() {
  return (
    <svg style={iconStyles} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="12" fill="#1e293b" stroke="#334155" strokeWidth="1" />
      <path d="M16 4 A12 12 0 0 1 28 16 L16 16 Z" fill="var(--brand-primary, #06b6d4)" />
      <path d="M28 16 A12 12 0 0 1 10 26.4 L16 16 Z" fill="var(--brand-accent, #14b8a6)" opacity="0.7" />
    </svg>
  );
}

function DonutIcon() {
  return (
    <svg style={iconStyles} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="12" fill="none" stroke="#334155" strokeWidth="5" />
      <path
        d="M16 4 A12 12 0 1 1 5.6 22"
        fill="none"
        stroke="var(--brand-primary, #06b6d4)"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AreaIcon() {
  return (
    <svg style={iconStyles} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand-primary, #06b6d4)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--brand-primary, #06b6d4)" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path
        d="M4,28 L4,20 Q8,14 12,16 Q16,18 20,10 Q24,4 28,8 L28,28 Z"
        fill="url(#areaGrad)"
      />
      <polyline
        points="4,20 12,16 20,10 28,8"
        stroke="var(--brand-primary, #06b6d4)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function ProgressIcon() {
  return (
    <svg style={iconStyles} viewBox="0 0 32 32" fill="none">
      <rect x="2" y="12" width="28" height="8" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1" />
      <rect x="3" y="13" width="18" height="6" rx="3" fill="var(--brand-primary, #06b6d4)" />
      <line x1="22" y1="10" x2="22" y2="22" stroke="var(--brand-accent, #14b8a6)" strokeWidth="1.5" strokeDasharray="2 2" />
    </svg>
  );
}

const ICON_MAP: Record<ChartType, React.FC> = {
  line: LineIcon,
  bar: BarIcon,
  pie: PieIcon,
  donut: DonutIcon,
  area: AreaIcon,
  progress: ProgressIcon,
};

export function ChartTypeIcon({ type }: { type: ChartType }) {
  const Icon = ICON_MAP[type];
  return Icon ? <Icon /> : null;
}
