import { useState, useEffect } from 'react';
import {
  Shield, Loader2, UserPlus, MoreVertical, X,
  AlertCircle, Crown, UserCog, CheckCircle2, XCircle,
} from 'lucide-react';
import { superAdminApi } from '../api';
import { useSuperAdminAuth } from '../AuthContext';

interface SuperAdminUser {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'staff';
  status: string;
  last_login: string | null;
  created_at: string;
}

export default function TeamPage() {
  const { token, user: currentUser } = useSuperAdminAuth();
  const [admins, setAdmins] = useState<SuperAdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModal, setInviteModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const [invEmail, setInvEmail] = useState('');
  const [invName, setInvName] = useState('');
  const [invRole, setInvRole] = useState<'owner' | 'staff'>('staff');
  const [invLoading, setInvLoading] = useState(false);
  const [invError, setInvError] = useState('');

  const isOwner = currentUser?.role === 'owner';

  const loadAdmins = async () => {
    if (!token) return;
    try {
      const data = await superAdminApi.listSuperAdmins(token);
      setAdmins(data.superAdmins || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAdmins(); }, [token]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setInvError('');
    setInvLoading(true);
    try {
      await superAdminApi.inviteSuperAdmin(token, { email: invEmail, name: invName, role: invRole });
      setInviteModal(false);
      setInvEmail('');
      setInvName('');
      await loadAdmins();
    } catch (err) {
      setInvError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setInvLoading(false);
    }
  };

  const handleAction = async (adminId: string, action: { role?: string; status?: string }) => {
    if (!token) return;
    setMenuOpen(null);
    try {
      await superAdminApi.updateSuperAdmin(token, { admin_id: adminId, ...action });
      await loadAdmins();
    } catch {
      // silently handle
    }
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Admin Team</h1>
          <p className="text-sm text-slate-400">Manage super admin accounts</p>
        </div>
        {isOwner && (
          <button onClick={() => setInviteModal(true)}
            className="h-9 px-4 rounded-lg text-sm font-semibold text-white flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}>
            <UserPlus className="w-4 h-4" /> Add Admin
          </button>
        )}
      </div>

      <div className="space-y-2">
        {admins.map(admin => (
          <div key={admin.id} className="rounded-xl border p-4 flex items-center gap-4"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
              style={{ background: admin.role === 'owner' ? 'rgba(245,158,11,0.15)' : 'rgba(14,165,233,0.15)' }}>
              {admin.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{admin.name}</span>
                {admin.id === currentUser?.id && (
                  <span className="text-[10px] text-sky-400 font-medium">(You)</span>
                )}
              </div>
              <div className="text-[11px] text-slate-500">{admin.email}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md"
                style={{
                  background: admin.role === 'owner' ? 'rgba(245,158,11,0.1)' : 'rgba(14,165,233,0.1)',
                  color: admin.role === 'owner' ? '#f59e0b' : '#0ea5e9',
                }}>
                {admin.role === 'owner' ? <Crown className="w-3 h-3" /> : <UserCog className="w-3 h-3" />}
                <span className="text-[10px] font-semibold capitalize">{admin.role}</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${admin.status === 'active' ? 'text-emerald-400' : 'text-slate-500'}`}
                style={{ background: admin.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)' }}>
                {admin.status}
              </span>
              {admin.last_login && (
                <span className="text-[10px] text-slate-500">
                  Last: {new Date(admin.last_login).toLocaleDateString()}
                </span>
              )}

              {isOwner && admin.id !== currentUser?.id && (
                <div className="relative">
                  <button onClick={() => setMenuOpen(menuOpen === admin.id ? null : admin.id)}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5">
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                  {menuOpen === admin.id && (
                    <div className="absolute right-0 top-full mt-1 w-44 rounded-lg border py-1 z-50"
                      style={{ background: '#1a2540', borderColor: 'rgba(255,255,255,0.1)' }}>
                      {admin.role === 'staff' ? (
                        <button onClick={() => handleAction(admin.id, { role: 'owner' })}
                          className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/5 flex items-center gap-2">
                          <Crown className="w-3.5 h-3.5 text-amber-400" /> Promote to Owner
                        </button>
                      ) : (
                        <button onClick={() => handleAction(admin.id, { role: 'staff' })}
                          className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/5 flex items-center gap-2">
                          <UserCog className="w-3.5 h-3.5 text-sky-400" /> Demote to Staff
                        </button>
                      )}
                      {admin.status === 'active' ? (
                        <button onClick={() => handleAction(admin.id, { status: 'inactive' })}
                          className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                          <XCircle className="w-3.5 h-3.5" /> Deactivate
                        </button>
                      ) : (
                        <button onClick={() => handleAction(admin.id, { status: 'active' })}
                          className="w-full text-left px-3 py-2 text-xs text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Reactivate
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {inviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setInviteModal(false)}>
          <div className="w-full max-w-md rounded-2xl border p-6"
            style={{ background: '#141e33', borderColor: 'rgba(255,255,255,0.08)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-400" />
                <h3 className="text-base font-semibold text-white">Add Super Admin</h3>
              </div>
              <button onClick={() => setInviteModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleInvite} className="space-y-4">
              {invError && (
                <div className="flex items-start gap-2 p-3 rounded-xl text-xs"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5" />
                  <span className="text-red-300">{invError}</span>
                </div>
              )}
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Name</label>
                <input type="text" value={invName} onChange={e => setInvName(e.target.value)}
                  required className="w-full h-9 px-3 rounded-lg text-sm text-white outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Email</label>
                <input type="email" value={invEmail} onChange={e => setInvEmail(e.target.value)}
                  required className="w-full h-9 px-3 rounded-lg text-sm text-white outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Role</label>
                <select value={invRole} onChange={e => setInvRole(e.target.value as 'owner' | 'staff')}
                  className="w-full h-9 px-3 rounded-lg text-sm text-white outline-none appearance-none" style={inputStyle}>
                  <option value="staff" className="bg-slate-800">Staff</option>
                  <option value="owner" className="bg-slate-800">Owner</option>
                </select>
              </div>
              <div className="flex items-center gap-2 justify-end pt-2">
                <button type="button" onClick={() => setInviteModal(false)}
                  className="h-8 px-3 rounded-lg text-xs text-slate-400">Cancel</button>
                <button type="submit" disabled={invLoading || !invEmail || !invName}
                  className="h-8 px-4 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}>
                  {invLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
