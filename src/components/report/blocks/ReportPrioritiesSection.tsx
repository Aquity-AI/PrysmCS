import React from 'react';
import type { ReportPriority } from '../useReportData';

interface ReportPrioritiesSectionProps {
  priorities: ReportPriority[];
  brandColor: string;
  sectionTitle?: string;
}

export function ReportPrioritiesSection({
  priorities,
  brandColor,
  sectionTitle = 'Strategic Priorities',
}: ReportPrioritiesSectionProps) {
  if (!priorities || priorities.length === 0) return null;

  return (
    <div className="rpt-section">
      <div className="rpt-section-header">
        <span className="rpt-section-icon" style={{ background: brandColor }}>
          {'\u{1F4A1}'}
        </span>
        <h2>{sectionTitle}</h2>
      </div>
      <div className="rpt-priorities-list">
        {priorities.map((priority, i) => (
          <div key={priority.id} className="rpt-priority-item">
            <div className="rpt-priority-number" style={{ background: brandColor }}>
              {i + 1}
            </div>
            <div className="rpt-priority-content">
              <h4>{priority.title}</h4>
              {priority.subtitle && <p className="rpt-priority-subtitle">{priority.subtitle}</p>}
              {priority.focus_areas && priority.focus_areas.length > 0 && (
                <ul className="rpt-priority-focus">
                  {priority.focus_areas.map((area, j) => (
                    <li key={j}>{area}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
