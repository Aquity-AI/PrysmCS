import React from 'react';

interface Opportunity {
  title: string;
  description: string;
}

interface ReportOpportunitiesSectionProps {
  opportunities: Opportunity[];
  brandColor: string;
  sectionTitle?: string;
}

export function ReportOpportunitiesSection({
  opportunities,
  brandColor,
  sectionTitle = 'Opportunities & Next Steps',
}: ReportOpportunitiesSectionProps) {
  if (!opportunities || opportunities.length === 0) return null;

  return (
    <div className="rpt-section">
      <div className="rpt-section-header">
        <span className="rpt-section-icon" style={{ background: '#ef4444' }}>
          {'\u{1F4A1}'}
        </span>
        <h2>{sectionTitle}</h2>
      </div>
      {opportunities.map((opp, i) => (
        <div key={i} className="rpt-opportunity-item">
          <div className="rpt-opportunity-number" style={{ background: brandColor }}>
            {i + 1}
          </div>
          <div className="rpt-opportunity-content">
            <h4>{opp.title}</h4>
            <p>{opp.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
