import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Info } from 'lucide-react';
import { supabase } from './supabaseClient';
import { FormFieldSelector } from './FormFieldSelector';

interface Metric {
  id?: string;
  client_id: string;
  metric_name: string;
  metric_key: string;
  data_type: 'number' | 'currency' | 'percentage' | 'decimal';
  category: 'enrollment' | 'financial' | 'engagement' | 'outcomes' | 'custom';
  source_type: 'form_field' | 'manual' | 'calculated';
  form_field_id?: string;
  form_page_id?: string;
  unit: string;
  description: string;
  is_active: boolean;
}

interface MetricFormModalProps {
  clientId: string;
  metric: Metric | null;
  onClose: () => void;
  onSave: () => void;
}

export function MetricFormModal({ clientId, metric, onClose, onSave }: MetricFormModalProps) {
  const [formData, setFormData] = useState<Metric>({
    client_id: clientId,
    metric_name: '',
    metric_key: '',
    data_type: 'number',
    category: 'custom',
    source_type: 'manual',
    unit: '',
    description: '',
    is_active: true
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.metric_name.trim()) {
      setError('Metric name is required');
      return;
    }

    if (!formData.metric_key.trim()) {
      setError('Metric key is required');
      return;
    }

    if (formData.source_type === 'form_field' && (!formData.form_field_id || !formData.form_page_id)) {
      setError('Please select a form field to track');
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
      } else {
        const { error: insertError } = await supabase
          .from('metric_definitions')
          .insert([dataToSave]);

        if (insertError) {
          if (insertError.code === '23505') {
            setError('A metric with this key already exists');
          } else {
            throw insertError;
          }
          return;
        }
      }

      onSave();
    } catch (err: any) {
      console.error('Error saving metric:', err);
      setError(err.message || 'Failed to save metric');
    } finally {
      setSaving(false);
    }
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
          borderRadius: '12px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>
            {metric ? 'Edit Metric' : 'Create New Metric'}
          </h2>
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

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && (
            <div style={{
              padding: '12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              marginBottom: '20px',
              display: 'flex',
              gap: '8px',
              alignItems: 'start'
            }}>
              <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
              <span style={{ color: '#991b1b', fontSize: '14px' }}>{error}</span>
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#1e293b'
            }}>
              Metric Name *
            </label>
            <input
              type="text"
              value={formData.metric_name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Monthly Enrollments"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#1e293b'
            }}>
              Metric Key *
            </label>
            <input
              type="text"
              value={formData.metric_key}
              onChange={(e) => setFormData(prev => ({ ...prev, metric_key: e.target.value }))}
              placeholder="e.g., monthly_enrollments"
              required
              disabled={!!metric}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                background: metric ? '#f8fafc' : 'white',
                cursor: metric ? 'not-allowed' : 'text'
              }}
            />
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
              Unique identifier (auto-generated from name, cannot be changed after creation)
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#1e293b'
            }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this metric tracks..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#1e293b'
              }}>
                Data Type *
              </label>
              <select
                value={formData.data_type}
                onChange={(e) => setFormData(prev => ({ ...prev, data_type: e.target.value as any }))}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  background: 'white'
                }}
              >
                <option value="number">Number</option>
                <option value="currency">Currency</option>
                <option value="percentage">Percentage</option>
                <option value="decimal">Decimal</option>
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#1e293b'
              }}>
                Unit
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                placeholder="e.g., patients, $, %"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#1e293b'
              }}>
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  background: 'white'
                }}
              >
                <option value="enrollment">Enrollment</option>
                <option value="financial">Financial</option>
                <option value="engagement">Engagement</option>
                <option value="outcomes">Outcomes</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#1e293b'
              }}>
                Data Source *
              </label>
              <select
                value={formData.source_type}
                onChange={(e) => setFormData(prev => ({ ...prev, source_type: e.target.value as any }))}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  background: 'white'
                }}
              >
                <option value="manual">Manual Entry</option>
                <option value="form_field">Form Field (Auto-track)</option>
                <option value="calculated">Calculated</option>
              </select>
            </div>
          </div>

          {formData.source_type === 'form_field' && (
            <div style={{
              marginBottom: '20px',
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
                      {formData.form_page_id} → {formData.form_field_id}
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
              marginBottom: '20px',
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

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px',
            background: '#f8fafc',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              style={{ cursor: 'pointer' }}
            />
            <label htmlFor="is_active" style={{ fontSize: '14px', color: '#1e293b', cursor: 'pointer', userSelect: 'none' }}>
              Active (visible in charts and analytics)
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
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
            <button
              type="submit"
              disabled={saving}
              style={{
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
              {saving ? 'Saving...' : (metric ? 'Update Metric' : 'Create Metric')}
            </button>
          </div>
        </form>
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
