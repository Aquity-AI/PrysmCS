import React, { useState, useEffect } from 'react';
import { Plus, LayoutDashboard, AlertCircle, Loader, Settings } from 'lucide-react';
import { supabase } from './supabaseClient';
import { PageSummaryItemForm } from './PageSummaryItemForm';
import { PageSummaryItemCard } from './PageSummaryItemCard';
import { getGridItemStyle } from '../utils/gridUtils';

interface PageSummaryManagerProps {
  section: {
    id: string;
    title: string;
    linkedTabId?: string;
    summaryMode?: string;
    layoutStyle?: string;
    maxItems?: number;
  };
  clientId: string;
  pageId: string;
  showEditControls?: boolean;
}

interface PageSummaryItem {
  id: string;
  summary_id: string;
  item_order: number;
  label: string;
  metric_value: string;
  trend_direction: 'positive' | 'negative' | 'neutral';
  description_text: string;
  is_visible: boolean;
  is_ai_generated: boolean;
}

interface PageSummary {
  id: string;
  client_id: string;
  page_id: string;
  section_id: string;
  title: string;
  subtitle: string;
  summary_mode: string;
  layout_style: string;
  max_items: number;
  width_units: number;
  enabled: boolean;
}

export function PageSummaryManager({
  section,
  clientId,
  pageId,
  showEditControls = true,
}: PageSummaryManagerProps) {
  const [items, setItems] = useState<PageSummaryItem[]>([]);
  const [summaryRecord, setSummaryRecord] = useState<PageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PageSummaryItem | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showWidthConfig, setShowWidthConfig] = useState(false);
  const [tempWidthUnits, setTempWidthUnits] = useState<number>(12);

  const maxItems = section.maxItems || 4;

  useEffect(() => {
    loadSummaryData();
  }, [clientId, pageId, section.id]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    if (summaryRecord) {
      setTempWidthUnits(summaryRecord.width_units);
    }
  }, [summaryRecord]);

  const loadSummaryData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[PageSummaryManager] Loading summary data:', {
        clientId,
        pageId,
        sectionId: section.id,
        showEditControls
      });

      const { data: summary, error: summaryError } = await supabase
        .from('page_summaries')
        .select('*')
        .eq('client_id', clientId)
        .eq('page_id', pageId)
        .eq('section_id', section.id)
        .maybeSingle();

      if (summaryError) throw summaryError;

      if (summary) {
        setSummaryRecord(summary);

        const { data: itemsData, error: itemsError } = await supabase
          .from('page_summary_items')
          .select('*')
          .eq('summary_id', summary.id)
          .order('item_order', { ascending: true });

        if (itemsError) throw itemsError;
        console.log('[PageSummaryManager] Loaded items:', itemsData);
        setItems(itemsData || []);
      } else {
        console.log('[PageSummaryManager] No summary found');
        setSummaryRecord(null);
        setItems([]);
      }
    } catch (err) {
      console.error('Error loading summary data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load summary data');
    } finally {
      setLoading(false);
    }
  };

  const ensureSummaryRecord = async (): Promise<string | null> => {
    if (summaryRecord) return summaryRecord.id;

    try {
      const insertData = {
        client_id: clientId,
        page_id: pageId,
        section_id: section.id,
        title: section.title,
        summary_mode: section.summaryMode || 'manual',
        layout_style: section.layoutStyle || 'grid',
        max_items: maxItems,
        enabled: true,
      };

      console.log('[PageSummaryManager] Creating page_summaries record with:', insertData);
      console.log('[PageSummaryManager] Section details:', {
        sectionId: section.id,
        linkedTabId: section.linkedTabId,
        receivedPageId: pageId
      });

      const { data, error } = await supabase
        .from('page_summaries')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      console.log('[PageSummaryManager] Successfully created page_summaries record:', data);
      setSummaryRecord(data);
      return data.id;
    } catch (err) {
      console.error('[PageSummaryManager] Error creating summary record:', err);
      setNotification({ type: 'error', message: 'Failed to create summary record' });
      return null;
    }
  };

  const handleCreateItem = async (itemData: Omit<PageSummaryItem, 'id' | 'summary_id' | 'item_order'>) => {
    try {
      console.log('[PageSummaryManager] Creating item with data:', itemData);

      const summaryId = await ensureSummaryRecord();
      console.log('[PageSummaryManager] Summary ID:', summaryId);

      if (!summaryId) {
        console.error('[PageSummaryManager] Failed to get summary ID');
        return;
      }

      const nextOrder = items.length > 0 ? Math.max(...items.map(i => i.item_order)) + 1 : 0;
      console.log('[PageSummaryManager] Next order:', nextOrder);

      const insertData = {
        summary_id: summaryId,
        item_order: nextOrder,
        ...itemData,
      };
      console.log('[PageSummaryManager] Inserting:', insertData);

      const { data, error } = await supabase
        .from('page_summary_items')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('[PageSummaryManager] Insert error:', error);
        throw error;
      }

      console.log('[PageSummaryManager] Item created successfully:', data);
      setItems([...items, data]);
      setShowForm(false);
      setNotification({ type: 'success', message: 'Summary item created successfully' });
    } catch (err) {
      console.error('[PageSummaryManager] Error creating item:', err);
      setNotification({ type: 'error', message: `Failed to create summary item: ${err instanceof Error ? err.message : 'Unknown error'}` });
    }
  };

  const handleUpdateItem = async (itemId: string, itemData: Partial<PageSummaryItem>) => {
    try {
      const { data, error } = await supabase
        .from('page_summary_items')
        .update(itemData)
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;

      setItems(items.map(item => (item.id === itemId ? data : item)));
      setEditingItem(null);
      setNotification({ type: 'success', message: 'Summary item updated successfully' });
    } catch (err) {
      console.error('Error updating item:', err);
      setNotification({ type: 'error', message: 'Failed to update summary item' });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this summary item?')) return;

    try {
      const { error } = await supabase
        .from('page_summary_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      const remainingItems = items.filter(item => item.id !== itemId);
      await reorderItems(remainingItems);
      setNotification({ type: 'success', message: 'Summary item deleted successfully' });
    } catch (err) {
      console.error('Error deleting item:', err);
      setNotification({ type: 'error', message: 'Failed to delete summary item' });
    }
  };

  const reorderItems = async (orderedItems: PageSummaryItem[]) => {
    try {
      const updates = orderedItems.map((item, index) => ({
        id: item.id,
        item_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from('page_summary_items')
          .update({ item_order: update.item_order })
          .eq('id', update.id);
      }

      setItems(orderedItems.map((item, index) => ({ ...item, item_order: index })));
    } catch (err) {
      console.error('Error reordering items:', err);
      setNotification({ type: 'error', message: 'Failed to reorder items' });
    }
  };

  const handleMoveItem = async (itemId: string, direction: 'up' | 'down') => {
    const currentIndex = items.findIndex(item => item.id === itemId);
    if (currentIndex === -1) return;
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === items.length - 1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const newItems = [...items];
    const [movedItem] = newItems.splice(currentIndex, 1);
    newItems.splice(newIndex, 0, movedItem);

    setItems(newItems);
    await reorderItems(newItems);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const handleUpdateWidth = async (newWidth: number) => {
    try {
      const summaryId = await ensureSummaryRecord();
      if (!summaryId) {
        setNotification({ type: 'error', message: 'Failed to update width: no summary record' });
        return;
      }

      const { error } = await supabase
        .from('page_summaries')
        .update({ width_units: newWidth })
        .eq('id', summaryId);

      if (error) throw error;

      setSummaryRecord(prev => prev ? { ...prev, width_units: newWidth } : null);
      setNotification({ type: 'success', message: 'Section width updated successfully' });
    } catch (err) {
      console.error('Error updating width:', err);
      setNotification({ type: 'error', message: 'Failed to update section width' });
    }
  };

  if (loading) {
    return (
      <div
        className="page-summary-manager grid-item"
        style={{ ...getGridItemStyle(12), padding: '20px', textAlign: 'center' }}
        data-width="12"
      >
        <Loader size={24} className="animate-spin" style={{ margin: '0 auto', color: 'var(--brand-primary)' }} />
        <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--slate-500)' }}>Loading summary data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="page-summary-manager grid-item"
        style={{ ...getGridItemStyle(12), padding: '20px' }}
        data-width="12"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--red-600)' }}>
          <AlertCircle size={20} />
          <p style={{ margin: 0, fontSize: '14px' }}>{error}</p>
        </div>
        <button
          onClick={loadSummaryData}
          style={{
            marginTop: '12px',
            padding: '8px 16px',
            background: 'var(--brand-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Client-facing view (read-only display of summary items)
  if (!showEditControls) {
    const visibleItems = items.filter(item => item.is_visible);
    const widthUnits = summaryRecord?.width_units || 12;

    if (visibleItems.length === 0) {
      return (
        <div
          className="page-summary-manager grid-item"
          style={{
            ...getGridItemStyle(widthUnits),
            padding: '40px 20px',
            textAlign: 'center',
            color: 'var(--slate-400)',
            fontSize: '14px'
          }}
          data-width={widthUnits}
        >
          No summary items configured yet. Go to Data Management to add items.
        </div>
      );
    }

    return (
      <div
        className="page-summary-manager grid-item"
        style={{
          ...getGridItemStyle(widthUnits),
          display: 'grid',
          gridTemplateColumns: section.layoutStyle === 'grid'
            ? 'repeat(auto-fit, minmax(250px, 1fr))'
            : '1fr',
          gap: '16px',
        padding: '20px',
      }}>
        {visibleItems.map((item) => (
          <div
            key={item.id}
            style={{
              padding: '20px',
              background: 'white',
              borderRadius: '8px',
              border: '1px solid var(--slate-200)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--slate-500)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px'
            }}>
              {item.label}
            </div>
            <div style={{
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--slate-900)',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {item.metric_value}
              {item.trend_direction === 'positive' && (
                <span style={{ color: 'var(--green-600)', fontSize: '20px' }}>↑</span>
              )}
              {item.trend_direction === 'negative' && (
                <span style={{ color: 'var(--red-600)', fontSize: '20px' }}>↓</span>
              )}
            </div>
            <div style={{
              fontSize: '13px',
              color: 'var(--slate-600)',
              lineHeight: '1.5'
            }}>
              {item.description_text}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Data Management view (edit controls)
  const widthUnits = summaryRecord?.width_units || 12;

  return (
    <div
      className="page-summary-manager grid-item"
      style={{
        ...getGridItemStyle(widthUnits),
        padding: '20px',
        background: 'var(--slate-50)',
        borderRadius: '8px',
        marginTop: '12px'
      }}
      data-width={widthUnits}
    >
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '16px 24px',
            background: notification.type === 'success' ? '#16a34a' : '#dc2626',
            color: 'white',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            zIndex: 99999,
            fontSize: '14px',
            fontWeight: 600,
            border: `2px solid ${notification.type === 'success' ? '#15803d' : '#b91c1c'}`,
            animation: 'slideInRight 0.3s ease-out',
          }}
        >
          {notification.message}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LayoutDashboard size={16} style={{ color: 'var(--brand-primary)' }} />
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
            Page Summary Items ({items.length} of {maxItems})
          </h4>
        </div>
        {items.length < maxItems && !showForm && !editingItem && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'var(--brand-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <Plus size={16} /> Add Summary Item
          </button>
        )}
      </div>

      {items.length >= maxItems && !showForm && !editingItem && (
        <div
          style={{
            padding: '12px',
            background: 'var(--amber-50)',
            border: '1px solid var(--amber-200)',
            borderRadius: '6px',
            marginBottom: '16px',
          }}
        >
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--amber-800)' }}>
            Maximum number of summary items reached ({maxItems}). Delete an existing item to add a new one.
          </p>
        </div>
      )}

      {(showForm || editingItem) && (
        <PageSummaryItemForm
          item={editingItem}
          onSave={editingItem ? (data) => handleUpdateItem(editingItem.id, data) : handleCreateItem}
          onCancel={handleFormCancel}
        />
      )}

      {items.length === 0 && !showForm && !editingItem ? (
        <div
          style={{
            padding: '32px',
            background: 'white',
            borderRadius: '6px',
            border: '1px dashed var(--slate-300)',
            textAlign: 'center',
          }}
        >
          <LayoutDashboard size={32} style={{ color: 'var(--slate-300)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '14px', color: 'var(--slate-600)', margin: 0 }}>
            No summary items yet. Click "Add Summary Item" to get started.
          </p>
        </div>
      ) : (
        !showForm &&
        !editingItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {items.map((item, index) => (
              <PageSummaryItemCard
                key={item.id}
                item={item}
                index={index}
                totalItems={items.length}
                onEdit={() => setEditingItem(item)}
                onDelete={() => handleDeleteItem(item.id)}
                onMoveUp={() => handleMoveItem(item.id, 'up')}
                onMoveDown={() => handleMoveItem(item.id, 'down')}
              />
            ))}
          </div>
        )
      )}

      <div style={{ marginTop: '20px', padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid var(--slate-200)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={16} style={{ color: 'var(--brand-primary)' }} />
            <h5 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--slate-700)' }}>
              Section Width Configuration
            </h5>
          </div>
          <button
            onClick={() => setShowWidthConfig(!showWidthConfig)}
            style={{
              padding: '4px 12px',
              background: 'transparent',
              color: 'var(--brand-primary)',
              border: '1px solid var(--brand-primary)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            {showWidthConfig ? 'Hide' : 'Configure'}
          </button>
        </div>

        {showWidthConfig && (
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--slate-700)', marginBottom: '8px' }}>
              Width (Grid Columns)
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setTempWidthUnits(3);
                  handleUpdateWidth(3);
                }}
                style={{
                  padding: '6px 12px',
                  background: widthUnits === 3 ? 'var(--brand-primary)' : 'white',
                  color: widthUnits === 3 ? 'white' : 'var(--slate-700)',
                  border: `1px solid ${widthUnits === 3 ? 'var(--brand-primary)' : 'var(--slate-300)'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                Quarter (3/12)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTempWidthUnits(4);
                  handleUpdateWidth(4);
                }}
                style={{
                  padding: '6px 12px',
                  background: widthUnits === 4 ? 'var(--brand-primary)' : 'white',
                  color: widthUnits === 4 ? 'white' : 'var(--slate-700)',
                  border: `1px solid ${widthUnits === 4 ? 'var(--brand-primary)' : 'var(--slate-300)'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                Third (4/12)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTempWidthUnits(6);
                  handleUpdateWidth(6);
                }}
                style={{
                  padding: '6px 12px',
                  background: widthUnits === 6 ? 'var(--brand-primary)' : 'white',
                  color: widthUnits === 6 ? 'white' : 'var(--slate-700)',
                  border: `1px solid ${widthUnits === 6 ? 'var(--brand-primary)' : 'var(--slate-300)'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                Half (6/12)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTempWidthUnits(8);
                  handleUpdateWidth(8);
                }}
                style={{
                  padding: '6px 12px',
                  background: widthUnits === 8 ? 'var(--brand-primary)' : 'white',
                  color: widthUnits === 8 ? 'white' : 'var(--slate-700)',
                  border: `1px solid ${widthUnits === 8 ? 'var(--brand-primary)' : 'var(--slate-300)'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                Two-Thirds (8/12)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTempWidthUnits(12);
                  handleUpdateWidth(12);
                }}
                style={{
                  padding: '6px 12px',
                  background: widthUnits === 12 ? 'var(--brand-primary)' : 'white',
                  color: widthUnits === 12 ? 'white' : 'var(--slate-700)',
                  border: `1px solid ${widthUnits === 12 ? 'var(--brand-primary)' : 'var(--slate-300)'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                Full (12/12)
              </button>
            </div>
            <input
              type="number"
              value={tempWidthUnits}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 12;
                const clampedValue = Math.max(1, Math.min(12, value));
                setTempWidthUnits(clampedValue);
              }}
              onBlur={() => handleUpdateWidth(tempWidthUnits)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleUpdateWidth(tempWidthUnits);
                }
              }}
              min="1"
              max="12"
              step="1"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--slate-300)',
                borderRadius: '6px',
                fontSize: '14px',
              }}
              placeholder="Custom width (1-12)"
            />
            <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: 'var(--slate-500)' }}>
              Select a preset or enter a custom value (1-12 columns). Current: {widthUnits}/12
            </p>
          </div>
        )}
      </div>

      <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--slate-400)' }}>
        <strong>Mode:</strong> {section.summaryMode === 'manual' ? 'Manual Entry' : 'AI-Powered'} •{' '}
        <strong>Layout:</strong> {section.layoutStyle === 'grid' ? 'Grid' : 'List'}
      </div>
    </div>
  );
}
