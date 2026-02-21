import type { SlideData, PresentationBranding } from '../types';

interface Props {
  slide: SlideData;
  branding: PresentationBranding;
}

export function CustomSlideLayout(_props: Props) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
    }} />
  );
}
