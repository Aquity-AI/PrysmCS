import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { SlideData, PresentationBranding } from '../types';

interface Props {
  slide: SlideData;
  branding: PresentationBranding;
}

export function PageSummarySlideLayout({ slide, branding }: Props) {
  const ps = slide.pageSummary;
  if (!ps) return null;

  const items = ps.items || [];
  const brandColor = branding.primaryColor;
  const cols = items.length <= 2 ? 2 : items.length <= 4 ? 2 : 3;
  const hasOverlay = (id: string) => slide.overlayElements?.some(e => e.id === id);

  const trendConfig: Record<string, { icon: any; color: string }> = {
    positive: { icon: TrendingUp, color: '#10b981' },
    negative: { icon: TrendingDown, color: '#ef4444' },
    neutral: { icon: Minus, color: 'rgba(255,255,255,0.4)' },
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '48px 56px',
    }}>
      {!hasOverlay('__title__') && (
        <h2 style={{
          fontSize: 28,
          fontWeight: 700,
          color: '#ffffff',
          marginBottom: 8,
        }}>
          {slide.title}
        </h2>
      )}
      {ps.subtitle && (
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 28 }}>
          {ps.subtitle}
        </p>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 16,
        flex: 1,
        alignContent: 'center',
      }}>
        {items.map(item => {
          const trend = trendConfig[item.trend_direction] || trendConfig.neutral;
          const TrendIcon = trend.icon;

          return (
            <div
              key={item.id}
              style={{
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 16,
                padding: '24px 20px',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  {item.label}
                </span>
                <TrendIcon size={16} color={trend.color} />
              </div>
              <div style={{
                fontSize: 28,
                fontWeight: 700,
                color: brandColor,
              }}>
                {item.metric_value}
              </div>
              {item.description_text && (
                <div style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.5)',
                  lineHeight: 1.4,
                }}>
                  {item.description_text}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
