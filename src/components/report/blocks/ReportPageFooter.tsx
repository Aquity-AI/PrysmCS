import React from 'react';

interface ReportPageFooterProps {
  platformName: string;
  platformTagline: string;
}

export function ReportPageFooter({ platformName, platformTagline }: ReportPageFooterProps) {
  return (
    <footer className="rpt-footer">
      <div><strong>{platformName}</strong>{platformTagline ? ` \u00B7 ${platformTagline}` : ''}</div>
      <div>Confidential</div>
    </footer>
  );
}
