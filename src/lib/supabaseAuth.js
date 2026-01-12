import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================
// SUPABASE AUTHENTICATION HELPERS
// ============================================================

export const supabaseAuth = {
  async signIn(email, password) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('[SupabaseAuth] Auth error:', authError);
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'No user returned from authentication' };
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select(`*, tenant:tenants(id, name, slug, plan, features)`)
        .eq('auth_user_id', authData.user.id)
        .single();

      if (profileError) {
        console.error('[SupabaseAuth] Profile error:', profileError);
        await supabase.auth.signOut();
        return { success: false, error: 'User profile not found. Contact administrator.' };
      }

      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userProfile.id);

      return {
        success: true,
        user: {
          id: userProfile.id,
          email: userProfile.email,
          name: userProfile.name,
          role: userProfile.role,
          phone: userProfile.phone,
          department: userProfile.department,
          assignedClients: userProfile.assigned_client_accounts || [],
          canAccessAllClients: userProfile.can_access_all_clients,
          status: userProfile.status,
          mfaEnabled: userProfile.mfa_enabled,
          tenantId: userProfile.tenant_id,
          tenant: userProfile.tenant,
        },
        session: authData.session,
      };
    } catch (error) {
      console.error('[SupabaseAuth] Unexpected error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { success: !error };
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  async getCurrentUser() {
    const session = await this.getSession();
    if (!session) return null;

    const { data: userProfile, error } = await supabase
      .from('users')
      .select(`*, tenant:tenants(id, name, slug, plan, features)`)
      .eq('auth_user_id', session.user.id)
      .single();

    if (error || !userProfile) return null;

    return {
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.name,
      role: userProfile.role,
      phone: userProfile.phone,
      department: userProfile.department,
      assignedClients: userProfile.assigned_client_accounts || [],
      canAccessAllClients: userProfile.can_access_all_clients,
      status: userProfile.status,
      mfaEnabled: userProfile.mfa_enabled,
      tenantId: userProfile.tenant_id,
      tenant: userProfile.tenant,
    };
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// ============================================================
// SUPABASE DATA HELPERS
// ============================================================

export const supabaseData = {
  async getClientAccounts(tenantId) {
    const { data, error } = await supabase
      .from('client_accounts')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .order('name');

    if (error) {
      console.error('[SupabaseData] Error fetching clients:', error);
      return [];
    }
    return data || [];
  },

  async getMonthlyData(clientAccountId, monthKey) {
    const { data, error } = await supabase
      .from('monthly_data')
      .select('*')
      .eq('client_account_id', clientAccountId)
      .eq('month_key', monthKey)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[SupabaseData] Error fetching monthly data:', error);
    }
    return data || null;
  },

  async getMonthlyDataRange(clientAccountId, startMonth, endMonth) {
    const { data, error } = await supabase
      .from('monthly_data')
      .select('*')
      .eq('client_account_id', clientAccountId)
      .gte('month_key', startMonth)
      .lte('month_key', endMonth)
      .order('month_key');

    if (error) {
      console.error('[SupabaseData] Error fetching monthly data range:', error);
      return [];
    }
    return data || [];
  },

  async saveMonthlyData(tenantId, clientAccountId, monthKey, metricValues, userId) {
    const { data, error } = await supabase
      .from('monthly_data')
      .upsert({
        tenant_id: tenantId,
        client_account_id: clientAccountId,
        month_key: monthKey,
        metric_values: metricValues,
        updated_by: userId,
      }, {
        onConflict: 'client_account_id,month_key',
      })
      .select()
      .single();

    if (error) {
      console.error('[SupabaseData] Error saving monthly data:', error);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  },

  async getStories(clientAccountId, monthKey) {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('client_account_id', clientAccountId)
      .eq('month_key', monthKey)
      .order('display_order');

    if (error) {
      console.error('[SupabaseData] Error fetching stories:', error);
      return [];
    }
    return data || [];
  },

  async getOpportunities(clientAccountId, monthKey) {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('client_account_id', clientAccountId)
      .eq('month_key', monthKey)
      .order('display_order');

    if (error) {
      console.error('[SupabaseData] Error fetching opportunities:', error);
      return [];
    }
    return data || [];
  },

  async logAudit(tenantId, action, details, user) {
    const { error } = await supabase
      .from('audit_log')
      .insert({
        tenant_id: tenantId,
        action,
        user_id: user?.id,
        user_email: user?.email,
        user_role: user?.role,
        details,
      });

    if (error) {
      console.error('[SupabaseData] Error logging audit:', error);
    }
  },
};

export default { auth: supabaseAuth, data: supabaseData };
```

---

### 16C: Save the file

Your folder structure should now look like:
```
src/
├── components/
│   └── prysmcs.jsx
├── lib/
│   └── supabaseAuth.js    <-- NEW FILE
├── App.tsx
├── main.tsx
└── index.css