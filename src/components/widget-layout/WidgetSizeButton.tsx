import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface WidthOption {
  value: number;
  label: string;
  description: string;
}

export const WIDTH_OPTIONS: WidthOption[] = [
  { value: 3, label: 'Quarter', description: '4 per row' },
  { value: 4, label: 'Third', description: '3 per row' },
  { value: 6, label: 'Half', description: '2 per row' },
  { value: 8, label: 'Two-Thirds', description: '1-2 per row' },
  { value: 12, label: 'Full Width', description: '1 per row' },
];

interface WidgetSizeButtonProps {
  currentWidth: number;
  onWidthChange: (width: number) => void;
  brandColor?: string;
}

export function WidgetSizeButton({ currentWidth, onWidthChange, brandColor }: WidgetSizeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const currentOption = WIDTH_OPTIONS.find(o => o.value === currentWidth) || WIDTH_OPTIONS[2];
  const accentColor = brandColor || 'var(--brand-primary, #06b6d4)';

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'absolute',
        bottom: '8px',
        right: '8px',
        zIndex: 20,
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(4px)',
          border: '1px solid var(--slate-200, #e2e8f0)',
          borderRadius: '6px',
          padding: '4px 10px',
          cursor: 'pointer',
          color: 'var(--slate-600, #475569)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {currentOption.label}
        <ChevronDown size={12} style={{ opacity: 0.6 }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            right: 0,
            marginBottom: '4px',
            background: 'white',
            border: '1px solid var(--slate-200, #e2e8f0)',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            minWidth: '140px',
            overflow: 'hidden',
          }}
        >
          {WIDTH_OPTIONS.map(option => {
            const isSelected = currentWidth === option.value;
            return (
              <button
                key={option.value}
                onClick={(e) => {
                  e.stopPropagation();
                  onWidthChange(option.value);
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  background: isSelected ? 'var(--slate-50, #f8fafc)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  fontSize: '12px',
                  color: isSelected ? accentColor : 'var(--slate-600, #475569)',
                  fontWeight: isSelected ? 600 : 400,
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'var(--slate-50, #f8fafc)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <span>{option.label}</span>
                {isSelected && <Check size={14} style={{ color: accentColor }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
