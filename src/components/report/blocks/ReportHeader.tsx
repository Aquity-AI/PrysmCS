import React from 'react';
import { Shield } from 'lucide-react';

interface ReportHeaderProps {
  platformName: string;
  platformTagline: string;
  logoUrl: string | null;
  logoMode: string;
  brandColor: string;
  fontFamily: string;
  reportTitle: string;
  monthLabel: string;
  generatedDate: string;
}

export function ReportHeader({
  platformName,
  platformTagline,
  logoUrl,
  logoMode,
  brandColor,
  fontFamily,
  reportTitle,
  monthLabel,
  generatedDate,
}: ReportHeaderProps) {
  const renderLogo = () => {
    if (logoMode === 'full-image' && logoUrl) {
      return (
        <img
          src={logoUrl}
          alt={platformName}
          style={{ maxHeight: 40, maxWidth: 180, objectFit: 'contain' }}
        />
      );
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {logoMode === 'icon-text' && logoUrl ? (
          <img src={logoUrl} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
        ) : (
          <Shield size={24} style={{ color: brandColor }} />
        )}
        <h1 className="rpt-logo-text" style={{ color: brandColor, fontFamily: `'${fontFamily}', sans-serif` }}>
          {platformName}
        </h1>
      </div>
    );
  };

  return (
    <header className="rpt-header">
      <div className="rpt-header-left">
        {renderLogo()}
        {platformTagline && (
          <p className="rpt-tagline">{platformTagline.toUpperCase()}</p>
        )}
      </div>
      <div className="rpt-header-right">
        <h2 className="rpt-report-title" style={{ color: brandColor }}>{reportTitle}</h2>
        <p className="rpt-month">{monthLabel}</p>
        <p className="rpt-generated">Generated: {generatedDate}</p>
      </div>
      <div className="rpt-header-divider" style={{ borderColor: brandColor }} />
    </header>
  );
}
