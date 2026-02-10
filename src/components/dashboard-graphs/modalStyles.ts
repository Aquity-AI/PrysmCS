import type React from 'react';

export const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.6)',
  backdropFilter: 'blur(4px)',
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
};

export const modal: React.CSSProperties = {
  background: '#0f172a',
  borderRadius: '16px',
  border: '1px solid #1e293b',
  boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)',
  width: '100%',
  maxWidth: '640px',
  maxHeight: '85vh',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
};

export const header: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '24px 28px 0',
};

export const title: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 700,
  color: '#f1f5f9',
  margin: 0,
};

export const closeButton: React.CSSProperties = {
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '8px',
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: '#94a3b8',
  transition: 'all 0.15s ease',
};

export const progressBar: React.CSSProperties = {
  display: 'flex',
  gap: '6px',
  padding: '16px 28px 0',
};

export const progressSegment = (active: boolean): React.CSSProperties => ({
  flex: 1,
  height: '3px',
  borderRadius: '2px',
  background: active ? 'var(--brand-primary, #06b6d4)' : '#1e293b',
  transition: 'background 0.3s ease',
});

export const stepLabel: React.CSSProperties = {
  padding: '16px 28px 0',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--brand-primary, #06b6d4)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

export const stepTitle: React.CSSProperties = {
  padding: '4px 28px 0',
  fontSize: '16px',
  fontWeight: 600,
  color: '#e2e8f0',
  margin: 0,
};

export const body: React.CSSProperties = {
  flex: 1,
  overflow: 'auto',
  padding: '20px 28px',
};

export const footer: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 28px 24px',
  borderTop: '1px solid #1e293b',
};

export const cancelBtn: React.CSSProperties = {
  padding: '10px 20px',
  background: 'transparent',
  border: '1px solid #334155',
  borderRadius: '10px',
  color: '#cbd5e1',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

export const continueBtn = (disabled: boolean): React.CSSProperties => ({
  padding: '10px 24px',
  background: disabled
    ? '#1e293b'
    : 'linear-gradient(135deg, var(--brand-primary, #06b6d4) 0%, var(--brand-accent, #14b8a6) 100%)',
  border: disabled ? '1px solid #334155' : '1px solid var(--brand-primary, #06b6d4)',
  borderRadius: '10px',
  color: disabled ? '#475569' : '#ffffff',
  fontSize: '14px',
  fontWeight: 600,
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.15s ease',
  opacity: disabled ? 0.6 : 1,
});

export const chartTypeCard = (selected: boolean): React.CSSProperties => ({
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  gap: '10px',
  padding: '20px 12px',
  background: selected ? 'color-mix(in srgb, var(--brand-primary, #06b6d4) 8%, transparent)' : '#1e293b',
  border: selected ? '2px solid var(--brand-primary, #06b6d4)' : '2px solid #334155',
  borderRadius: '12px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  minWidth: 0,
});

export const metricCard = (selected: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  background: selected ? 'color-mix(in srgb, var(--brand-primary, #06b6d4) 8%, transparent)' : '#1e293b',
  border: selected ? '2px solid var(--brand-primary, #06b6d4)' : '1px solid #334155',
  borderRadius: '10px',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
});

export const sizeCard = (selected: boolean): React.CSSProperties => ({
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  gap: '8px',
  padding: '16px 12px',
  background: selected ? 'color-mix(in srgb, var(--brand-primary, #06b6d4) 8%, transparent)' : '#1e293b',
  border: selected ? '2px solid var(--brand-primary, #06b6d4)' : '2px solid #334155',
  borderRadius: '10px',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  flex: 1,
  minWidth: 0,
});

export const selectInput: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: '13px',
  outline: 'none',
};

export const textInput: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box' as const,
};

export const fieldLabel: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#94a3b8',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.04em',
  marginBottom: '8px',
  display: 'block',
};

export const categoryBadge = (color: string): React.CSSProperties => ({
  fontSize: '10px',
  fontWeight: 600,
  padding: '2px 8px',
  borderRadius: '10px',
  background: `${color}18`,
  color: color,
  textTransform: 'capitalize' as const,
});

export const searchInput: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px 10px 36px',
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '10px',
  color: '#e2e8f0',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box' as const,
};
