import type { SlideData, PresentationBranding } from '../types';

interface Props {
  slide: SlideData;
  branding: PresentationBranding;
}

export function PrioritiesSlideLayout({ slide, branding }: Props) {
  const priorities = slide.priorities || [];
  const brandColor = branding.primaryColor;
  const hasOverlay = (id: string) => slide.overlayElements?.some(e => e.id === id);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '48px 56px',
    }}>
      {!hasOverlay('__title__') && (
        <h2 style={{
          fontSize: 32,
          fontWeight: 700,
          color: '#ffffff',
          marginBottom: 32,
        }}>
          {slide.title}
        </h2>
      )}

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        justifyContent: 'center',
      }}>
        {priorities.map((priority, i) => (
          <div
            key={priority.id}
            style={{
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 16,
              padding: '24px 28px',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              gap: 20,
              alignItems: 'flex-start',
            }}
          >
            <div style={{
              flexShrink: 0,
              width: 40,
              height: 40,
              borderRadius: 10,
              background: brandColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 700,
              color: '#ffffff',
            }}>
              {i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{
                fontSize: 18,
                fontWeight: 600,
                color: '#ffffff',
                margin: '0 0 4px 0',
              }}>
                {priority.title}
              </h4>
              {priority.subtitle && (
                <p style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.5)',
                  margin: '0 0 8px 0',
                }}>
                  {priority.subtitle}
                </p>
              )}
              {priority.focus_areas && priority.focus_areas.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {priority.focus_areas.map((area, j) => (
                    <span
                      key={j}
                      style={{
                        fontSize: 12,
                        padding: '3px 10px',
                        borderRadius: 6,
                        background: `${brandColor}20`,
                        color: brandColor,
                        fontWeight: 500,
                      }}
                    >
                      {area}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
