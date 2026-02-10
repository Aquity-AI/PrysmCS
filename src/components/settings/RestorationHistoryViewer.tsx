import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../success-planning/supabaseClient';
import { RotateCcw, Search, Calendar, User, FileText, Download, Clock } from 'lucide-react';

interface RestorationRecord {
  restoration_id: string;
  client_id: string;
  company_name: string;
  restored_at: string;
  restored_by: string;
  restoration_reason: string;
  deleted_at: string;
  deleted_by: string | null;
  deletion_reason: string | null;
  days_deleted: number;
}

interface RestorationHistoryViewerProps {
  currentUserEmail: string;
}

export function RestorationHistoryViewer({ currentUserEmail }: RestorationHistoryViewerProps) {
  const [restorations, setRestorations] = useState<RestorationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
  const [error, setError] = useState<string | null>(null);

  const fetchRestorationHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('client_restoration_log')
        .select(`
          restoration_id,
          client_id,
          company_name,
          restored_at,
          restored_by,
          restoration_reason,
          deleted_at,
          deleted_by,
          deletion_reason
        `)
        .order('restored_at', { ascending: false });

      if (fetchError) throw fetchError;

      const recordsWithDays = (data || []).map(record => {
        const deletedDate = new Date(record.deleted_at);
        const restoredDate = new Date(record.restored_at);
        const daysDeleted = Math.ceil((restoredDate.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24));

        return {
          ...record,
          days_deleted: daysDeleted
        };
      });

      setRestorations(recordsWithDays);
    } catch (err) {
      console.error('Error fetching restoration history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch restoration history');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestorationHistory();
  }, [fetchRestorationHistory]);

  const filteredRestorations = restorations.filter(record => {
    const matchesSearch =
      record.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.restored_by.toLowerCase().includes(searchTerm.toLowerCase());

    const restoredDate = new Date(record.restored_at);
    const matchesDateFrom = !dateFilter.from || restoredDate >= new Date(dateFilter.from);
    const matchesDateTo = !dateFilter.to || restoredDate <= new Date(dateFilter.to + 'T23:59:59');

    return matchesSearch && matchesDateFrom && matchesDateTo;
  });

  const exportToCSV = () => {
    const headers = ['Company Name', 'Restored Date', 'Restored By', 'Restoration Reason', 'Originally Deleted', 'Deleted By', 'Deletion Reason', 'Days Deleted'];
    const rows = filteredRestorations.map(record => [
      record.company_name,
      new Date(record.restored_at).toLocaleString(),
      record.restored_by,
      record.restoration_reason,
      new Date(record.deleted_at).toLocaleString(),
      record.deleted_by || 'Unknown',
      record.deletion_reason || 'No reason provided',
      record.days_deleted.toString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `restoration-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Restoration History</h1>
        <p className="text-gray-600">
          Complete audit trail of all restored client accounts with deletion and restoration reasons.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
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

      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by company name or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={exportToCSV}
            disabled={filteredRestorations.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export to CSV"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">From:</label>
            <input
              type="date"
              value={dateFilter.from}
              onChange={(e) => setDateFilter({ ...dateFilter, from: e.target.value })}
              className="px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">To:</label>
            <input
              type="date"
              value={dateFilter.to}
              onChange={(e) => setDateFilter({ ...dateFilter, to: e.target.value })}
              className="px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {(dateFilter.from || dateFilter.to) && (
            <button
              onClick={() => setDateFilter({ from: '', to: '' })}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear dates
            </button>
          )}
          <div className="ml-auto text-sm text-gray-600">
            {filteredRestorations.length} restoration{filteredRestorations.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading restoration history...</p>
        </div>
      ) : filteredRestorations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <RotateCcw className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No restoration records</h3>
          <p className="text-gray-600">
            {searchTerm || dateFilter.from || dateFilter.to
              ? 'No restorations match your filters.'
              : 'No accounts have been restored yet.'}
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
                    Restored Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Restored By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Restoration Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deleted Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days Deleted
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRestorations.map((record) => (
                  <tr key={record.restoration_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{record.company_name}</div>
                      <div className="text-xs text-gray-500">{record.client_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(record.restored_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(record.restored_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <User className="w-4 h-4 text-gray-400" />
                        {record.restored_by}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-gray-900 max-w-md">
                          {record.restoration_reason}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-2 text-gray-900 mb-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {new Date(record.deleted_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <User className="w-3 h-3 text-gray-400" />
                          {record.deleted_by || 'Unknown'}
                        </div>
                        {record.deletion_reason && (
                          <div className="flex items-start gap-2 mt-2">
                            <FileText className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />
                            <div className="text-xs text-gray-600 max-w-xs">
                              {record.deletion_reason}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                        <Clock className="w-4 h-4" />
                        {record.days_deleted} days
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
