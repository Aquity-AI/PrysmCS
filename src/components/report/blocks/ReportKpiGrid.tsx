import React from 'react';
import type { ReportSection } from '../useReportData';

interface ReportKpiGridProps {
  section: ReportSection;
  deltas?: Record<string, string | null>;
  formatValue: (field: any, value: any) => string;
  brandColor: string;
}

export function ReportKpiGrid({ section, deltas = {}, formatValue, brandColor }: ReportKpiGridProps) {
  if (!section.fields || section.fields.length === 0) return null;

  return (
    <div className="rpt-section">
      <div className="rpt-section-header">
        <span className="rpt-section-icon" style={{ background: brandColor }}>
          {getSectionEmoji(section.icon)}
        </span>
        <h2>{section.title}</h2>
      </div>
      <div className="rpt-kpi-grid">
        {section.fields.map((field: any) => {
          const delta = deltas[field.id];
          return (
            <div key={field.id} className="rpt-kpi-card">
              <div className="rpt-kpi-value">{formatValue(field, field.value)}</div>
              <div className="rpt-kpi-label">{field.label}</div>
              {delta && (
                <span className={`rpt-kpi-delta ${delta.startsWith('+') ? 'positive' : 'negative'}`}>
                  {delta} vs last month
                </span>
              )}
            </div>
          );
        })}
      </div>
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
  };
  return map[icon || ''] || '\u{1F4CA}';
}
