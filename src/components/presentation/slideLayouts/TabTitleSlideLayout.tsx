import * as LucideIcons from 'lucide-react';
import type { SlideData, PresentationBranding } from '../types';

interface Props {
  slide: SlideData;
  branding: PresentationBranding;
}

export function TabTitleSlideLayout({ slide, branding }: Props) {
  const brandColor = branding.primaryColor;
  const IconComponent = slide.tabIcon ? (LucideIcons as any)[slide.tabIcon] : null;

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
      {branding.logoUrl && (
        <div style={{ position: 'absolute', top: 32, right: 40, opacity: 0.6 }}>
          <img src={branding.logoUrl} alt="" style={{ maxHeight: 28, maxWidth: 120, objectFit: 'contain' }} />
        </div>
      )}

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

      {slide.subtitle && (
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
