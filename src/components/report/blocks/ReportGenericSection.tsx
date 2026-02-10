import React from 'react';
import type { ReportSection } from '../useReportData';

interface ReportGenericSectionProps {
  section: ReportSection;
  formatValue: (field: any, value: any) => string;
  brandColor: string;
}

export function ReportGenericSection({ section, formatValue, brandColor }: ReportGenericSectionProps) {
  if (!section.fields || section.fields.length === 0) return null;

  const isCardStyle = section.fields.length <= 6 && section.fields.every(
    (f: any) => f.fieldType === 'number' || f.fieldType === 'currency' || f.fieldType === 'percent' || typeof f.value === 'number'
  );

  if (isCardStyle) {
    return (
      <div className="rpt-section">
        <div className="rpt-section-header">
          <span className="rpt-section-icon" style={{ background: brandColor }}>
            {getSectionEmoji(section.icon)}
          </span>
          <h2>{section.title}</h2>
        </div>
        <div className="rpt-outcomes-grid">
          {section.fields.map((field: any) => (
            <div key={field.id} className="rpt-outcome-card">
              <div className="rpt-outcome-value">{formatValue(field, field.value)}</div>
              <div className="rpt-outcome-label">{field.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rpt-section">
      <div className="rpt-section-header">
        <span className="rpt-section-icon" style={{ background: brandColor }}>
          {getSectionEmoji(section.icon)}
        </span>
        <h2>{section.title}</h2>
      </div>
      <table className="rpt-table">
        <tbody>
          {section.fields.map((field: any) => (
            <tr key={field.id}>
              <td>{field.label}</td>
              <td>{formatValue(field, field.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getSectionEmoji(icon?: string): string {
  const map: Record<string, string> = {
    BarChart2: '\u{1F4CA}',
    Users: '\u{1F465}',
    Heart: '\u{2764}\u{FE0F}',
    DollarSign: '\u{1F4B0}',
    TrendingUp: '\u{1F4C8}',
    MessageSquare: '\u{1F4AC}',
    Lightbulb: '\u{1F4A1}',
    Target: '\u{1F3AF}',
    Activity: '\u{1F4CA}',
    Star: '\u{2B50}',
    Mail: '\u{1F4E7}',
    Smartphone: '\u{1F4F1}',
    FileText: '\u{1F4C4}',
  };
  return map[icon || ''] || '\u{1F4CA}';
}
