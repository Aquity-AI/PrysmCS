import React from 'react';
import { Pencil, Trash2, ChevronUp, ChevronDown, TrendingUp, TrendingDown, Minus, Eye, EyeOff } from 'lucide-react';

interface PageSummaryItem {
  id: string;
  label: string;
  metric_value: string;
  trend_direction: 'positive' | 'negative' | 'neutral';
  description_text: string;
  is_visible: boolean;
  is_ai_generated: boolean;
}

interface PageSummaryItemCardProps {
  item: PageSummaryItem;
  index: number;
  totalItems: number;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function PageSummaryItemCard({
  item,
  index,
  totalItems,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: PageSummaryItemCardProps) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'positive':
        return <TrendingUp size={20} />;
      case 'negative':
        return <TrendingDown size={20} />;
      case 'neutral':
        return <Minus size={20} />;
      default:
        return null;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'positive':
        return 'var(--green-600)';
      case 'negative':
        return 'var(--red-600)';
      case 'neutral':
        return 'var(--slate-500)';
      default:
        return 'var(--slate-500)';
    }
  };

  const getTrendBgColor = (trend: string) => {
    switch (trend) {
      case 'positive':
        return 'var(--green-50)';
      case 'negative':
        return 'var(--red-50)';
      case 'neutral':
        return 'var(--slate-50)';
      default:
        return 'var(--slate-50)';
    }
  };

  return (
    <div
      style={{
        padding: '16px',
        background: 'white',
        border: '1px solid var(--slate-200)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
        transition: 'all 0.2s',
        opacity: item.is_visible ? 1 : 0.6,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          background: 'var(--brand-primary)',
          color: 'white',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {index + 1}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <h5
                style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--slate-800)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.label}
              </h5>
              {!item.is_visible && (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    color: 'var(--slate-500)',
                    background: 'var(--slate-100)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  <EyeOff size={12} /> Hidden
                </span>
              )}
              {item.is_ai_generated && (
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--purple-600)',
                    background: 'var(--purple-50)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 500,
                  }}
                >
                  AI
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: getTrendBgColor(item.trend_direction),
                  borderRadius: '6px',
                }}
              >
                <span style={{ color: getTrendColor(item.trend_direction) }}>
                  {getTrendIcon(item.trend_direction)}
                </span>
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: getTrendColor(item.trend_direction),
                  }}
                >
                  {item.metric_value}
                </span>
              </div>
            </div>

            {item.description_text && (
              <p
                style={{
                  margin: 0,
                  fontSize: '13px',
                  color: 'var(--slate-600)',
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {item.description_text}
              </p>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '4px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            title="Move up"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              padding: 0,
              background: index === 0 ? 'var(--slate-100)' : 'var(--slate-200)',
              color: index === 0 ? 'var(--slate-400)' : 'var(--slate-600)',
              border: 'none',
              borderRadius: '4px',
              cursor: index === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <ChevronUp size={16} />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === totalItems - 1}
            title="Move down"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              padding: 0,
              background: index === totalItems - 1 ? 'var(--slate-100)' : 'var(--slate-200)',
              color: index === totalItems - 1 ? 'var(--slate-400)' : 'var(--slate-600)',
              border: 'none',
              borderRadius: '4px',
              cursor: index === totalItems - 1 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <ChevronDown size={16} />
          </button>
        </div>

        <button
          onClick={onEdit}
          title="Edit item"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            padding: 0,
            background: 'var(--blue-50)',
            color: 'var(--blue-600)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <Pencil size={16} />
        </button>

        <button
          onClick={onDelete}
          title="Delete item"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            padding: 0,
            background: 'var(--red-50)',
            color: 'var(--red-600)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
