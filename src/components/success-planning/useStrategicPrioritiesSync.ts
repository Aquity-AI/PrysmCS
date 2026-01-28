import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';

export interface StrategicPriority {
  id?: string;
  client_id: string;
  icon: string;
  title: string;
  subtitle: string;
  focus_areas: string[];
  is_visible: boolean;
  show_in_data_management: boolean;
  display_order: number;
  month_association?: string;
  created_at?: string;
  updated_at?: string;
}

interface UseStrategicPrioritiesSyncResult {
  priorities: StrategicPriority[];
  isLoading: boolean;
  isMigrated: boolean;
  addPriority: (priority: Omit<StrategicPriority, 'id'>) => Promise<boolean>;
  updatePriority: (id: string, updates: Partial<StrategicPriority>, skipReload?: boolean) => Promise<boolean>;
  deletePriority: (id: string) => Promise<boolean>;
  refreshPriorities: () => Promise<void>;
}

export function useStrategicPrioritiesSync(
  clientId: string,
  options?: {
    visibleOnly?: boolean;
    showInDataManagementOnly?: boolean;
  }
): UseStrategicPrioritiesSyncResult {
  const [priorities, setPriorities] = useState<StrategicPriority[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrated] = useState(true); // Strategic priorities are a new feature, no migration needed

  const loadPriorities = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('[Strategic Priorities Sync] Loading priorities for client:', clientId);

      let query = supabase
        .from('strategic_priorities')
        .select('*')
        .eq('client_id', clientId)
        .order('display_order', { ascending: true });

      if (options?.visibleOnly) {
        query = query.eq('is_visible', true);
      }

      if (options?.showInDataManagementOnly) {
        query = query.eq('show_in_data_management', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[Strategic Priorities Sync] Error loading priorities:', error);
        setPriorities([]);
        return;
      }

      const transformedPriorities: StrategicPriority[] = (data || []).map(row => ({
        id: row.id,
        client_id: row.client_id,
        icon: row.icon || 'Lightbulb',
        title: row.title || '',
        subtitle: row.subtitle || '',
        focus_areas: Array.isArray(row.focus_areas) ? row.focus_areas : [],
        is_visible: row.is_visible ?? true,
        show_in_data_management: row.show_in_data_management ?? true,
        display_order: row.display_order ?? 0,
        month_association: row.month_association,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));

      console.log('[Strategic Priorities Sync] Loaded priorities:', transformedPriorities.length, transformedPriorities.map(p => ({ id: p.id, title: p.title, is_visible: p.is_visible })));
      setPriorities(transformedPriorities);
    } catch (error) {
      console.error('[Strategic Priorities Sync] Unexpected error loading priorities:', error);
      setPriorities([]);
    } finally {
      setIsLoading(false);
    }
  }, [clientId, options?.visibleOnly, options?.showInDataManagementOnly]);

  const addPriority = useCallback(async (priority: Omit<StrategicPriority, 'id'>): Promise<boolean> => {
    try {
      console.log('[Strategic Priorities Sync] Adding new priority:', priority);

      const { data, error } = await supabase
        .from('strategic_priorities')
        .insert({
          client_id: priority.client_id,
          icon: priority.icon || 'Lightbulb',
          title: priority.title,
          subtitle: priority.subtitle || '',
          focus_areas: priority.focus_areas || [],
          is_visible: priority.is_visible ?? true,
          show_in_data_management: priority.show_in_data_management ?? true,
          display_order: priority.display_order ?? 0,
          month_association: priority.month_association,
        })
        .select();

      if (error) {
        console.error('[Strategic Priorities Sync] Supabase error adding priority:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('[Strategic Priorities Sync] Priority added successfully:', data);
      await loadPriorities();
      return true;
    } catch (error: any) {
      console.error('[Strategic Priorities Sync] Unexpected error adding priority:', {
        error,
        message: error?.message,
        stack: error?.stack
      });
      throw error;
    }
  }, [loadPriorities]);

  const updatePriority = useCallback(async (id: string, updates: Partial<StrategicPriority>, skipReload = false): Promise<boolean> => {
    try {
      console.log('[Strategic Priorities Sync] Updating priority:', id, 'with updates:', updates);

      const updateData: any = {};
      if (updates.icon !== undefined) updateData.icon = updates.icon;
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.subtitle !== undefined) updateData.subtitle = updates.subtitle;
      if (updates.focus_areas !== undefined) updateData.focus_areas = updates.focus_areas;
      if (updates.is_visible !== undefined) updateData.is_visible = updates.is_visible;
      if (updates.show_in_data_management !== undefined) updateData.show_in_data_management = updates.show_in_data_management;
      if (updates.display_order !== undefined) updateData.display_order = updates.display_order;
      if (updates.month_association !== undefined) updateData.month_association = updates.month_association;

      console.log('[Strategic Priorities Sync] Final update data being sent to database:', updateData);

      const { data, error } = await supabase
        .from('strategic_priorities')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) {
        console.error('[Strategic Priorities Sync] Supabase error updating priority:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('[Strategic Priorities Sync] Priority updated successfully:', data);
      console.log('[Strategic Priorities Sync] skipReload:', skipReload);
      if (!skipReload) {
        await loadPriorities();
      }
      return true;
    } catch (error: any) {
      console.error('[Strategic Priorities Sync] Unexpected error updating priority:', {
        error,
        message: error?.message,
        stack: error?.stack
      });
      throw error;
    }
  }, [loadPriorities]);

  const deletePriority = useCallback(async (id: string): Promise<boolean> => {
    try {
      console.log('[Strategic Priorities Sync] Deleting priority:', id);

      const { error } = await supabase
        .from('strategic_priorities')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[Strategic Priorities Sync] Supabase error deleting priority:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('[Strategic Priorities Sync] Priority deleted successfully');
      await loadPriorities();
      return true;
    } catch (error: any) {
      console.error('[Strategic Priorities Sync] Unexpected error deleting priority:', {
        error,
        message: error?.message,
        stack: error?.stack
      });
      throw error;
    }
  }, [loadPriorities]);

  const refreshPriorities = useCallback(async () => {
    await loadPriorities();
  }, [loadPriorities]);

  // Initial load
  useEffect(() => {
    loadPriorities();
  }, [loadPriorities]);

  // Set up real-time subscription
  useEffect(() => {
    console.log('[Strategic Priorities Sync] Setting up real-time subscription for client:', clientId);

    const channel = supabase
      .channel(`strategic-priorities-${clientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'strategic_priorities',
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          console.log('[Strategic Priorities Sync] Real-time update received:', payload);
          loadPriorities();
        }
      )
      .subscribe();

    return () => {
      console.log('[Strategic Priorities Sync] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [clientId, loadPriorities]);

  return {
    priorities,
    isLoading,
    isMigrated,
    addPriority,
    updatePriority,
    deletePriority,
    refreshPriorities,
  };
}
