import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Building2, Users, Mail, ScrollText, CreditCard,
  Loader2, UserPlus, MoreVertical, Shield, Eye, Pencil,
  Key, UserX, CheckCircle2, XCircle, RefreshCw, X,
  AlertCircle, Send,
} from 'lucide-react';
import { superAdminApi } from '../api';
import { useSuperAdminAuth } from '../AuthContext';

interface WorkspaceData {
  id: string;
  slug: string;
  name: string;
  owner_email: string;
  status: string;
  plan_tier: string | null;
  billing_contact_name: string | null;
  billing_contact_email: string | null;
  billing_notes: string | null;
  created_at: string;
}

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  last_login: string | null;
  created_at: string;
}

interface InvitationData {
  id: string;
  invitee_email: string;
  invitee_name: string | null;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
}

interface AuditEntry {
  id: string;
  action: string;
  user_email: string;
  user_name: string;
  resource: string;
  created_at: string;
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: Building2 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'invitations', label: 'Invitations', icon: Mail },
  { id: 'audit', label: 'Audit', icon: ScrollText },
];

const ROLE_COLORS: Record<string, string> = {
  admin: '#0ea5e9',
  csm: '#8b5cf6',
  client: '#10b981',
};

export default function WorkspaceDetailPage({
  workspaceId,
  onNavigate,
}: {
  workspaceId: string;
  onNavigate: (page: string) => void;
}) {
  const { token } = useSuperAdminAuth();
  const [tab, setTab] = useState('overview');
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [invitations, setInvitations] = useState<InvitationData[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [clientCount, setClientCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userMenu, setUserMenu] = useState<string | null>(null);
  const [inviteModal, setInviteModal] = useState(false);
  const [editBilling, setEditBilling] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('csm');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const [billingName, setBillingName] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [billingNotes, setBillingNotes] = useState('');
  const [billingLoading, setBillingLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const data = await superAdminApi.getWorkspaceDetail(token, workspaceId);
      setWorkspace(data.workspace);
      setUsers(data.users);
      setInvitations(data.invitations);
      setAuditLog(data.auditLog);
      setClientCount(data.clientCount);
      setBillingName(data.workspace.billing_contact_name || '');
      setBillingEmail(data.workspace.billing_contact_email || '');
      setBillingNotes(data.workspace.billing_notes || '');
    } finally {
      setLoading(false);
    }
  }, [token, workspaceId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setInviteError('');
    setInviteLoading(true);
    try {
      await superAdminApi.inviteUser(token, {
        workspace_id: workspaceId,
        email: inviteEmail,
        name: inviteName || undefined,
        role: inviteRole,
      });
      setInviteModal(false);
      setInviteEmail('');
      setInviteName('');
      await loadData();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleUserAction = async (action: string, userId: string, payload?: Record<string, string>) => {
    if (!token) return;
    setUserMenu(null);
    try {
      if (action === 'role') {
        await superAdminApi.updateUserRole(token, {
          user_id: userId,
          role: payload?.role || 'csm',
          workspace_id: workspaceId,
        });
      } else if (action === 'deactivate') {
        await superAdminApi.updateUserStatus(token, {
          user_id: userId,
          status: 'inactive',
          workspace_id: workspaceId,
        });
      } else if (action === 'activate') {
        await superAdminApi.updateUserStatus(token, {
          user_id: userId,
          status: 'active',
          workspace_id: workspaceId,
        });
      } else if (action === 'reset-password') {
        const user = users.find(u => u.id === userId);
        if (user) await superAdminApi.resetUserPassword(token, user.email);
      } else if (action === 'remove') {
        await superAdminApi.removeUser(token, userId, workspaceId);
      }
      await loadData();
    } catch {
      // silently handle
    }
  };

  const handleSaveBilling = async () => {
    if (!token) return;
    setBillingLoading(true);
    try {
      await superAdminApi.updateWorkspace(token, {
        workspace_id: workspaceId,
        billing_contact_name: billingName,
        billing_contact_email: billingEmail,
        billing_notes: billingNotes,
      });
      setEditBilling(false);
      await loadData();
    } finally {
      setBillingLoading(false);
    }
  };

  const handleInvitationAction = async (action: 'revoke' | 'resend', invitationId: string) => {
    if (!token) return;
    if (action === 'revoke') await superAdminApi.revokeInvitation(token, invitationId);
    else await superAdminApi.resendInvitation(token, invitationId);
    await loadData();
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
  };

  if (loading || !workspace) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => onNavigate('workspaces')}
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Workspaces
      </button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(14,165,233,0.1)' }}>
            <Building2 className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{workspace.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-mono text-slate-500">/{workspace.slug}</span>
              <span className="text-slate-600">|</span>
              <span className="text-xs text-slate-400">{workspace.owner_email}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize"
            style={{
              background: workspace.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
              color: workspace.status === 'active' ? '#10b981' : '#f59e0b',
            }}>
            {workspace.status}
          </span>
          {workspace.plan_tier && (
            <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-sky-300"
              style={{ background: 'rgba(14,165,233,0.1)' }}>
              {workspace.plan_tier}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 mb-6 rounded-lg p-0.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-all"
            style={{
              background: tab === t.id ? 'rgba(14,165,233,0.15)' : 'transparent',
              color: tab === t.id ? '#38bdf8' : '#94a3b8',
            }}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Users', value: users.length, color: '#0ea5e9' },
            { label: 'Clients', value: clientCount, color: '#10b981' },
            { label: 'Pending Invites', value: invitations.filter(i => i.status === 'pending').length, color: '#f59e0b' },
            { label: 'Created', value: new Date(workspace.created_at).toLocaleDateString(), color: '#64748b' },
          ].map(card => (
            <div key={card.label} className="rounded-xl border p-4"
              style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="text-[11px] text-slate-500 mb-1">{card.label}</div>
              <div className="text-xl font-bold" style={{ color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-slate-400">{users.length} user{users.length !== 1 ? 's' : ''}</div>
            <button onClick={() => setInviteModal(true)}
              className="h-8 px-3 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}>
              <UserPlus className="w-3.5 h-3.5" /> Invite User
            </button>
          </div>

          {users.length === 0 ? (
            <div className="text-center py-12 rounded-xl border"
              style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No users yet</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {users.map(user => (
                <div key={user.id} className="rounded-xl border p-3.5 flex items-center gap-3"
                  style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: `${ROLE_COLORS[user.role] || '#64748b'}20` }}>
                    {user.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{user.name}</div>
                    <div className="text-[11px] text-slate-500">{user.email}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold capitalize"
                    style={{
                      background: `${ROLE_COLORS[user.role] || '#64748b'}15`,
                      color: ROLE_COLORS[user.role] || '#64748b',
                    }}>
                    {user.role}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${user.status === 'active' ? 'text-emerald-400' : 'text-slate-500'}`}
                    style={{ background: user.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)' }}>
                    {user.status}
                  </span>
                  <div className="relative">
                    <button onClick={() => setUserMenu(userMenu === user.id ? null : user.id)}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                    {userMenu === user.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border py-1 z-50"
                        style={{ background: '#1a2540', borderColor: 'rgba(255,255,255,0.1)' }}>
                        {['admin', 'csm', 'client'].filter(r => r !== user.role).map(r => (
                          <button key={r} onClick={() => handleUserAction('role', user.id, { role: r })}
                            className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/5 flex items-center gap-2 capitalize">
                            {r === 'admin' ? <Shield className="w-3.5 h-3.5 text-sky-400" /> :
                              r === 'csm' ? <Pencil className="w-3.5 h-3.5 text-violet-400" /> :
                                <Eye className="w-3.5 h-3.5 text-emerald-400" />}
                            Set as {r}
                          </button>
                        ))}
                        <div className="border-t my-1" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                        <button onClick={() => handleUserAction('reset-password', user.id)}
                          className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/5 flex items-center gap-2">
                          <Key className="w-3.5 h-3.5 text-amber-400" /> Reset Password
                        </button>
                        {user.status === 'active' ? (
                          <button onClick={() => handleUserAction('deactivate', user.id)}
                            className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                            <XCircle className="w-3.5 h-3.5" /> Deactivate
                          </button>
                        ) : (
                          <button onClick={() => handleUserAction('activate', user.id)}
                            className="w-full text-left px-3 py-2 text-xs text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Reactivate
                          </button>
                        )}
                        <button onClick={() => handleUserAction('remove', user.id)}
                          className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                          <UserX className="w-3.5 h-3.5" /> Remove from Workspace
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'billing' && (
        <div className="rounded-xl border p-5"
          style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Billing Information</h3>
            {!editBilling && (
              <button onClick={() => setEditBilling(true)}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium">Edit</button>
            )}
          </div>
          {editBilling ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Contact Name</label>
                  <input type="text" value={billingName} onChange={e => setBillingName(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg text-sm text-white outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Contact Email</label>
                  <input type="email" value={billingEmail} onChange={e => setBillingEmail(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg text-sm text-white outline-none" style={inputStyle} />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Billing Notes</label>
                <textarea value={billingNotes} onChange={e => setBillingNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none resize-none" style={inputStyle} />
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button onClick={() => setEditBilling(false)}
                  className="h-8 px-3 rounded-lg text-xs text-slate-400 hover:text-white">Cancel</button>
                <button onClick={handleSaveBilling} disabled={billingLoading}
                  className="h-8 px-4 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5"
                  style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}>
                  {billingLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] text-slate-500 mb-0.5">Contact Name</div>
                <div className="text-sm text-slate-300">{workspace.billing_contact_name || '-'}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500 mb-0.5">Contact Email</div>
                <div className="text-sm text-slate-300">{workspace.billing_contact_email || '-'}</div>
              </div>
              <div className="col-span-2">
                <div className="text-[11px] text-slate-500 mb-0.5">Notes</div>
                <div className="text-sm text-slate-300 whitespace-pre-wrap">{workspace.billing_notes || '-'}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'invitations' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-slate-400">{invitations.length} invitation{invitations.length !== 1 ? 's' : ''}</div>
          </div>
          {invitations.length === 0 ? (
            <div className="text-center py-12 rounded-xl border"
              style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <Mail className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No invitations</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {invitations.map(inv => (
                <div key={inv.id} className="rounded-xl border p-3.5 flex items-center gap-3"
                  style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(14,165,233,0.1)' }}>
                    <Mail className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{inv.invitee_email}</div>
                    <div className="text-[11px] text-slate-500">
                      {inv.invitee_name || 'No name'} - Invited {new Date(inv.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold capitalize"
                    style={{
                      background: `${ROLE_COLORS[inv.role] || '#64748b'}15`,
                      color: ROLE_COLORS[inv.role] || '#64748b',
                    }}>
                    {inv.role}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${inv.status === 'pending' ? 'text-amber-400' : inv.status === 'accepted' ? 'text-emerald-400' : 'text-slate-500'}`}
                    style={{
                      background: inv.status === 'pending' ? 'rgba(245,158,11,0.1)' : inv.status === 'accepted' ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)',
                    }}>
                    {inv.status}
                  </span>
                  {inv.status === 'pending' && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleInvitationAction('resend', inv.id)}
                        title="Resend"
                        className="w-7 h-7 rounded-md flex items-center justify-center text-sky-400 hover:bg-sky-500/10">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleInvitationAction('revoke', inv.id)}
                        title="Revoke"
                        className="w-7 h-7 rounded-md flex items-center justify-center text-red-400 hover:bg-red-500/10">
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'audit' && (
        <div className="space-y-1.5">
          {auditLog.length === 0 ? (
            <div className="text-center py-12 rounded-xl border"
              style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <ScrollText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No audit entries</p>
            </div>
          ) : (
            auditLog.map(entry => (
              <div key={entry.id} className="rounded-lg border p-3 flex items-center gap-3"
                style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.04)' }}>
                <div className="flex-1">
                  <div className="text-xs text-slate-300">
                    <span className="font-medium text-white">{entry.user_name || entry.user_email}</span>
                    {' '}{entry.action.replace(/_/g, ' ')}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{entry.resource}</div>
                </div>
                <div className="text-[10px] text-slate-500">{new Date(entry.created_at).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      )}

      {inviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setInviteModal(false)}>
          <div className="w-full max-w-md rounded-2xl border p-6"
            style={{ background: '#141e33', borderColor: 'rgba(255,255,255,0.08)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-white">Invite User</h3>
              <button onClick={() => setInviteModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleInviteUser} className="space-y-4">
              {inviteError && (
                <div className="flex items-start gap-2 p-3 rounded-xl text-xs"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5" />
                  <span className="text-red-300">{inviteError}</span>
                </div>
              )}
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Email</label>
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  required
                  className="w-full h-9 px-3 rounded-lg text-sm text-white outline-none" style={inputStyle}
                  placeholder="user@company.com" />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Name (optional)</label>
                <input type="text" value={inviteName} onChange={e => setInviteName(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg text-sm text-white outline-none" style={inputStyle}
                  placeholder="User name" />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Role</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg text-sm text-white outline-none appearance-none" style={inputStyle}>
                  <option value="admin" className="bg-slate-800">Admin</option>
                  <option value="csm" className="bg-slate-800">CSM</option>
                  <option value="client" className="bg-slate-800">Client</option>
                </select>
              </div>
              <div className="flex items-center gap-2 justify-end pt-2">
                <button type="button" onClick={() => setInviteModal(false)}
                  className="h-8 px-3 rounded-lg text-xs text-slate-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={inviteLoading || !inviteEmail}
                  className="h-8 px-4 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}>
                  {inviteLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Send className="w-3 h-3" /> Send Invite</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
