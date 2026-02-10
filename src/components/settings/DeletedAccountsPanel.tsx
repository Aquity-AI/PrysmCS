import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../success-planning/supabaseClient';
import { Trash2, RotateCcw, AlertCircle, Search, Calendar, User, Clock, AlertTriangle, History } from 'lucide-react';
import { AccountLifecycleTimeline } from './AccountLifecycleTimeline';

interface DeletedClient {
  client_id: string;
  company_name: string;
  deleted_at: string;
  deleted_by: string | null;
  deletion_reason: string | null;
  purge_at: string;
}

interface DeletedAccountsPanelProps {
  currentUserEmail: string;
  hasRestorePermission: boolean;
  hasPurgePermission: boolean;
  onClientRestored?: () => void;
}

export function DeletedAccountsPanel({
  currentUserEmail,
  hasRestorePermission,
  hasPurgePermission,
  onClientRestored
}: DeletedAccountsPanelProps) {
  const [deletedClients, setDeletedClients] = useState<DeletedClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [selectedClient, setSelectedClient] = useState<DeletedClient | null>(null);
  const [restorationReason, setRestorationReason] = useState('');
  const [purgeReason, setPurgeReason] = useState('');
  const [purgeConfirmText, setPurgeConfirmText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchDeletedClients = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('success_planning_overview')
        .select('client_id, company_name, deleted_at, deleted_by, deletion_reason, purge_at')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (fetchError) throw fetchError;

      setDeletedClients(data || []);
    } catch (err) {
      console.error('Error fetching deleted clients:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch deleted clients');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeletedClients();
  }, [fetchDeletedClients]);

  const calculateDaysUntilPurge = (purgeDate: string): number => {
    const now = new Date();
    const purge = new Date(purgeDate);
    const diffTime = purge.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getUrgencyColor = (daysUntilPurge: number): string => {
    if (daysUntilPurge > 60) return 'text-green-600 bg-green-50';
    if (daysUntilPurge > 30) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const handleRestoreClick = (client: DeletedClient) => {
    setSelectedClient(client);
    setRestorationReason('');
    setShowRestoreModal(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handlePurgeClick = (client: DeletedClient) => {
    setSelectedClient(client);
    setPurgeReason('');
    setPurgeConfirmText('');
    setShowPurgeModal(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleTimelineClick = (client: DeletedClient) => {
    setSelectedClient(client);
    setShowTimeline(true);
  };

  const handleRestore = async () => {
    if (!selectedClient || !restorationReason.trim()) {
      setError('Restoration reason is required');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const { data, error: restoreError } = await supabase.rpc('restore_client', {
        p_client_id: selectedClient.client_id,
        p_restored_by: currentUserEmail,
        p_restoration_reason: restorationReason.trim()
      });

      if (restoreError) throw restoreError;

      if (data && data.success) {
        await supabase.rpc('create_restoration_notifications', {
          p_client_id: selectedClient.client_id,
          p_company_name: selectedClient.company_name,
          p_restored_by: currentUserEmail,
          p_restoration_reason: restorationReason.trim()
        });

        setSuccessMessage(`Successfully restored "${selectedClient.company_name}". Team members have been notified.`);
        setShowRestoreModal(false);
        setSelectedClient(null);
        setRestorationReason('');
        await fetchDeletedClients();

        // Refresh the main client list
        if (onClientRestored) {
          onClientRestored();
        }
      } else {
        throw new Error('Restoration failed');
      }
    } catch (err) {
      console.error('Error restoring client:', err);
      setError(err instanceof Error ? err.message : 'Failed to restore client');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePurge = async () => {
    if (!selectedClient || !purgeReason.trim()) {
      setError('Purge reason is required');
      return;
    }

    if (purgeConfirmText !== 'PURGE PERMANENTLY') {
      setError('Please type "PURGE PERMANENTLY" to confirm');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const { data, error: purgeError } = await supabase.rpc('immediate_purge_client', {
        p_client_id: selectedClient.client_id,
        p_purged_by: currentUserEmail,
        p_purge_reason: purgeReason.trim()
      });

      if (purgeError) throw purgeError;

      if (data && data.success) {
        setSuccessMessage(`Successfully purged "${selectedClient.company_name}". This action is permanent.`);
        setShowPurgeModal(false);
        setSelectedClient(null);
        setPurgeReason('');
        setPurgeConfirmText('');
        await fetchDeletedClients();
      } else {
        throw new Error(data?.error || 'Purge failed');
      }
    } catch (err) {
      console.error('Error purging client:', err);
      setError(err instanceof Error ? err.message : 'Failed to purge client');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredClients = deletedClients.filter(client =>
    client.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Deleted Client Accounts</h1>
        <p className="text-gray-600">
          Manage deleted client accounts. Deleted accounts are retained for 90 days before automatic purging.
          {hasRestorePermission && ' As an admin, you can restore or immediately purge these accounts.'}
        </p>
      </div>

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-green-800">{successMessage}</p>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-600 hover:text-green-800"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}

      <div className="mb-6 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by company name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="text-sm text-gray-600">
          {filteredClients.length} deleted {filteredClients.length === 1 ? 'account' : 'accounts'}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading deleted accounts...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Trash2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No deleted accounts</h3>
          <p className="text-gray-600">
            {searchTerm ? 'No deleted accounts match your search.' : 'There are no deleted client accounts.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deleted Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deleted By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days Until Purge
                  </th>
                  {(hasRestorePermission || hasPurgePermission) && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.map((client) => {
                  const daysUntilPurge = calculateDaysUntilPurge(client.purge_at);
                  const urgencyColor = getUrgencyColor(daysUntilPurge);

                  return (
                    <tr key={client.client_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{client.company_name}</div>
                        <div className="text-sm text-gray-500">{client.client_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(client.deleted_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <User className="w-4 h-4 text-gray-400" />
                          {client.deleted_by || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={client.deletion_reason || 'No reason provided'}>
                          {client.deletion_reason || 'No reason provided'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${urgencyColor}`}>
                          <Clock className="w-4 h-4" />
                          {daysUntilPurge} days
                        </div>
                      </td>
                      {(hasRestorePermission || hasPurgePermission) && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleTimelineClick(client)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                              title="View account history"
                            >
                              <History className="w-4 h-4" />
                              History
                            </button>
                            {hasRestorePermission && (
                              <button
                                onClick={() => handleRestoreClick(client)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-green-700 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                                title="Restore this client account"
                              >
                                <RotateCcw className="w-4 h-4" />
                                Restore
                              </button>
                            )}
                            {hasPurgePermission && (
                              <button
                                onClick={() => handlePurgeClick(client)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                                title="Permanently delete this client account"
                              >
                                <AlertTriangle className="w-4 h-4" />
                                Purge Now
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showRestoreModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Restore Client Account
            </h3>
            <p className="text-gray-600 mb-4">
              You are about to restore <strong>{selectedClient.company_name}</strong>.
              All data will be recovered and the account will become active again.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Restoration Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={restorationReason}
                onChange={(e) => setRestorationReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Why is this account being restored?"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRestoreModal(false);
                  setSelectedClient(null);
                  setRestorationReason('');
                }}
                disabled={isProcessing}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRestore}
                disabled={isProcessing || !restorationReason.trim()}
                className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Restoring...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    Restore Account
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPurgeModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Permanently Purge Client
              </h3>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-red-800 text-sm font-medium">
                ⚠️ WARNING: This action is permanent and cannot be undone!
              </p>
            </div>
            <p className="text-gray-600 mb-4">
              You are about to permanently delete <strong>{selectedClient.company_name}</strong> and
              all associated data. This bypasses the 90-day recovery period.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purge Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={purgeReason}
                onChange={(e) => setPurgeReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Why is this account being purged immediately?"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="font-mono font-bold">PURGE PERMANENTLY</span> to confirm
              </label>
              <input
                type="text"
                value={purgeConfirmText}
                onChange={(e) => setPurgeConfirmText(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono"
                placeholder="PURGE PERMANENTLY"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowPurgeModal(false);
                  setSelectedClient(null);
                  setPurgeReason('');
                  setPurgeConfirmText('');
                }}
                disabled={isProcessing}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePurge}
                disabled={isProcessing || !purgeReason.trim() || purgeConfirmText !== 'PURGE PERMANENTLY'}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Purging...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    Purge Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTimeline && selectedClient && (
        <AccountLifecycleTimeline
          clientId={selectedClient.client_id}
          companyName={selectedClient.company_name}
          onClose={() => {
            setShowTimeline(false);
            setSelectedClient(null);
          }}
        />
      )}
    </div>
  );
}
