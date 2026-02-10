import React, { useState, useEffect } from 'react';
import { TrendingUp, Plus, Edit2, Trash2, Search, Activity, Eye, EyeOff } from 'lucide-react';
import { supabase } from './supabaseClient';
import { MetricFormModal } from './MetricFormModal';
import { ManualDataEntryModal } from './ManualDataEntryModal';
import { getIconComponent } from './iconConfig';
import { SavedGraphsList } from '../dashboard-graphs/SavedGraphsList';

interface Metric {
  id: string;
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
  created_at: string;
  updated_at: string;
}

export interface MetricCategory {
  id: string;
  client_id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  display_order: number;
  is_system: boolean;
}

interface MetricsManagerProps {
  clientId: string;
}

const FALLBACK_CATEGORY_COLOR = '#6b7280';

export function MetricsManager({ clientId }: MetricsManagerProps) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [categories, setCategories] = useState<MetricCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [showMetricModal, setShowMetricModal] = useState(false);
  const [showDataEntryModal, setShowDataEntryModal] = useState(false);
  const [editingMetric, setEditingMetric] = useState<Metric | null>(null);
  const [selectedMetricForData, setSelectedMetricForData] = useState<Metric | null>(null);
  const [dataPointCounts, setDataPointCounts] = useState<Record<string, number>>({});

  const categoryColorMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach(c => { map[c.slug] = c.color; });
    return map;
  }, [categories]);

  const categoryNameMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach(c => { map[c.slug] = c.name; });
    return map;
  }, [categories]);

  useEffect(() => {
    loadCategories();
    loadMetrics();
  }, [clientId]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('metric_categories')
        .select('*')
        .eq('client_id', clientId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('metric_definitions')
        .select('*')
        .eq('client_id', clientId)
        .order('category', { ascending: true });

      if (error) throw error;
      setMetrics(data || []);

      if (data && data.length > 0) {
        const metricIds = data.map(m => m.id);
        const { data: countData } = await supabase
          .from('historical_metric_data')
          .select('metric_id')
          .in('metric_id', metricIds);

        const counts: Record<string, number> = {};
        countData?.forEach((row: any) => {
          counts[row.metric_id] = (counts[row.metric_id] || 0) + 1;
        });
        setDataPointCounts(counts);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMetric = () => {
    setEditingMetric(null);
    setShowMetricModal(true);
  };

  const handleEditMetric = (metric: Metric) => {
    setEditingMetric(metric);
    setShowMetricModal(true);
  };

  const handleDeleteMetric = async (metric: Metric) => {
    if (!confirm(`Delete "${metric.metric_name}"? This will remove all historical data for this metric.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('metric_definitions')
        .delete()
        .eq('id', metric.id);

      if (error) throw error;
      loadMetrics();
    } catch (error) {
      console.error('Error deleting metric:', error);
      alert('Failed to delete metric. It may be in use by charts.');
    }
  };

  const handleToggleActive = async (metric: Metric) => {
    try {
      const { error } = await supabase
        .from('metric_definitions')
        .update({ is_active: !metric.is_active })
        .eq('id', metric.id);

      if (error) throw error;
      loadMetrics();
    } catch (error) {
      console.error('Error toggling metric:', error);
    }
  };

  const handleManageData = (metric: Metric) => {
    setSelectedMetricForData(metric);
    setShowDataEntryModal(true);
  };

  const filteredMetrics = metrics.filter(metric => {
    const matchesSearch = metric.metric_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         metric.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || metric.category === filterCategory;
    const matchesSource = filterSource === 'all' || metric.source_type === filterSource;
    return matchesSearch && matchesCategory && matchesSource;
  });

  const getSourceLabel = (sourceType: string) => {
    switch (sourceType) {
      case 'form_field': return 'Auto-tracked';
      case 'manual': return 'Manual Entry';
      case 'calculated': return 'Calculated';
      default: return sourceType;
    }
  };

  const getDataTypeLabel = (dataType: string) => {
    switch (dataType) {
      case 'currency': return 'Currency';
      case 'percentage': return 'Percentage';
      case 'decimal': return 'Decimal';
      default: return 'Number';
    }
  };

  const getCategoryColor = (slug: string) => categoryColorMap[slug] || FALLBACK_CATEGORY_COLOR;
  const getCategoryName = (slug: string) => categoryNameMap[slug] || slug;

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--slate-500, #64748b)' }}>
        <Activity size={32} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '16px' }}>Loading metrics...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '600', color: 'var(--slate-800, #1e293b)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={28} />
            Metric Library
          </h2>
          <p style={{ margin: 0, color: 'var(--slate-500, #64748b)', fontSize: '14px' }}>
            {metrics.length} metric{metrics.length !== 1 ? 's' : ''} configured across {categories.length} categories
          </p>
        </div>
        <button
          onClick={handleCreateMetric}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: 'var(--brand-primary, #06b6d4)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <Plus size={18} />
          Create Metric
        </button>
      </div>

      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '240px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400, #94a3b8)' }} />
          <input
            type="text"
            placeholder="Search metrics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              border: '1px solid var(--slate-200, #e2e8f0)',
              borderRadius: '8px',
              fontSize: '14px',
              background: 'white'
            }}
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{
            padding: '10px 32px 10px 12px',
            border: '1px solid var(--slate-200, #e2e8f0)',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer',
            background: 'white'
          }}
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat.slug} value={cat.slug}>{cat.name}</option>
          ))}
        </select>
        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          style={{
            padding: '10px 32px 10px 12px',
            border: '1px solid var(--slate-200, #e2e8f0)',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer',
            background: 'white'
          }}
        >
          <option value="all">All Sources</option>
          <option value="form_field">Auto-tracked</option>
          <option value="manual">Manual Entry</option>
          <option value="calculated">Calculated</option>
        </select>
      </div>

      {filteredMetrics.length === 0 ? (
        <div style={{
          background: 'white',
          border: '2px dashed var(--slate-200, #e2e8f0)',
          borderRadius: '12px',
          padding: '60px 20px',
          textAlign: 'center'
        }}>
          <TrendingUp size={48} style={{ color: 'var(--slate-300, #cbd5e1)', marginBottom: '16px' }} />
          <h3 style={{ margin: '0 0 8px 0', color: 'var(--slate-600, #475569)', fontSize: '18px', fontWeight: '600' }}>
            {metrics.length === 0 ? 'No Metrics Yet' : 'No Matching Metrics'}
          </h3>
          <p style={{ margin: '0 0 20px 0', color: 'var(--slate-500, #64748b)', fontSize: '14px' }}>
            {metrics.length === 0
              ? 'Create your first metric to start tracking data over time'
              : 'Try adjusting your filters or search term'
            }
          </p>
          {metrics.length === 0 && (
            <button
              onClick={handleCreateMetric}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'var(--brand-primary, #06b6d4)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <Plus size={18} />
              Create Your First Metric
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {filteredMetrics.map(metric => {
            const iconConfig = getIconComponent(metric.icon, metric.category);
            const CategoryIcon = iconConfig.component;
            const categoryColor = getCategoryColor(metric.category);
            const dataPointCount = dataPointCounts[metric.id] || 0;

            return (
              <div
                key={metric.id}
                style={{
                  background: 'white',
                  border: '1px solid var(--slate-200, #e2e8f0)',
                  borderRadius: '12px',
                  padding: '20px',
                  position: 'relative',
                  opacity: metric.is_active ? 1 : 0.6,
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'start', gap: '12px', marginBottom: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: `${categoryColor}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <CategoryIcon size={20} style={{ color: categoryColor }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      margin: '0 0 4px 0',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: 'var(--slate-800, #1e293b)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {metric.metric_name}
                    </h3>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '12px',
                        padding: '2px 8px',
                        background: `${categoryColor}15`,
                        color: categoryColor,
                        borderRadius: '4px',
                        fontWeight: '500',
                        textTransform: 'capitalize'
                      }}>
                        {getCategoryName(metric.category)}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        padding: '2px 8px',
                        background: 'var(--slate-50, #f1f5f9)',
                        color: 'var(--slate-500, #64748b)',
                        borderRadius: '4px'
                      }}>
                        {getSourceLabel(metric.source_type)}
                      </span>
                    </div>
                  </div>
                </div>

                {metric.description && (
                  <p style={{
                    margin: '0 0 12px 0',
                    fontSize: '13px',
                    color: 'var(--slate-500, #64748b)',
                    lineHeight: '1.5'
                  }}>
                    {metric.description}
                  </p>
                )}

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  marginBottom: '16px',
                  padding: '12px',
                  background: 'var(--slate-50, #f8fafc)',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}>
                  <div>
                    <div style={{ color: 'var(--slate-400, #94a3b8)', marginBottom: '2px' }}>Type</div>
                    <div style={{ color: 'var(--slate-800, #1e293b)', fontWeight: '500' }}>{getDataTypeLabel(metric.data_type)}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--slate-400, #94a3b8)', marginBottom: '2px' }}>Unit</div>
                    <div style={{ color: 'var(--slate-800, #1e293b)', fontWeight: '500' }}>{metric.unit || '\u2014'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--slate-400, #94a3b8)', marginBottom: '2px' }}>Data Points</div>
                    <div style={{ color: 'var(--slate-800, #1e293b)', fontWeight: '500' }}>{dataPointCount}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--slate-400, #94a3b8)', marginBottom: '2px' }}>Status</div>
                    <div style={{ color: metric.is_active ? '#10b981' : '#f59e0b', fontWeight: '500' }}>
                      {metric.is_active ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleManageData(metric)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: 'var(--slate-50, #f1f5f9)',
                      color: 'var(--brand-primary, #06b6d4)',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--slate-100, #e2e8f0)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--slate-50, #f1f5f9)'}
                  >
                    Manage Data
                  </button>
                  <button
                    onClick={() => handleEditMetric(metric)}
                    style={{
                      padding: '8px 12px',
                      background: 'var(--slate-50, #f1f5f9)',
                      color: 'var(--slate-500, #64748b)',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--slate-100, #e2e8f0)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--slate-50, #f1f5f9)'}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleToggleActive(metric)}
                    style={{
                      padding: '8px 12px',
                      background: 'var(--slate-50, #f1f5f9)',
                      color: metric.is_active ? '#f59e0b' : '#10b981',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--slate-100, #e2e8f0)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--slate-50, #f1f5f9)'}
                    title={metric.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {metric.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={() => handleDeleteMetric(metric)}
                    style={{
                      padding: '8px 12px',
                      background: '#fef2f2',
                      color: '#ef4444',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--slate-200, #e2e8f0)' }}>
        <SavedGraphsList clientId={clientId} />
      </div>

      {showMetricModal && (
        <MetricFormModal
          clientId={clientId}
          metric={editingMetric}
          categories={categories}
          onClose={() => {
            setShowMetricModal(false);
            setEditingMetric(null);
          }}
          onSave={() => {
            setShowMetricModal(false);
            setEditingMetric(null);
            loadMetrics();
          }}
        />
      )}

      {showDataEntryModal && selectedMetricForData && (
        <ManualDataEntryModal
          clientId={clientId}
          metric={selectedMetricForData}
          onClose={() => {
            setShowDataEntryModal(false);
            setSelectedMetricForData(null);
          }}
          onSave={() => {
            setShowDataEntryModal(false);
            setSelectedMetricForData(null);
            loadMetrics();
          }}
        />
      )}
    </div>
  );
}
