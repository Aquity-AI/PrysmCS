import React from 'react';
import type { ReportStory } from '../useReportData';

interface ReportStoriesSectionProps {
  stories: ReportStory[];
  brandColor: string;
  sectionTitle?: string;
}

export function ReportStoriesSection({ stories, brandColor, sectionTitle = 'Success Stories' }: ReportStoriesSectionProps) {
  if (!stories || stories.length === 0) return null;

  return (
    <div className="rpt-section">
      <div className="rpt-section-header">
        <span className="rpt-section-icon" style={{ background: '#f59e0b' }}>
          {'\u{1F4AC}'}
        </span>
        <h2>{sectionTitle}</h2>
      </div>
      {stories.map((story) => (
        <div key={story.id} className="rpt-story-card" style={{ borderLeftColor: brandColor }}>
          <p>"{story.quote}"</p>
          <div className="rpt-story-attribution">
            &mdash; {story.context || story.initials || ''}
          </div>
        </div>
      ))}
    </div>
  );
}
