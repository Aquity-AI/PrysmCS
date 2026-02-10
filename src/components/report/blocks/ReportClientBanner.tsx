import React from 'react';

interface ReportClientBannerProps {
  companyName: string;
  address: string;
}

export function ReportClientBanner({ companyName, address }: ReportClientBannerProps) {
  if (!companyName) return null;

  return (
    <div className="rpt-client-banner">
      <h3>{companyName}</h3>
      {address && <p>{address}</p>}
    </div>
  );
}
