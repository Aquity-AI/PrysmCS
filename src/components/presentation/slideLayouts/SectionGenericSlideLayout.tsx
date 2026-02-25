import type { SlideData, PresentationBranding } from '../types';

interface Props {
  slide: SlideData;
  branding: PresentationBranding;
}

function formatFieldValue(field: any): string {
  const val = field.value;
  if (val === undefined || val === null || val === '') return '-';
  if (field.prefix === '$' || field.fieldType === 'currency') {
    return `$${Number(val || 0).toLocaleString()}`;
  }
  if (field.suffix === '%' || field.fieldType === 'percent') {
    return `${val}%`;
  }
  if (field.fieldType === 'toggle') {
    return val ? 'Yes' : 'No';
  }
  if (typeof val === 'number') return val.toLocaleString();
  return String(val);
}

export function SectionGenericSlideLayout({ slide, branding }: Props) {
  const fields = slide.section?.fields || [];
  const brandColor = branding.primaryColor;

  const textFields = fields.filter(f =>
    f.fieldType === 'text' || f.fieldType === 'textarea' || f.fieldType === 'select'
  );
  const numericFields = fields.filter(f =>
    f.fieldType !== 'text' && f.fieldType !== 'textarea' && f.fieldType !== 'select'
  );

  const cols = numericFields.length <= 3 ? numericFields.length || 1 : numericFields.length <= 6 ? 3 : 4;
  const hasOverlay = (id: string) => slide.overlayElements?.some(e => e.id === id);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '48px 56px',
    }}>
      {hasOverlay('__title__') ? (
        <div style={{ height: slide.section?.subtitle && hasOverlay('__subtitle__') ? 72 : 48 }} />
      ) : (
        <h2 style={{
          fontSize: 32,
          fontWeight: 700,
          color: '#ffffff',
          marginBottom: 8,
        }}>
          {slide.title}
        </h2>
      )}
      {!hasOverlay('__subtitle__') && slide.section?.subtitle && (
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 28 }}>
          {slide.section.subtitle}
        </p>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24 }}>
        {numericFields.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 16,
          }}>
            {numericFields.map((field, i) => (
              <div
                key={field.id}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: 12,
                  padding: '20px',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 6,
                }}>
                  {field.label}
                </div>
                <div style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: i === 0 ? brandColor : '#ffffff',
                }}>
                  {formatFieldValue(field)}
                </div>
              </div>
            ))}
          </div>
        )}

        {textFields.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {textFields.map(field => (
              <div
                key={field.id}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 12,
                  padding: '16px 20px',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 6,
                }}>
                  {field.label}
                </div>
                <div style={{
                  fontSize: 16,
                  color: 'rgba(255,255,255,0.85)',
                  lineHeight: 1.5,
                }}>
                  {formatFieldValue(field)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
