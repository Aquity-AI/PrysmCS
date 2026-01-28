import React, { useState } from 'react';
import { X, FileText, ChevronRight, Info } from 'lucide-react';

interface FormFieldSelectorProps {
  clientId: string;
  onSelect: (pageId: string, fieldId: string, fieldLabel: string) => void;
  onClose: () => void;
}

interface FormField {
  id: string;
  label: string;
  fieldType: string;
}

interface Section {
  id: string;
  title: string;
  fields: FormField[];
}

interface Page {
  id: string;
  label: string;
  sections: Section[];
}

const SAMPLE_PAGES: Page[] = [
  {
    id: 'overview',
    label: 'Overview',
    sections: [
      {
        id: 'metrics',
        title: 'Key Metrics',
        fields: [
          { id: 'total_enrolled', label: 'Total Enrolled Patients', fieldType: 'number' },
          { id: 'active_patients', label: 'Active Patients', fieldType: 'number' },
          { id: 'monthly_revenue', label: 'Monthly Revenue', fieldType: 'number' }
        ]
      }
    ]
  },
  {
    id: 'enrollment',
    label: 'Enrollment',
    sections: [
      {
        id: 'enrollment_metrics',
        title: 'Enrollment Metrics',
        fields: [
          { id: 'new_enrollments', label: 'New Enrollments This Month', fieldType: 'number' },
          { id: 'enrollment_target', label: 'Monthly Enrollment Target', fieldType: 'number' },
          { id: 'conversion_rate', label: 'Enrollment Conversion Rate', fieldType: 'number' }
        ]
      }
    ]
  },
  {
    id: 'financial',
    label: 'Financial',
    sections: [
      {
        id: 'revenue_metrics',
        title: 'Revenue Metrics',
        fields: [
          { id: 'total_revenue', label: 'Total Revenue', fieldType: 'number' },
          { id: 'avg_revenue_per_patient', label: 'Average Revenue per Patient', fieldType: 'number' },
          { id: 'billing_efficiency', label: 'Billing Efficiency %', fieldType: 'number' }
        ]
      }
    ]
  },
  {
    id: 'engagement',
    label: 'Engagement',
    sections: [
      {
        id: 'engagement_metrics',
        title: 'Engagement Metrics',
        fields: [
          { id: 'avg_calls_per_patient', label: 'Average Calls per Patient', fieldType: 'number' },
          { id: 'patient_satisfaction', label: 'Patient Satisfaction Score', fieldType: 'number' },
          { id: 'engagement_rate', label: 'Engagement Rate %', fieldType: 'number' }
        ]
      }
    ]
  },
  {
    id: 'outcomes',
    label: 'Clinical Outcomes',
    sections: [
      {
        id: 'health_metrics',
        title: 'Health Metrics',
        fields: [
          { id: 'avg_health_score', label: 'Average Health Score', fieldType: 'number' },
          { id: 'er_reduction', label: 'ER Visit Reduction %', fieldType: 'number' },
          { id: 'medication_adherence', label: 'Medication Adherence %', fieldType: 'number' }
        ]
      }
    ]
  }
];

export function FormFieldSelector({ clientId, onSelect, onClose }: FormFieldSelectorProps) {
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPages = SAMPLE_PAGES.map(page => ({
    ...page,
    sections: page.sections.map(section => ({
      ...section,
      fields: section.fields.filter(field =>
        field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })).filter(section => section.fields.length > 0)
  })).filter(page => page.sections.length > 0);

  const handleFieldSelect = (pageId: string, fieldId: string, fieldLabel: string) => {
    onSelect(pageId, fieldId, fieldLabel);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10002,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '700px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'start'
        }}>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>
              Select Form Field to Track
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
              Choose a numeric field from any page to automatically track over time
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <input
            type="text"
            placeholder="Search fields..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px 24px'
        }}>
          {filteredPages.length === 0 ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: '#94a3b8'
            }}>
              <FileText size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '14px' }}>
                No fields found matching "{searchTerm}"
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                padding: '12px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                display: 'flex',
                gap: '8px',
                alignItems: 'start',
                marginBottom: '8px'
              }}>
                <Info size={16} style={{ color: '#3b82f6', marginTop: '2px', flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: '13px', color: '#1e40af' }}>
                  Note: This is a preview of available form fields. In production, this would scan your actual dashboard configuration to find numeric fields.
                </p>
              </div>

              {filteredPages.map(page => (
                <div key={page.id} style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    padding: '12px 16px',
                    background: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#1e293b'
                  }}>
                    {page.label}
                  </div>
                  {page.sections.map(section => (
                    <div key={section.id}>
                      {section.fields.map((field, index) => (
                        <button
                          key={field.id}
                          onClick={() => handleFieldSelect(page.id, field.id, field.label)}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            background: 'white',
                            border: 'none',
                            borderBottom: index < section.fields.length - 1 ? '1px solid #f1f5f9' : 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            textAlign: 'left',
                            transition: 'background 0.15s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'white'}
                        >
                          <div>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: '500',
                              color: '#1e293b',
                              marginBottom: '2px'
                            }}>
                              {field.label}
                            </div>
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                              {section.title} • {field.fieldType}
                            </div>
                          </div>
                          <ChevronRight size={16} style={{ color: '#94a3b8' }} />
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: 'white',
              color: '#64748b',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
