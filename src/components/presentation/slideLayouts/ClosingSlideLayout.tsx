import type { SlideData, PresentationBranding } from '../types';

interface Props {
  slide: SlideData;
  branding: PresentationBranding;
}

export function ClosingSlideLayout({ slide, branding }: Props) {
  const brandColor = branding.primaryColor;
  const csmInfo = slide.csmInfo;
  const hasOverlay = (id: string) => slide.overlayElements?.some(e => e.id === id);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      textAlign: 'center',
      padding: '60px',
      position: 'relative',
    }}>
      {!hasOverlay('__title__') && (
        <h1 style={{
          fontSize: 56,
          fontWeight: 700,
          color: '#ffffff',
          marginBottom: 12,
          background: `linear-gradient(135deg, #ffffff 0%, ${brandColor} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          {slide.title}
        </h1>
      )}
      {!hasOverlay('__subtitle__') && (
        <h2 style={{
          fontSize: 22,
          color: 'rgba(255,255,255,0.6)',
          fontWeight: 400,
          marginBottom: 40,
        }}>
          {slide.subtitle}
        </h2>
      )}

      {csmInfo && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 16,
          padding: '20px 32px',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: `linear-gradient(135deg, ${brandColor}, ${branding.accentColor || brandColor})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 700,
            color: '#ffffff',
          }}>
            {csmInfo.name?.split(' ').map(n => n[0]).join('') || '?'}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#ffffff' }}>{csmInfo.name}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{csmInfo.role_type}</div>
            <div style={{ fontSize: 13, color: brandColor }}>{csmInfo.email}</div>
          </div>
        </div>
      )}

      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 200,
        background: `radial-gradient(ellipse at center bottom, ${brandColor}20 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />
    </div>
  );
}
