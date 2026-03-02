import { useState } from 'react';
import { ArrowLeft, Building2, Loader2, AlertCircle } from 'lucide-react';
import { superAdminApi } from '../api';
import { useSuperAdminAuth } from '../AuthContext';

export default function CreateWorkspacePage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { token } = useSuperAdminAuth();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [planTier, setPlanTier] = useState('');
  const [billingContactName, setBillingContactName] = useState('');
  const [billingContactEmail, setBillingContactEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [slugManual, setSlugManual] = useState(false);

  const autoSlug = (val: string) => {
    return val
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slugManual) setSlug(autoSlug(val));
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError('');
    setLoading(true);
    try {
      await superAdminApi.createWorkspace(token, {
        name,
        slug,
        owner_email: ownerEmail,
        plan_tier: planTier || undefined,
        billing_contact_name: billingContactName || undefined,
        billing_contact_email: billingContactEmail || undefined,
      });
      onNavigate('workspaces');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <button onClick={() => onNavigate('workspaces')}
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Workspaces
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(16,185,129,0.12)' }}>
          <Building2 className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Create Workspace</h1>
          <p className="text-sm text-slate-400">Set up a new B2B customer workspace</p>
        </div>
      </div>

      <div className="rounded-xl border p-6"
        style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <span className="text-red-300">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                Workspace Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-lg text-sm text-white placeholder-slate-500 outline-none"
                style={inputStyle}
                placeholder="Acme Healthcare"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                URL Slug
              </label>
              <div className="flex items-center gap-0">
                <span className="h-10 px-3 flex items-center text-xs text-slate-500 rounded-l-lg border-r-0"
                  style={inputStyle}>
                  /
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={e => { setSlug(autoSlug(e.target.value)); setSlugManual(true); }}
                  required
                  className="w-full h-10 px-3 rounded-r-lg text-sm text-white font-mono placeholder-slate-500 outline-none"
                  style={inputStyle}
                  placeholder="acme-healthcare"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
              Workspace Admin Email
            </label>
            <input
              type="email"
              value={ownerEmail}
              onChange={e => setOwnerEmail(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-lg text-sm text-white placeholder-slate-500 outline-none"
              style={inputStyle}
              placeholder="admin@acmehealthcare.com"
            />
            <p className="text-[11px] text-slate-500 mt-1.5">
              An invitation email will be sent to this address to set up their account.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
              Plan Tier
            </label>
            <select
              value={planTier}
              onChange={e => setPlanTier(e.target.value)}
              className="w-full h-10 px-3 rounded-lg text-sm text-white outline-none appearance-none"
              style={inputStyle}>
              <option value="" className="bg-slate-800">No tier assigned</option>
              <option value="starter" className="bg-slate-800">Starter</option>
              <option value="professional" className="bg-slate-800">Professional</option>
              <option value="enterprise" className="bg-slate-800">Enterprise</option>
            </select>
          </div>

          <div className="pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <h3 className="text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wider">Billing Contact (Optional)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Contact Name</label>
                <input
                  type="text"
                  value={billingContactName}
                  onChange={e => setBillingContactName(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg text-sm text-white placeholder-slate-500 outline-none"
                  style={inputStyle}
                  placeholder="Billing contact name"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={billingContactEmail}
                  onChange={e => setBillingContactEmail(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg text-sm text-white placeholder-slate-500 outline-none"
                  style={inputStyle}
                  placeholder="billing@company.com"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-end pt-2">
            <button type="button" onClick={() => onNavigate('workspaces')}
              className="h-10 px-5 rounded-lg text-sm font-medium text-slate-400 hover:text-white transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading || !name || !slug || !ownerEmail}
              className="h-10 px-6 rounded-lg text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-50 transition-all"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
