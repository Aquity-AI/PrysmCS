export function getGridColumnSpan(widthUnits: number): string {
  return `span ${Math.max(1, Math.min(12, widthUnits))} / span ${Math.max(1, Math.min(12, widthUnits))}`;
}

export function getGridContainerStyle(): React.CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap: '20px',
    width: '100%',
  };
}

export function getGridItemStyle(widthUnits: number): React.CSSProperties {
  return {
    gridColumn: getGridColumnSpan(widthUnits),
    minWidth: 0,
  };
}

export const GRID_BREAKPOINTS = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
};

export function getResponsiveGridStyle(): string {
  return `
    @media (max-width: ${GRID_BREAKPOINTS.tablet}px) {
      .grid-container {
        grid-template-columns: repeat(6, 1fr) !important;
      }
      .grid-item[data-width="12"],
      .grid-item[data-width="11"],
      .grid-item[data-width="10"],
      .grid-item[data-width="9"],
      .grid-item[data-width="8"],
      .grid-item[data-width="7"] {
        grid-column: span 6 / span 6 !important;
      }
    }

    @media (max-width: ${GRID_BREAKPOINTS.mobile}px) {
      .grid-container {
        grid-template-columns: 1fr !important;
      }
      .grid-item {
        grid-column: span 1 / span 1 !important;
      }
    }
  `;
}
