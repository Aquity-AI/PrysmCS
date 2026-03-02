import { useState, useEffect } from 'react';
import {
  Mail, Loader2, Search, RefreshCw, XCircle, Clock,
  CheckCircle2, Building2, AlertTriangle,
} from 'lucide-react';
import { superAdminApi } from '../api';
import { useSuperAdminAuth } from '../AuthContext';

interface Invitation {
  id: string;
  token: string;
  type: string;
  invitee_email: string;
  invitee_name: string | null;
  invited_by: string;
  role: string;
  status: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  workspace_id: string | null;
  workspaces: { name: string; slug: string } | null;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: typeof CheckCircle2 }> = {
  pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Clock },
  accepted: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: CheckCircle2 },
  expired: { color: '#64748b', bg: 'rgba(100,116,139,0.1)', icon: AlertTriangle },
  revoked: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: XCircle },
};

export default function InvitationsPage() {
  const { token } = useSuperAdminAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadInvitations = async () => {
    if (!token) return;
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const data = await superAdminApi.listAllInvitations(token, params);
      setInvitations(data.invitations || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInvitations(); }, [token, statusFilter]);

  const handleAction = async (action: 'revoke' | 'resend', invId: string) => {
    if (!token) return;
    setActionLoading(invId);
    try {
      if (action === 'revoke') await superAdminApi.revokeInvitation(token, invId);
      else await superAdminApi.resendInvitation(token, invId);
      await loadInvitations();
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = invitations.filter(inv =>
    !search ||
    inv.invitee_email.toLowerCase().includes(search.toLowerCase()) ||
    (inv.invitee_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (inv.workspaces?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const timeUntilExpiry = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return `${Math.floor(diff / (1000 * 60))}m left`;
    if (hours < 24) return `${hours}h left`;
    return `${Math.floor(hours / 24)}d left`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Invitations</h1>
        <p className="text-sm text-slate-400">Manage all platform invitations</p>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search invitations..."
            className="w-full h-9 pl-9 pr-3 rounded-lg text-sm text-white placeholder-slate-500 outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>
        <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {['all', 'pending', 'accepted', 'expired', 'revoked'].map(s => (
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
          <Mail className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">{search ? 'No matching invitations' : 'No invitations yet'}</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(inv => {
            const sc = STATUS_CONFIG[inv.status] || STATUS_CONFIG.pending;
            const StatusIcon = sc.icon;
            return (
              <div key={inv.id} className="rounded-xl border p-4 flex items-center gap-3"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: sc.bg }}>
                  <StatusIcon className="w-4 h-4" style={{ color: sc.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{inv.invitee_email}</div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    {inv.invitee_name && <span>{inv.invitee_name}</span>}
                    {inv.workspaces && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {inv.workspaces.name}
                      </span>
                    )}
                    {inv.type === 'super_admin' && (
                      <span className="text-sky-400 font-medium">Super Admin</span>
                    )}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold capitalize"
                  style={{ background: sc.bg, color: sc.color }}>
                  {inv.status}
                </span>
                {inv.status === 'pending' && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    {timeUntilExpiry(inv.expires_at)}
                  </span>
                )}
                <span className="text-[10px] text-slate-500">
                  {new Date(inv.created_at).toLocaleDateString()}
                </span>
                {inv.status === 'pending' && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleAction('resend', inv.id)}
                      disabled={actionLoading === inv.id}
                      title="Resend"
                      className="w-7 h-7 rounded-md flex items-center justify-center text-sky-400 hover:bg-sky-500/10 disabled:opacity-50">
                      {actionLoading === inv.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => handleAction('revoke', inv.id)}
                      disabled={actionLoading === inv.id}
                      title="Revoke"
                      className="w-7 h-7 rounded-md flex items-center justify-center text-red-400 hover:bg-red-500/10 disabled:opacity-50">
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
