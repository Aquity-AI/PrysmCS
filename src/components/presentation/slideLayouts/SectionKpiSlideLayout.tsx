import type { SlideData, PresentationBranding } from '../types';

interface Props {
  slide: SlideData;
  branding: PresentationBranding;
}

const COLOR_MAP: Record<number, string> = {
  0: '#06b6d4',
  1: '#10b981',
  2: '#f59e0b',
  3: '#ef4444',
  4: '#3b82f6',
  5: '#14b8a6',
};

function formatFieldValue(field: any): string {
  const val = field.value;
  if (val === undefined || val === null) return '0';
  if (field.prefix === '$' || field.fieldType === 'currency') {
    return `$${Number(val || 0).toLocaleString()}`;
  }
  if (field.suffix === '%' || field.fieldType === 'percent') {
    return `${val}%`;
  }
  return typeof val === 'number' ? val.toLocaleString() : String(val || 0);
}

export function SectionKpiSlideLayout({ slide, branding }: Props) {
  const fields = slide.section?.fields || [];
  const brandColor = branding.primaryColor;
  const cols = fields.length <= 3 ? fields.length : fields.length <= 4 ? 2 : 3;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '48px 56px',
    }}>
      <h2 style={{
        fontSize: 32,
        fontWeight: 700,
        color: '#ffffff',
        marginBottom: 8,
        letterSpacing: '-0.01em',
      }}>
        {slide.title}
      </h2>
      {slide.section?.subtitle && (
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 32 }}>
          {slide.section.subtitle}
        </p>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 20,
        flex: 1,
        alignContent: 'center',
      }}>
        {fields.map((field, i) => {
          const accent = i === 0 ? brandColor : COLOR_MAP[i % 6] || brandColor;
          return (
            <div
              key={field.id}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                borderRadius: 16,
                padding: '28px 24px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.6)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                {field.label}
              </div>
              <div style={{
                fontSize: 36,
                fontWeight: 700,
                color: accent,
                lineHeight: 1.1,
              }}>
                {formatFieldValue(field)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
