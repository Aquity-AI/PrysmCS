import React, { useState, useEffect } from 'react';
import { X, Hash, DollarSign, Percent, AlertCircle, Plus, Check } from 'lucide-react';
import { supabase } from './supabaseClient';
import * as styles from './modalStyles';

interface MetricCategory {
  id: string;
  client_id: string;
  name: string;
  slug: string;
  color: string;
}

interface CreateMetricModalProps {
  clientId: string;
  onClose: () => void;
  onSave: (savedMetric: any) => void;
}

type DataType = 'number' | 'currency' | 'percentage' | 'decimal';
type Aggregation = 'sum' | 'avg' | 'min' | 'max' | 'count';

const DATA_TYPE_OPTIONS: { value: DataType; label: string; icon: React.ReactNode }[] = [
  { value: 'number', label: 'Number', icon: <Hash size={20} /> },
  { value: 'currency', label: 'Currency', icon: <DollarSign size={20} /> },
  { value: 'percentage', label: 'Percentage', icon: <Percent size={20} /> },
  { value: 'decimal', label: 'Decimal', icon: <span style={{ fontSize: '18px', fontWeight: 700 }}>0.0</span> },
];

const AGGREGATION_OPTIONS: Aggregation[] = ['sum', 'avg', 'min', 'max', 'count'];

const sectionHeader: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '16px',
};

export function CreateMetricModal({ clientId, onClose, onSave }: CreateMetricModalProps) {
  const [metricName, setMetricName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [sourceSystem, setSourceSystem] = useState('');
  const [dataType, setDataType] = useState<DataType>('number');
  const [aggregation, setAggregation] = useState<Aggregation>('avg');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [categories, setCategories] = useState<MetricCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const { data } = await supabase
        .from('metric_categories')
        .select('id, client_id, name, slug, color')
        .eq('client_id', clientId)
        .order('display_order', { ascending: true });

      const unique = deduplicateCategories(data || []);
      setCategories(unique);
      if (unique.length > 0 && !category) {
        setCategory(unique[0].slug);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const deduplicateCategories = (cats: MetricCategory[]) => {
    const seen = new Set<string>();
    return cats.filter(c => {
      if (seen.has(c.slug)) return false;
      seen.add(c.slug);
      return true;
    });
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');

  const generateMetricKey = (name: string) => generateSlug(name);

  const handleAddCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    const slug = generateSlug(trimmed);
    const exists = categories.some(c => c.slug === slug);
    if (exists) {
      setCategory(slug);
      setShowAddCategory(false);
      setNewCategoryName('');
      return;
    }

    setAddingCategory(true);
    try {
      const { data, error: insertErr } = await supabase
        .from('metric_categories')
        .insert([{
          client_id: clientId,
          name: trimmed,
          slug,
          color: '#6b7280',
          icon: 'BarChart2',
          display_order: categories.length,
          is_system: false,
        }])
        .select()
        .maybeSingle();

      if (insertErr) throw insertErr;

      if (data) {
        setCategories(prev => deduplicateCategories([...prev, data]));
        setCategory(slug);
      }
      setShowAddCategory(false);
      setNewCategoryName('');
    } catch (err) {
      console.error('Failed to add category:', err);
    } finally {
      setAddingCategory(false);
    }
  };

  const handleSave = async () => {
    setError('');
    const name = metricName.trim();
    if (!name) {
      setError('Metric name is required');
      return;
    }
    if (!category) {
      setError('Please select a category');
      return;
    }

    setSaving(true);
    try {
      const metricKey = generateMetricKey(name);

      const { data: inserted, error: insertErr } = await supabase
        .from('metric_definitions')
        .insert([{
          client_id: clientId,
          metric_name: name,
          metric_key: metricKey,
          data_type: dataType,
          category,
          description: description.trim(),
          source_system: sourceSystem.trim() || null,
          default_aggregation: aggregation,
          source_type: 'manual',
          is_active: true,
        }])
        .select()
        .maybeSingle();

      if (insertErr) {
        if (insertErr.code === '23505') {
          setError('A metric with this name already exists. Please use a different name.');
        } else {
          throw insertErr;
        }
        return;
      }

      onSave(inserted || undefined);
    } catch (err: any) {
      console.error('Error saving metric:', err);
      setError(err.message || 'Failed to save metric');
    } finally {
      setSaving(false);
    }
  };

  const canSave = metricName.trim().length > 0 && category.length > 0;

  return (
    <div style={{ ...styles.overlay, zIndex: 10001 }} onClick={onClose}>
      <div
        style={{ ...styles.modal, maxWidth: '540px' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={styles.header}>
          <h2 style={styles.title}>Create Metric</h2>
          <button style={styles.closeButton} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
          {error && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              marginBottom: '20px',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}>
              <AlertCircle size={15} style={{ color: '#ef4444', flexShrink: 0 }} />
              <span style={{ color: '#fca5a5', fontSize: '13px' }}>{error}</span>
            </div>
          )}

          <div style={sectionHeader}>Basic Info</div>

          <div style={{ marginBottom: '18px' }}>
            <label style={styles.fieldLabel}>Metric Name *</label>
            <input
              type="text"
              value={metricName}
              onChange={e => setMetricName(e.target.value)}
              placeholder="e.g., Monthly Active Users"
              style={styles.textInput}
            />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={styles.fieldLabel}>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What does this metric measure?"
              rows={3}
              style={{
                ...styles.textInput,
                resize: 'vertical' as const,
                fontFamily: 'inherit',
                minHeight: '72px',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '10px', marginBottom: '28px', alignItems: 'end' }}>
            <div>
              <label style={styles.fieldLabel}>Category *</label>
              {showAddCategory ? (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    placeholder="Category name"
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddCategory();
                      if (e.key === 'Escape') { setShowAddCategory(false); setNewCategoryName(''); }
                    }}
                    style={{ ...styles.textInput, padding: '8px 10px' }}
                  />
                  <button
                    onClick={handleAddCategory}
                    disabled={addingCategory || !newCategoryName.trim()}
                    style={{
                      padding: '8px 10px',
                      background: newCategoryName.trim() ? 'var(--brand-primary, #06b6d4)' : '#334155',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      cursor: newCategoryName.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Check size={14} />
                  </button>
                </div>
              ) : (
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  disabled={categoriesLoading}
                  style={styles.selectInput}
                >
                  {categoriesLoading ? (
                    <option value="">Loading...</option>
                  ) : categories.length === 0 ? (
                    <option value="">No categories</option>
                  ) : (
                    categories.map(c => (
                      <option key={c.slug} value={c.slug}>{c.name}</option>
                    ))
                  )}
                </select>
              )}
            </div>

            <button
              onClick={() => setShowAddCategory(!showAddCategory)}
              title={showAddCategory ? 'Cancel' : 'Add category'}
              style={{
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#94a3b8',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-primary, #06b6d4)'; e.currentTarget.style.color = 'var(--brand-primary, #06b6d4)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#94a3b8'; }}
            >
              {showAddCategory ? <X size={14} /> : <Plus size={14} />}
            </button>

            <div>
              <label style={styles.fieldLabel}>Source System / API</label>
              <input
                type="text"
                value={sourceSystem}
                onChange={e => setSourceSystem(e.target.value)}
                placeholder="e.g., billing_api"
                style={styles.textInput}
              />
            </div>
          </div>

          <div style={sectionHeader}>Configuration</div>

          <div style={{ marginBottom: '24px' }}>
            <label style={styles.fieldLabel}>Data Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {DATA_TYPE_OPTIONS.map(opt => {
                const selected = dataType === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setDataType(opt.value)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '16px 8px',
                      background: selected
                        ? 'color-mix(in srgb, var(--brand-primary, #06b6d4) 10%, transparent)'
                        : '#1e293b',
                      border: selected
                        ? '2px solid var(--brand-primary, #06b6d4)'
                        : '2px solid #334155',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      color: selected ? 'var(--brand-primary, #06b6d4)' : '#94a3b8',
                    }}
                    onMouseEnter={e => {
                      if (!selected) e.currentTarget.style.borderColor = '#475569';
                    }}
                    onMouseLeave={e => {
                      if (!selected) e.currentTarget.style.borderColor = '#334155';
                    }}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: selected
                        ? 'color-mix(in srgb, var(--brand-primary, #06b6d4) 15%, transparent)'
                        : '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {opt.icon}
                    </div>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: selected ? '#e2e8f0' : '#94a3b8',
                    }}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={styles.fieldLabel}>Default Aggregation</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {AGGREGATION_OPTIONS.map(agg => {
                const selected = aggregation === agg;
                return (
                  <button
                    key={agg}
                    onClick={() => setAggregation(agg)}
                    style={{
                      padding: '8px 16px',
                      background: selected
                        ? 'var(--brand-primary, #06b6d4)'
                        : '#1e293b',
                      border: selected
                        ? '1px solid var(--brand-primary, #06b6d4)'
                        : '1px solid #334155',
                      borderRadius: '8px',
                      color: selected ? '#fff' : '#94a3b8',
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => {
                      if (!selected) {
                        e.currentTarget.style.borderColor = '#475569';
                        e.currentTarget.style.color = '#e2e8f0';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!selected) {
                        e.currentTarget.style.borderColor = '#334155';
                        e.currentTarget.style.color = '#94a3b8';
                      }
                    }}
                  >
                    {agg}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div style={styles.footer}>
          <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button
            style={styles.continueBtn(!canSave || saving)}
            onClick={handleSave}
            disabled={!canSave || saving}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={14} />
              {saving ? 'Creating...' : 'Create Metric'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
