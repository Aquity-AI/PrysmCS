import { supabase } from '../success-planning/supabaseClient';

export interface RestorationInfo {
  wasRestored: boolean;
  restoredAt: string | null;
  restoredBy: string | null;
  restorationReason: string | null;
  daysAgo: number | null;
}

export async function checkClientRestoration(clientId: string): Promise<RestorationInfo> {
  try {
    const { data, error } = await supabase
      .from('client_restoration_log')
      .select('restored_at, restored_by, restoration_reason')
      .eq('client_id', clientId)
      .order('restored_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error checking restoration:', error);
      return {
        wasRestored: false,
        restoredAt: null,
        restoredBy: null,
        restorationReason: null,
        daysAgo: null
      };
    }

    if (data) {
      const restoredDate = new Date(data.restored_at);
      const now = new Date();
      const diffTime = now.getTime() - restoredDate.getTime();
      const daysAgo = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      return {
        wasRestored: true,
        restoredAt: data.restored_at,
        restoredBy: data.restored_by,
        restorationReason: data.restoration_reason,
        daysAgo
      };
    }

    return {
      wasRestored: false,
      restoredAt: null,
      restoredBy: null,
      restorationReason: null,
      daysAgo: null
    };
  } catch (err) {
    console.error('Error in checkClientRestoration:', err);
    return {
      wasRestored: false,
      restoredAt: null,
      restoredBy: null,
      restorationReason: null,
      daysAgo: null
    };
  }
}

export function isRecentlyRestored(daysAgo: number | null, threshold: number = 30): boolean {
  return daysAgo !== null && daysAgo <= threshold;
}
