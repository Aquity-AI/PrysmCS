import { useState, useEffect } from 'react';
import {
  Building2, Search, Plus, Loader2, Users, Calendar,
  CheckCircle2, Pause, Archive, Trash2, MoreVertical, X,
} from 'lucide-react';
import { superAdminApi } from '../api';
import { useSuperAdminAuth } from '../AuthContext';

interface Workspace {
  id: string;
  slug: string;
  name: string;
  owner_email: string;
  status: string;
  plan_tier: string | null;
  user_count: number;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: typeof CheckCircle2 }> = {
  active: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: CheckCircle2 },
  paused: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Pause },
  archived: { color: '#64748b', bg: 'rgba(100,116,139,0.1)', icon: Archive },
  deleted: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: Trash2 },
};

export default function WorkspacesPage({ onNavigate }: { onNavigate: (page: string, data?: unknown) => void }) {
  const { token } = useSuperAdminAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pauseModal, setPauseModal] = useState<{ id: string; name: string } | null>(null);
  const [pauseReason, setPauseReason] = useState('');

  const loadWorkspaces = async () => {
    if (!token) return;
    try {
      const data = await superAdminApi.listWorkspaces(token);
      setWorkspaces(data.workspaces || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadWorkspaces(); }, [token]);

  const handleStatusChange = async (workspaceId: string, status: string, reason?: string) => {
    if (!token) return;
    setActionLoading(workspaceId);
    setMenuOpen(null);
    try {
      await superAdminApi.updateWorkspaceStatus(token, { workspace_id: workspaceId, status, reason });
      await loadWorkspaces();
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = workspaces.filter(w => {
    const matchesSearch = !search ||
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.slug.toLowerCase().includes(search.toLowerCase()) ||
      w.owner_email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Workspaces</h1>
          <p className="text-sm text-slate-400">{workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''} total</p>
        </div>
        <button onClick={() => onNavigate('create-workspace')}
          className="h-9 px-4 rounded-lg text-sm font-semibold text-white flex items-center gap-2 transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}>
          <Plus className="w-4 h-4" /> New Workspace
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search workspaces..."
            className="w-full h-9 pl-9 pr-3 rounded-lg text-sm text-white placeholder-slate-500 outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {['all', 'active', 'paused', 'archived'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize"
              style={{
                background: statusFilter === s ? 'rgba(14,165,233,0.15)' : 'transparent',
                color: statusFilter === s ? '#38bdf8' : '#94a3b8',
              }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-xl border"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">{search ? 'No matching workspaces' : 'No workspaces yet'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(ws => {
            const sc = STATUS_CONFIG[ws.status] || STATUS_CONFIG.active;
            const StatusIcon = sc.icon;
            return (
              <div key={ws.id}
                className="rounded-xl border p-4 flex items-center gap-4 transition-all hover:translate-y-[-1px] cursor-pointer group"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
                onClick={() => onNavigate('workspace-detail', { id: ws.id })}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(14,165,233,0.1)' }}>
                  <Building2 className="w-5 h-5 text-sky-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-white truncate">{ws.name}</span>
                    <span className="text-[10px] font-mono text-slate-500">/{ws.slug}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">{ws.owner_email}</div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Users className="w-3.5 h-3.5" />
                    {ws.user_count}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(ws.created_at).toLocaleDateString()}
                  </div>
                  {ws.plan_tier && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium text-sky-300"
                      style={{ background: 'rgba(14,165,233,0.1)' }}>
                      {ws.plan_tier}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md" style={{ background: sc.bg }}>
                    <StatusIcon className="w-3 h-3" style={{ color: sc.color }} />
                    <span className="text-[10px] font-semibold capitalize" style={{ color: sc.color }}>{ws.status}</span>
                  </div>

                  <div className="relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setMenuOpen(menuOpen === ws.id ? null : ws.id)}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                      {actionLoading === ws.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MoreVertical className="w-3.5 h-3.5" />}
                    </button>
                    {menuOpen === ws.id && (
                      <div className="absolute right-0 top-full mt-1 w-40 rounded-lg border py-1 z-50"
                        style={{ background: '#1a2540', borderColor: 'rgba(255,255,255,0.1)' }}>
                        {ws.status !== 'active' && (
                          <button onClick={() => handleStatusChange(ws.id, 'active')}
                            className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/5 flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Reactivate
                          </button>
                        )}
                        {ws.status === 'active' && (
                          <button onClick={() => { setPauseModal({ id: ws.id, name: ws.name }); setMenuOpen(null); }}
                            className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/5 flex items-center gap-2">
                            <Pause className="w-3.5 h-3.5 text-amber-400" /> Pause
                          </button>
                        )}
                        {ws.status !== 'archived' && ws.status !== 'deleted' && (
                          <button onClick={() => handleStatusChange(ws.id, 'archived')}
                            className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/5 flex items-center gap-2">
                            <Archive className="w-3.5 h-3.5 text-slate-400" /> Archive
                          </button>
                        )}
                        {ws.status !== 'deleted' && (
                          <button onClick={() => handleStatusChange(ws.id, 'deleted')}
                            className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pauseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setPauseModal(null)}>
          <div className="w-full max-w-md rounded-2xl border p-6"
            style={{ background: '#141e33', borderColor: 'rgba(255,255,255,0.08)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-white">Pause Workspace</h3>
              <button onClick={() => setPauseModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Pausing <strong className="text-white">{pauseModal.name}</strong> will prevent users from making changes. They can still log in and view data.
            </p>
            <textarea
              value={pauseReason}
              onChange={e => setPauseReason(e.target.value)}
              placeholder="Reason for pausing (optional)"
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-slate-500 outline-none resize-none mb-4"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <div className="flex items-center gap-3 justify-end">
              <button onClick={() => setPauseModal(null)}
                className="h-9 px-4 rounded-lg text-sm font-medium text-slate-400 hover:text-white transition-all">
                Cancel
              </button>
              <button onClick={async () => {
                await handleStatusChange(pauseModal.id, 'paused', pauseReason);
                setPauseModal(null);
                setPauseReason('');
              }}
                className="h-9 px-4 rounded-lg text-sm font-semibold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                Pause Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
