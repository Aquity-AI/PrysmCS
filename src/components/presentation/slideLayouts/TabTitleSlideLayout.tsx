import * as LucideIcons from 'lucide-react';
import type { SlideData, PresentationBranding } from '../types';

interface Props {
  slide: SlideData;
  branding: PresentationBranding;
}

export function TabTitleSlideLayout({ slide, branding }: Props) {
  const brandColor = branding.primaryColor;
  const IconComponent = slide.tabIcon ? (LucideIcons as any)[slide.tabIcon] : null;
  const hasOverlay = (id: string) => slide.overlayElements?.some(e => e.id === id);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: '60px',
      textAlign: 'center',
      position: 'relative',
    }}>
      {IconComponent && (
        <div style={{
          width: 72,
          height: 72,
          borderRadius: 18,
          background: `${brandColor}25`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 28,
        }}>
          <IconComponent size={36} color={brandColor} />
        </div>
      )}

      <div style={{
        width: 64,
        height: 3,
        borderRadius: 2,
        background: brandColor,
        marginBottom: 28,
        opacity: 0.8,
      }} />

      {!hasOverlay('__title__') && (
        <h1 style={{
          fontSize: 52,
          fontWeight: 700,
          color: '#ffffff',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          margin: 0,
        }}>
          {slide.title}
        </h1>
      )}

      {!hasOverlay('__subtitle__') && slide.subtitle && (
        <p style={{
          fontSize: 20,
          color: 'rgba(255, 255, 255, 0.6)',
          marginTop: 16,
          fontWeight: 400,
        }}>
          {slide.subtitle}
        </p>
      )}
    </div>
  );
}
