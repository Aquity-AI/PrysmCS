import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { SuperAdminAuthProvider, useSuperAdminAuth } from './AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import SetupPage from './pages/SetupPage';
import DashboardPage from './pages/DashboardPage';
import WorkspacesPage from './pages/WorkspacesPage';
import CreateWorkspacePage from './pages/CreateWorkspacePage';
import WorkspaceDetailPage from './pages/WorkspaceDetailPage';
import InvitationsPage from './pages/InvitationsPage';
import TeamPage from './pages/TeamPage';
import AuditLogPage from './pages/AuditLogPage';
import AcceptInvitePage from './pages/AcceptInvitePage';

function SuperAdminRouter() {
  const { user, loading } = useSuperAdminAuth();
  const [page, setPage] = useState('dashboard');
  const [pageData, setPageData] = useState<Record<string, unknown>>({});
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/accept-invite')) {
      setPage('accept-invite');
      return;
    }

    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
    fetch(`${SUPABASE_URL}/functions/v1/super-admin/bootstrap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify({ email: '', name: '', password: '' }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.error === 'Setup has already been completed') {
          setNeedsSetup(false);
        } else {
          setNeedsSetup(true);
        }
      })
      .catch(() => setNeedsSetup(false));
  }, []);

  const navigate = useCallback((newPage: string, data?: unknown) => {
    setPage(newPage);
    if (data) setPageData(data as Record<string, unknown>);
    else setPageData({});
  }, []);

  if (page === 'accept-invite') {
    return <AcceptInvitePage />;
  }

  if (loading || needsSetup === null) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0f1f3d 50%, #0a1628 100%)' }}>
        <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
      </div>
    );
  }

  if (needsSetup) {
    return <SetupPage onComplete={() => setNeedsSetup(false)} />;
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <DashboardPage onNavigate={navigate} />;
      case 'workspaces':
        return <WorkspacesPage onNavigate={navigate} />;
      case 'create-workspace':
        return <CreateWorkspacePage onNavigate={navigate} />;
      case 'workspace-detail':
        return (
          <WorkspaceDetailPage
            workspaceId={pageData.id as string}
            onNavigate={navigate}
          />
        );
      case 'invitations':
        return <InvitationsPage />;
      case 'team':
        return <TeamPage />;
      case 'audit':
        return <AuditLogPage />;
      default:
        return <DashboardPage onNavigate={navigate} />;
    }
  };

  return (
    <Layout currentPage={page} onNavigate={navigate}>
      {renderPage()}
    </Layout>
  );
}

export default function SuperAdminApp() {
  return (
    <SuperAdminAuthProvider>
      <SuperAdminRouter />
    </SuperAdminAuthProvider>
  );
}
