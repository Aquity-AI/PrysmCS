import { useState, useEffect } from 'react';
import {
  Building2, Users, Mail, Pause, Archive, TrendingUp,
  Loader2, Clock, ArrowRight,
} from 'lucide-react';
import { superAdminApi } from '../api';
import { useSuperAdminAuth } from '../AuthContext';

interface Stats {
  totalWorkspaces: number;
  activeWorkspaces: number;
  pausedWorkspaces: number;
  archivedWorkspaces: number;
  totalUsers: number;
  pendingInvitations: number;
}

interface ActivityEntry {
  id: string;
  action: string;
  user_email: string;
  user_name: string;
  resource: string;
  details: Record<string, unknown>;
  created_at: string;
}

const STAT_CARDS = [
  { key: 'totalWorkspaces', label: 'Total Workspaces', icon: Building2, color: '#0ea5e9' },
  { key: 'activeWorkspaces', label: 'Active', icon: TrendingUp, color: '#10b981' },
  { key: 'pausedWorkspaces', label: 'Paused', icon: Pause, color: '#f59e0b' },
  { key: 'archivedWorkspaces', label: 'Archived', icon: Archive, color: '#64748b' },
  { key: 'totalUsers', label: 'Total Users', icon: Users, color: '#8b5cf6' },
  { key: 'pendingInvitations', label: 'Pending Invites', icon: Mail, color: '#06b6d4' },
] as const;

function formatAction(action: string) {
  return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function DashboardPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { token } = useSuperAdminAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    superAdminApi.getStats(token).then(data => {
      setStats(data.stats);
      setActivity(data.recentActivity || []);
    }).finally(() => setLoading(false));
  }, [token]);

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
        <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
        <p className="text-sm text-slate-400">Platform overview and recent activity</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {STAT_CARDS.map(card => (
          <div key={card.key}
            className="rounded-xl border p-4 transition-all hover:translate-y-[-2px]"
            style={{
              background: 'rgba(255,255,255,0.03)',
              borderColor: 'rgba(255,255,255,0.06)',
            }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${card.color}15` }}>
                <card.icon className="w-4 h-4" style={{ color: card.color }} />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-0.5">
              {stats ? stats[card.key] : 0}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border"
          style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
            <button onClick={() => onNavigate('audit')}
              className="text-[11px] text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="px-5 pb-5 space-y-1">
            {activity.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-500">No activity yet</div>
            ) : (
              activity.slice(0, 10).map(entry => (
                <div key={entry.id}
                  className="flex items-center gap-3 py-2.5 border-b last:border-0"
                  style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(14,165,233,0.1)' }}>
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-300 truncate">
                      <span className="font-medium text-white">{entry.user_name || entry.user_email}</span>
                      {' '}{formatAction(entry.action).toLowerCase()}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{entry.resource}</div>
                  </div>
                  <div className="text-[10px] text-slate-500 flex-shrink-0">{timeAgo(entry.created_at)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border"
          style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="p-5 pb-3">
            <h2 className="text-sm font-semibold text-white">Quick Actions</h2>
          </div>
          <div className="px-5 pb-5 space-y-2">
            <button onClick={() => onNavigate('create-workspace')}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium text-slate-300 transition-all hover:bg-white/5"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)' }}>
                <Building2 className="w-4 h-4 text-emerald-400" />
              </div>
              Create Workspace
            </button>
            <button onClick={() => onNavigate('invitations')}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium text-slate-300 transition-all hover:bg-white/5"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(14,165,233,0.12)' }}>
                <Mail className="w-4 h-4 text-sky-400" />
              </div>
              View Invitations
            </button>
            <button onClick={() => onNavigate('team')}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium text-slate-300 transition-all hover:bg-white/5"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.12)' }}>
                <Users className="w-4 h-4 text-violet-400" />
              </div>
              Manage Admin Team
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
