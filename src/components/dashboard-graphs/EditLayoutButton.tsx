import React, { useState, useEffect } from 'react';
import { Pencil, Check, X, Undo2 } from 'lucide-react';
import { useEditLayout } from './EditLayoutContext';

interface EditLayoutButtonProps {
  activePage?: string;
  dashboardTabIds?: string[];
  brandColor?: string;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function EditLayoutButton({ activePage, dashboardTabIds = [], brandColor = '#06b6d4' }: EditLayoutButtonProps) {
  const { isEditing, toggleEditing, saveEditing, cancelEditing, undoLastAction, canUndo, hasPendingChanges } = useEditLayout();
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setShowCancelConfirm(false);
    }
  }, [isEditing]);

  const handleCancel = () => {
    if (hasPendingChanges) {
      setShowCancelConfirm(true);
    } else {
      cancelEditing();
    }
  };

  const isOnDashboardTab = !activePage || dashboardTabIds.length === 0 || dashboardTabIds.includes(activePage);

  if (!isOnDashboardTab && !isEditing) {
    return null;
  }

  if (!isEditing) {
    return (
      <button
        onClick={toggleEditing}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title="Edit Layout"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '36px',
          padding: isHovered ? '0 14px 0 10px' : '0 10px',
          gap: '6px',
          background: isHovered
            ? brandColor
            : hexToRgba(brandColor, 0.12),
          color: isHovered ? '#ffffff' : brandColor,
          border: `1px solid ${isHovered ? brandColor : hexToRgba(brandColor, 0.25)}`,
          borderRadius: '10px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 500,
          boxShadow: isHovered
            ? `0 4px 16px ${hexToRgba(brandColor, 0.35)}`
            : 'none',
          transition: 'all 0.2s ease',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        <Pencil size={14} style={{ flexShrink: 0 }} />
        {isHovered && <span>Edit Layout</span>}
      </button>
    );
  }

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid #334155',
          borderRadius: '14px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35), 0 4px 16px rgba(0, 0, 0, 0.2)',
        }}
      >
        <button
          onClick={undoLastAction}
          disabled={!canUndo}
          onMouseEnter={() => setHoveredBtn('undo')}
          onMouseLeave={() => setHoveredBtn(null)}
          title="Undo (Ctrl+Z)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            background: hoveredBtn === 'undo' && canUndo ? 'rgba(148, 163, 184, 0.2)' : 'transparent',
            color: canUndo ? '#cbd5e1' : '#475569',
            border: 'none',
            borderRadius: '9px',
            cursor: canUndo ? 'pointer' : 'default',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'all 0.15s ease',
            opacity: canUndo ? 1 : 0.5,
          }}
        >
          <Undo2 size={14} />
          Undo
        </button>

        <div style={{ width: '1px', height: '20px', background: '#334155' }} />

        <button
          onClick={handleCancel}
          onMouseEnter={() => setHoveredBtn('cancel')}
          onMouseLeave={() => setHoveredBtn(null)}
          title="Cancel changes"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            background: hoveredBtn === 'cancel' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
            color: hoveredBtn === 'cancel' ? '#fca5a5' : '#94a3b8',
            border: 'none',
            borderRadius: '9px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'all 0.15s ease',
          }}
        >
          <X size={14} />
          Cancel
        </button>

        <button
          onClick={saveEditing}
          onMouseEnter={() => setHoveredBtn('save')}
          onMouseLeave={() => setHoveredBtn(null)}
          title="Save changes"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            background: hoveredBtn === 'save'
              ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            border: '1px solid #34d399',
            borderRadius: '9px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            transition: 'all 0.15s ease',
            boxShadow: hoveredBtn === 'save'
              ? '0 4px 12px rgba(16, 185, 129, 0.4)'
              : '0 2px 8px rgba(16, 185, 129, 0.25)',
          }}
        >
          <Check size={14} />
          Save
        </button>
      </div>

      {showCancelConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowCancelConfirm(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '420px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: '#fef2f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <X size={20} style={{ color: '#ef4444' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
                    Discard Changes?
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                    You have unsaved layout changes.
                  </p>
                </div>
              </div>
              <p style={{ fontSize: '14px', color: '#475569', marginBottom: '24px', lineHeight: '1.5' }}>
                Are you sure you want to discard your changes? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    background: 'white',
                    color: '#475569',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Keep Editing
                </button>
                <button
                  onClick={() => {
                    setShowCancelConfirm(false);
                    cancelEditing();
                  }}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Discard Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
