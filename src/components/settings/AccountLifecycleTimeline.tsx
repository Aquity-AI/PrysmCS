import React, { useState, useEffect } from 'react';
import { supabase } from '../success-planning/supabaseClient';
import { Calendar, User, FileText, RotateCcw, Trash2, AlertTriangle, X } from 'lucide-react';

interface TimelineEvent {
  type: 'created' | 'deleted' | 'restored' | 'purged';
  timestamp: string;
  user: string | null;
  reason: string | null;
}

interface AccountLifecycleTimelineProps {
  clientId: string;
  companyName: string;
  onClose: () => void;
}

export function AccountLifecycleTimeline({ clientId, companyName, onClose }: AccountLifecycleTimelineProps) {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTimeline();
  }, [clientId]);

  const fetchTimeline = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const events: TimelineEvent[] = [];

      const { data: clientData, error: clientError } = await supabase
        .from('success_planning_overview')
        .select('created_at, deleted_at, deleted_by, deletion_reason, purge_at')
        .eq('client_id', clientId)
        .maybeSingle();

      if (clientError) throw clientError;

      if (clientData) {
        if (clientData.created_at) {
          events.push({
            type: 'created',
            timestamp: clientData.created_at,
            user: null,
            reason: null
          });
        }

        if (clientData.deleted_at) {
          events.push({
            type: 'deleted',
            timestamp: clientData.deleted_at,
            user: clientData.deleted_by,
            reason: clientData.deletion_reason
          });
        }
      }

      const { data: restorations, error: restoreError } = await supabase
        .from('client_restoration_log')
        .select('restored_at, restored_by, restoration_reason, deleted_at, deleted_by, deletion_reason')
        .eq('client_id', clientId)
        .order('restored_at', { ascending: true });

      if (restoreError) throw restoreError;

      if (restorations && restorations.length > 0) {
        restorations.forEach(restoration => {
          events.push({
            type: 'deleted',
            timestamp: restoration.deleted_at,
            user: restoration.deleted_by,
            reason: restoration.deletion_reason
          });

          events.push({
            type: 'restored',
            timestamp: restoration.restored_at,
            user: restoration.restored_by,
            reason: restoration.restoration_reason
          });
        });
      }

      const { data: purgeData, error: purgeError } = await supabase
        .from('purge_log')
        .select('purged_at, purged_by, purge_reason')
        .eq('client_id', clientId)
        .maybeSingle();

      if (purgeError && purgeError.code !== 'PGRST116') throw purgeError;

      if (purgeData) {
        events.push({
          type: 'purged',
          timestamp: purgeData.purged_at,
          user: purgeData.purged_by,
          reason: purgeData.purge_reason
        });
      }

      events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      setTimeline(events);
    } catch (err) {
      console.error('Error fetching timeline:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch account timeline');
    } finally {
      setIsLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'created':
        return <Calendar className="w-5 h-5" />;
      case 'deleted':
        return <Trash2 className="w-5 h-5" />;
      case 'restored':
        return <RotateCcw className="w-5 h-5" />;
      case 'purged':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Calendar className="w-5 h-5" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'created':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'deleted':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'restored':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'purged':
        return 'bg-gray-800 text-white border-gray-900';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getEventTitle = (type: string) => {
    switch (type) {
      case 'created':
        return 'Account Created';
      case 'deleted':
        return 'Account Deleted';
      case 'restored':
        return 'Account Restored';
      case 'purged':
        return 'Account Permanently Purged';
      default:
        return 'Event';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Account Lifecycle Timeline</h2>
            <p className="text-sm text-gray-600 mt-1">{companyName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading timeline...</p>
            </div>
          ) : timeline.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No timeline events found</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-[29px] top-0 bottom-0 w-0.5 bg-gray-200"></div>

              <div className="space-y-8">
                {timeline.map((event, index) => (
                  <div key={index} className="relative flex gap-4">
                    <div
                      className={`flex-shrink-0 w-[60px] h-[60px] rounded-full border-2 flex items-center justify-center ${getEventColor(
                        event.type
                      )}`}
                    >
                      {getEventIcon(event.type)}
                    </div>

                    <div className="flex-1 pt-2">
                      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{getEventTitle(event.type)}</h3>
                          <span className="text-sm text-gray-500">
                            {new Date(event.timestamp).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="text-sm text-gray-600 mb-3">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </div>

                        {event.user && (
                          <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">By:</span> {event.user}
                          </div>
                        )}

                        {event.reason && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-start gap-2">
                              <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                                  Reason
                                </div>
                                <div className="text-sm text-gray-700">{event.reason}</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>{timeline.length} total events</span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
