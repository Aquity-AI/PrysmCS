import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ReportPageSummary } from '../useReportData';

interface ReportPageSummaryBlockProps {
  summary: ReportPageSummary;
  brandColor: string;
}

export function ReportPageSummaryBlock({ summary, brandColor }: ReportPageSummaryBlockProps) {
  if (!summary.items || summary.items.length === 0) return null;

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'positive':
        return <TrendingUp size={14} style={{ color: '#10b981' }} />;
      case 'negative':
        return <TrendingDown size={14} style={{ color: '#ef4444' }} />;
      default:
        return <Minus size={14} style={{ color: '#94a3b8' }} />;
    }
  };

  return (
    <div className="rpt-page-summary">
      {summary.title && (
        <h4 className="rpt-subsection-title" style={{ color: brandColor }}>
          {summary.title}
        </h4>
      )}
      <div className="rpt-summary-grid">
        {summary.items.map(item => (
          <div key={item.id} className="rpt-summary-item">
            <div className="rpt-summary-item-top">
              <span className="rpt-summary-value">{item.metric_value}</span>
              {getTrendIcon(item.trend_direction)}
            </div>
            <div className="rpt-summary-label">{item.label}</div>
            {item.description_text && (
              <div className="rpt-summary-desc">{item.description_text}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
