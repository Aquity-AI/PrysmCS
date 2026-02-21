import type { SlideData, PresentationBranding } from '../types';

interface Props {
  slide: SlideData;
  branding: PresentationBranding;
}

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

export function SectionTableSlideLayout({ slide, branding }: Props) {
  const fields = slide.section?.fields || [];
  const brandColor = branding.primaryColor;

  const numericFields = fields.filter(f =>
    f.fieldType !== 'text' && f.fieldType !== 'textarea' && f.fieldType !== 'select'
  );
  const firstValue = numericFields.length > 0 ? Number((numericFields[0] as any).value || 0) : 1;

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
      }}>
        {slide.title}
      </h2>
      {slide.section?.subtitle && (
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 32 }}>
          {slide.section.subtitle}
        </p>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          {fields.map((field, i) => {
            const val = Number((field as any).value || 0);
            const barWidth = firstValue > 0 ? Math.min((val / firstValue) * 100, 100) : 0;

            return (
              <div
                key={field.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '18px 24px',
                  borderBottom: i < fields.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  gap: 16,
                }}
              >
                <div style={{
                  flex: '0 0 200px',
                  fontSize: 15,
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.8)',
                }}>
                  {field.label}
                </div>
                <div style={{ flex: 1, position: 'relative', height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.06)' }}>
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: `${barWidth}%`,
                    borderRadius: 6,
                    background: `${brandColor}60`,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
                <div style={{
                  flex: '0 0 100px',
                  textAlign: 'right',
                  fontSize: 18,
                  fontWeight: 700,
                  color: brandColor,
                }}>
                  {formatFieldValue(field)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
