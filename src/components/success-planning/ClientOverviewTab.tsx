import React, { useState, useEffect } from 'react';
import { Building2, DollarSign, Users, Save, Plus, Pencil, Trash2, X, Calendar, FileText, Link2, ExternalLink, Upload } from 'lucide-react';
import { SuccessOverview, Stakeholder, HealthData, Document } from './useSuccessPlanning';
import { supabase } from './supabaseClient';
import { useResponsive, getResponsiveGridCols, getResponsiveModalWidth } from './responsiveUtils';

interface ClientOverviewTabProps {
  overview: SuccessOverview | null;
  stakeholders: Stakeholder[];
  health: HealthData | null;
  documents: Document[];
  onUpdateOverview: (data: Partial<SuccessOverview>) => Promise<void>;
  onSave?: () => Promise<void>;
  onUpdateStakeholder?: (data: Partial<Stakeholder>) => Promise<void>;
  onDeleteStakeholder?: (id: string) => Promise<void>;
  onUpdateDocument?: (data: Partial<Document>) => Promise<void>;
  onDeleteDocument?: (id: string) => Promise<void>;
}

const ROLE_OPTIONS = [
  'Decision Maker',
  'Primary Contact',
  'Operations Lead',
  'Billing',
  'User',
  'Other'
];

const ROLE_COLORS: Record<string, string> = {
  'Decision Maker': '#ef4444',
  'Primary Contact': '#14b8a6',
  'Operations Lead': '#3b82f6',
  'Billing': '#f59e0b',
  'User': '#8b5cf6',
  'Other': '#64748b'
};

const DOCUMENT_TYPE_OPTIONS = [
  'Signed Contract',
  'SOW (Statement of Work)',
  'ACH Information',
  'Invoice',
  'MSA (Master Service Agreement)',
  'NDA',
  'Security Documentation',
  'Other'
];

export function ClientOverviewTab({
  overview,
  stakeholders,
  health,
  documents,
  onUpdateOverview,
  onSave,
  onUpdateStakeholder,
  onDeleteStakeholder,
  onUpdateDocument,
  onDeleteDocument,
}: ClientOverviewTabProps) {
  const [localOverview, setLocalOverview] = useState<Partial<SuccessOverview>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [showStakeholderModal, setShowStakeholderModal] = useState(false);
  const [editingStakeholder, setEditingStakeholder] = useState<Stakeholder | null>(null);
  const [stakeholderForm, setStakeholderForm] = useState<Partial<Stakeholder>>({
    name: '',
    title: '',
    role: 'Primary Contact',
    email: '',
    phone: '',
    reports_to_id: null,
    notes: ''
  });
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [documentForm, setDocumentForm] = useState<Partial<Document>>({
    document_type: 'Signed Contract',
    document_name: '',
    document_url: '',
    file_size: '',
    notes: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const { isMobile, isTablet } = useResponsive();

  useEffect(() => {
    if (overview) {
      setLocalOverview(overview);
    }
  }, [overview]);

  const handleOverviewChange = (field: keyof SuccessOverview, value: any) => {
    setLocalOverview(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      console.log('Saving overview data:', localOverview);
      await onUpdateOverview(localOverview);
      setHasChanges(false);
      if (onSave) await onSave();
      console.log('Overview data saved successfully');
    } catch (error) {
      console.error('Error saving overview:', error);
      alert('Failed to save changes. Please try again.');
    }
  };

  const openStakeholderModal = (stakeholder?: Stakeholder) => {
    if (stakeholder) {
      setEditingStakeholder(stakeholder);
      setStakeholderForm(stakeholder);
    } else {
      setEditingStakeholder(null);
      setStakeholderForm({
        name: '',
        title: '',
        role: 'Primary Contact',
        email: '',
        phone: '',
        reports_to_id: null,
        notes: ''
      });
    }
    setShowStakeholderModal(true);
  };

  const closeStakeholderModal = () => {
    setShowStakeholderModal(false);
    setEditingStakeholder(null);
  };

  const handleStakeholderSave = async () => {
    if (!stakeholderForm.name || !stakeholderForm.title || !stakeholderForm.role) {
      alert('Please fill in name, title, and role');
      return;
    }

    try {
      if (onUpdateStakeholder) {
        await onUpdateStakeholder(stakeholderForm);
      }
      closeStakeholderModal();
      if (onSave) await onSave();
    } catch (error) {
      console.error('Error saving stakeholder:', error);
      alert('Failed to save stakeholder. Please try again.');
    }
  };

  const handleStakeholderDelete = async (id: string) => {
    setConfirmModalConfig({
      title: 'Delete Stakeholder',
      message: 'Are you sure you want to delete this stakeholder? This action cannot be undone.',
      onConfirm: async () => {
        try {
          if (onDeleteStakeholder) {
            await onDeleteStakeholder(id);
          }
          if (onSave) await onSave();
          setShowConfirmModal(false);
        } catch (error) {
          console.error('Error deleting stakeholder:', error);
          alert('Failed to delete stakeholder. Please try again.');
          setShowConfirmModal(false);
        }
      }
    });
    setShowConfirmModal(true);
  };

  const openDocumentModal = (document?: Document) => {
    if (document) {
      setEditingDocument(document);
      setDocumentForm(document);
    } else {
      setEditingDocument(null);
      setDocumentForm({
        document_type: 'Signed Contract',
        document_name: '',
        document_url: '',
        file_size: '',
        notes: ''
      });
    }
    setSelectedFile(null);
    setShowDocumentModal(true);
  };

  const closeDocumentModal = () => {
    setShowDocumentModal(false);
    setEditingDocument(null);
  };

  const handleDocumentSave = async () => {
    if (!documentForm.document_name || !documentForm.document_type) {
      alert('Please fill in document type and name');
      return;
    }

    if (!documentForm.document_url && !selectedFile) {
      alert('Please either provide a URL or upload a file');
      return;
    }

    try {
      let fileUrl = documentForm.document_url || '';
      let fileSize = documentForm.file_size || '';

      // Upload file to Supabase Storage if selected
      if (selectedFile) {
        const fileName = `${Date.now()}-${selectedFile.name}`;
        const filePath = `documents/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          alert('Failed to upload file. Please try again.');
          return;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        fileUrl = publicUrl;
        fileSize = `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`;
      }

      if (onUpdateDocument) {
        await onUpdateDocument({
          ...documentForm,
          document_url: fileUrl,
          file_size: fileSize
        });
      }
      closeDocumentModal();
      if (onSave) await onSave();
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Failed to save document. Please try again.');
    }
  };

  const handleDocumentDelete = async (id: string) => {
    setConfirmModalConfig({
      title: 'Delete Document',
      message: 'Are you sure you want to delete this document? This action cannot be undone.',
      onConfirm: async () => {
        try {
          if (onDeleteDocument) {
            await onDeleteDocument(id);
          }
          if (onSave) await onSave();
          setShowConfirmModal(false);
        } catch (error) {
          console.error('Error deleting document:', error);
          alert('Failed to delete document. Please try again.');
          setShowConfirmModal(false);
        }
      }
    });
    setShowConfirmModal(true);
  };

  const daysToRenewal = health?.days_until_renewal ?? null;
  const mrr = overview?.mrr || 0;
  const contractTermMonths = overview?.contract_term_months || 12;

  return (
    <div style={{ padding: isMobile ? '16px' : '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: getResponsiveGridCols(1, 2, 4, isMobile, isTablet), gap: '16px', marginBottom: '24px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
          borderRadius: '12px',
          padding: '20px',
          color: 'white'
        }}>
          <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>MRR</div>
          <div style={{ fontSize: '28px', fontWeight: 700 }}>${Math.round(mrr).toLocaleString()}</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '12px',
          padding: '20px',
          color: 'white'
        }}>
          <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>Contract Term</div>
          <div style={{ fontSize: '28px', fontWeight: 700 }}>{contractTermMonths} mo</div>
        </div>

        <div style={{
          background: daysToRenewal && daysToRenewal < 30
            ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
            : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          borderRadius: '12px',
          padding: '20px',
          color: 'white'
        }}>
          <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>Days to Renewal</div>
          <div style={{ fontSize: '28px', fontWeight: 700 }}>{daysToRenewal !== null ? daysToRenewal : 'N/A'}</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
          borderRadius: '12px',
          padding: '20px',
          color: 'white'
        }}>
          <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>Open Actions</div>
          <div style={{ fontSize: '28px', fontWeight: 700 }}>{health?.open_overdue_actions || 0}</div>
        </div>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '12px'
          }}>
            <Building2 size={20} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Company Information</h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Basic client details and contact information</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: getResponsiveGridCols(1, 1, 2, isMobile, isTablet), gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
              Company Name
            </label>
            <input
              type="text"
              value={localOverview.company_name || ''}
              onChange={(e) => handleOverviewChange('company_name', e.target.value)}
              placeholder="Enter company name..."
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#0f172a'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
              Phone
            </label>
            <input
              type="text"
              value={localOverview.phone || ''}
              onChange={(e) => handleOverviewChange('phone', e.target.value)}
              placeholder="(555) 555-5555"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#0f172a'
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
            Address
          </label>
          <input
            type="text"
            value={localOverview.address || ''}
            onChange={(e) => handleOverviewChange('address', e.target.value)}
            placeholder="Street address, City, State ZIP"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#0f172a'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: getResponsiveGridCols(1, 1, 2, isMobile, isTablet), gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
              Email
            </label>
            <input
              type="email"
              value={localOverview.email || ''}
              onChange={(e) => handleOverviewChange('email', e.target.value)}
              placeholder="contact@example.com"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#0f172a'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
              Website
            </label>
            <input
              type="text"
              value={localOverview.website || ''}
              onChange={(e) => handleOverviewChange('website', e.target.value)}
              placeholder="www.example.com"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#0f172a'
              }}
            />
          </div>
        </div>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '12px'
          }}>
            <DollarSign size={20} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Contract Details</h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Financial and contract information</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: getResponsiveGridCols(1, 1, 2, isMobile, isTablet), gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
              ARR (Annual Recurring Revenue)
            </label>
            <input
              type="number"
              value={localOverview.arr || ''}
              onChange={(e) => handleOverviewChange('arr', parseFloat(e.target.value) || 0)}
              placeholder="0"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#0f172a'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
              Contract Term (Months)
            </label>
            <input
              type="number"
              value={localOverview.contract_term_months || ''}
              onChange={(e) => handleOverviewChange('contract_term_months', parseInt(e.target.value) || 12)}
              placeholder="12"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#0f172a'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
              Contract Start Date
            </label>
            <input
              type="date"
              value={localOverview.contract_start_date || ''}
              onChange={(e) => handleOverviewChange('contract_start_date', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#0f172a'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
              Renewal Date
            </label>
            <input
              type="date"
              value={localOverview.renewal_date || ''}
              onChange={(e) => handleOverviewChange('renewal_date', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#0f172a'
              }}
            />
          </div>
        </div>

        <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '20px', paddingTop: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>Billing Information</h3>

          <div style={{ display: 'grid', gridTemplateColumns: getResponsiveGridCols(1, 2, 3, isMobile, isTablet), gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                Billing Contact Name
              </label>
              <input
                type="text"
                value={localOverview.billing_contact_name || ''}
                onChange={(e) => handleOverviewChange('billing_contact_name', e.target.value)}
                placeholder="Enter billing contact name..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#0f172a'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                Billing Email
              </label>
              <input
                type="email"
                value={localOverview.billing_contact_email || ''}
                onChange={(e) => handleOverviewChange('billing_contact_email', e.target.value)}
                placeholder="billing@example.com"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#0f172a'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                Billing Phone
              </label>
              <input
                type="tel"
                value={localOverview.billing_contact_phone || ''}
                onChange={(e) => handleOverviewChange('billing_contact_phone', e.target.value)}
                placeholder="(555) 555-5555"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#0f172a'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
              Billing Notes
            </label>
            <textarea
              value={localOverview.billing_notes || ''}
              onChange={(e) => handleOverviewChange('billing_notes', e.target.value)}
              placeholder="Payment terms, invoicing preferences, special billing instructions..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#0f172a',
                resize: 'vertical'
              }}
            />
          </div>
        </div>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px'
            }}>
              <FileText size={20} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Important Documents</h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Contract, SOW, ACH info, and other key documents</p>
            </div>
          </div>
          <button
            onClick={() => openDocumentModal()}
            style={{
              padding: '10px 16px',
              background: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={18} />
            Add Document
          </button>
        </div>

        {documents.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#94a3b8',
            fontSize: '14px'
          }}>
            No documents added yet. Click "Add Document" to get started.
          </div>
        )}

        {documents.map((document) => (
          <div key={document.id} style={{
            padding: '16px',
            background: '#f8fafc',
            borderRadius: '8px',
            marginBottom: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Link2 size={16} color="#64748b" />
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
                    {document.document_name}
                  </div>
                  <span style={{
                    padding: '2px 8px',
                    background: '#8b5cf6',
                    color: 'white',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px'
                  }}>
                    {document.document_type}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '100px 1fr', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>URL:</div>
                  <div style={{ fontSize: '13px', color: '#475569' }}>
                    <a
                      href={document.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#8b5cf6',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {document.document_url}
                      <ExternalLink size={12} />
                    </a>
                  </div>

                  {document.file_size && (
                    <>
                      <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Size:</div>
                      <div style={{ fontSize: '13px', color: '#475569' }}>
                        {document.file_size}
                      </div>
                    </>
                  )}

                  {document.notes && (
                    <>
                      <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Notes:</div>
                      <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
                        {document.notes}
                      </div>
                    </>
                  )}

                  {document.uploaded_at && (
                    <>
                      <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Uploaded:</div>
                      <div style={{ fontSize: '13px', color: '#475569' }}>
                        {new Date(document.uploaded_at).toLocaleDateString()}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                <button
                  onClick={() => openDocumentModal(document)}
                  style={{
                    padding: '8px',
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#64748b'
                  }}
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => document.id && handleDocumentDelete(document.id)}
                  style={{
                    padding: '8px',
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#ef4444'
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '12px'
          }}>
            <Calendar size={20} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Engagement & Communication</h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Meeting schedule and communication preferences</p>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
            Meeting Cadence
          </label>
          <input
            type="text"
            value={localOverview.meeting_cadence || ''}
            onChange={(e) => handleOverviewChange('meeting_cadence', e.target.value)}
            placeholder="e.g., Weekly on Mondays at 10am, Monthly QBRs on first Wednesday..."
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#0f172a'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
            Hours of Operation
          </label>
          <input
            type="text"
            value={localOverview.hours_of_operation || ''}
            onChange={(e) => handleOverviewChange('hours_of_operation', e.target.value)}
            placeholder="e.g., Monday-Friday 9am-5pm EST, 24/7 support available..."
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#0f172a'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
            Communication Preferences
          </label>
          <textarea
            value={localOverview.communication_preferences || ''}
            onChange={(e) => handleOverviewChange('communication_preferences', e.target.value)}
            placeholder="e.g., Prefers Slack for quick questions, Email for formal requests, Teams for video calls..."
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#0f172a',
              resize: 'vertical'
            }}
          />
        </div>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px'
            }}>
              <Users size={20} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Key Stakeholders</h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Client-side contacts and decision makers</p>
            </div>
          </div>
          <button
            onClick={() => openStakeholderModal()}
            style={{
              padding: '10px 16px',
              background: '#14b8a6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={18} />
            Add Stakeholder
          </button>
        </div>

        {stakeholders.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#94a3b8',
            fontSize: '14px'
          }}>
            No stakeholders added yet. Click "Add Stakeholder" to get started.
          </div>
        )}

        {stakeholders.map((stakeholder) => {
          const reportsTo = stakeholder.reports_to_id
            ? stakeholders.find(s => s.id === stakeholder.reports_to_id)
            : null;

          const formatPhoneNumber = (phone: string | null | undefined) => {
            if (!phone) return null;
            const cleaned = phone.replace(/\D/g, '');
            if (cleaned.length === 10) {
              return `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
            } else if (cleaned.length === 11 && cleaned[0] === '1') {
              return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
            }
            return phone;
          };

          return (
            <div key={stakeholder.id} style={{
              padding: '20px',
              background: '#f8fafc',
              borderRadius: '8px',
              marginBottom: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ fontSize: '17px', fontWeight: 600, color: '#0f172a' }}>
                      {stakeholder.name}
                    </div>
                    <span style={{
                      padding: '2px 8px',
                      background: ROLE_COLORS[stakeholder.role] || '#64748b',
                      color: 'white',
                      borderRadius: '10px',
                      fontSize: '10px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px'
                    }}>
                      {stakeholder.role || 'Stakeholder'}
                    </span>
                  </div>

                  <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '12px', fontWeight: 500 }}>
                    {stakeholder.title}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '120px 1fr', gap: '8px', marginBottom: '4px' }}>
                    {stakeholder.email && (
                      <>
                        <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Email:</div>
                        <div style={{ fontSize: '13px', color: '#475569' }}>
                          {stakeholder.email}
                        </div>
                      </>
                    )}
                    {stakeholder.phone && (
                      <>
                        <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Phone:</div>
                        <div style={{ fontSize: '13px', color: '#475569' }}>
                          {formatPhoneNumber(stakeholder.phone)}
                        </div>
                      </>
                    )}
                    {reportsTo && (
                      <>
                        <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Reports To:</div>
                        <div style={{ fontSize: '13px', color: '#475569' }}>
                          {reportsTo.name} ({reportsTo.title})
                        </div>
                      </>
                    )}
                    {stakeholder.notes && (
                      <>
                        <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Notes:</div>
                        <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
                          {stakeholder.notes}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                  <button
                    onClick={() => openStakeholderModal(stakeholder)}
                    style={{
                      padding: '8px',
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      color: '#64748b'
                    }}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => stakeholder.id && handleStakeholderDelete(stakeholder.id)}
                    style={{
                      padding: '8px',
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      color: '#ef4444'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {hasChanges && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'white',
          borderRadius: '12px',
          padding: '16px 24px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 50
        }}>
          <span style={{ fontSize: '14px', color: '#64748b' }}>You have unsaved changes</span>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              background: '#14b8a6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Save size={18} />
            Save Changes
          </button>
        </div>
      )}

      {showStakeholderModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            ...getResponsiveModalWidth(isMobile, isTablet),
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {editingStakeholder ? 'Edit Stakeholder' : 'Add Stakeholder'}
              </h3>
              <button
                onClick={closeStakeholderModal}
                style={{
                  padding: '8px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={stakeholderForm.name || ''}
                  onChange={(e) => setStakeholderForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter stakeholder name..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#0f172a'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  Title *
                </label>
                <input
                  type="text"
                  value={stakeholderForm.title || ''}
                  onChange={(e) => setStakeholderForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Chief Technology Officer..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#0f172a'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  Role *
                </label>
                <select
                  value={stakeholderForm.role || 'Primary Contact'}
                  onChange={(e) => setStakeholderForm(prev => ({ ...prev, role: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#0f172a'
                  }}
                >
                  {ROLE_OPTIONS.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: getResponsiveGridCols(1, 1, 2, isMobile, isTablet), gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={stakeholderForm.email || ''}
                    onChange={(e) => setStakeholderForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@example.com"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#0f172a'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={stakeholderForm.phone || ''}
                    onChange={(e) => setStakeholderForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 555-5555"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#0f172a'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  Reports To
                </label>
                <select
                  value={stakeholderForm.reports_to_id || ''}
                  onChange={(e) => setStakeholderForm(prev => ({ ...prev, reports_to_id: e.target.value || null }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#0f172a'
                  }}
                >
                  <option value="">None</option>
                  {stakeholders
                    .filter(s => s.id !== editingStakeholder?.id)
                    .map(s => (
                      <option key={s.id} value={s.id}>{s.name} - {s.title}</option>
                    ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  Notes
                </label>
                <textarea
                  value={stakeholderForm.notes || ''}
                  onChange={(e) => setStakeholderForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this stakeholder..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#0f172a',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={closeStakeholderModal}
                  style={{
                    padding: '10px 20px',
                    background: 'white',
                    color: '#64748b',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleStakeholderSave}
                  style={{
                    padding: '10px 20px',
                    background: '#14b8a6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {editingStakeholder ? 'Update Stakeholder' : 'Add Stakeholder'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDocumentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            ...getResponsiveModalWidth(isMobile, isTablet),
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {editingDocument ? 'Edit Document' : 'Add Document'}
              </h3>
              <button
                onClick={closeDocumentModal}
                style={{
                  padding: '8px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  Document Type *
                </label>
                <select
                  value={documentForm.document_type || 'Signed Contract'}
                  onChange={(e) => setDocumentForm(prev => ({ ...prev, document_type: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#0f172a'
                  }}
                >
                  {DOCUMENT_TYPE_OPTIONS.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  Document Name *
                </label>
                <input
                  type="text"
                  value={documentForm.document_name || ''}
                  onChange={(e) => setDocumentForm(prev => ({ ...prev, document_name: e.target.value }))}
                  placeholder="e.g., Q1 2024 Contract - Signed..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#0f172a'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  Document URL (optional)
                </label>
                <input
                  type="url"
                  value={documentForm.document_url || ''}
                  onChange={(e) => setDocumentForm(prev => ({ ...prev, document_url: e.target.value }))}
                  placeholder="https://drive.google.com/file/..."
                  disabled={!!selectedFile}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#0f172a',
                    background: selectedFile ? '#f1f5f9' : 'white',
                    cursor: selectedFile ? 'not-allowed' : 'text'
                  }}
                />
                {selectedFile && (
                  <div style={{ marginTop: '6px', fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                    URL field is disabled when a file is uploaded
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  Upload File (optional)
                </label>
                <div style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px dashed #e2e8f0',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  cursor: documentForm.document_url && !selectedFile ? 'not-allowed' : 'pointer',
                  background: documentForm.document_url && !selectedFile ? '#f1f5f9' : '#f8fafc',
                  position: 'relative',
                  opacity: documentForm.document_url && !selectedFile ? 0.6 : 1
                }}
                onClick={() => {
                  if (!documentForm.document_url || selectedFile) {
                    document.getElementById('file-upload')?.click();
                  }
                }}
                >
                  <Upload size={20} color="#64748b" />
                  <span style={{ fontSize: '14px', color: '#64748b' }}>
                    {selectedFile ? selectedFile.name : 'Click to select a file'}
                  </span>
                  <input
                    id="file-upload"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                </div>
                {selectedFile && (
                  <div style={{
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{
                      fontSize: '13px',
                      color: '#8b5cf6',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <FileText size={14} />
                      {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      style={{
                        padding: '4px 8px',
                        background: 'transparent',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: '#ef4444',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
                {documentForm.document_url && !selectedFile && (
                  <div style={{ marginTop: '6px', fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                    File upload is disabled when a URL is provided
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  Notes
                </label>
                <textarea
                  value={documentForm.notes || ''}
                  onChange={(e) => setDocumentForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this document..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#0f172a',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={closeDocumentModal}
                  style={{
                    padding: '10px 20px',
                    background: 'white',
                    color: '#64748b',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDocumentSave}
                  style={{
                    padding: '10px 20px',
                    background: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {editingDocument ? 'Update Document' : 'Add Document'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && confirmModalConfig && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            width: isMobile ? '90vw' : '450px',
            maxWidth: isMobile ? '90vw' : '450px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              padding: isMobile ? '16px' : '24px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {confirmModalConfig.title}
              </h3>
            </div>

            <div style={{ padding: '24px' }}>
              <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: 0 }}>
                {confirmModalConfig.message}
              </p>
            </div>

            <div style={{
              padding: '24px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  padding: '10px 20px',
                  background: 'white',
                  color: '#64748b',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmModalConfig.onConfirm}
                style={{
                  padding: '10px 20px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
