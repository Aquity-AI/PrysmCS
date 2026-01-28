import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, TrendingUp, Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from './supabaseClient';

interface Metric {
  id: string;
  client_id: string;
  metric_name: string;
  metric_key: string;
  data_type: 'number' | 'currency' | 'percentage' | 'decimal';
  unit: string;
}

interface DataPoint {
  id?: string;
  data_date: string;
  value: string;
  data_source: string;
}

interface ManualDataEntryModalProps {
  clientId: string;
  metric: Metric;
  onClose: () => void;
  onSave: () => void;
}

export function ManualDataEntryModal({ clientId, metric, onClose, onSave }: ManualDataEntryModalProps) {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newValue, setNewValue] = useState('');

  useEffect(() => {
    loadData();
  }, [metric.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('historical_metric_data')
        .select('id, data_date, value, data_source')
        .eq('metric_id', metric.id)
        .eq('client_id', clientId)
        .order('data_date', { ascending: false });

      if (fetchError) throw fetchError;

      setDataPoints(data?.map(d => ({
        ...d,
        value: d.value.toString()
      })) || []);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError('Failed to load data points');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDataPoint = async () => {
    if (!newDate || !newValue) {
      setError('Date and value are required');
      return;
    }

    const numValue = parseFloat(newValue);
    if (isNaN(numValue)) {
      setError('Value must be a valid number');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const { error: insertError } = await supabase
        .from('historical_metric_data')
        .insert([{
          metric_id: metric.id,
          client_id: clientId,
          data_date: newDate,
          value: numValue,
          data_source: 'manual_entry'
        }]);

      if (insertError) {
        if (insertError.code === '23505') {
          setError('A data point already exists for this date');
        } else {
          throw insertError;
        }
        return;
      }

      setNewDate('');
      setNewValue('');
      setSuccess('Data point added successfully');
      setTimeout(() => setSuccess(''), 3000);
      await loadData();
    } catch (err: any) {
      console.error('Error adding data point:', err);
      setError(err.message || 'Failed to add data point');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDataPoint = async (id: string) => {
    if (!confirm('Delete this data point?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('historical_metric_data')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setSuccess('Data point deleted');
      setTimeout(() => setSuccess(''), 3000);
      await loadData();
    } catch (err: any) {
      console.error('Error deleting data point:', err);
      setError('Failed to delete data point');
    }
  };

  const handleUpdateDataPoint = async (id: string, newValue: string) => {
    const numValue = parseFloat(newValue);
    if (isNaN(numValue)) return;

    try {
      const { error: updateError } = await supabase
        .from('historical_metric_data')
        .update({ value: numValue })
        .eq('id', id);

      if (updateError) throw updateError;

      setSuccess('Data point updated');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error updating data point:', err);
      setError('Failed to update data point');
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      'Date,Value',
      ...dataPoints.map(dp => `${dp.data_date},${dp.value}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metric.metric_key}_data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());

        const dataToImport: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const [date, value] = lines[i].split(',').map(s => s.trim());
          if (date && value) {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
              dataToImport.push({
                metric_id: metric.id,
                client_id: clientId,
                data_date: date,
                value: numValue,
                data_source: 'csv_import'
              });
            }
          }
        }

        if (dataToImport.length === 0) {
          setError('No valid data found in CSV file');
          return;
        }

        setSaving(true);
        const { error: importError } = await supabase
          .from('historical_metric_data')
          .upsert(dataToImport, {
            onConflict: 'metric_id,client_id,data_date',
            ignoreDuplicates: false
          });

        if (importError) throw importError;

        setSuccess(`Imported ${dataToImport.length} data points`);
        setTimeout(() => setSuccess(''), 3000);
        await loadData();
      } catch (err: any) {
        console.error('Error importing CSV:', err);
        setError('Failed to import CSV file');
      } finally {
        setSaving(false);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const formatValue = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return value;

    switch (metric.data_type) {
      case 'currency':
        return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'percentage':
        return `${num.toFixed(1)}%`;
      case 'decimal':
        return num.toFixed(2);
      default:
        return num.toLocaleString();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10001,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'start'
        }}>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>
              Manage Data: {metric.metric_name}
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
              Add, edit, or import historical data points
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px', flex: 1, overflow: 'auto' }}>
          {error && (
            <div style={{
              padding: '12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              marginBottom: '20px',
              display: 'flex',
              gap: '8px',
              alignItems: 'start'
            }}>
              <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
              <span style={{ color: '#991b1b', fontSize: '14px' }}>{error}</span>
            </div>
          )}

          {success && (
            <div style={{
              padding: '12px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              marginBottom: '20px',
              display: 'flex',
              gap: '8px',
              alignItems: 'start'
            }}>
              <CheckCircle size={18} style={{ color: '#22c55e', flexShrink: 0, marginTop: '2px' }} />
              <span style={{ color: '#166534', fontSize: '14px' }}>{success}</span>
            </div>
          )}

          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
              Add New Data Point
            </h3>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'end' }}>
              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#475569'
                }}>
                  Date
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#475569'
                }}>
                  Value {metric.unit && `(${metric.unit})`}
                </label>
                <input
                  type="number"
                  step="any"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <button
                onClick={handleAddDataPoint}
                disabled={saving || !newDate || !newValue}
                style={{
                  padding: '10px 16px',
                  background: saving || !newDate || !newValue ? '#94a3b8' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: saving || !newDate || !newValue ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
              >
                <Plus size={16} />
                Add
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
              Historical Data ({dataPoints.length} points)
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleExportCSV}
                disabled={dataPoints.length === 0}
                style={{
                  padding: '8px 12px',
                  background: 'white',
                  color: '#64748b',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: dataPoints.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Download size={14} />
                Export CSV
              </button>
              <label style={{
                padding: '8px 12px',
                background: 'white',
                color: '#64748b',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Upload size={14} />
                Import CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              <TrendingUp size={32} style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: '12px' }}>Loading data...</p>
            </div>
          ) : dataPoints.length === 0 ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              border: '2px dashed #e2e8f0',
              borderRadius: '8px'
            }}>
              <Calendar size={32} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                No data points yet. Add your first data point above or import from CSV.
              </p>
            </div>
          ) : (
            <div style={{
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#475569',
                      borderBottom: '1px solid #e2e8f0'
                    }}>
                      Date
                    </th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#475569',
                      borderBottom: '1px solid #e2e8f0'
                    }}>
                      Value
                    </th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#475569',
                      borderBottom: '1px solid #e2e8f0'
                    }}>
                      Source
                    </th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#475569',
                      borderBottom: '1px solid #e2e8f0',
                      width: '80px'
                    }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dataPoints.map((dp, index) => (
                    <tr key={dp.id} style={{
                      background: index % 2 === 0 ? 'white' : '#f9fafb'
                    }}>
                      <td style={{
                        padding: '12px 16px',
                        fontSize: '14px',
                        color: '#1e293b',
                        borderBottom: index < dataPoints.length - 1 ? '1px solid #f1f5f9' : 'none'
                      }}>
                        {new Date(dp.data_date).toLocaleDateString()}
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        fontSize: '14px',
                        borderBottom: index < dataPoints.length - 1 ? '1px solid #f1f5f9' : 'none'
                      }}>
                        <input
                          type="number"
                          step="any"
                          defaultValue={dp.value}
                          onBlur={(e) => {
                            if (e.target.value !== dp.value && dp.id) {
                              handleUpdateDataPoint(dp.id, e.target.value);
                            }
                          }}
                          style={{
                            width: '120px',
                            padding: '6px 8px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '4px',
                            fontSize: '14px',
                            color: '#1e293b'
                          }}
                        />
                        <span style={{ marginLeft: '8px', color: '#64748b', fontSize: '13px' }}>
                          ({formatValue(dp.value)})
                        </span>
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        fontSize: '13px',
                        color: '#64748b',
                        borderBottom: index < dataPoints.length - 1 ? '1px solid #f1f5f9' : 'none'
                      }}>
                        {dp.data_source === 'manual_entry' && 'Manual'}
                        {dp.data_source === 'csv_import' && 'CSV Import'}
                        {dp.data_source === 'auto_snapshot' && 'Auto-tracked'}
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        textAlign: 'right',
                        borderBottom: index < dataPoints.length - 1 ? '1px solid #f1f5f9' : 'none'
                      }}>
                        <button
                          onClick={() => dp.id && handleDeleteDataPoint(dp.id)}
                          style={{
                            padding: '6px',
                            background: '#fef2f2',
                            color: '#ef4444',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
