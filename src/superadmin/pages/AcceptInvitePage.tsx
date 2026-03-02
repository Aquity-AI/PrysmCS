import { useState, useEffect } from 'react';
import {
  Mail, Loader2, Eye, EyeOff, AlertCircle, CheckCircle2, XCircle,
} from 'lucide-react';
import { superAdminApi } from '../api';

interface InvitationInfo {
  id: string;
  invitee_email: string;
  invitee_name: string | null;
  type: string;
  role: string;
  expires_at: string;
  workspace_id: string | null;
  workspaces: { name: string } | null;
}

export default function AcceptInvitePage() {
  const [invToken, setInvToken] = useState('');
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [validating, setValidating] = useState(true);
  const [invalid, setInvalid] = useState(false);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || '';
    setInvToken(token);

    if (!token) {
      setInvalid(true);
      setValidating(false);
      return;
    }

    superAdminApi.validateInvitation(token)
      .then(data => {
        setInvitation(data.invitation);
        setName(data.invitation.invitee_name || '');
      })
      .catch(() => setInvalid(true))
      .finally(() => setValidating(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await superAdminApi.acceptInvitation({ token: invToken, name, password });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0f1f3d 50%, #0a1628 100%)' }}>
        <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
      </div>
    );
  }

  if (invalid) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0f1f3d 50%, #0a1628 100%)' }}>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-5"
            style={{ background: 'rgba(239,68,68,0.12)' }}>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Invalid Invitation</h2>
          <p className="text-sm text-slate-400 max-w-xs mx-auto">
            This invitation link is invalid, has expired, or has already been used. Please contact your admin for a new invitation.
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0f1f3d 50%, #0a1628 100%)' }}>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-5"
            style={{ background: 'rgba(16,185,129,0.12)' }}>
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Account Created</h2>
          <p className="text-sm text-slate-400 mb-6">
            You can now sign in with your email and password.
          </p>
          <a href="/"
            className="inline-flex h-10 px-6 rounded-xl text-sm font-semibold text-white items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}>
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0f1f3d 50%, #0a1628 100%)' }}>
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
            style={{ background: 'rgba(14,165,233,0.15)' }}>
            <Mail className="w-7 h-7 text-sky-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1.5">Accept Invitation</h1>
          {invitation?.workspaces && (
            <p className="text-sm text-slate-400">
              You've been invited to join <span className="text-white font-medium">{invitation.workspaces.name}</span>
            </p>
          )}
          {invitation?.type === 'super_admin' && (
            <p className="text-sm text-slate-400">You've been invited as a <span className="text-sky-400 font-medium">Super Admin</span></p>
          )}
        </div>

        <div className="rounded-2xl border p-8"
          style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="mb-5 p-3 rounded-lg" style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.15)' }}>
            <div className="text-[11px] text-sky-400 font-medium mb-0.5">Invitation for</div>
            <div className="text-sm text-white">{invitation?.invitee_email}</div>
            <div className="text-[11px] text-slate-400 capitalize mt-0.5">Role: {invitation?.role}</div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl text-xs"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5" />
                <span className="text-red-300">{error}</span>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                required
                className="w-full h-11 px-3.5 rounded-xl text-sm text-white placeholder-slate-500 outline-none"
                style={inputStyle} placeholder="Your name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  required minLength={8}
                  className="w-full h-11 px-3.5 pr-10 rounded-xl text-sm text-white placeholder-slate-500 outline-none"
                  style={inputStyle} placeholder="Min. 8 characters" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                required
                className="w-full h-11 px-3.5 rounded-xl text-sm text-white placeholder-slate-500 outline-none"
                style={inputStyle} placeholder="Re-enter password" />
            </div>
            <button type="submit" disabled={loading || !name || !password || !confirmPassword}
              className="w-full h-11 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              style={{ background: loading ? 'rgba(14,165,233,0.5)' : 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
