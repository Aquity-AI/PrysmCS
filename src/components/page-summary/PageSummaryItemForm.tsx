import React, { useState, useEffect } from 'react';
import { Save, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PageSummaryItem {
  id?: string;
  label: string;
  metric_value: string;
  trend_direction: 'positive' | 'negative' | 'neutral';
  description_text: string;
  is_visible: boolean;
  is_ai_generated?: boolean;
}

interface PageSummaryItemFormProps {
  item?: PageSummaryItem | null;
  onSave: (data: Omit<PageSummaryItem, 'id' | 'summary_id' | 'item_order'>) => void;
  onCancel: () => void;
}

interface ValidationErrors {
  label?: string;
  metric_value?: string;
  trend_direction?: string;
}

export function PageSummaryItemForm({ item, onSave, onCancel }: PageSummaryItemFormProps) {
  const [formData, setFormData] = useState<Omit<PageSummaryItem, 'id'>>({
    label: '',
    metric_value: '',
    trend_direction: 'neutral',
    description_text: '',
    is_visible: true,
    is_ai_generated: false,
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        label: item.label,
        metric_value: item.metric_value,
        trend_direction: item.trend_direction,
        description_text: item.description_text,
        is_visible: item.is_visible,
        is_ai_generated: item.is_ai_generated || false,
      });
    }
  }, [item]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.label.trim()) {
      newErrors.label = 'Label is required';
    } else if (formData.label.length > 100) {
      newErrors.label = 'Label must be 100 characters or less';
    }

    if (!formData.metric_value.trim()) {
      newErrors.metric_value = 'Metric value is required';
    } else if (formData.metric_value.length > 50) {
      newErrors.metric_value = 'Metric value must be 50 characters or less';
    }

    if (!formData.trend_direction) {
      newErrors.trend_direction = 'Trend direction is required';
    }

    if (formData.description_text.length > 500) {
      newErrors.label = 'Description must be 500 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field as keyof ValidationErrors]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'positive':
        return <TrendingUp size={16} />;
      case 'negative':
        return <TrendingDown size={16} />;
      case 'neutral':
        return <Minus size={16} />;
      default:
        return null;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'positive':
        return 'var(--green-600)';
      case 'negative':
        return 'var(--red-600)';
      case 'neutral':
        return 'var(--slate-500)';
      default:
        return 'var(--slate-500)';
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: '20px',
        background: 'white',
        borderRadius: '8px',
        border: '2px solid var(--brand-primary)',
        marginBottom: '16px',
      }}
    >
      <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 600 }}>
        {item ? 'Edit Summary Item' : 'Add New Summary Item'}
      </h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label
            htmlFor="label"
            style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--slate-700)',
            }}
          >
            Label <span style={{ color: 'var(--red-500)' }}>*</span>
          </label>
          <input
            id="label"
            type="text"
            value={formData.label}
            onChange={(e) => handleChange('label', e.target.value)}
            placeholder="e.g., Enrollment Growth, Patient Retention"
            maxLength={100}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: `1px solid ${errors.label ? 'var(--red-500)' : 'var(--slate-300)'}`,
              borderRadius: '6px',
              fontSize: '13px',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            {errors.label ? (
              <span style={{ fontSize: '12px', color: 'var(--red-500)' }}>{errors.label}</span>
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--slate-400)' }}>Brief, descriptive label</span>
            )}
            <span
              style={{
                fontSize: '12px',
                color: formData.label.length > 90 ? 'var(--red-500)' : 'var(--slate-400)',
              }}
            >
              {formData.label.length}/100
            </span>
          </div>
        </div>

        <div>
          <label
            htmlFor="metric_value"
            style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--slate-700)',
            }}
          >
            Metric Value <span style={{ color: 'var(--red-500)' }}>*</span>
          </label>
          <input
            id="metric_value"
            type="text"
            value={formData.metric_value}
            onChange={(e) => handleChange('metric_value', e.target.value)}
            placeholder="e.g., +17%, $45,200, 1,250 patients"
            maxLength={50}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: `1px solid ${errors.metric_value ? 'var(--red-500)' : 'var(--slate-300)'}`,
              borderRadius: '6px',
              fontSize: '13px',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            {errors.metric_value ? (
              <span style={{ fontSize: '12px', color: 'var(--red-500)' }}>{errors.metric_value}</span>
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--slate-400)' }}>
                The main number or percentage to display
              </span>
            )}
            <span
              style={{
                fontSize: '12px',
                color: formData.metric_value.length > 45 ? 'var(--red-500)' : 'var(--slate-400)',
              }}
            >
              {formData.metric_value.length}/50
            </span>
          </div>
        </div>

        <div>
          <label
            htmlFor="trend_direction"
            style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--slate-700)',
            }}
          >
            Trend Direction <span style={{ color: 'var(--red-500)' }}>*</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {(['positive', 'negative', 'neutral'] as const).map((trend) => (
              <button
                key={trend}
                type="button"
                onClick={() => handleChange('trend_direction', trend)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px',
                  border: `2px solid ${formData.trend_direction === trend ? getTrendColor(trend) : 'var(--slate-300)'}`,
                  borderRadius: '6px',
                  background: formData.trend_direction === trend ? `${getTrendColor(trend)}15` : 'white',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: formData.trend_direction === trend ? getTrendColor(trend) : 'var(--slate-600)',
                  transition: 'all 0.2s',
                }}
              >
                {getTrendIcon(trend)}
                {trend.charAt(0).toUpperCase() + trend.slice(1)}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--slate-400)', margin: '4px 0 0 0' }}>
            Positive (green) for good news, Negative (red) for concerns, Neutral (gray) for informational
          </p>
        </div>

        <div>
          <label
            htmlFor="description_text"
            style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--slate-700)',
            }}
          >
            Description (Optional)
          </label>
          <textarea
            id="description_text"
            value={formData.description_text}
            onChange={(e) => handleChange('description_text', e.target.value)}
            placeholder="Provide context and insights about this metric"
            maxLength={500}
            rows={3}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid var(--slate-300)',
              borderRadius: '6px',
              fontSize: '13px',
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--slate-400)' }}>Additional context or insights</span>
            <span
              style={{
                fontSize: '12px',
                color: formData.description_text.length > 450 ? 'var(--red-500)' : 'var(--slate-400)',
              }}
            >
              {formData.description_text.length}/500
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            id="is_visible"
            type="checkbox"
            checked={formData.is_visible}
            onChange={(e) => handleChange('is_visible', e.target.checked)}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <label
            htmlFor="is_visible"
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--slate-700)',
              cursor: 'pointer',
            }}
          >
            Show on dashboard
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            background: 'white',
            color: 'var(--slate-600)',
            border: '1px solid var(--slate-300)',
            borderRadius: '6px',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            opacity: isSaving ? 0.5 : 1,
          }}
        >
          <X size={16} /> Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            background: 'var(--brand-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            opacity: isSaving ? 0.7 : 1,
          }}
        >
          <Save size={16} /> {isSaving ? 'Saving...' : item ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}
