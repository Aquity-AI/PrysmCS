import React from 'react';
import { Plus } from 'lucide-react';

interface AddGraphCardProps {
  onClick: () => void;
}

export function AddGraphCard({ onClick }: AddGraphCardProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        width: '100%',
        minHeight: '220px',
        background: 'var(--slate-50, #f8fafc)',
        border: '2px dashed var(--slate-200, #e2e8f0)',
        borderRadius: '16px',
        cursor: 'pointer',
        padding: '32px 20px',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.background = 'white';
        el.style.borderColor = 'var(--brand-primary, #06b6d4)';
        el.style.transform = 'translateY(-2px)';
        el.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.background = 'var(--slate-50, #f8fafc)';
        el.style.borderColor = 'var(--slate-200, #e2e8f0)';
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = 'none';
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--slate-100, #f1f5f9) 0%, var(--slate-200, #e2e8f0) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Plus size={22} style={{ color: 'var(--brand-primary, #06b6d4)' }} />
      </div>
      <span
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--slate-500, #64748b)',
          letterSpacing: '0.01em',
        }}
      >
        Add Graph
      </span>
    </button>
  );
}
