import React from 'react';
import type { ReportSection } from '../useReportData';

interface ReportCardGridProps {
  section: ReportSection;
  formatValue: (field: any, value: any) => string;
  brandColor: string;
}

export function ReportCardGrid({ section, formatValue, brandColor }: ReportCardGridProps) {
  if (!section.fields || section.fields.length === 0) return null;

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

function getSectionEmoji(icon?: string): string {
  const map: Record<string, string> = {
    Heart: '\u{2764}\u{FE0F}',
    Activity: '\u{1F4CA}',
    Target: '\u{1F3AF}',
    TrendingUp: '\u{1F4C8}',
    Star: '\u{2B50}',
  };
  return map[icon || ''] || '\u{2764}\u{FE0F}';
}
