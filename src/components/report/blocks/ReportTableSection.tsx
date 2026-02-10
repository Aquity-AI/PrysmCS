import React from 'react';
import type { ReportSection } from '../useReportData';

interface ReportTableSectionProps {
  section: ReportSection;
  formatValue: (field: any, value: any) => string;
  showConversionRate?: boolean;
  brandColor: string;
}

export function ReportTableSection({ section, formatValue, showConversionRate = false, brandColor }: ReportTableSectionProps) {
  if (!section.fields || section.fields.length === 0) return null;

  const firstValue = Number(section.fields[0]?.value || 0);
  const lastValue = Number(section.fields[section.fields.length - 1]?.value || 0);
  const conversionRate = firstValue > 0 ? Math.round((lastValue / firstValue) * 100) : 0;

  return (
    <div className="rpt-table-block">
      <h4 className="rpt-subsection-title">{section.title}</h4>
      <table className="rpt-table">
        <tbody>
          {section.fields.map((field: any) => (
            <tr key={field.id}>
              <td>{field.label}</td>
              <td>{formatValue(field, field.value)}</td>
            </tr>
          ))}
          {showConversionRate && section.fields.length >= 2 && (
            <tr>
              <td>Conversion Rate</td>
              <td className="rpt-highlight" style={{ color: brandColor, fontWeight: 700 }}>
                {conversionRate}%
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
