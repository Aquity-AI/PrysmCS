import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

export function useResponsive() {
  const isMobile = useMediaQuery('(max-width: 640px)');
  const isTablet = useMediaQuery('(max-width: 768px)');
  const isDesktop = useMediaQuery('(min-width: 769px)');

  return { isMobile, isTablet, isDesktop };
}

export const getResponsiveGridCols = (mobile: number, tablet: number, desktop: number, isMobile: boolean, isTablet: boolean): string => {
  if (isMobile) return `repeat(${mobile}, 1fr)`;
  if (isTablet) return `repeat(${tablet}, 1fr)`;
  return `repeat(${desktop}, 1fr)`;
};

export const getResponsiveModalWidth = (isMobile: boolean, isTablet: boolean): React.CSSProperties => {
  if (isMobile) return { width: '95vw', maxWidth: '95vw' };
  if (isTablet) return { width: '85vw', maxWidth: '600px' };
  return { width: '600px', maxWidth: '90vw' };
};
