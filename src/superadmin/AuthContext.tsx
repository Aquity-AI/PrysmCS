import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface SuperAdmin {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'staff';
  status: string;
}

interface AuthState {
  user: SuperAdmin | null;
  token: string | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useSuperAdminAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useSuperAdminAuth must be used within SuperAdminAuthProvider');
  return ctx;
}

export function SuperAdminAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
  });

  const loadSuperAdmin = useCallback(async (accessToken: string) => {
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/super-admin/stats`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Apikey: SUPABASE_ANON_KEY,
        },
      });

      if (!res.ok) {
        setState({ user: null, token: null, loading: false });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser(accessToken);
      if (!user) {
        setState({ user: null, token: null, loading: false });
        return;
      }

      const adminClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );
      const { data: superAdmin } = await adminClient
        .from('super_admins')
        .select('*')
        .eq('supabase_auth_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (superAdmin) {
        setState({
          user: superAdmin as SuperAdmin,
          token: accessToken,
          loading: false,
        });
      } else {
        setState({ user: null, token: null, loading: false });
      }
    } catch {
      setState({ user: null, token: null, loading: false });
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        loadSuperAdmin(session.access_token);
      } else {
        setState({ user: null, token: null, loading: false });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        loadSuperAdmin(session.access_token);
      } else {
        setState({ user: null, token: null, loading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, [loadSuperAdmin]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.session?.access_token) {
      await loadSuperAdmin(data.session.access_token);
      if (!state.user) {
        const adminClient = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        );
        const { data: sa } = await adminClient
          .from('super_admins')
          .select('*')
          .eq('supabase_auth_id', data.user.id)
          .eq('status', 'active')
          .maybeSingle();
        if (!sa) {
          await supabase.auth.signOut();
          throw new Error('Not authorized as super admin');
        }
      }
    }
  }, [loadSuperAdmin, state.user]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ user: null, token: null, loading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
