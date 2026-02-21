import type { SlideData, PresentationBranding, OverlayElement } from './types';
import { TitleSlideLayout } from './slideLayouts/TitleSlideLayout';
import { TabTitleSlideLayout } from './slideLayouts/TabTitleSlideLayout';
import { SectionKpiSlideLayout } from './slideLayouts/SectionKpiSlideLayout';
import { SectionTableSlideLayout } from './slideLayouts/SectionTableSlideLayout';
import { SectionCardGridSlideLayout } from './slideLayouts/SectionCardGridSlideLayout';
import { SectionGenericSlideLayout } from './slideLayouts/SectionGenericSlideLayout';
import { GraphSlideLayout } from './slideLayouts/GraphSlideLayout';
import { PageSummarySlideLayout } from './slideLayouts/PageSummarySlideLayout';
import { StoriesSlideLayout } from './slideLayouts/StoriesSlideLayout';
import { PrioritiesSlideLayout } from './slideLayouts/PrioritiesSlideLayout';
import { ClosingSlideLayout } from './slideLayouts/ClosingSlideLayout';
import { CustomSlideLayout } from './slideLayouts/CustomSlideLayout';

interface SlideContentProps {
  slide: SlideData;
  branding: PresentationBranding;
  showOverlays?: boolean;
}

function OverlayRenderer({ elements }: { elements: OverlayElement[] }) {
  if (!elements || elements.length === 0) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
      {elements.map(elem => (
        <div
          key={elem.id}
          style={{
            position: 'absolute',
            left: `${elem.x}px`,
            top: `${elem.y}px`,
            width: elem.type === 'text' ? `${elem.width}px` : 'auto',
            pointerEvents: 'auto',
          }}
        >
          {elem.type === 'text' ? (
            <span style={{
              fontSize: `${elem.fontSize || 18}px`,
              color: elem.color || '#ffffff',
              fontWeight: elem.fontWeight || 'normal',
              whiteSpace: 'pre-wrap',
              display: 'block',
            }}>
              {elem.content}
            </span>
          ) : (
            <img
              src={elem.src}
              alt=""
              style={{
                width: `${elem.width}px`,
                height: `${elem.height || 'auto'}px`,
                objectFit: 'cover',
                borderRadius: 8,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function SlideLayoutRouter({ slide, branding }: { slide: SlideData; branding: PresentationBranding }) {
  switch (slide.type) {
    case 'title':
      return <TitleSlideLayout slide={slide} branding={branding} />;
    case 'tab-title':
      return <TabTitleSlideLayout slide={slide} branding={branding} />;
    case 'section-kpi':
      return <SectionKpiSlideLayout slide={slide} branding={branding} />;
    case 'section-table':
      return <SectionTableSlideLayout slide={slide} branding={branding} />;
    case 'section-cardgrid':
      return <SectionCardGridSlideLayout slide={slide} branding={branding} />;
    case 'section-generic':
      return <SectionGenericSlideLayout slide={slide} branding={branding} />;
    case 'graph':
      return <GraphSlideLayout slide={slide} branding={branding} />;
    case 'page-summary':
      return <PageSummarySlideLayout slide={slide} branding={branding} />;
    case 'stories':
      return <StoriesSlideLayout slide={slide} branding={branding} />;
    case 'priorities':
      return <PrioritiesSlideLayout slide={slide} branding={branding} />;
    case 'closing':
      return <ClosingSlideLayout slide={slide} branding={branding} />;
    case 'custom':
      return <CustomSlideLayout slide={slide} branding={branding} />;
    default:
      return <div style={{ color: 'rgba(255,255,255,0.4)', padding: 40, textAlign: 'center' }}>Unknown slide type</div>;
  }
}

export function SlideContentRenderer({ slide, branding, showOverlays = true }: SlideContentProps) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <SlideLayoutRouter slide={slide} branding={branding} />
      {showOverlays && <OverlayRenderer elements={slide.overlayElements} />}
    </div>
  );
}
