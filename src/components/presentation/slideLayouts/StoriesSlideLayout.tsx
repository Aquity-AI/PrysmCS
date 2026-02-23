import { Quote } from 'lucide-react';
import type { SlideData, PresentationBranding } from '../types';

interface Props {
  slide: SlideData;
  branding: PresentationBranding;
}

export function StoriesSlideLayout({ slide, branding }: Props) {
  const stories = slide.stories || [];
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
        gap: 20,
        justifyContent: 'center',
      }}>
        {stories.map((story) => (
          <div
            key={story.id}
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
              width: 44,
              height: 44,
              borderRadius: 12,
              background: `${brandColor}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {story.initials ? (
                <span style={{ fontSize: 15, fontWeight: 700, color: brandColor }}>{story.initials}</span>
              ) : (
                <Quote size={18} color={brandColor} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{
                fontSize: 16,
                color: 'rgba(255,255,255,0.9)',
                lineHeight: 1.6,
                margin: 0,
                fontStyle: 'italic',
              }}>
                "{story.quote}"
              </p>
              {story.context && (
                <p style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.45)',
                  marginTop: 8,
                  margin: '8px 0 0 0',
                }}>
                  {story.context}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
