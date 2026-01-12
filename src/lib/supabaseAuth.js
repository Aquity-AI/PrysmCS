import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
        .select('*, tenant:tenants(id, name, slug, plan, features)')
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
      .select('*, tenant:tenants(id, name, slug, plan, features)')
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

  // ============================================================
  // Load all data for dashboard
  // ============================================================
  async loadDashboardData(tenantId) {
    try {
      // Get all client accounts
      const { data: clients, error: clientsError } = await supabase
        .from('client_accounts')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name');

      if (clientsError) throw clientsError;

      // Get all monthly data
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('monthly_data')
        .select('*')
        .eq('tenant_id', tenantId);

      if (monthlyError) throw monthlyError;

      // Get all stories
      const { data: stories, error: storiesError } = await supabase
        .from('stories')
        .select('*')
        .eq('tenant_id', tenantId);

      if (storiesError) throw storiesError;

      // Get all opportunities
      const { data: opportunities, error: oppError } = await supabase
        .from('opportunities')
        .select('*')
        .eq('tenant_id', tenantId);

      if (oppError) throw oppError;

      // Convert to frontend format
      const clientsData = {};

      for (const client of clients) {
        const clientMonthlyData = {};
        const clientStories = {};
        const clientOpportunities = {};

        // Group monthly data by month
        monthlyData
          .filter(m => m.client_account_id === client.id)
          .forEach(m => {
            clientMonthlyData[m.month_key] = m.metric_values || {};
          });

        // Group stories by month
        stories
          .filter(s => s.client_account_id === client.id)
          .forEach(s => {
            if (!clientStories[s.month_key]) clientStories[s.month_key] = [];
            clientStories[s.month_key].push({
              id: s.display_order + 1,
              dbId: s.id,
              title: s.title,
              quote: s.content,
              patientType: s.category,
            });
          });

        // Group opportunities by month
        opportunities
          .filter(o => o.client_account_id === client.id)
          .forEach(o => {
            if (!clientOpportunities[o.month_key]) clientOpportunities[o.month_key] = [];
            clientOpportunities[o.month_key].push({
              id: o.display_order + 1,
              dbId: o.id,
              title: o.title,
              description: o.description,
              priority: o.display_order + 1,
            });
          });

        clientsData[client.slug] = {
          id: client.slug,
          dbId: client.id,
          clientInfo: {
            clientName: client.name,
            address: client.address || '',
            phone: client.contact_phone || '',
            email: client.contact_email || '',
            contactName: client.contact_name || '',
            website: '',
            stakeholders: [],
            csmAssigned: { name: '', email: '', phone: '' },
            careManagementCoordinator: { name: '', email: '', phone: '' },
            enrollmentSpecialists: [],
            providers: [],
            ...client.settings,
          },
          monthlyData: clientMonthlyData,
          stories: clientStories,
          opportunities: clientOpportunities,
        };
      }

      return { success: true, data: clientsData, clients };
    } catch (error) {
      console.error('[SupabaseData] Error loading dashboard data:', error);
      return { success: false, error: error.message };
    }
  },

  // Save monthly data to Supabase
  async saveMonthlyDataToSupabase(tenantId, clientDbId, monthKey, metricValues) {
    try {
      const { data, error } = await supabase
        .from('monthly_data')
        .upsert({
          tenant_id: tenantId,
          client_account_id: clientDbId,
          month_key: monthKey,
          metric_values: metricValues,
          status: 'draft',
        }, {
          onConflict: 'client_account_id,month_key',
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('[SupabaseData] Error saving monthly data:', error);
      return { success: false, error: error.message };
    }
  },

  // Save story to Supabase
  async saveStoryToSupabase(tenantId, clientDbId, monthKey, story) {
    try {
      const storyData = {
        tenant_id: tenantId,
        client_account_id: clientDbId,
        month_key: monthKey,
        title: story.title,
        content: story.quote || story.content,
        category: story.patientType || story.category,
        display_order: (story.id || 1) - 1,
      };

      if (story.dbId) {
        storyData.id = story.dbId;
      }

      const { data, error } = await supabase
        .from('stories')
        .upsert(storyData)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('[SupabaseData] Error saving story:', error);
      return { success: false, error: error.message };
    }
  },

  // Save opportunity to Supabase
  async saveOpportunityToSupabase(tenantId, clientDbId, monthKey, opportunity) {
    try {
      const oppData = {
        tenant_id: tenantId,
        client_account_id: clientDbId,
        month_key: monthKey,
        title: opportunity.title,
        description: opportunity.description,
        display_order: (opportunity.priority || opportunity.id || 1) - 1,
        status: 'identified',
      };

      if (opportunity.dbId) {
        oppData.id = opportunity.dbId;
      }

      const { data, error } = await supabase
        .from('opportunities')
        .upsert(oppData)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('[SupabaseData] Error saving opportunity:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete story
  async deleteStoryFromSupabase(storyId) {
    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('[SupabaseData] Error deleting story:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete opportunity
  async deleteOpportunityFromSupabase(oppId) {
    try {
      const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', oppId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('[SupabaseData] Error deleting opportunity:', error);
      return { success: false, error: error.message };
    }
  },

  // Export data as CSV
  async exportDataAsCSV(tenantId) {
    try {
      const { data: monthlyData, error } = await supabase
        .from('monthly_data')
        .select(`
          *,
          client:client_accounts(name, slug)
        `)
        .eq('tenant_id', tenantId)
        .order('month_key', { ascending: false });

      if (error) throw error;

      // Convert to CSV format
      const rows = monthlyData.map(row => ({
        client_name: row.client?.name,
        client_slug: row.client?.slug,
        month: row.month_key,
        status: row.status,
        ...row.metric_values,
      }));

      return { success: true, data: rows };
    } catch (error) {
      console.error('[SupabaseData] Error exporting data:', error);
      return { success: false, error: error.message };
    }
  },
};

export default { auth: supabaseAuth, data: supabaseData };