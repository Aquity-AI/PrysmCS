import React, { useState, useMemo } from 'react';
import { Info, Monitor, Tablet, Smartphone, AlertTriangle, Layers } from 'lucide-react';
import { calculateSectionLayout, type FieldLayoutInfo } from './utils/gridUtils';

interface WidthOption {
  value: number;
  label: string;
  description: string;
  perRow: string;
}

const WIDTH_OPTIONS: WidthOption[] = [
  {
    value: 3,
    label: 'Compact',
    description: 'Small section, ideal for single metrics or KPIs',
    perRow: '4 sections per row on desktop',
  },
  {
    value: 4,
    label: 'Small',
    description: 'Balanced size for metric cards',
    perRow: '3 sections per row on desktop',
  },
  {
    value: 6,
    label: 'Medium',
    description: 'Standard size for most content',
    perRow: '2 sections per row on desktop',
  },
  {
    value: 8,
    label: 'Large',
    description: 'Spacious layout for detailed data',
    perRow: '1-2 sections per row on desktop',
  },
  {
    value: 12,
    label: 'Full Width',
    description: 'Spans the entire dashboard width',
    perRow: '1 section per row',
  },
];

interface WidthSelectorProps {
  value: number;
  onChange: (width: number) => void;
  sectionType?: 'chart' | 'summary' | 'generic' | 'time_series_chart' | 'page_summary';
  showAdvanced?: boolean;
  fields?: FieldLayoutInfo[];
}

export const WidthSelector: React.FC<WidthSelectorProps> = ({
  value,
  onChange,
  sectionType = 'generic',
  showAdvanced = false,
  fields,
}) => {
  const [hoveredWidth, setHoveredWidth] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const displayWidth = hoveredWidth !== null ? hoveredWidth : value;

  const isChartType = sectionType === 'chart' || sectionType === 'time_series_chart' || sectionType === 'page_summary';
  const minChartWidth = 6;

  const visibleFields = useMemo(() => {
    if (!fields || fields.length === 0) return [];
    return fields.filter(f => f.widthUnits > 0);
  }, [fields]);

  const hasFields = visibleFields.length > 0;

  const layoutForWidth = useMemo(() => {
    if (!hasFields) return null;
    return calculateSectionLayout(displayWidth, visibleFields);
  }, [displayWidth, visibleFields, hasFields]);

  const recommendedWidth = useMemo(() => {
    if (isChartType) return 12;
    if (!hasFields) return 12;
    const layout = calculateSectionLayout(12, visibleFields);
    if (layout.totalRows === 1) return layout.minSingleRowWidth;
    return 12;
  }, [isChartType, hasFields, visibleFields]);

  const getLayoutForOption = (optionWidth: number) => {
    if (!hasFields) return null;
    return calculateSectionLayout(optionWidth, visibleFields);
  };

  const renderContentPreview = (sectionWidth: number) => {
    if (!hasFields || !layoutForWidth) return null;

    const layout = calculateSectionLayout(sectionWidth, visibleFields);
    const maxCols = sectionWidth;

    const rows: { col: number; width: number; label?: string }[][] = [];
    layout.fieldPlacements.forEach((placement, idx) => {
      if (!rows[placement.row]) rows[placement.row] = [];
      rows[placement.row].push({
        col: placement.col,
        width: placement.width,
        label: visibleFields[idx]?.label,
      });
    });

    return (
      <div style={{ marginTop: '8px' }}>
        <div
          style={{
            background: 'white',
            border: '2px solid var(--brand-primary, #0ea5e9)',
            borderRadius: '8px',
            padding: '10px',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-9px',
              left: '12px',
              background: 'var(--brand-primary, #0ea5e9)',
              color: 'white',
              fontSize: '9px',
              fontWeight: 700,
              padding: '1px 8px',
              borderRadius: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Inside Section
          </div>
          {rows.map((row, rowIdx) => (
            <div
              key={rowIdx}
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${maxCols}, 1fr)`,
                gap: '4px',
                marginBottom: rowIdx < rows.length - 1 ? '4px' : '0',
              }}
            >
              {row.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  style={{
                    gridColumn: `span ${item.width}`,
                    height: '28px',
                    background: 'linear-gradient(135deg, var(--brand-primary, #0ea5e9) 0%, var(--brand-secondary, #38bdf8) 100%)',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <span
                    style={{
                      fontSize: '8px',
                      fontWeight: 600,
                      color: 'white',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      padding: '0 4px',
                      opacity: 0.9,
                    }}
                  >
                    {item.label || 'Card'}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: '6px',
            fontSize: '11px',
            color: layout.willStack ? 'var(--amber-600, #d97706)' : 'var(--slate-500)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {layout.willStack && <Layers size={12} />}
          <span>
            {visibleFields.length} card{visibleFields.length !== 1 ? 's' : ''} --{' '}
            {layout.totalRows === 1
              ? '1 row'
              : `${layout.totalRows} rows${layout.willStack ? ' (stacked)' : ''}`}
          </span>
        </div>
      </div>
    );
  };

  const renderGridPreview = (width: number) => {
    const segments: { width: number; isActive: boolean; row: number }[] = [];
    let remaining = 12;
    let currentRow = 0;
    let positionInRow = 0;

    segments.push({ width, isActive: true, row: currentRow });
    remaining -= width;
    positionInRow += width;

    while (remaining > 0 || segments.length < 4) {
      if (positionInRow >= 12) {
        currentRow++;
        positionInRow = 0;
        remaining = 12;
      }
      const placeholderWidth = Math.min(remaining, 6);
      if (placeholderWidth > 0) {
        segments.push({ width: placeholderWidth, isActive: false, row: currentRow });
        positionInRow += placeholderWidth;
        remaining -= placeholderWidth;
      }
      if (segments.length >= 8) break;
    }

    const rows: (typeof segments[number])[][] = [];
    segments.forEach((seg) => {
      if (!rows[seg.row]) rows[seg.row] = [];
      rows[seg.row].push(seg);
    });

    return (
      <div style={{ marginTop: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Monitor size={14} style={{ color: 'var(--slate-500)' }} />
          <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--slate-600)' }}>
            Layout Preview
          </span>
        </div>
        <div
          style={{
            background: 'var(--slate-50)',
            border: '1px solid var(--slate-200)',
            borderRadius: '8px',
            padding: '16px',
          }}
        >
          {rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(12, 1fr)',
                gap: '8px',
                marginBottom: rowIndex < rows.length - 1 ? '8px' : '0',
              }}
            >
              {row.map((segment, segIndex) => (
                <div
                  key={`${rowIndex}-${segIndex}`}
                  style={{
                    gridColumn: `span ${segment.width}`,
                    minHeight: segment.isActive && hasFields ? 'auto' : '60px',
                    background: segment.isActive
                      ? 'linear-gradient(135deg, rgba(14,165,233,0.08) 0%, rgba(14,165,233,0.04) 100%)'
                      : 'var(--slate-200)',
                    borderRadius: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: segment.isActive ? 'stretch' : 'center',
                    justifyContent: 'center',
                    color: segment.isActive ? 'var(--slate-700)' : 'var(--slate-400)',
                    fontSize: '11px',
                    fontWeight: 600,
                    border: segment.isActive ? '2px solid var(--brand-primary, #0ea5e9)' : 'none',
                    boxShadow: segment.isActive ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.2s ease',
                    padding: segment.isActive ? '8px' : '0',
                  }}
                >
                  {segment.isActive ? (
                    hasFields ? (
                      <>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          color: 'var(--slate-500)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '4px',
                        }}>
                          Your Section
                        </span>
                        {renderContentPreview(width)}
                      </>
                    ) : (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '60px',
                        color: 'var(--brand-primary, #0ea5e9)',
                      }}>
                        Your Section
                      </span>
                    )
                  ) : (
                    'Other'
                  )}
                </div>
              ))}
            </div>
          ))}
          <div
            style={{
              marginTop: '12px',
              padding: '8px 12px',
              background: 'white',
              borderRadius: '6px',
              fontSize: '12px',
              color: 'var(--slate-600)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Info size={14} style={{ color: 'var(--brand-primary, #0ea5e9)', flexShrink: 0 }} />
            <span>
              {WIDTH_OPTIONS.find((opt) => opt.value === displayWidth)?.perRow || 'Custom layout'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <label
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--slate-700)',
            margin: 0,
          }}
        >
          Section Width
        </label>
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            color: 'var(--slate-400)',
          }}
          title="Learn about section widths"
        >
          <Info size={16} />
        </button>
      </div>

      <p
        style={{
          fontSize: '12px',
          color: 'var(--slate-500)',
          margin: '0 0 12px 0',
          lineHeight: '1.5',
        }}
      >
        Choose how much horizontal space this section takes on your dashboard
      </p>

      {showHelp && (
        <div
          style={{
            background: 'var(--blue-50)',
            border: '1px solid var(--blue-200)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '12px',
            fontSize: '12px',
            color: 'var(--slate-700)',
            lineHeight: '1.6',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--blue-900)' }}>
            How Dashboard Layout Works
          </div>
          <p style={{ margin: '0 0 8px 0' }}>
            Your dashboard uses a 12-column grid system. Sections can be sized from 1-12 columns
            wide, and multiple sections automatically arrange themselves side-by-side when they fit.
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <div style={{ flex: 1 }}>
              <Monitor size={14} style={{ marginBottom: '4px' }} />
              <div style={{ fontSize: '11px', color: 'var(--slate-600)' }}>Desktop</div>
              <div style={{ fontSize: '10px', color: 'var(--slate-500)' }}>Full grid layout</div>
            </div>
            <div style={{ flex: 1 }}>
              <Tablet size={14} style={{ marginBottom: '4px' }} />
              <div style={{ fontSize: '11px', color: 'var(--slate-600)' }}>Tablet</div>
              <div style={{ fontSize: '10px', color: 'var(--slate-500)' }}>Adapts for screen</div>
            </div>
            <div style={{ flex: 1 }}>
              <Smartphone size={14} style={{ marginBottom: '4px' }} />
              <div style={{ fontSize: '11px', color: 'var(--slate-600)' }}>Mobile</div>
              <div style={{ fontSize: '10px', color: 'var(--slate-500)' }}>Always full width</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {WIDTH_OPTIONS.map((option) => {
          const isSelected = value === option.value;
          const isHovered = hoveredWidth === option.value;
          const isRecommended = option.value === recommendedWidth;
          const isDisabled = isChartType && option.value < minChartWidth;
          const optionLayout = hasFields ? getLayoutForOption(option.value) : null;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                if (!isDisabled) onChange(option.value);
              }}
              onMouseEnter={() => {
                if (!isDisabled) setHoveredWidth(option.value);
              }}
              onMouseLeave={() => setHoveredWidth(null)}
              style={{
                position: 'relative',
                padding: '10px 16px',
                background: isDisabled
                  ? 'var(--slate-50)'
                  : isSelected
                  ? 'var(--brand-primary, #0ea5e9)'
                  : isHovered
                  ? 'var(--slate-100)'
                  : 'white',
                color: isDisabled
                  ? 'var(--slate-300)'
                  : isSelected
                  ? 'white'
                  : 'var(--slate-700)',
                border: `2px solid ${
                  isDisabled
                    ? 'var(--slate-150, #e9ecef)'
                    : isSelected
                    ? 'var(--brand-primary, #0ea5e9)'
                    : isHovered
                    ? 'var(--slate-300)'
                    : 'var(--slate-200)'
                }`,
                borderRadius: '8px',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                minWidth: '120px',
                boxShadow: isHovered && !isDisabled ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                opacity: isDisabled ? 0.6 : 1,
              }}
            >
              {isRecommended && !isDisabled && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    background: 'var(--green-500, #22c55e)',
                    color: 'white',
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Recommended
                </span>
              )}
              <span style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>
                {option.label}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  opacity: isSelected ? 0.9 : 0.6,
                  fontWeight: 500,
                }}
              >
                {option.perRow}
              </span>
              {isDisabled && (
                <span
                  style={{
                    fontSize: '9px',
                    color: 'var(--slate-400)',
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  <AlertTriangle size={10} />
                  Requires Medium+
                </span>
              )}
              {!isDisabled && optionLayout && optionLayout.willStack && (
                <span
                  style={{
                    fontSize: '9px',
                    color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--amber-600, #d97706)',
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  <Layers size={10} />
                  {optionLayout.totalRows} rows
                </span>
              )}
            </button>
          );
        })}
      </div>

      {renderGridPreview(displayWidth)}

      <div
        style={{
          padding: '10px 12px',
          background: 'var(--slate-50)',
          borderRadius: '6px',
          border: '1px solid var(--slate-200)',
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--slate-700)', marginBottom: '4px' }}>
          {WIDTH_OPTIONS.find((opt) => opt.value === displayWidth)?.label || 'Custom'}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--slate-600)', lineHeight: '1.5' }}>
          {WIDTH_OPTIONS.find((opt) => opt.value === displayWidth)?.description ||
            'Custom width configuration'}
        </div>
      </div>

      {showAdvanced && (
        <div style={{ marginTop: '16px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--slate-600)',
              marginBottom: '6px',
            }}
          >
            Custom Width (Advanced)
          </label>
          <input
            type="number"
            value={value}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 12;
              const min = isChartType ? minChartWidth : 1;
              onChange(Math.max(min, Math.min(12, val)));
            }}
            min={isChartType ? minChartWidth : 1}
            max="12"
            step="1"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid var(--slate-300)',
              borderRadius: '6px',
              fontSize: '14px',
              color: 'var(--slate-700)',
            }}
          />
          <p style={{ fontSize: '11px', color: 'var(--slate-500)', margin: '4px 0 0 0' }}>
            Enter a value between {isChartType ? minChartWidth : 1} and 12 columns
          </p>
        </div>
      )}
    </div>
  );
};
