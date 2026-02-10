import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Info, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { supabase } from './supabaseClient';
import { FormFieldSelector } from './FormFieldSelector';
import { METRIC_ICON_OPTIONS, categoryDefaultIcons, getIconComponent } from './iconConfig';
import type { MetricCategory } from './MetricsManager';

interface Metric {
  id?: string;
  client_id: string;
  metric_name: string;
  metric_key: string;
  data_type: 'number' | 'currency' | 'percentage' | 'decimal';
  category: string;
  source_type: 'form_field' | 'manual' | 'calculated';
  form_field_id?: string;
  form_page_id?: string;
  unit: string;
  description: string;
  is_active: boolean;
  icon?: string | null;
}

interface MetricFormModalProps {
  clientId: string;
  metric: Metric | null;
  categories?: MetricCategory[];
  onClose: () => void;
  onSave: (savedMetric?: any) => void;
}

const TOTAL_STEPS = 3;
const STEP_LABELS = ['Basic Info', 'Configuration', 'Review & Save'];

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '14px',
  fontWeight: '500',
  color: '#1e293b',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  fontSize: '14px',
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
  background: 'white',
};

export function MetricFormModal({ clientId, metric, categories = [], onClose, onSave }: MetricFormModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Metric>({
    client_id: clientId,
    metric_name: '',
    metric_key: '',
    data_type: 'number',
    category: 'custom',
    source_type: 'manual',
    unit: '',
    description: '',
    is_active: true,
    icon: categoryDefaultIcons['custom']
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showFieldSelector, setShowFieldSelector] = useState(false);

  useEffect(() => {
    if (metric) {
      setFormData(metric);
    }
  }, [metric]);

  const generateMetricKey = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      metric_name: name,
      metric_key: !metric ? generateMetricKey(name) : prev.metric_key
    }));
  };

  const handleFieldSelect = (pageId: string, fieldId: string, fieldLabel: string) => {
    setFormData(prev => ({
      ...prev,
      form_page_id: pageId,
      form_field_id: fieldId,
      metric_name: prev.metric_name || fieldLabel,
      metric_key: prev.metric_key || generateMetricKey(fieldLabel)
    }));
    setShowFieldSelector(false);
  };

  const handleCategoryChange = (category: string) => {
    setFormData(prev => ({
      ...prev,
      category: category as any,
      icon: !metric ? categoryDefaultIcons[category] : prev.icon
    }));
  };

  const canContinue = (): boolean => {
    switch (step) {
      case 1:
        return formData.metric_name.trim().length > 0 && formData.metric_key.trim().length > 0;
      case 2:
        if (formData.source_type === 'form_field' && (!formData.form_field_id || !formData.form_page_id)) {
          return false;
        }
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    setError('');
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setError('');

    if (!formData.metric_name.trim()) {
      setError('Metric name is required');
      setStep(1);
      return;
    }

    if (!formData.metric_key.trim()) {
      setError('Metric key is required');
      setStep(1);
      return;
    }

    if (formData.source_type === 'form_field' && (!formData.form_field_id || !formData.form_page_id)) {
      setError('Please select a form field to track');
      setStep(2);
      return;
    }

    try {
      setSaving(true);

      const dataToSave = {
        ...formData,
        form_field_id: formData.source_type === 'form_field' ? formData.form_field_id : null,
        form_page_id: formData.source_type === 'form_field' ? formData.form_page_id : null
      };

      if (metric?.id) {
        const { error: updateError } = await supabase
          .from('metric_definitions')
          .update(dataToSave)
          .eq('id', metric.id);

        if (updateError) throw updateError;
        onSave();
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('metric_definitions')
          .insert([dataToSave])
          .select()
          .maybeSingle();

        if (insertError) {
          if (insertError.code === '23505') {
            setError('A metric with this key already exists');
          } else {
            throw insertError;
          }
          return;
        }

        onSave(inserted || undefined);
      }
    } catch (err: any) {
      console.error('Error saving metric:', err);
      setError(err.message || 'Failed to save metric');
    } finally {
      setSaving(false);
    }
  };

  const iconConfig = getIconComponent(formData.icon, formData.category);
  const SelectedIcon = iconConfig.component;

  const dataTypeLabels: Record<string, string> = {
    number: 'Number',
    currency: 'Currency',
    percentage: 'Percentage',
    decimal: 'Decimal',
  };

  const sourceLabels: Record<string, string> = {
    manual: 'Manual Entry',
    form_field: 'Form Field (Auto-track)',
    calculated: 'Calculated',
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
            {metric ? 'Edit Metric' : 'Create New Metric'}
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '6px',
              background: '#f1f5f9',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '4px', padding: '16px 24px 0' }}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{
                height: '3px',
                borderRadius: '2px',
                background: i < step ? '#3b82f6' : '#e2e8f0',
                transition: 'background 0.3s ease',
              }} />
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                color: i < step ? '#3b82f6' : i === step - 1 ? '#1e293b' : '#94a3b8',
                textAlign: 'center',
              }}>
                {STEP_LABELS[i]}
              </span>
            </div>
          ))}
        </div>

        <div style={{ padding: '20px 24px', overflow: 'auto', flex: 1 }}>
          {error && (
            <div style={{
              padding: '12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              marginBottom: '16px',
              display: 'flex',
              gap: '8px',
              alignItems: 'start'
            }}>
              <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
              <span style={{ color: '#991b1b', fontSize: '14px' }}>{error}</span>
            </div>
          )}

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={labelStyle}>Metric Name *</label>
                <input
                  type="text"
                  value={formData.metric_name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Monthly Enrollments"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Metric Key *</label>
                <input
                  type="text"
                  value={formData.metric_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, metric_key: e.target.value }))}
                  placeholder="e.g., monthly_enrollments"
                  disabled={!!metric}
                  style={{
                    ...inputStyle,
                    background: metric ? '#f8fafc' : 'white',
                    cursor: metric ? 'not-allowed' : 'text'
                  }}
                />
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                  Unique identifier (auto-generated from name)
                </p>
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this metric tracks..."
                  rows={3}
                  style={{
                    ...inputStyle,
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <label style={labelStyle}>Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  style={selectStyle}
                >
                  {categories.length > 0 ? (
                    categories.map(cat => (
                      <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                    ))
                  ) : (
                    <>
                      <option value="enrollment">Enrollment</option>
                      <option value="financial">Financial</option>
                      <option value="engagement">Engagement</option>
                      <option value="outcomes">Outcomes</option>
                      <option value="custom">Custom</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Data Type *</label>
                  <select
                    value={formData.data_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_type: e.target.value as any }))}
                    style={selectStyle}
                  >
                    <option value="number">Number</option>
                    <option value="currency">Currency</option>
                    <option value="percentage">Percentage</option>
                    <option value="decimal">Decimal</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Unit</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    placeholder="e.g., patients, $, %"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Data Source *</label>
                <select
                  value={formData.source_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, source_type: e.target.value as any }))}
                  style={selectStyle}
                >
                  <option value="manual">Manual Entry</option>
                  <option value="form_field">Form Field (Auto-track)</option>
                  <option value="calculated">Calculated</option>
                </select>
              </div>

              {formData.source_type === 'form_field' && (
                <div style={{
                  padding: '16px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'start', gap: '8px', marginBottom: '12px' }}>
                    <Info size={16} style={{ color: '#3b82f6', marginTop: '2px', flexShrink: 0 }} />
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                      Select a form field to automatically track its values over time
                    </p>
                  </div>
                  {formData.form_field_id ? (
                    <div>
                      <div style={{
                        padding: '10px 12px',
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        marginBottom: '8px'
                      }}>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '2px' }}>Selected Field</div>
                        <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>
                          {formData.form_page_id} &rarr; {formData.form_field_id}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowFieldSelector(true)}
                        style={{
                          padding: '8px 12px',
                          background: 'white',
                          color: '#3b82f6',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Change Field
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowFieldSelector(true)}
                      style={{
                        padding: '10px 16px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        width: '100%'
                      }}
                    >
                      Select Form Field
                    </button>
                  )}
                </div>
              )}

              {formData.source_type === 'calculated' && (
                <div style={{
                  padding: '12px',
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  display: 'flex',
                  gap: '8px'
                }}>
                  <Info size={16} style={{ color: '#d97706', marginTop: '2px', flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: '13px', color: '#92400e' }}>
                    Calculated metrics are not yet fully implemented. Data will need to be entered manually.
                  </p>
                </div>
              )}

              <div>
                <label style={labelStyle}>Icon</label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(8, 1fr)',
                  gap: '6px',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  background: '#fafbfc',
                  maxHeight: '180px',
                  overflowY: 'auto',
                }}>
                  {METRIC_ICON_OPTIONS.map(opt => {
                    const isSelected = formData.icon === opt.name;
                    const IconComp = opt.component;
                    return (
                      <button
                        key={opt.name}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, icon: opt.name }))}
                        title={opt.name}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid #3b82f6' : '1px solid transparent',
                          background: isSelected ? '#eff6ff' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <IconComp size={18} style={{ color: isSelected ? '#3b82f6' : '#64748b' }} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                background: '#f8fafc',
                borderRadius: '8px',
              }}>
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  style={{ cursor: 'pointer', accentColor: '#3b82f6' }}
                />
                <label htmlFor="is_active" style={{ fontSize: '14px', color: '#1e293b', cursor: 'pointer', userSelect: 'none' }}>
                  Active (visible in charts and analytics)
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                background: '#f8fafc',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <SelectedIcon size={22} style={{ color: '#3b82f6' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>
                      {formData.metric_name || 'Untitled Metric'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
                      {formData.metric_key || 'no_key'}
                    </div>
                  </div>
                </div>

                {formData.description && (
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
                    {formData.description}
                  </p>
                )}

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  paddingTop: '8px',
                  borderTop: '1px solid #e2e8f0',
                }}>
                  {[
                    { label: 'Category', value: formData.category },
                    { label: 'Data Type', value: dataTypeLabels[formData.data_type] || formData.data_type },
                    { label: 'Unit', value: formData.unit || '-' },
                    { label: 'Data Source', value: sourceLabels[formData.source_type] || formData.source_type },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#1e293b' }}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  paddingTop: '8px',
                  borderTop: '1px solid #e2e8f0',
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: formData.is_active ? '#10b981' : '#94a3b8',
                  }} />
                  <span style={{ fontSize: '13px', color: formData.is_active ? '#10b981' : '#94a3b8', fontWeight: 500 }}>
                    {formData.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '10px 16px',
                background: 'white',
                color: '#64748b',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <ChevronLeft size={14} /> Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 16px',
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
          )}

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canContinue()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '10px 20px',
                background: canContinue() ? '#3b82f6' : '#94a3b8',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: canContinue() ? 'pointer' : 'not-allowed'
              }}
            >
              Continue <ChevronRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '10px 20px',
                background: saving ? '#94a3b8' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              <Check size={14} />
              {saving ? 'Saving...' : (metric ? 'Update Metric' : 'Create Metric')}
            </button>
          )}
        </div>
      </div>

      {showFieldSelector && (
        <FormFieldSelector
          clientId={clientId}
          onSelect={handleFieldSelect}
          onClose={() => setShowFieldSelector(false)}
        />
      )}
    </div>
  );
}
