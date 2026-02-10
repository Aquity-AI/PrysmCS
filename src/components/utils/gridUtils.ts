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

export interface FieldLayoutInfo {
  id: string;
  widthUnits: number;
  label?: string;
}

export interface SectionLayoutResult {
  totalRows: number;
  fieldsPerRow: number[];
  willStack: boolean;
  minSingleRowWidth: number;
  fieldPlacements: { row: number; col: number; width: number }[];
}

export function calculateSectionLayout(
  sectionWidthUnits: number,
  fields: FieldLayoutInfo[]
): SectionLayoutResult {
  const sectionWidth = Math.max(1, Math.min(12, sectionWidthUnits));
  const visibleFields = fields.filter(f => f.widthUnits > 0);

  if (visibleFields.length === 0) {
    return { totalRows: 0, fieldsPerRow: [], willStack: false, minSingleRowWidth: 0, fieldPlacements: [] };
  }

  const fieldPlacements: { row: number; col: number; width: number }[] = [];
  const fieldsPerRow: number[] = [];
  let currentRow = 0;
  let usedInRow = 0;

  for (const field of visibleFields) {
    const fieldWidth = Math.min(field.widthUnits || 3, sectionWidth);

    if (usedInRow + fieldWidth > sectionWidth) {
      currentRow++;
      usedInRow = 0;
    }

    fieldPlacements.push({ row: currentRow, col: usedInRow, width: fieldWidth });
    usedInRow += fieldWidth;

    if (!fieldsPerRow[currentRow]) fieldsPerRow[currentRow] = 0;
    fieldsPerRow[currentRow]++;
  }

  const totalRows = currentRow + 1;
  const totalFieldWidth = visibleFields.reduce((sum, f) => sum + (f.widthUnits || 3), 0);
  const minSingleRowWidth = Math.min(12, totalFieldWidth);

  const willStack = sectionWidth < 12
    ? totalRows > calculateSectionLayout(12, fields).totalRows
    : false;

  return { totalRows, fieldsPerRow, willStack, minSingleRowWidth, fieldPlacements };
}

export function clampFieldWidths(
  sectionWidthUnits: number,
  fields: FieldLayoutInfo[]
): { id: string; newWidth: number }[] {
  const clamped: { id: string; newWidth: number }[] = [];
  for (const field of fields) {
    if (field.widthUnits > sectionWidthUnits) {
      clamped.push({ id: field.id, newWidth: sectionWidthUnits });
    }
  }
  return clamped;
}

export function getFieldWidthAnnotation(
  fieldWidthUnits: number,
  sectionWidthUnits: number
): string | null {
  if (fieldWidthUnits >= sectionWidthUnits) {
    return '(full section)';
  }
  return null;
}
