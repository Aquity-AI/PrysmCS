import React, { useState, useEffect, useCallback } from 'react';
import { BarChart2, Trash2, Eye, EyeOff, Loader, Edit2, Copy, Plus, X, AlertTriangle } from 'lucide-react';
import { supabase } from './supabaseClient';
import { fetchAllGraphsForClient, updateGraph, deleteGraph as deleteGraphService, createGraph } from './dashboardGraphService';
import { EditGraphModal } from './EditGraphModal';
import { AddGraphModal } from './AddGraphModal';
import { ChartTypeIcon } from './ChartTypeIcons';
import { CHART_TYPE_OPTIONS, SIZE_OPTIONS } from './types';
import type { DashboardGraph } from './types';

interface SavedGraphsListProps {
  clientId: string;
}

const PAGE_LABELS: Record<string, string> = {
  overview: 'Overview',
  enrollment: 'Customers',
  financial: 'Financial',
  outcomes: 'Outcomes',
  stories: 'Success Stories',
  initiatives: 'Strategic Priorities',
  opportunities: 'Opportunities',
};

const PAGE_OPTIONS = Object.entries(PAGE_LABELS);

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '28px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: '#fef2f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <AlertTriangle size={20} style={{ color: '#ef4444' }} />
          </div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>
            {title}
          </h3>
        </div>
        <p style={{ margin: '0 0 24px', fontSize: '13px', color: '#64748b', lineHeight: '1.6' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#475569',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              background: '#ef4444',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'white',
              cursor: 'pointer',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SavedGraphsList({ clientId }: SavedGraphsListProps) {
  const [graphs, setGraphs] = useState<DashboardGraph[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPage, setFilterPage] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const [editingGraph, setEditingGraph] = useState<DashboardGraph | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DashboardGraph | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addToPage, setAddToPage] = useState<string>('overview');

  const loadGraphs = useCallback(async () => {
    if (!clientId) return;
    try {
      setLoading(true);
      const data = await fetchAllGraphsForClient(clientId);
      setGraphs(data);
    } catch (err) {
      console.error('Failed to load graphs:', err);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadGraphs();
  }, [loadGraphs]);

  useEffect(() => {
    if (!clientId) return;
    const channel = supabase
      .channel(`saved-graphs-${clientId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'dashboard_graphs',
        filter: `client_id=eq.${clientId}`,
      }, () => {
        loadGraphs();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [clientId, loadGraphs]);

  const toggleEnabled = async (graph: DashboardGraph) => {
    try {
      await updateGraph(graph.id, { enabled: !graph.enabled });
      setGraphs(prev => prev.map(g =>
        g.id === graph.id ? { ...g, enabled: !g.enabled } : g
      ));
    } catch (err) {
      console.error('Failed to toggle graph:', err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteGraphService(deleteTarget.id);
      setGraphs(prev => prev.filter(g => g.id !== deleteTarget.id));
    } catch (err) {
      console.error('Failed to delete graph:', err);
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleDuplicate = async (graph: DashboardGraph) => {
    setDuplicating(graph.id);
    try {
      await createGraph({
        client_id: graph.client_id,
        page_id: graph.page_id,
        title: `${graph.title} (copy)`,
        chart_type: graph.chart_type,
        size: graph.size,
        metric_ids: Array.isArray(graph.metric_ids) ? graph.metric_ids : [],
        time_range: graph.time_range || undefined,
        group_by: graph.group_by || undefined,
        goals: graph.goals || undefined,
        config: graph.config || undefined,
      });
      await loadGraphs();
    } catch (err) {
      console.error('Failed to duplicate graph:', err);
    } finally {
      setDuplicating(null);
    }
  };

  const filtered = graphs.filter(g => {
    if (filterPage !== 'all' && g.page_id !== filterPage) return false;
    if (filterType !== 'all' && g.chart_type !== filterType) return false;
    return true;
  });

  const uniquePages = [...new Set(graphs.map(g => g.page_id))];

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px',
        color: '#64748b',
      }}>
        <Loader size={20} className="animate-spin" style={{ marginRight: '8px' }} />
        Loading saved graphs...
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>
            Saved Graphs
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>
            {graphs.length} graph{graphs.length !== 1 ? 's' : ''} across all tabs
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={filterPage}
            onChange={e => setFilterPage(e.target.value)}
            style={{
              padding: '6px 12px',
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#334155',
            }}
          >
            <option value="all">All Tabs</option>
            {uniquePages.map(p => (
              <option key={p} value={p}>{PAGE_LABELS[p] || p}</option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{
              padding: '6px 12px',
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#334155',
            }}
          >
            <option value="all">All Types</option>
            {CHART_TYPE_OPTIONS.map(opt => (
              <option key={opt.type} value={opt.type}>{opt.label}</option>
            ))}
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <select
              value={addToPage}
              onChange={e => setAddToPage(e.target.value)}
              style={{
                padding: '6px 12px',
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#334155',
              }}
            >
              {PAGE_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 14px',
                background: 'var(--brand-primary, #06b6d4)',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'white',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <Plus size={14} />
              Add Graph
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 20px',
          color: '#94a3b8',
          background: '#f8fafc',
          borderRadius: '10px',
          border: '1px dashed #e2e8f0',
        }}>
          <BarChart2 size={32} style={{ marginBottom: '12px', color: '#cbd5e1' }} />
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>
            {graphs.length === 0
              ? 'No graphs created yet. Click "Add Graph" to get started.'
              : 'No graphs match your filters.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(graph => {
            const chartLabel = CHART_TYPE_OPTIONS.find(o => o.type === graph.chart_type)?.label || graph.chart_type;
            const sizeLabel = SIZE_OPTIONS.find(o => o.value === graph.size)?.label || graph.size;
            const pageLabel = PAGE_LABELS[graph.page_id] || graph.page_id;
            const metricCount = Array.isArray(graph.metric_ids) ? graph.metric_ids.length : 0;
            const isDuplicating = duplicating === graph.id;

            return (
              <div
                key={graph.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  background: graph.enabled ? '#fff' : '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  opacity: graph.enabled ? 1 : 0.6,
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <ChartTypeIcon type={graph.chart_type} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#1e293b',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {graph.title}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '2px',
                    fontSize: '11px',
                    color: '#64748b',
                  }}>
                    <span>{chartLabel}</span>
                    <span style={{ color: '#cbd5e1' }}>|</span>
                    <span>{sizeLabel}</span>
                    <span style={{ color: '#cbd5e1' }}>|</span>
                    <span>{metricCount} metric{metricCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                <span style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  padding: '3px 10px',
                  borderRadius: '12px',
                  background: '#f0fdfa',
                  color: '#0d9488',
                  flexShrink: 0,
                }}>
                  {pageLabel}
                </span>

                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <button
                    onClick={() => setEditingGraph(graph)}
                    title="Edit graph"
                    style={{
                      background: 'transparent',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDuplicate(graph)}
                    title="Duplicate graph"
                    disabled={isDuplicating}
                    style={{
                      background: 'transparent',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      cursor: isDuplicating ? 'wait' : 'pointer',
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      opacity: isDuplicating ? 0.5 : 1,
                    }}
                  >
                    {isDuplicating
                      ? <Loader size={14} className="animate-spin" />
                      : <Copy size={14} />
                    }
                  </button>
                  <button
                    onClick={() => toggleEnabled(graph)}
                    title={graph.enabled ? 'Hide graph' : 'Show graph'}
                    style={{
                      background: 'transparent',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      color: graph.enabled ? '#64748b' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {graph.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(graph)}
                    title="Delete graph"
                    style={{
                      background: 'transparent',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      color: '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingGraph && (
        <EditGraphModal
          graph={editingGraph}
          clientId={clientId}
          onClose={() => setEditingGraph(null)}
          onUpdated={() => {
            setEditingGraph(null);
            loadGraphs();
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Graph"
          message={`Are you sure you want to delete "${deleteTarget.title}"? This graph will be soft-deleted and can be recovered within 90 days.`}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {showAddModal && (
        <AddGraphModal
          clientId={clientId}
          pageId={addToPage}
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            setShowAddModal(false);
            loadGraphs();
          }}
        />
      )}
    </div>
  );
}
