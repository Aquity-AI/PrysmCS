import React from 'react';
import type { ReportCsmInfo } from '../useReportData';

interface ReportCsmFooterProps {
  csmInfo: ReportCsmInfo | null;
  fallbackCsm?: { name: string; email: string; phone: string };
  platformName: string;
}

export function ReportCsmFooter({ csmInfo, fallbackCsm, platformName }: ReportCsmFooterProps) {
  const csm = csmInfo || (fallbackCsm?.name ? fallbackCsm : null);
  if (!csm || !csm.name) return null;

  return (
    <div className="rpt-csm-info">
      <h4>Your {platformName} Team</h4>
      <p><strong>Customer Success Manager:</strong> {csm.name}</p>
      <p className="rpt-contact">{csm.email} &middot; {csm.phone}</p>
    </div>
  );
}
