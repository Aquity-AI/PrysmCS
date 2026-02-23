import type { SlideData, PresentationBranding } from '../types';

interface Props {
  slide: SlideData;
  branding: PresentationBranding;
}

export function TitleSlideLayout({ slide, branding }: Props) {
  const brandColor = branding.primaryColor;
  const hasOverlay = (id: string) => slide.overlayElements?.some(e => e.id === id);

  return (
    <div className="pres-slide-title-layout">
      <div className="pres-title-content">
        {!hasOverlay('__title__') && (
          <h1
            className="pres-main-title"
            style={{
              background: `linear-gradient(135deg, #ffffff 0%, ${brandColor} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {slide.title}
          </h1>
        )}
        {!hasOverlay('__subtitle__') && (
          <h2 className="pres-main-subtitle">{slide.subtitle || slide.companyName}</h2>
        )}
        {!hasOverlay('__meta__') && (
          <p className="pres-main-meta">{slide.meta}</p>
        )}
      </div>
      <div
        className="pres-title-decoration"
        style={{ background: `radial-gradient(circle, ${brandColor}4D 0%, transparent 70%)` }}
      />
    </div>
  );
}
