import { useState, useEffect } from 'react';
import {
  ScrollText, Loader2, Search, ChevronLeft, ChevronRight,
  Clock, Filter,
} from 'lucide-react';
import { superAdminApi } from '../api';
import { useSuperAdminAuth } from '../AuthContext';

interface AuditEntry {
  id: string;
  action: string;
  user_email: string;
  user_name: string;
  user_role: string;
  resource: string;
  details: Record<string, unknown>;
  workspace_id: string | null;
  client_id: string | null;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  workspace_created: '#10b981',
  workspace_paused: '#f59e0b',
  workspace_archived: '#64748b',
  workspace_deleted: '#ef4444',
  workspace_active: '#10b981',
  workspace_updated: '#0ea5e9',
  user_invited: '#06b6d4',
  user_role_updated: '#8b5cf6',
  user_reactivated: '#10b981',
  user_deactivated: '#ef4444',
  user_removed_from_workspace: '#ef4444',
  invitation_accepted: '#10b981',
  invitation_revoked: '#ef4444',
  invitation_resent: '#f59e0b',
  super_admin_invited: '#0ea5e9',
  super_admin_updated: '#8b5cf6',
  password_reset_triggered: '#f59e0b',
  platform_bootstrapped: '#10b981',
};

const PAGE_SIZE = 50;

export default function AuditLogPage() {
  const { token } = useSuperAdminAuth();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [actionFilter, setActionFilter] = useState('');

  const loadAuditLog = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params: Record<string, string> = {
        limit: String(PAGE_SIZE),
        offset: String(offset),
      };
      if (actionFilter) params.action = actionFilter;
      const data = await superAdminApi.getAuditLog(token, params);
      setEntries(data.entries || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAuditLog(); }, [token, offset, actionFilter]);

  const filtered = entries.filter(e =>
    !search ||
    (e.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.user_email || '').toLowerCase().includes(search.toLowerCase()) ||
    e.action.toLowerCase().includes(search.toLowerCase()) ||
    e.resource.toLowerCase().includes(search.toLowerCase())
  );

  const uniqueActions = [...new Set(entries.map(e => e.action))].sort();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Audit Log</h1>
        <p className="text-sm text-slate-400">{total} total entries</p>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search audit log..."
            className="w-full h-9 pl-9 pr-3 rounded-lg text-sm text-white placeholder-slate-500 outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>
        <div className="relative">
          <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setOffset(0); }}
            className="h-9 pl-8 pr-3 rounded-lg text-xs text-white outline-none appearance-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <option value="" className="bg-slate-800">All Actions</option>
            {uniqueActions.map(a => (
              <option key={a} value={a} className="bg-slate-800">{a.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[40vh]">
          <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-xl border"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <ScrollText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">{search ? 'No matching entries' : 'No audit entries yet'}</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map(entry => {
            const actionColor = ACTION_COLORS[entry.action] || '#64748b';
            return (
              <div key={entry.id} className="rounded-lg border p-3.5 flex items-start gap-3"
                style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.04)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `${actionColor}15` }}>
                  <Clock className="w-3.5 h-3.5" style={{ color: actionColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-white">
                      {entry.user_name || entry.user_email || 'System'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold"
                      style={{ background: `${actionColor}15`, color: actionColor }}>
                      {entry.action.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {entry.resource}
                    {entry.user_role && <span className="ml-2 text-slate-600">({entry.user_role})</span>}
                  </div>
                  {entry.details && Object.keys(entry.details).length > 0 && (
                    <div className="mt-1.5 text-[10px] text-slate-500 font-mono truncate max-w-lg">
                      {JSON.stringify(entry.details)}
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 flex-shrink-0 whitespace-nowrap">
                  {new Date(entry.created_at).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-xs text-slate-500">
            Showing {offset + 1}-{Math.min(offset + PAGE_SIZE, total)} of {total}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              disabled={offset === 0}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setOffset(offset + PAGE_SIZE)}
              disabled={offset + PAGE_SIZE >= total}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
