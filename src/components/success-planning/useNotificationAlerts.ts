import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface NotificationAlert {
  id: string;
  action_id: string;
  client_id: string;
  client_name: string;
  alert_type: 'overdue' | 'risk' | 'opportunity';
  title: string;
  message: string;
  status: 'active' | 'dismissed' | 'snoozed';
  snooze_until: string | null;
  dismissed_at: string | null;
  created_at: string;
}

export function useNotificationAlerts() {
  const [alerts, setAlerts] = useState<NotificationAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('notification_alerts')
        .select('*')
        .eq('status', 'active')
        .or('snooze_until.is.null,snooze_until.lt.' + new Date().toISOString())
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setAlerts(data || []);
    } catch (err) {
      console.error('Error fetching notification alerts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();

    let channel: RealtimeChannel;

    const setupRealtimeSubscription = async () => {
      channel = supabase
        .channel('notification_alerts_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notification_alerts',
          },
          (payload) => {
            console.log('Notification alert change detected:', payload);
            fetchAlerts();
          }
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchAlerts]);

  const dismissAlert = useCallback(async (alertId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('notification_alerts')
        .update({
          status: 'dismissed',
          dismissed_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (updateError) throw updateError;

      setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
    } catch (err) {
      console.error('Error dismissing alert:', err);
      setError(err instanceof Error ? err.message : 'Failed to dismiss alert');
    }
  }, []);

  const snoozeAlert = useCallback(async (alertId: string, hours: number) => {
    try {
      const snoozeUntil = new Date();
      snoozeUntil.setHours(snoozeUntil.getHours() + hours);

      const { error: updateError } = await supabase
        .from('notification_alerts')
        .update({
          status: 'snoozed',
          snooze_until: snoozeUntil.toISOString(),
        })
        .eq('id', alertId);

      if (updateError) throw updateError;

      setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
    } catch (err) {
      console.error('Error snoozing alert:', err);
      setError(err instanceof Error ? err.message : 'Failed to snooze alert');
    }
  }, []);

  const refetch = useCallback(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return {
    alerts,
    alertCount: alerts.length,
    isLoading,
    error,
    dismissAlert,
    snoozeAlert,
    refetch,
  };
}
