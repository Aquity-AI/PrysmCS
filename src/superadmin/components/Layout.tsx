import { type ReactNode } from 'react';
import {
  Shield, LayoutDashboard, Building2, Mail, Users, ScrollText,
  LogOut, ChevronRight,
} from 'lucide-react';
import { useSuperAdminAuth } from '../AuthContext';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'workspaces', label: 'Workspaces', icon: Building2 },
  { id: 'invitations', label: 'Invitations', icon: Mail },
  { id: 'team', label: 'Admin Team', icon: Users },
  { id: 'audit', label: 'Audit Log', icon: ScrollText },
];

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { user, signOut } = useSuperAdminAuth();

  return (
    <div className="min-h-screen flex" style={{ background: '#0b1121' }}>
      <aside className="w-[260px] flex-shrink-0 flex flex-col border-r"
        style={{
          background: 'linear-gradient(180deg, #0d1a30 0%, #0b1121 100%)',
          borderColor: 'rgba(255,255,255,0.06)',
        }}>
        <div className="p-5 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
              <Shield className="w-[18px] h-[18px] text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight">Aquity</div>
              <div className="text-[11px] text-slate-500 leading-tight">Super Admin</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const isActive = currentPage === item.id ||
              (item.id === 'workspaces' && currentPage.startsWith('workspace'));
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group"
                style={{
                  background: isActive ? 'rgba(14,165,233,0.12)' : 'transparent',
                  color: isActive ? '#38bdf8' : '#94a3b8',
                }}>
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'rgba(14,165,233,0.2)' }}>
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-slate-300 truncate">{user?.name}</div>
              <div className="text-[10px] text-slate-500 truncate capitalize">{user?.role}</div>
            </div>
          </div>
          <button onClick={signOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-[1400px]">
          {children}
        </div>
      </main>
    </div>
  );
}
